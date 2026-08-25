from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import utcnow
from app.models.churn import ChurnModelRun, CustomerChurnRisk
from app.models.customers import Customer
from app.models.sales import SalesLineItem, SalesTransaction, TransactionStatus
from preprocessing.churn_prediction import (
    CHURN_FEATURES,
    engineer_churn_features,
    train_churn_models,
)


def extract_customer_transactions(db: Session, tenant_id: UUID) -> pd.DataFrame:
    """Extracts completed sales transactions for tenant customer churn modeling."""
    query = (
        select(
            SalesTransaction.id.label("invoice_id"),
            SalesTransaction.customer_id,
            SalesTransaction.occurred_at.label("invoice_date"),
            SalesTransaction.total_amount.label("line_revenue"),
            SalesTransaction.item_count.label("quantity"),
            SalesTransaction.status,
        )
        .where(
            SalesTransaction.tenant_id == tenant_id,
            SalesTransaction.customer_id.is_not(None),
            SalesTransaction.status == TransactionStatus.COMPLETED,
        )
    )
    results = db.execute(query).fetchall()
    if not results:
        # Also check customer summaries if direct transactions are sparse
        customers = db.scalars(select(Customer).where(Customer.tenant_id == tenant_id)).all()
        if not customers:
            return pd.DataFrame()
        records = []
        for c in customers:
            records.append({
                "invoice_id": str(c.id),
                "customer_id": str(c.id),
                "invoice_date": c.last_purchase,
                "line_revenue": float(c.total_revenue),
                "quantity": int(c.item_quantity),
                "status": "completed",
            })
        return pd.DataFrame(records)

    records = [
        {
            "invoice_id": str(r.invoice_id),
            "customer_id": str(r.customer_id),
            "invoice_date": r.invoice_date,
            "line_revenue": float(r.line_revenue),
            "quantity": int(r.quantity),
            "status": r.status,
        }
        for r in results
    ]
    return pd.DataFrame(records)


def train_tenant_churn_model(db: Session, tenant_id: UUID) -> ChurnModelRun | None:
    """Trains churn prediction models on tenant customer behavior and stores predictions."""
    df_tx = extract_customer_transactions(db, tenant_id)
    if df_tx.empty:
        return None

    features_df = engineer_churn_features(df_tx)
    if len(features_df) < 5:
        return None

    # If < 10, duplicate slightly for training stability
    if len(features_df) < 10:
        features_df = pd.concat([features_df, features_df], ignore_index=True)

    result = train_churn_models(features_df)

    # Save ChurnModelRun
    model_run = ChurnModelRun(
        tenant_id=tenant_id,
        model_version=f"{result.model_version}-{utcnow().strftime('%Y%m%d%H%M%S')}",
        algorithm=result.metrics["algorithm"],
        baseline_algorithm="Logistic Regression (Baseline)",
        status="active",
        accuracy=result.metrics["accuracy"],
        precision_score=result.metrics["precision"],
        recall_score=result.metrics["recall"],
        f1_score=result.metrics["f1"],
        roc_auc=result.metrics.get("roc_auc"),
        feature_names=result.feature_names,
        metrics={
            "winning_model": result.metrics,
            "candidate_evaluations": result.candidate_metrics,
        },
        trained_at=utcnow(),
    )
    db.add(model_run)
    db.flush()

    # Map predictions to real Customer IDs in DB
    existing_customers = {
        str(c.id): c for c in db.scalars(select(Customer).where(Customer.tenant_id == tenant_id)).all()
    }

    for _, row in result.predictions.iterrows():
        cust_id_str = str(row["customer_id"])
        if cust_id_str not in existing_customers:
            continue
        cust_obj = existing_customers[cust_id_str]

        churn_risk = CustomerChurnRisk(
            tenant_id=tenant_id,
            model_run_id=model_run.id,
            customer_id=cust_obj.id,
            churn_probability=float(row["churn_probability"]),
            risk_level=str(row["risk_level"]),
            inactivity_days=int(row["recency_days"]),
            order_frequency_30d=Decimal(str(round(float(row["purchase_frequency_30d"]), 4))),
            total_spend=Decimal(str(round(float(row["total_revenue"]), 2))),
            risk_factors=list(row["risk_factors"]),
            recommended_actions=list(row["recommended_actions"]),
        )
        db.add(churn_risk)

    db.commit()
    db.refresh(model_run)
    return model_run


def get_latest_churn_model_run(db: Session, tenant_id: UUID) -> ChurnModelRun | None:
    return db.scalar(
        select(ChurnModelRun)
        .where(ChurnModelRun.tenant_id == tenant_id)
        .order_by(ChurnModelRun.trained_at.desc())
    )

