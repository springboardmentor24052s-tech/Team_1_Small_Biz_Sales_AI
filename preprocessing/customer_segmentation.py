from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering, KMeans
from sklearn.metrics import calinski_harabasz_score, davies_bouldin_score, silhouette_score
from sklearn.preprocessing import RobustScaler

from preprocessing.milestone1 import clean_customer_transactions


MODEL_VERSION = "customer-segmentation-v1"
CLUSTER_FEATURES = (
    "recency_days",
    "order_count",
    "total_revenue",
    "active_months",
    "product_variety",
    "return_rate",
)
LOG_FEATURES = {
    "recency_days",
    "order_count",
    "total_revenue",
    "active_months",
    "product_variety",
}
REQUIRED_TRANSACTION_COLUMNS = {
    "invoice_id",
    "stock_code",
    "quantity",
    "invoice_date",
    "unit_price",
    "customer_id",
    "country",
    "transaction_type",
    "line_revenue",
}


@dataclass
class SegmentationResult:
    assignments: pd.DataFrame
    report: dict[str, Any]
    artifact: dict[str, Any]


def _required_columns(frame: pd.DataFrame) -> None:
    missing = sorted(REQUIRED_TRANSACTION_COLUMNS - set(frame.columns))
    if missing:
        raise ValueError(f"customer transactions are missing columns: {', '.join(missing)}")


def _average_purchase_gap(values: pd.Series) -> float:
    dates = pd.Series(pd.to_datetime(values).dt.normalize().unique()).sort_values()
    if len(dates) < 2:
        return 0.0
    return float(dates.diff().dropna().dt.days.mean())


def _mode_or_unknown(values: pd.Series) -> str:
    mode = values.dropna().astype("string").mode()
    return str(mode.iloc[0]) if not mode.empty else "Unknown"


def _percentile_score(values: pd.Series, *, higher_is_better: bool = True) -> pd.Series:
    score = values.rank(method="average", pct=True)
    if not higher_is_better:
        score = 1 - score + (1 / max(len(values), 1))
    return score.clip(0, 1)


def build_customer_features(transactions: pd.DataFrame) -> pd.DataFrame:
    """Create one reusable behavioral feature row per customer."""
    _required_columns(transactions)
    data = transactions.copy()
    data["invoice_date"] = pd.to_datetime(data["invoice_date"], errors="coerce")
    data["quantity"] = pd.to_numeric(data["quantity"], errors="coerce")
    data["unit_price"] = pd.to_numeric(data["unit_price"], errors="coerce")
    data["line_revenue"] = pd.to_numeric(data["line_revenue"], errors="coerce")
    data["customer_id"] = data["customer_id"].astype("string")
    data = data.dropna(
        subset=["invoice_id", "stock_code", "invoice_date", "customer_id", "transaction_type"]
    )

    sales = data.loc[
        data["transaction_type"].eq("sale")
        & data["quantity"].gt(0)
        & data["unit_price"].gt(0)
        & data["line_revenue"].gt(0)
    ].copy()
    if sales.empty:
        raise ValueError("customer transactions contain no valid sales")

    orders = (
        sales.groupby(["customer_id", "invoice_id"], as_index=False)
        .agg(
            order_date=("invoice_date", "min"),
            order_revenue=("line_revenue", "sum"),
            order_quantity=("quantity", "sum"),
            basket_products=("stock_code", "nunique"),
        )
        .sort_values(["customer_id", "order_date"])
    )
    order_features = orders.groupby("customer_id", as_index=False).agg(
        first_purchase=("order_date", "min"),
        last_purchase=("order_date", "max"),
        order_count=("invoice_id", "nunique"),
        total_revenue=("order_revenue", "sum"),
        item_quantity=("order_quantity", "sum"),
        average_order_value=("order_revenue", "mean"),
        average_basket_size=("order_quantity", "mean"),
    )
    purchase_gaps = (
        orders.groupby("customer_id")["order_date"]
        .apply(_average_purchase_gap, include_groups=False)
        .rename("average_days_between_orders")
        .reset_index()
    )
    activity = sales.groupby("customer_id", as_index=False).agg(
        active_days=("invoice_date", lambda values: values.dt.normalize().nunique()),
        active_months=("invoice_date", lambda values: values.dt.to_period("M").nunique()),
        product_variety=("stock_code", "nunique"),
        country=("country", _mode_or_unknown),
    )

    returns = data.loc[data["transaction_type"].eq("return")].copy()
    if returns.empty:
        return_features = pd.DataFrame(
            columns=[
                "customer_id",
                "return_order_count",
                "returned_quantity",
                "returned_value",
            ]
        )
    else:
        returns["returned_quantity"] = returns["quantity"].abs()
        returns["returned_value"] = returns["line_revenue"].abs()
        return_features = returns.groupby("customer_id", as_index=False).agg(
            return_order_count=("invoice_id", "nunique"),
            returned_quantity=("returned_quantity", "sum"),
            returned_value=("returned_value", "sum"),
        )

    features = (
        order_features.merge(activity, on="customer_id", how="left")
        .merge(purchase_gaps, on="customer_id", how="left")
        .merge(return_features, on="customer_id", how="left")
    )
    features[["return_order_count", "returned_quantity", "returned_value"]] = features[
        ["return_order_count", "returned_quantity", "returned_value"]
    ].fillna(0)

    reference_date = sales["invoice_date"].max().normalize() + pd.Timedelta(days=1)
    features["recency_days"] = (reference_date - features["last_purchase"]).dt.days
    features["tenure_days"] = (
        features["last_purchase"] - features["first_purchase"]
    ).dt.days.clip(lower=0)
    features["purchase_frequency_30d"] = (
        features["order_count"] / features["tenure_days"].clip(lower=30) * 30
    )
    features["return_rate"] = features["return_order_count"] / (
        features["order_count"] + features["return_order_count"]
    ).clip(lower=1)

    recent_score = _percentile_score(features["recency_days"], higher_is_better=False)
    frequency_score = _percentile_score(features["order_count"])
    activity_score = _percentile_score(features["active_months"])
    variety_score = _percentile_score(features["product_variety"])
    return_score = _percentile_score(features["return_rate"], higher_is_better=False)
    features["engagement_score"] = (
        recent_score * 0.35
        + frequency_score * 0.25
        + activity_score * 0.20
        + variety_score * 0.10
        + return_score * 0.10
    ).mul(100).round(1)

    integer_columns = [
        "order_count",
        "item_quantity",
        "active_days",
        "active_months",
        "product_variety",
        "return_order_count",
        "returned_quantity",
        "recency_days",
        "tenure_days",
    ]
    for column in integer_columns:
        features[column] = features[column].round().astype("int64")
    money_columns = ["total_revenue", "average_order_value", "returned_value"]
    features[money_columns] = features[money_columns].round(2)
    rate_columns = [
        "average_basket_size",
        "average_days_between_orders",
        "purchase_frequency_30d",
        "return_rate",
    ]
    features[rate_columns] = features[rate_columns].round(4)
    return features.sort_values("customer_id").reset_index(drop=True)


def _model_matrix(features: pd.DataFrame) -> tuple[np.ndarray, RobustScaler]:
    matrix = features.loc[:, CLUSTER_FEATURES].astype(float).copy()
    for column in LOG_FEATURES:
        matrix[column] = np.log1p(matrix[column].clip(lower=0))
    scaler = RobustScaler()
    return scaler.fit_transform(matrix), scaler


def _metrics(labels: np.ndarray, matrix: np.ndarray) -> dict[str, float]:
    return {
        "silhouette_score": round(float(silhouette_score(matrix, labels)), 6),
        "davies_bouldin_score": round(float(davies_bouldin_score(matrix, labels)), 6),
        "calinski_harabasz_score": round(float(calinski_harabasz_score(matrix, labels)), 6),
    }


def _segment_names(profiles: pd.DataFrame) -> dict[int, str]:
    labels_by_size = {
        2: ["Champions", "At Risk"],
        3: ["Champions", "Needs Attention", "Hibernating"],
        4: ["Champions", "Loyal Customers", "At Risk", "Hibernating"],
        5: [
            "Champions",
            "Loyal Customers",
            "Promising Customers",
            "At Risk",
            "Hibernating",
        ],
        6: [
            "Champions",
            "Loyal Customers",
            "Potential Loyalists",
            "Promising Customers",
            "At Risk",
            "Hibernating",
        ],
        7: [
            "Champions",
            "Loyal Customers",
            "High-Value Regulars",
            "Potential Loyalists",
            "Promising Customers",
            "At Risk",
            "Hibernating",
        ],
        8: [
            "Champions",
            "Loyal Customers",
            "High-Value Regulars",
            "Potential Loyalists",
            "Promising Customers",
            "Needs Attention",
            "At Risk",
            "Hibernating",
        ],
    }
    ranked = profiles.copy()
    ranked["business_score"] = (
        ranked["total_revenue"].rank(pct=True) * 0.35
        + ranked["order_count"].rank(pct=True) * 0.25
        + ranked["engagement_score"].rank(pct=True) * 0.25
        + ranked["recency_days"].rank(pct=True, ascending=False) * 0.15
    )
    ordered_clusters = ranked.sort_values("business_score", ascending=False)["cluster_id"].tolist()
    names = labels_by_size[len(ordered_clusters)]
    return dict(zip(ordered_clusters, names, strict=True))


def train_customer_segmentation(
    features: pd.DataFrame,
    *,
    min_clusters: int = 2,
    max_clusters: int = 8,
    random_state: int = 42,
) -> SegmentationResult:
    if len(features) < 4:
        raise ValueError("at least four customers are required for segmentation")
    missing = sorted(set(CLUSTER_FEATURES) - set(features.columns))
    if missing:
        raise ValueError(f"customer features are missing columns: {', '.join(missing)}")
    upper = min(max_clusters, len(features) - 1)
    if min_clusters < 2 or min_clusters > upper:
        raise ValueError("cluster range must contain at least one value between 2 and n-1")

    matrix, scaler = _model_matrix(features)
    candidates: list[dict[str, Any]] = []
    fitted_models: dict[int, KMeans] = {}
    for cluster_count in range(min_clusters, upper + 1):
        model = KMeans(n_clusters=cluster_count, random_state=random_state, n_init=20)
        labels = model.fit_predict(matrix)
        fitted_models[cluster_count] = model
        candidates.append(
            {
                "algorithm": "kmeans",
                "cluster_count": cluster_count,
                **_metrics(labels, matrix),
            }
        )

    comparison_size = min(len(features), 2000)
    rng = np.random.default_rng(random_state)
    comparison_indices = np.sort(rng.choice(len(features), size=comparison_size, replace=False))
    comparison_matrix = matrix[comparison_indices]
    for cluster_count in range(min_clusters, min(upper, comparison_size - 1) + 1):
        labels = AgglomerativeClustering(n_clusters=cluster_count, linkage="ward").fit_predict(
            comparison_matrix
        )
        candidates.append(
            {
                "algorithm": "hierarchical",
                "cluster_count": cluster_count,
                "evaluation_sample_size": comparison_size,
                **_metrics(labels, comparison_matrix),
            }
        )

    kmeans_results = [item for item in candidates if item["algorithm"] == "kmeans"]
    selected_metrics = max(
        kmeans_results,
        key=lambda item: (item["silhouette_score"], -item["davies_bouldin_score"]),
    )
    selected_k = int(selected_metrics["cluster_count"])
    model = fitted_models[selected_k]
    assignments = features.copy()
    assignments["cluster_id"] = model.labels_.astype(int)

    profiles = assignments.groupby("cluster_id", as_index=False).agg(
        customer_count=("customer_id", "size"),
        total_revenue=("total_revenue", "sum"),
        average_revenue=("total_revenue", "mean"),
        order_count=("order_count", "mean"),
        recency_days=("recency_days", "mean"),
        active_months=("active_months", "mean"),
        product_variety=("product_variety", "mean"),
        return_rate=("return_rate", "mean"),
        engagement_score=("engagement_score", "mean"),
    )
    name_map = _segment_names(profiles)
    code_map = {
        cluster_id: f"SEG-{position:02d}"
        for position, cluster_id in enumerate(name_map, start=1)
    }
    assignments["segment_code"] = assignments["cluster_id"].map(code_map)
    assignments["segment_name"] = assignments["cluster_id"].map(name_map)
    assignments["model_version"] = MODEL_VERSION
    profiles["segment_code"] = profiles["cluster_id"].map(code_map)
    profiles["segment_name"] = profiles["cluster_id"].map(name_map)
    profiles["customer_share"] = profiles["customer_count"] / len(assignments)
    profiles["revenue_share"] = profiles["total_revenue"] / assignments["total_revenue"].sum()

    profile_records = []
    for item in profiles.sort_values("segment_code").to_dict(orient="records"):
        profile_records.append(
            {
                key: (
                    int(value)
                    if isinstance(value, np.integer)
                    else round(float(value), 6)
                    if isinstance(value, float | np.floating)
                    else value
                )
                for key, value in item.items()
            }
        )

    report = {
        "model_version": MODEL_VERSION,
        "algorithm": "kmeans",
        "generated_at": datetime.now(UTC).isoformat(),
        "customer_count": len(assignments),
        "feature_names": list(CLUSTER_FEATURES),
        "transform": "log1p selected skewed features followed by RobustScaler",
        "selected_cluster_count": selected_k,
        "selected_metrics": selected_metrics,
        "candidate_metrics": candidates,
        "segment_profiles": profile_records,
        "engagement_definition": (
            "Transaction engagement score: 35% recency, 25% order frequency, "
            "20% active months, 10% product variety, and 10% inverse return rate."
        ),
    }
    artifact = {
        "model_version": MODEL_VERSION,
        "feature_names": list(CLUSTER_FEATURES),
        "log_features": sorted(LOG_FEATURES),
        "scaler": scaler,
        "model": model,
        "segment_names": name_map,
        "segment_codes": code_map,
        "metrics": selected_metrics,
    }
    return SegmentationResult(assignments=assignments, report=report, artifact=artifact)


def run_pipeline(
    customer_path: Path,
    output_dir: Path,
    *,
    min_clusters: int = 2,
    max_clusters: int = 8,
    random_state: int = 42,
    review_output_dir: Path | None = None,
    sample_size: int = 250,
) -> dict[str, Any]:
    sheets = pd.read_excel(customer_path, sheet_name=None)
    raw = pd.concat(sheets.values(), ignore_index=True)
    cleaned, _, quality = clean_customer_transactions(raw)
    features = build_customer_features(cleaned)
    result = train_customer_segmentation(
        features,
        min_clusters=min_clusters,
        max_clusters=max_clusters,
        random_state=random_state,
    )
    output_dir.mkdir(parents=True, exist_ok=True)
    features.to_csv(output_dir / "customer_features.csv", index=False)
    result.assignments.to_csv(output_dir / "customer_segments.csv", index=False)
    report = {"data_quality": quality, **result.report}
    (output_dir / "segmentation_report.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    joblib.dump(result.artifact, output_dir / "customer_segmentation.joblib")
    if review_output_dir is not None:
        review_output_dir.mkdir(parents=True, exist_ok=True)
        sample = result.assignments.sample(
            n=min(sample_size, len(result.assignments)), random_state=random_state
        ).sort_values("customer_id")
        sample.to_csv(review_output_dir / "customer_segments_sample.csv", index=False)
        (review_output_dir / "segmentation_report.json").write_text(
            json.dumps(report, indent=2) + "\n", encoding="utf-8"
        )
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build MarketMind customer behavior features and segmentation models."
    )
    parser.add_argument("--customers", required=True, type=Path, help="online_retail_II.xlsx")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/generated/customer-segmentation"),
        help="Generated feature, assignment, report, and model directory",
    )
    parser.add_argument("--min-clusters", type=int, default=2)
    parser.add_argument("--max-clusters", type=int, default=8)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument(
        "--review-output",
        type=Path,
        default=None,
        help="Optional directory for a small reviewed assignment sample and metrics report",
    )
    parser.add_argument("--sample-size", type=int, default=250)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.sample_size < 1:
        raise ValueError("sample-size must be at least 1")
    report = run_pipeline(
        args.customers,
        args.output,
        min_clusters=args.min_clusters,
        max_clusters=args.max_clusters,
        random_state=args.random_state,
        review_output_dir=args.review_output,
        sample_size=args.sample_size,
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
