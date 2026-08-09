from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.segmentation import CustomerSegmentAssignment, SegmentationModelRun

REQUIRED_COLUMNS = {
    "customer_id",
    "last_purchase",
    "order_count",
    "item_quantity",
    "total_revenue",
    "recency_days",
    "first_purchase",
    "average_order_value",
    "average_basket_size",
    "active_days",
    "active_months",
    "product_variety",
    "tenure_days",
    "average_days_between_orders",
    "return_order_count",
    "returned_value",
    "return_rate",
    "purchase_frequency_30d",
    "engagement_score",
    "cluster_id",
    "segment_code",
    "segment_name",
    "model_version",
}


@dataclass
class SegmentationImportReport:
    model_run_created: bool = False
    customers_created: int = 0
    customers_updated: int = 0
    customers_unchanged: int = 0
    assignments_created: int = 0
    assignments_updated: int = 0
    assignments_unchanged: int = 0
    assignments_skipped: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _read_assignments(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        raise ValueError(f"segmentation assignment file does not exist: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        missing = sorted(REQUIRED_COLUMNS - set(reader.fieldnames or []))
        if missing:
            raise ValueError(f"segmentation assignments are missing columns: {', '.join(missing)}")
        return list(reader)


def _read_report(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise ValueError(f"segmentation report does not exist: {path}")
    report = json.loads(path.read_text(encoding="utf-8"))
    required = {
        "model_version",
        "algorithm",
        "generated_at",
        "feature_names",
        "selected_cluster_count",
        "selected_metrics",
    }
    missing = sorted(required - set(report))
    if missing:
        raise ValueError(f"segmentation report is missing fields: {', '.join(missing)}")
    return report


def _integer(value: str | None) -> int:
    try:
        return int(Decimal(value or ""))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"invalid integer value: {value!r}") from exc


def _decimal(value: str | None, places: str = "0.0001") -> Decimal:
    try:
        return Decimal(value or "").quantize(Decimal(places))
    except InvalidOperation as exc:
        raise ValueError(f"invalid decimal value: {value!r}") from exc


def _timestamp(value: str | None) -> datetime:
    if not value:
        raise ValueError("missing timestamp")
    parsed = datetime.fromisoformat(value)
    return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed


def _set_changed(model: Any, values: dict[str, Any]) -> bool:
    changed = False
    for name, value in values.items():
        current = getattr(model, name)
        if isinstance(current, datetime) and isinstance(value, datetime):
            current = current.replace(tzinfo=current.tzinfo or UTC).astimezone(UTC)
            value = value.replace(tzinfo=value.tzinfo or UTC).astimezone(UTC)
        if current != value:
            setattr(model, name, value)
            changed = True
    return changed


def import_customer_segments(
    db: Session,
    *,
    tenant_id: UUID,
    assignments_path: Path,
    report_path: Path,
    source_system: str = "online_retail_ii",
    assigned_seller_id: UUID | None = None,
) -> SegmentationImportReport:
    rows = _read_assignments(assignments_path)
    model_report = _read_report(report_path)
    metrics = model_report["selected_metrics"]
    model_version = str(model_report["model_version"])
    if any(row["model_version"] != model_version for row in rows):
        raise ValueError("assignment model versions do not match the report")

    result = SegmentationImportReport()
    model_run = db.scalar(
        select(SegmentationModelRun).where(
            SegmentationModelRun.tenant_id == tenant_id,
            SegmentationModelRun.source_system == source_system,
            SegmentationModelRun.model_version == model_version,
        )
    )
    model_values = {
        "algorithm": str(model_report["algorithm"]),
        "cluster_count": int(model_report["selected_cluster_count"]),
        "silhouette_score": float(metrics["silhouette_score"]),
        "davies_bouldin_score": float(metrics["davies_bouldin_score"]),
        "calinski_harabasz_score": float(metrics["calinski_harabasz_score"]),
        "feature_names": list(model_report["feature_names"]),
        "metrics": model_report,
        "trained_at": _timestamp(str(model_report["generated_at"])),
    }
    if model_run is None:
        model_run = SegmentationModelRun(
            tenant_id=tenant_id,
            source_system=source_system,
            model_version=model_version,
            **model_values,
        )
        db.add(model_run)
        db.flush()
        result.model_run_created = True
    else:
        _set_changed(model_run, model_values)

    customers = {
        customer.external_customer_id: customer
        for customer in db.scalars(
            select(Customer).where(
                Customer.tenant_id == tenant_id,
                Customer.source_system == source_system,
            )
        ).all()
    }
    existing = {
        assignment.customer_id: assignment
        for assignment in db.scalars(
            select(CustomerSegmentAssignment).where(
                CustomerSegmentAssignment.model_run_id == model_run.id
            )
        ).all()
    }
    for row in rows:
        external_customer_id = row["customer_id"].strip()
        try:
            customer_values = {
                "last_purchase": _timestamp(row["last_purchase"]),
                "order_count": _integer(row["order_count"]),
                "item_quantity": _integer(row["item_quantity"]),
                "total_revenue": _decimal(row["total_revenue"], "0.01"),
                "recency_days": _integer(row["recency_days"]),
            }
            if assigned_seller_id is not None:
                customer_values["assigned_seller_id"] = assigned_seller_id
            values = {
                "tenant_id": tenant_id,
                "cluster_id": _integer(row["cluster_id"]),
                "segment_code": row["segment_code"].strip(),
                "segment_name": row["segment_name"].strip(),
                "first_purchase": _timestamp(row["first_purchase"]),
                "average_order_value": _decimal(row["average_order_value"], "0.01"),
                "average_basket_size": _decimal(row["average_basket_size"]),
                "active_days": _integer(row["active_days"]),
                "active_months": _integer(row["active_months"]),
                "product_variety": _integer(row["product_variety"]),
                "tenure_days": _integer(row["tenure_days"]),
                "average_days_between_orders": _decimal(
                    row["average_days_between_orders"]
                ),
                "return_order_count": _integer(row["return_order_count"]),
                "returned_value": _decimal(row["returned_value"], "0.01"),
                "return_rate": _decimal(row["return_rate"], "0.000001"),
                "purchase_frequency_30d": _decimal(row["purchase_frequency_30d"]),
                "engagement_score": _decimal(row["engagement_score"], "0.01"),
            }
        except ValueError:
            result.assignments_skipped += 1
            continue
        if (
            not external_customer_id
            or not values["segment_code"]
            or not values["segment_name"]
            or customer_values["order_count"] < 1
            or customer_values["item_quantity"] < 1
            or customer_values["total_revenue"] <= 0
            or customer_values["recency_days"] < 0
        ):
            result.assignments_skipped += 1
            continue
        customer = customers.get(external_customer_id)
        if customer is None:
            customer = Customer(
                tenant_id=tenant_id,
                source_system=source_system,
                external_customer_id=external_customer_id,
                **customer_values,
            )
            db.add(customer)
            db.flush()
            customers[external_customer_id] = customer
            result.customers_created += 1
        elif _set_changed(customer, customer_values):
            result.customers_updated += 1
        else:
            result.customers_unchanged += 1
        assignment = existing.get(customer.id)
        if assignment is None:
            db.add(
                CustomerSegmentAssignment(
                    model_run_id=model_run.id,
                    customer_id=customer.id,
                    **values,
                )
            )
            result.assignments_created += 1
        elif _set_changed(assignment, values):
            result.assignments_updated += 1
        else:
            result.assignments_unchanged += 1
    db.flush()
    return result
