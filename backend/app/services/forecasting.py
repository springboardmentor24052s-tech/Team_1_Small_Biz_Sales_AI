from collections import defaultdict
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.forecasting import ForecastModelRun, ForecastPrediction
from app.models.inventory import Inventory, Product


def latest_forecast_run(
    db: Session,
    *,
    tenant_id: UUID,
    forecast_type: str,
    scope_type: str,
    store_id: UUID | None = None,
    seller_id: UUID | None = None,
) -> ForecastModelRun | None:
    query = select(ForecastModelRun).where(
        ForecastModelRun.tenant_id == tenant_id,
        ForecastModelRun.forecast_type == forecast_type,
        ForecastModelRun.scope_type == scope_type,
        ForecastModelRun.status == "active",
    )
    if store_id is not None:
        query = query.where(ForecastModelRun.store_id == store_id)
    if seller_id is not None:
        query = query.where(ForecastModelRun.seller_id == seller_id)
    return db.scalar(query.order_by(ForecastModelRun.trained_at.desc()).limit(1))


def prediction_rows(
    db: Session,
    *,
    model_run_id: UUID,
    horizon: int,
    category: str | None = None,
) -> list[ForecastPrediction]:
    query = select(ForecastPrediction).where(
        ForecastPrediction.model_run_id == model_run_id,
        ForecastPrediction.horizon_day <= horizon,
    )
    if category:
        query = query.where(ForecastPrediction.source_category_id == category)
    return list(
        db.scalars(
            query.order_by(
                ForecastPrediction.source_product_id,
                ForecastPrediction.forecast_date,
            )
        ).all()
    )


def demand_groups(
    db: Session,
    *,
    model_run_id: UUID,
    store_id: UUID,
    horizon: int,
    category: str | None,
    source_product_id: str | None,
) -> list[dict]:
    rows = prediction_rows(
        db,
        model_run_id=model_run_id,
        horizon=horizon,
        category=category,
    )
    if source_product_id:
        rows = [row for row in rows if row.source_product_id == source_product_id]
    inventory_rows = list(db.scalars(select(Inventory).where(Inventory.store_id == store_id)).all())
    inventory = {item.product_id: item.stock_quantity for item in inventory_rows}
    products = {item.product_id: item.product for item in inventory_rows}
    mapped_product_ids = {row.product_id for row in rows if row.product_id is not None}
    if mapped_product_ids:
        products.update(
            {
                product.id: product
                for product in db.scalars(
                    select(Product).where(Product.id.in_(mapped_product_ids))
                ).all()
            }
        )
    grouped: dict[tuple[str, str, str, UUID | None], list[ForecastPrediction]] = defaultdict(list)
    for row in rows:
        grouped[
            (
                row.source_store_id,
                row.source_product_id,
                row.source_category_id,
                row.product_id,
            )
        ].append(row)
    result = []
    for key, series in grouped.items():
        predicted = sum((item.predicted for item in series), Decimal("0"))
        available = inventory.get(key[3]) if key[3] else None
        product = products.get(key[3]) if key[3] else None
        if available is None:
            risk = "unknown"
        elif predicted > available:
            risk = "high"
        elif predicted > Decimal(available) * Decimal("0.75"):
            risk = "medium"
        else:
            risk = "low"
        result.append(
            {
                "source_store_id": key[0],
                "source_product_id": key[1],
                "source_category_id": key[2],
                "product_id": key[3],
                "product_sku": product.sku if product else None,
                "product_name": product.name if product else None,
                "mapping_status": "mapped" if product else "unmapped",
                "predicted_demand": predicted,
                "available_stock": available,
                "stock_risk": risk,
                "rows": series,
            }
        )
    return sorted(result, key=lambda item: item["predicted_demand"], reverse=True)
