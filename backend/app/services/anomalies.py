from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import utcnow
from app.models.anomalies import AnomalyEvent, AnomalyModelRun
from app.models.inventory import Inventory, Product
from app.models.sales import SalesTransaction, TransactionStatus
from preprocessing.anomaly_detector import (
    detect_inventory_shrinkage,
    detect_sales_trend_anomalies,
    detect_transaction_anomalies,
)


def train_and_scan_anomalies(db: Session, tenant_id: UUID, contamination: float = 0.05) -> AnomalyModelRun | None:
    """Executes multi-dimensional anomaly detection across sales, transactions, and inventory."""
    # 1. Fetch transactions
    tx_query = select(SalesTransaction).where(
        SalesTransaction.tenant_id == tenant_id,
        SalesTransaction.status == TransactionStatus.COMPLETED,
    )
    transactions = db.scalars(tx_query).all()

    df_tx = pd.DataFrame([
        {
            "id": str(t.id),
            "external_reference": t.external_reference or str(t.id)[:8],
            "total_amount": float(t.total_amount),
            "item_count": t.item_count,
            "discount_amount": float(t.discount_amount or 0),
            "payment_method": t.payment_method or "unknown",
            "occurred_at": t.occurred_at,
        }
        for t in transactions
    ])

    tx_anomalies, metrics = detect_transaction_anomalies(df_tx, contamination=contamination)

    # 2. Fetch daily sales trend for statistical anomalies
    daily_sales = (
        db.query(
            func.date(SalesTransaction.occurred_at).label("day"),
            func.sum(SalesTransaction.total_amount).label("daily_total"),
        )
        .filter(
            SalesTransaction.tenant_id == tenant_id,
            SalesTransaction.status == TransactionStatus.COMPLETED,
        )
        .group_by("day")
        .order_by("day")
        .all()
    )
    daily_series = [(datetime.strptime(str(row.day), "%Y-%m-%d"), float(row.daily_total)) for row in daily_sales]
    trend_anomalies = detect_sales_trend_anomalies(daily_series)

    # 3. Inventory shrinkage scan
    inv_records = (
        db.query(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .filter(Inventory.tenant_id == tenant_id)
        .all()
    )
    inv_data = [
        {
            "sku": prod.sku,
            "product_name": prod.name,
            "stock_quantity": inv.stock_quantity,
            "reorder_level": inv.reorder_level,
        }
        for inv, prod in inv_records
    ]
    inv_anomalies = detect_inventory_shrinkage(inv_data)

    all_anomalies = tx_anomalies + trend_anomalies + inv_anomalies

    # Save AnomalyModelRun
    model_run = AnomalyModelRun(
        tenant_id=tenant_id,
        model_version=f"anomaly-detection-v1-{utcnow().strftime('%Y%m%d%H%M%S')}",
        algorithm="Isolation Forest & Statistical Outlier Scoring",
        status="active",
        detection_rate=metrics["detection_rate"],
        false_positive_rate=metrics["false_positive_rate"],
        contamination=contamination,
        metrics={
            "isolation_forest": metrics,
            "trend_anomalies_count": len(trend_anomalies),
            "inventory_anomalies_count": len(inv_anomalies),
            "total_anomalies_flagged": len(all_anomalies),
        },
        trained_at=utcnow(),
    )
    db.add(model_run)
    db.flush()

    # Clear old open events and persist new ones
    for anom in all_anomalies:
        event = AnomalyEvent(
            tenant_id=tenant_id,
            model_run_id=model_run.id,
            anomaly_type=anom["anomaly_type"],
            severity=anom["severity"],
            score=anom["score"],
            title=anom["title"],
            description=anom["description"],
            details=anom["details"],
            status="open",
            entity_type=anom.get("entity_type"),
            entity_id=anom.get("entity_id"),
        )
        db.add(event)

    db.commit()
    db.refresh(model_run)
    return model_run


def list_tenant_anomalies(
    db: Session,
    tenant_id: UUID,
    severity: str | None = None,
    anomaly_type: str | None = None,
    status: str | None = None,
    limit: int = 50,
) -> list[AnomalyEvent]:
    """Retrieves filtered anomaly events."""
    query = select(AnomalyEvent).where(AnomalyEvent.tenant_id == tenant_id)
    if severity:
        query = query.where(AnomalyEvent.severity == severity)
    if anomaly_type:
        query = query.where(AnomalyEvent.anomaly_type == anomaly_type)
    if status:
        query = query.where(AnomalyEvent.status == status)
    
    return db.scalars(query.order_by(AnomalyEvent.created_at.desc()).limit(limit)).all()

