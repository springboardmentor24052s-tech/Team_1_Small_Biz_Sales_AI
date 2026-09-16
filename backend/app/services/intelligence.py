from __future__ import annotations

import math
import random
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from statistics import fmean
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.forecasting import ForecastModelRun, ForecastPrediction
from app.models.identity import Role, RoleCode, User, UserStatus
from app.models.inventory import Product
from app.models.sales import SalesLineItem, SalesTransaction, TransactionStatus
from app.models.segmentation import CustomerSegmentAssignment, SegmentationModelRun

MIN_FORECAST_RECORDS = 30
MIN_FORECAST_DAYS = 30
MIN_SEGMENT_CUSTOMERS = 20
MIN_MODEL_IMPROVEMENT = 0.02
MIN_SILHOUETTE = 0.20


def _daily_series(rows: list[tuple[date, float]]) -> list[tuple[date, float]]:
    totals: dict[date, float] = defaultdict(float)
    for observed_date, value in rows:
        totals[observed_date] += value
    if not totals:
        return []
    current, end = min(totals), max(totals)
    series = []
    while current <= end:
        series.append((current, totals.get(current, 0.0)))
        current += timedelta(days=1)
    return series


def _linear_fit(values: list[float]) -> tuple[float, float]:
    count = len(values)
    mean_x = (count - 1) / 2
    mean_y = fmean(values)
    denominator = sum((index - mean_x) ** 2 for index in range(count))
    slope = (
        sum((index - mean_x) * (value - mean_y) for index, value in enumerate(values)) / denominator
        if denominator
        else 0.0
    )
    return mean_y - slope * mean_x, slope


def _metrics(actual: list[float], predicted: list[float], algorithm: str) -> dict[str, Any]:
    errors = [prediction - observed for observed, prediction in zip(actual, predicted, strict=True)]
    mae = fmean(abs(error) for error in errors)
    rmse = math.sqrt(fmean(error**2 for error in errors))
    mean_actual = fmean(actual)
    denominator = sum((value - mean_actual) ** 2 for value in actual)
    r2 = 1 - sum(error**2 for error in errors) / denominator if denominator else None
    return {
        "algorithm": algorithm,
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "bias": round(fmean(errors), 4),
        "r2": round(r2, 4) if r2 is not None else None,
    }


def _evaluate_forecast(series: list[tuple[date, float]]) -> dict[str, Any]:
    values = [value for _, value in series]
    holdout = max(7, min(14, len(values) // 5))
    train, actual = values[:-holdout], values[-holdout:]
    baseline = [train[-1]] * holdout
    intercept, slope = _linear_fit(train)
    linear = [max(0.0, intercept + slope * (len(train) + offset)) for offset in range(holdout)]
    baseline_metrics = _metrics(actual, baseline, "Last-value baseline")
    linear_metrics = _metrics(actual, linear, "Linear trend regression")
    improvement = (
        (baseline_metrics["mae"] - linear_metrics["mae"]) / baseline_metrics["mae"]
        if baseline_metrics["mae"]
        else 0.0
    )
    return {
        "accepted": improvement >= MIN_MODEL_IMPROVEMENT,
        "improvement": round(improvement, 4),
        "selected": linear_metrics,
        "candidates": [baseline_metrics, linear_metrics],
        "residual_rmse": linear_metrics["rmse"],
    }


def _publish_forecast(
    db: Session,
    *,
    tenant_id: UUID,
    series: list[tuple[date, float]],
    forecast_type: str,
    scope_type: str,
    scope_key: str,
    source_system: str,
    target: str,
    unit: str,
    store_id: UUID | None = None,
    seller_id: UUID | None = None,
    product: Product | None = None,
) -> tuple[bool, dict[str, Any]]:
    evaluation = _evaluate_forecast(series)
    if not evaluation["accepted"]:
        return False, {
            "status": "rejected_quality_gate",
            "reason": "Linear trend did not beat the last-value baseline by at least 2%.",
            "improvement": evaluation["improvement"],
            "metrics": evaluation["candidates"],
        }
    now = datetime.now(UTC)
    version = f"tenant-{now.strftime('%Y%m%d%H%M%S%f')}"
    for old in db.scalars(
        select(ForecastModelRun).where(
            ForecastModelRun.tenant_id == tenant_id,
            ForecastModelRun.forecast_type == forecast_type,
            ForecastModelRun.scope_type == scope_type,
            ForecastModelRun.scope_key == scope_key,
            ForecastModelRun.status == "active",
        )
    ):
        old.status = "superseded"
    run = ForecastModelRun(
        tenant_id=tenant_id,
        store_id=store_id,
        seller_id=seller_id,
        model_version=version,
        forecast_type=forecast_type,
        scope_type=scope_type,
        scope_key=scope_key,
        target=target,
        unit=unit,
        granularity="daily",
        source_system=source_system,
        algorithm="Linear trend regression",
        baseline_algorithm="Last-value baseline",
        status="active",
        horizons=[7, 14, 30],
        metrics={**evaluation["selected"], "baseline_improvement": evaluation["improvement"]},
        candidate_metrics=evaluation["candidates"],
        training_start=series[0][0],
        training_end=series[-1][0],
        trained_at=now,
    )
    db.add(run)
    db.flush()
    values = [value for _, value in series]
    intercept, slope = _linear_fit(values)
    margin = max(float(evaluation["residual_rmse"]) * 1.96, 0.01)
    for horizon_day in range(1, 31):
        predicted = max(0.0, intercept + slope * (len(values) - 1 + horizon_day))
        db.add(
            ForecastPrediction(
                tenant_id=tenant_id,
                model_run_id=run.id,
                product_id=product.id if product else None,
                source_store_id=str(store_id) if store_id else "ALL",
                source_product_id=product.sku if product else "ALL",
                source_category_id=(product.category or "Uncategorised") if product else "ALL",
                forecast_date=series[-1][0] + timedelta(days=horizon_day),
                horizon_day=horizon_day,
                algorithm="Linear trend regression",
                metrics=run.metrics,
                candidate_metrics=run.candidate_metrics,
                actual=None,
                predicted=Decimal(str(round(predicted, 4))),
                lower_bound=Decimal(str(round(max(0.0, predicted - margin), 4))),
                upper_bound=Decimal(str(round(predicted + margin, 4))),
            )
        )
    return True, {
        "status": "published",
        "model_version": version,
        "algorithm": run.algorithm,
        "baseline_improvement": evaluation["improvement"],
        "training_start": str(series[0][0]),
        "training_end": str(series[-1][0]),
    }


def _publish_store_demand(
    db: Session,
    *,
    tenant_id: UUID,
    store_id: UUID,
    product_series: dict[UUID, list[tuple[date, float]]],
    products: dict[UUID, Product],
    source_system: str,
) -> dict[str, Any]:
    accepted = []
    rejected = []
    for product_id, series in product_series.items():
        evaluation = _evaluate_forecast(series)
        if evaluation["accepted"]:
            accepted.append((product_id, series, evaluation))
        else:
            rejected.append(
                {
                    "product_id": str(product_id),
                    "reason": "Did not beat the last-value baseline by 2%.",
                    "improvement": evaluation["improvement"],
                }
            )
    if not accepted:
        return {
            "status": "rejected_quality_gate",
            "reason": "No product series passed chronological baseline testing.",
            "rejected_products": rejected,
        }
    now = datetime.now(UTC)
    version = f"tenant-demand-{now.strftime('%Y%m%d%H%M%S%f')}"
    for old in db.scalars(
        select(ForecastModelRun).where(
            ForecastModelRun.tenant_id == tenant_id,
            ForecastModelRun.forecast_type == "demand",
            ForecastModelRun.scope_type == "store",
            ForecastModelRun.store_id == store_id,
            ForecastModelRun.status == "active",
        )
    ):
        old.status = "superseded"
    selected_metrics = [item[2]["selected"] for item in accepted]
    baseline_metrics = [item[2]["candidates"][0] for item in accepted]
    aggregate = {
        "algorithm": "Linear trend regression",
        "mae": round(fmean(item["mae"] for item in selected_metrics), 4),
        "rmse": round(fmean(item["rmse"] for item in selected_metrics), 4),
        "bias": round(fmean(item["bias"] for item in selected_metrics), 4),
        "r2": None,
    }
    baseline = {
        "algorithm": "Last-value baseline",
        "mae": round(fmean(item["mae"] for item in baseline_metrics), 4),
        "rmse": round(fmean(item["rmse"] for item in baseline_metrics), 4),
        "bias": round(fmean(item["bias"] for item in baseline_metrics), 4),
        "r2": None,
    }
    run = ForecastModelRun(
        tenant_id=tenant_id,
        store_id=store_id,
        seller_id=None,
        model_version=version,
        forecast_type="demand",
        scope_type="store",
        scope_key=str(store_id),
        target="daily_product_quantity",
        unit="units",
        granularity="daily",
        source_system=source_system,
        algorithm="Linear trend regression",
        baseline_algorithm="Last-value baseline",
        status="active",
        horizons=[7, 14, 30],
        metrics=aggregate,
        candidate_metrics=[baseline, aggregate],
        training_start=min(item[1][0][0] for item in accepted),
        training_end=max(item[1][-1][0] for item in accepted),
        trained_at=now,
    )
    db.add(run)
    db.flush()
    for product_id, series, evaluation in accepted:
        product = products[product_id]
        values = [value for _, value in series]
        intercept, slope = _linear_fit(values)
        margin = max(float(evaluation["residual_rmse"]) * 1.96, 0.01)
        for horizon_day in range(1, 31):
            predicted = max(0.0, intercept + slope * (len(values) - 1 + horizon_day))
            db.add(
                ForecastPrediction(
                    tenant_id=tenant_id,
                    model_run_id=run.id,
                    product_id=product.id,
                    source_store_id=str(store_id),
                    source_product_id=product.sku,
                    source_category_id=product.category or "Uncategorised",
                    forecast_date=series[-1][0] + timedelta(days=horizon_day),
                    horizon_day=horizon_day,
                    algorithm="Linear trend regression",
                    metrics={
                        **evaluation["selected"],
                        "baseline_improvement": evaluation["improvement"],
                    },
                    candidate_metrics=evaluation["candidates"],
                    actual=None,
                    predicted=Decimal(str(round(predicted, 4))),
                    lower_bound=Decimal(str(round(max(0.0, predicted - margin), 4))),
                    upper_bound=Decimal(str(round(predicted + margin, 4))),
                )
            )
    return {
        "status": "published",
        "model_version": version,
        "algorithm": run.algorithm,
        "products_published": len(accepted),
        "products_rejected": len(rejected),
        "rejected_products": rejected,
    }


def _revenue_rows(db: Session, tenant_id: UUID, seller_id: UUID | None = None):
    query = select(func.date(SalesTransaction.occurred_at), SalesTransaction.total_amount).where(
        SalesTransaction.tenant_id == tenant_id,
        SalesTransaction.status == TransactionStatus.COMPLETED,
    )
    if seller_id:
        query = query.where(SalesTransaction.seller_id == seller_id)
    return [(date.fromisoformat(str(day)), float(amount)) for day, amount in db.execute(query)]


def _tenant_data_source(db: Session, tenant_id: UUID) -> str:
    sources = set(
        db.scalars(
            select(SalesTransaction.source_system).where(
                SalesTransaction.tenant_id == tenant_id,
                SalesTransaction.status == TransactionStatus.COMPLETED,
            )
        ).all()
    )
    if sources and sources <= {"sample_data"}:
        return "evaluation_sample_data"
    if "sample_data" in sources:
        return "mixed_uploaded_and_sample_data"
    return "tenant_uploaded_database_records"


def _demand_rows(db: Session, tenant_id: UUID):
    rows = db.execute(
        select(
            SalesTransaction.store_id,
            SalesLineItem.product_id,
            func.date(SalesTransaction.occurred_at),
            SalesLineItem.quantity,
        )
        .join(SalesTransaction, SalesTransaction.id == SalesLineItem.transaction_id)
        .where(
            SalesLineItem.tenant_id == tenant_id,
            SalesTransaction.status == TransactionStatus.COMPLETED,
        )
    )
    grouped: dict[tuple[UUID, UUID], list[tuple[date, float]]] = defaultdict(list)
    for store_id, product_id, day, quantity in rows:
        grouped[(store_id, product_id)].append((date.fromisoformat(str(day)), float(quantity)))
    return grouped


def readiness(db: Session, tenant_id: UUID) -> dict[str, Any]:
    revenue_rows = _revenue_rows(db, tenant_id)
    revenue_series = _daily_series(revenue_rows)
    customers = (
        db.scalar(select(func.count(Customer.id)).where(Customer.tenant_id == tenant_id)) or 0
    )
    demand_rows = _demand_rows(db, tenant_id)
    eligible_demand = [
        key
        for key, rows in demand_rows.items()
        if len(rows) >= MIN_FORECAST_RECORDS and len(_daily_series(rows)) >= MIN_FORECAST_DAYS
    ]
    personal_counts = list(
        db.execute(
            select(
                SalesTransaction.seller_id,
                func.count(SalesTransaction.id),
                func.count(func.distinct(func.date(SalesTransaction.occurred_at))),
            )
            .where(
                SalesTransaction.tenant_id == tenant_id,
                SalesTransaction.status == TransactionStatus.COMPLETED,
            )
            .group_by(SalesTransaction.seller_id)
        )
    )
    personal_ready = sum(
        count >= MIN_FORECAST_RECORDS and days >= MIN_FORECAST_DAYS
        for _, count, days in personal_counts
    )
    revenue_reasons = []
    if len(revenue_rows) < MIN_FORECAST_RECORDS:
        revenue_reasons.append(f"Add at least {MIN_FORECAST_RECORDS} completed sales records.")
    if len(revenue_series) < MIN_FORECAST_DAYS:
        revenue_reasons.append(f"Sales history must cover at least {MIN_FORECAST_DAYS} days.")
    demand_reasons = []
    if not demand_rows:
        demand_reasons.append("Import sales with valid SKU and quantity columns.")
    elif not eligible_demand:
        demand_reasons.append(
            f"At least one store-product series needs {MIN_FORECAST_RECORDS} rows across "
            f"{MIN_FORECAST_DAYS} days."
        )
    segment_reasons = (
        []
        if customers >= MIN_SEGMENT_CUSTOMERS
        else [f"Add at least {MIN_SEGMENT_CUSTOMERS} customers."]
    )
    return {
        "revenue": {
            "ready": not revenue_reasons,
            "observed_records": len(revenue_rows),
            "observed_days": len(revenue_series),
            "minimum_records": MIN_FORECAST_RECORDS,
            "minimum_days": MIN_FORECAST_DAYS,
            "blocking_reasons": revenue_reasons,
            "data_source": "completed sales_transactions for this tenant",
        },
        "personal": {
            "ready": personal_ready > 0,
            "observed_records": personal_ready,
            "observed_days": None,
            "minimum_records": 1,
            "minimum_days": MIN_FORECAST_DAYS,
            "blocking_reasons": []
            if personal_ready
            else ["No seller has enough dated sales history."],
            "data_source": "seller-scoped completed sales_transactions",
        },
        "demand": {
            "ready": bool(eligible_demand),
            "observed_records": len(eligible_demand),
            "observed_days": None,
            "minimum_records": 1,
            "minimum_days": MIN_FORECAST_DAYS,
            "blocking_reasons": demand_reasons,
            "data_source": "SKU-linked sales_line_items joined to sales_transactions",
        },
        "segmentation": {
            "ready": not segment_reasons,
            "observed_records": customers,
            "observed_days": None,
            "minimum_records": MIN_SEGMENT_CUSTOMERS,
            "minimum_days": None,
            "blocking_reasons": segment_reasons,
            "data_source": "customer summaries for this tenant",
        },
    }


def _distance(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right, strict=True)))


def _kmeans(points: list[list[float]], clusters: int) -> tuple[list[int], list[list[float]]]:
    rng = random.Random(42)
    centers = [points[index][:] for index in rng.sample(range(len(points)), clusters)]
    labels = [0] * len(points)
    for _ in range(100):
        next_labels = [
            min(range(clusters), key=lambda i: _distance(point, centers[i])) for point in points
        ]
        if next_labels == labels and _:
            break
        labels = next_labels
        for cluster in range(clusters):
            members = [
                point for point, label in zip(points, labels, strict=True) if label == cluster
            ]
            if members:
                centers[cluster] = [fmean(values) for values in zip(*members, strict=True)]
    return labels, centers


def _silhouette(points: list[list[float]], labels: list[int]) -> float:
    scores = []
    for index, point in enumerate(points):
        same = [
            _distance(point, other)
            for other_index, other in enumerate(points)
            if labels[other_index] == labels[index] and other_index != index
        ]
        a = fmean(same) if same else 0.0
        other_distances = []
        for label in set(labels) - {labels[index]}:
            distances = [
                _distance(point, other)
                for other_index, other in enumerate(points)
                if labels[other_index] == label
            ]
            if distances:
                other_distances.append(fmean(distances))
        b = min(other_distances) if other_distances else 0.0
        scores.append((b - a) / max(a, b) if max(a, b) else 0.0)
    return fmean(scores)


def _cluster_validation_metrics(
    points: list[list[float]], labels: list[int], centers: list[list[float]]
) -> tuple[float, float]:
    cluster_count = len(centers)
    dispersions = []
    within = 0.0
    for cluster, center in enumerate(centers):
        members = [point for point, label in zip(points, labels, strict=True) if label == cluster]
        distances = [_distance(point, center) for point in members]
        dispersions.append(fmean(distances) if distances else 0.0)
        within += sum(distance**2 for distance in distances)
    db_scores = []
    for left in range(cluster_count):
        comparisons = []
        for right in range(cluster_count):
            if left == right:
                continue
            separation = _distance(centers[left], centers[right])
            comparisons.append(
                (dispersions[left] + dispersions[right]) / separation if separation else math.inf
            )
        db_scores.append(max(comparisons))
    overall = [fmean(column) for column in zip(*points, strict=True)]
    between = sum(
        labels.count(cluster) * _distance(center, overall) ** 2
        for cluster, center in enumerate(centers)
    )
    ch_score = (
        (between / (cluster_count - 1)) / (within / (len(points) - cluster_count))
        if within and len(points) > cluster_count and cluster_count > 1
        else 0.0
    )
    return fmean(db_scores), ch_score


def _train_segments(db: Session, tenant_id: UUID, source_system: str) -> dict[str, Any]:
    customers = list(db.scalars(select(Customer).where(Customer.tenant_id == tenant_id)).all())
    if len(customers) < MIN_SEGMENT_CUSTOMERS:
        return {
            "status": "not_ready",
            "reason": f"At least {MIN_SEGMENT_CUSTOMERS} customers are required.",
        }
    raw = [
        [float(customer.recency_days), float(customer.order_count), float(customer.total_revenue)]
        for customer in customers
    ]
    means = [fmean(column) for column in zip(*raw, strict=True)]
    deviations = [
        math.sqrt(fmean((value - mean) ** 2 for value in column)) or 1.0
        for column, mean in zip(zip(*raw, strict=True), means, strict=True)
    ]
    points = [
        [
            (value - mean) / deviation
            for value, mean, deviation in zip(row, means, deviations, strict=True)
        ]
        for row in raw
    ]
    candidates = []
    for cluster_count in range(2, min(5, len(customers) - 1) + 1):
        labels, centers = _kmeans(points, cluster_count)
        counts = [labels.count(index) for index in range(cluster_count)]
        score = _silhouette(points, labels)
        if min(counts) >= max(2, math.ceil(len(customers) * 0.05)):
            candidates.append((score, labels, centers, counts))
    if not candidates:
        return {
            "status": "rejected_quality_gate",
            "reason": "No stable customer clusters were found.",
        }
    score, labels, centers, counts = max(candidates, key=lambda item: item[0])
    if score < MIN_SILHOUETTE:
        return {
            "status": "rejected_quality_gate",
            "reason": f"Silhouette score {score:.3f} is below the {MIN_SILHOUETTE:.2f} threshold.",
        }
    now = datetime.now(UTC)
    version = f"tenant-segments-{now.strftime('%Y%m%d%H%M%S%f')}"
    davies_bouldin, calinski_harabasz = _cluster_validation_metrics(points, labels, centers)
    run = SegmentationModelRun(
        tenant_id=tenant_id,
        source_system=source_system,
        model_version=version,
        algorithm="K-Means (deterministic seed 42)",
        cluster_count=len(centers),
        silhouette_score=score,
        davies_bouldin_score=davies_bouldin,
        calinski_harabasz_score=calinski_harabasz,
        feature_names=["recency_days", "order_count", "total_revenue"],
        metrics={
            "silhouette_score": score,
            "davies_bouldin_score": davies_bouldin,
            "calinski_harabasz_score": calinski_harabasz,
            "cluster_sizes": counts,
            "quality_gate": MIN_SILHOUETTE,
            "derived_fields": [
                "average_order_value",
                "average_basket_size",
                "purchase_frequency_30d",
                "engagement_score",
            ],
            "unavailable_fields": [
                "first_purchase",
                "active_days",
                "active_months",
                "product_variety",
                "return_rate",
            ],
        },
        trained_at=now,
    )
    db.add(run)
    db.flush()
    center_value = {
        index: centers[index][2] + centers[index][1] - centers[index][0]
        for index in range(len(centers))
    }
    ranked = sorted(center_value, key=center_value.get, reverse=True)
    names = ["Champions", "Loyal Customers", "Potential Loyalists", "Needs Attention", "At Risk"]
    name_map = {cluster: names[min(rank, len(names) - 1)] for rank, cluster in enumerate(ranked)}
    for customer, label in zip(customers, labels, strict=True):
        average_order = Decimal(customer.total_revenue) / max(customer.order_count, 1)
        engagement = max(
            0.0, min(100.0, 100 - customer.recency_days * 0.5 + customer.order_count * 2)
        )
        db.add(
            CustomerSegmentAssignment(
                tenant_id=tenant_id,
                model_run_id=run.id,
                customer_id=customer.id,
                cluster_id=label,
                segment_code=f"SEG-{ranked.index(label) + 1:02d}",
                segment_name=name_map[label],
                first_purchase=None,
                average_order_value=average_order,
                average_basket_size=Decimal(customer.item_quantity) / max(customer.order_count, 1),
                active_days=None,
                active_months=None,
                product_variety=None,
                tenure_days=None,
                average_days_between_orders=None,
                return_order_count=None,
                returned_value=None,
                return_rate=None,
                purchase_frequency_30d=Decimal(customer.order_count)
                * Decimal("30")
                / max(customer.recency_days, 30),
                engagement_score=Decimal(str(round(engagement, 2))),
            )
        )
    return {
        "status": "published",
        "model_version": version,
        "algorithm": run.algorithm,
        "silhouette_score": round(score, 4),
        "customers": len(customers),
        "cluster_sizes": counts,
    }


def train_tenant_intelligence(db: Session, tenant_id: UUID) -> dict[str, Any]:
    state = readiness(db, tenant_id)
    data_source = _tenant_data_source(db, tenant_id)
    modules: dict[str, Any] = {}
    if state["revenue"]["ready"]:
        _, modules["revenue"] = _publish_forecast(
            db,
            tenant_id=tenant_id,
            series=_daily_series(_revenue_rows(db, tenant_id)),
            forecast_type="revenue",
            scope_type="business",
            scope_key="business",
            source_system=data_source,
            target="daily_revenue",
            unit="INR",
        )
    else:
        modules["revenue"] = {
            "status": "not_ready",
            "reasons": state["revenue"]["blocking_reasons"],
        }

    sellers = db.scalars(
        select(User)
        .join(Role)
        .where(
            User.tenant_id == tenant_id,
            User.status == UserStatus.ACTIVE,
            Role.code == RoleCode.SALES_EXECUTIVE,
        )
    ).all()
    personal = []
    for seller in sellers:
        series = _daily_series(_revenue_rows(db, tenant_id, seller.id))
        if len(series) < MIN_FORECAST_DAYS:
            personal.append({"seller_id": str(seller.id), "status": "not_ready"})
            continue
        _, result = _publish_forecast(
            db,
            tenant_id=tenant_id,
            series=series,
            forecast_type="revenue",
            scope_type="personal",
            scope_key=str(seller.id),
            source_system=data_source,
            target="daily_personal_revenue",
            unit="INR",
            store_id=seller.store_id,
            seller_id=seller.id,
        )
        personal.append({"seller_id": str(seller.id), **result})
    modules["personal"] = personal or [
        {"status": "not_ready", "reason": "No Sales Executive accounts."}
    ]

    demand_results = []
    products = {
        item.id: item
        for item in db.scalars(select(Product).where(Product.tenant_id == tenant_id)).all()
    }
    by_store: dict[UUID, dict[UUID, list[tuple[date, float]]]] = defaultdict(dict)
    for (store_id, product_id), rows in _demand_rows(db, tenant_id).items():
        series = _daily_series(rows)
        if (
            len(rows) >= MIN_FORECAST_RECORDS
            and len(series) >= MIN_FORECAST_DAYS
            and product_id in products
        ):
            by_store[store_id][product_id] = series
    for store_id, product_series in by_store.items():
        result = _publish_store_demand(
            db,
            tenant_id=tenant_id,
            store_id=store_id,
            product_series=product_series,
            products=products,
            source_system=data_source,
        )
        demand_results.append({"store_id": str(store_id), **result})
    modules["demand"] = demand_results or [
        {"status": "not_ready", "reasons": state["demand"]["blocking_reasons"]}
    ]
    modules["segmentation"] = _train_segments(db, tenant_id, data_source)
    return modules
