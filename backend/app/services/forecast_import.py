from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from datetime import UTC, date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.forecasting import ForecastJob, ForecastModelRun, ForecastPrediction
from app.models.identity import Store
from app.models.inventory import Product

REQUIRED_COLUMNS = {
    "forecast_type",
    "target",
    "unit",
    "granularity",
    "source_store_id",
    "source_product_id",
    "source_category_id",
    "forecast_date",
    "horizon_day",
    "actual",
    "predicted",
    "lower_bound",
    "upper_bound",
}


@dataclass
class ForecastImportReport:
    model_run_created: bool = False
    predictions_created: int = 0
    predictions_updated: int = 0
    predictions_unchanged: int = 0
    predictions_skipped: int = 0
    mapped_series: int = 0
    unmapped_series: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _read_predictions(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        raise ValueError(f"forecast prediction file does not exist: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        missing = sorted(REQUIRED_COLUMNS - set(reader.fieldnames or []))
        if missing:
            raise ValueError(f"forecast predictions are missing columns: {', '.join(missing)}")
        return list(reader)


def _read_report(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise ValueError(f"forecast report does not exist: {path}")
    report = json.loads(path.read_text(encoding="utf-8"))
    required = {
        "model_version",
        "forecast_type",
        "source_system",
        "target",
        "unit",
        "granularity",
        "horizons",
        "generated_at",
        "selected_algorithm",
        "selected_metrics",
        "candidate_metrics",
        "training_start",
        "training_end",
    }
    missing = sorted(required - set(report))
    if missing:
        raise ValueError(f"forecast report is missing fields: {', '.join(missing)}")
    return report


def _read_product_mapping(
    db: Session,
    *,
    tenant_id: UUID,
    path: Path | None,
    scoped_store_id: UUID | None,
) -> dict[tuple[str, str], UUID]:
    if path is None:
        return {}
    if not path.is_file():
        raise ValueError(f"forecast product mapping file does not exist: {path}")
    required = {"source_store_id", "source_product_id", "store_code", "product_sku"}
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        missing = sorted(required - set(reader.fieldnames or []))
        if missing:
            raise ValueError(f"forecast product mapping is missing columns: {', '.join(missing)}")
        rows = list(reader)

    stores = {
        store.code: store
        for store in db.scalars(select(Store).where(Store.tenant_id == tenant_id)).all()
    }
    products = {
        product.sku: product
        for product in db.scalars(select(Product).where(Product.tenant_id == tenant_id)).all()
    }
    mappings: dict[tuple[str, str], UUID] = {}
    for line_number, row in enumerate(rows, start=2):
        source_key = (row["source_store_id"].strip(), row["source_product_id"].strip())
        store = stores.get(row["store_code"].strip())
        product = products.get(row["product_sku"].strip())
        if not all(source_key):
            raise ValueError(f"forecast product mapping row {line_number} has a blank source key")
        if store is None:
            raise ValueError(f"forecast product mapping row {line_number} has an unknown store")
        if scoped_store_id is not None and store.id != scoped_store_id:
            raise ValueError(
                f"forecast product mapping row {line_number} is outside the imported store scope"
            )
        if product is None:
            raise ValueError(
                f"forecast product mapping row {line_number} has an unknown product SKU"
            )
        existing = mappings.get(source_key)
        if existing is not None and existing != product.id:
            source_label = f"{source_key[0]}/{source_key[1]}"
            raise ValueError(
                f"forecast product mapping contains conflicting rows for {source_label}"
            )
        mappings[source_key] = product.id
    return mappings


def _timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed


def _decimal(value: str, *, optional: bool = False) -> Decimal | None:
    if optional and not value.strip():
        return None
    try:
        return Decimal(value).quantize(Decimal("0.0001"))
    except InvalidOperation as exc:
        raise ValueError(f"invalid forecast value: {value!r}") from exc


def _set_changed(model: Any, values: dict[str, Any]) -> bool:
    changed = False
    for name, value in values.items():
        if getattr(model, name) != value:
            setattr(model, name, value)
            changed = True
    return changed


def import_forecasts(
    db: Session,
    *,
    tenant_id: UUID,
    predictions_path: Path,
    report_path: Path,
    scope_type: str,
    store_id: UUID | None = None,
    seller_id: UUID | None = None,
    source_store_id: str | None = None,
    product_mapping_path: Path | None = None,
) -> ForecastImportReport:
    if scope_type not in {"business", "store", "personal"}:
        raise ValueError("scope_type must be business, store or personal")
    if scope_type == "store" and store_id is None:
        raise ValueError("store scope requires store_id")
    if scope_type == "personal" and seller_id is None:
        raise ValueError("personal scope requires seller_id")
    rows = _read_predictions(predictions_path)
    model_report = _read_report(report_path)
    forecast_type = str(model_report["forecast_type"])
    if any(row["forecast_type"] != forecast_type for row in rows):
        raise ValueError("prediction forecast types do not match the report")
    if source_store_id is not None:
        rows = [row for row in rows if row["source_store_id"] == source_store_id]
    if not rows:
        raise ValueError("no forecast rows match the requested scope")

    scope_key = {
        "business": "business",
        "store": f"store:{store_id}",
        "personal": f"seller:{seller_id}",
    }[scope_type]
    result = ForecastImportReport()
    model_run = db.scalar(
        select(ForecastModelRun).where(
            ForecastModelRun.tenant_id == tenant_id,
            ForecastModelRun.model_version == str(model_report["model_version"]),
            ForecastModelRun.forecast_type == forecast_type,
            ForecastModelRun.scope_key == scope_key,
        )
    )
    model_values = {
        "store_id": store_id,
        "seller_id": seller_id,
        "scope_type": scope_type,
        "target": str(model_report["target"]),
        "unit": str(model_report["unit"]),
        "granularity": str(model_report["granularity"]),
        "source_system": str(model_report["source_system"]),
        "algorithm": str(model_report["selected_algorithm"]),
        "baseline_algorithm": "seasonal_naive",
        "status": "active",
        "horizons": [int(item) for item in model_report["horizons"]],
        "metrics": dict(model_report["selected_metrics"]),
        "candidate_metrics": list(model_report["candidate_metrics"]),
        "training_start": date.fromisoformat(model_report["training_start"]),
        "training_end": date.fromisoformat(model_report["training_end"]),
        "trained_at": _timestamp(str(model_report["generated_at"])),
    }
    if model_run is None:
        model_run = ForecastModelRun(
            tenant_id=tenant_id,
            model_version=str(model_report["model_version"]),
            forecast_type=forecast_type,
            scope_key=scope_key,
            **model_values,
        )
        db.add(model_run)
        db.flush()
        result.model_run_created = True
    else:
        _set_changed(model_run, model_values)

    previous_runs = db.scalars(
        select(ForecastModelRun).where(
            ForecastModelRun.tenant_id == tenant_id,
            ForecastModelRun.forecast_type == forecast_type,
            ForecastModelRun.scope_key == scope_key,
            ForecastModelRun.id != model_run.id,
            ForecastModelRun.status == "active",
        )
    ).all()
    for previous_run in previous_runs:
        previous_run.status = "superseded"

    products = {
        product.sku: product.id
        for product in db.scalars(select(Product).where(Product.tenant_id == tenant_id)).all()
    }
    product_mappings = _read_product_mapping(
        db,
        tenant_id=tenant_id,
        path=product_mapping_path,
        scoped_store_id=store_id,
    )
    scope_reports = {str(item["category"]): item for item in model_report.get("scope_reports", [])}
    existing = {
        (
            item.source_store_id,
            item.source_product_id,
            item.source_category_id,
            item.forecast_date,
        ): item
        for item in db.scalars(
            select(ForecastPrediction).where(ForecastPrediction.model_run_id == model_run.id)
        ).all()
    }
    mapped_series: set[tuple[str, str]] = set()
    unmapped_series: set[tuple[str, str]] = set()
    for row in rows:
        try:
            forecast_date = date.fromisoformat(row["forecast_date"])
            series_report = scope_reports.get(row["source_category_id"], model_report)
            source_key = (row["source_store_id"], row["source_product_id"])
            product_id = product_mappings.get(source_key) or products.get(row["source_product_id"])
            values = {
                "tenant_id": tenant_id,
                "product_id": product_id,
                "horizon_day": int(row["horizon_day"]),
                "algorithm": str(series_report["selected_algorithm"]),
                "metrics": dict(series_report["selected_metrics"]),
                "candidate_metrics": list(series_report["candidate_metrics"]),
                "actual": _decimal(row["actual"], optional=True),
                "predicted": _decimal(row["predicted"]),
                "lower_bound": _decimal(row["lower_bound"]),
                "upper_bound": _decimal(row["upper_bound"]),
            }
        except (ValueError, TypeError):
            result.predictions_skipped += 1
            continue
        if values["horizon_day"] not in range(1, 31) or values["predicted"] < 0:
            result.predictions_skipped += 1
            continue
        if forecast_type == "demand":
            (mapped_series if values["product_id"] else unmapped_series).add(source_key)
        key = (
            row["source_store_id"],
            row["source_product_id"],
            row["source_category_id"],
            forecast_date,
        )
        prediction = existing.get(key)
        if prediction is None:
            prediction = ForecastPrediction(
                model_run_id=model_run.id,
                source_store_id=key[0],
                source_product_id=key[1],
                source_category_id=key[2],
                forecast_date=forecast_date,
                **values,
            )
            db.add(prediction)
            existing[key] = prediction
            result.predictions_created += 1
        elif _set_changed(prediction, values):
            result.predictions_updated += 1
        else:
            result.predictions_unchanged += 1

    result.mapped_series = len(mapped_series)
    result.unmapped_series = len(unmapped_series)

    reference = f"{model_run.model_version}:{forecast_type}:{scope_key}"
    job = db.scalar(
        select(ForecastJob).where(
            ForecastJob.tenant_id == tenant_id,
            ForecastJob.external_reference == reference,
        )
    )
    now = datetime.now(UTC)
    job_values = {
        "job_type": f"{forecast_type}_import",
        "status": "success",
        "record_count": len(rows) - result.predictions_skipped,
        "started_at": model_run.trained_at,
        "completed_at": now,
        "details": result.to_dict(),
    }
    if job is None:
        db.add(
            ForecastJob(
                tenant_id=tenant_id,
                external_reference=reference,
                **job_values,
            )
        )
    else:
        _set_changed(job, job_values)
    db.flush()
    return result
