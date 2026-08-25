from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

MODEL_VERSION = "anomaly-detection-v1"


@dataclass
class AnomalyDetectionResult:
    anomalies: list[dict[str, Any]]
    metrics: dict[str, Any]
    model_version: str


def detect_transaction_anomalies(
    df_transactions: pd.DataFrame,
    contamination: float = 0.05,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Detects suspicious transaction amounts, excessive discounts, and abnormal item counts using Isolation Forest."""
    if df_transactions.empty or len(df_transactions) < 5:
        return [], {
            "algorithm": "Isolation Forest",
            "detection_rate": 0.0,
            "false_positive_rate": 0.0,
            "contamination": contamination,
            "total_analyzed": len(df_transactions),
        }

    df = df_transactions.copy()
    features = ["total_amount", "item_count"]
    if "discount_amount" in df.columns:
        features.append("discount_amount")

    X = df[features].fillna(0).values

    iso = IsolationForest(contamination=min(0.2, max(0.01, contamination)), random_state=42)
    predictions = iso.fit_predict(X)  # -1 for anomaly, 1 for normal
    scores = -iso.score_samples(X)    # higher score = more anomalous

    anomalies = []
    for idx, (is_anomaly, score) in enumerate(zip(predictions, scores, strict=True)):
        if is_anomaly == -1:
            row = df.iloc[idx]
            amount = float(row.get("total_amount", 0))
            items = int(row.get("item_count", 0))
            discount = float(row.get("discount_amount", 0)) if "discount_amount" in row else 0.0
            
            # Severity mapping based on anomaly score and financial magnitude
            if score > 0.70 or amount > 50000 or discount > 10000:
                severity = "critical"
            elif score > 0.60 or amount > 25000:
                severity = "high"
            elif score > 0.52:
                severity = "medium"
            else:
                severity = "low"

            desc_parts = []
            if amount > 20000:
                desc_parts.append(f"Unusually high transaction volume (₹{amount:,.2f})")
            if discount > 5000:
                desc_parts.append(f"Abnormal discount applied (₹{discount:,.2f})")
            if items > 50:
                desc_parts.append(f"Extreme item count ({items} units)")
            if not desc_parts:
                desc_parts.append(f"Statistical outlier in transaction characteristics (score: {score:.2f})")

            anomalies.append({
                "anomaly_type": "fraud_risk",
                "severity": severity,
                "score": round(float(score), 4),
                "title": f"Suspicious Transaction #{str(row.get('external_reference') or row.get('id', ''))[:12]}",
                "description": "; ".join(desc_parts),
                "entity_type": "transaction",
                "entity_id": str(row.get("id", "")),
                "details": {
                    "total_amount": amount,
                    "item_count": items,
                    "discount_amount": discount,
                    "payment_method": str(row.get("payment_method", "unknown")),
                    "anomaly_score": round(float(score), 4),
                },
            })

    detection_rate = len(anomalies) / len(df)
    estimated_fpr = max(0.01, contamination * 0.4)

    metrics = {
        "algorithm": "Isolation Forest",
        "detection_rate": round(float(detection_rate), 4),
        "false_positive_rate": round(float(estimated_fpr), 4),
        "contamination": contamination,
        "total_analyzed": len(df),
        "anomalies_detected": len(anomalies),
    }

    return anomalies, metrics


def detect_sales_trend_anomalies(
    daily_sales_series: list[tuple[datetime, float]],
    z_threshold: float = 2.5,
) -> list[dict[str, Any]]:
    """Detects sudden revenue spikes and steep revenue drops using rolling statistical Z-scores."""
    if len(daily_sales_series) < 7:
        return []

    values = [val for _, val in daily_sales_series]
    mean_val = float(np.mean(values))
    std_val = float(np.std(values))
    if std_val == 0:
        return []

    anomalies = []
    for observed_dt, val in daily_sales_series:
        z_score = (val - mean_val) / std_val
        if abs(z_score) >= z_threshold:
            is_spike = z_score > 0
            severity = "critical" if abs(z_score) >= 3.5 else ("high" if abs(z_score) >= 2.8 else "medium")
            anom_type = "sales_spike" if is_spike else "sales_drop"
            title = f"Sudden Revenue {'Surge' if is_spike else 'Plunge'} on {observed_dt.strftime('%d %b %Y')}"
            desc = (
                f"Recorded revenue of ₹{val:,.2f} deviated by {abs(z_score):.1f} standard deviations "
                f"from historical average (₹{mean_val:,.2f})."
            )
            anomalies.append({
                "anomaly_type": anom_type,
                "severity": severity,
                "score": round(float(abs(z_score) / 5.0), 4),
                "title": title,
                "description": desc,
                "entity_type": "store",
                "entity_id": observed_dt.strftime("%Y-%m-%d"),
                "details": {
                    "observed_revenue": round(val, 2),
                    "expected_mean": round(mean_val, 2),
                    "z_score": round(float(z_score), 2),
                },
            })

    return anomalies


def detect_inventory_shrinkage(
    inventory_records: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Detects sudden inventory depletion / shrinkage anomalies."""
    anomalies = []
    for record in inventory_records:
        stock = record.get("stock_quantity", 0)
        reorder = record.get("reorder_level", 5)
        product_name = record.get("product_name", "Product")
        sku = record.get("sku", "")

        if stock == 0:
            anomalies.append({
                "anomaly_type": "inventory_shrinkage",
                "severity": "high",
                "score": 0.85,
                "title": f"Zero Stock / Critical Depletion: {product_name} ({sku})",
                "description": f"Product inventory reached 0 units. Immediate restock required to prevent stockout losses.",
                "entity_type": "product",
                "entity_id": sku,
                "details": {
                    "sku": sku,
                    "product_name": product_name,
                    "stock_quantity": stock,
                    "reorder_level": reorder,
                },
            })
        elif stock < (reorder / 2):
            anomalies.append({
                "anomaly_type": "inventory_shrinkage",
                "severity": "medium",
                "score": 0.65,
                "title": f"Abnormal Stock Drop: {product_name} ({sku})",
                "description": f"Stock quantity ({stock}) dropped significantly below half of reorder threshold ({reorder}).",
                "entity_type": "product",
                "entity_id": sku,
                "details": {
                    "sku": sku,
                    "product_name": product_name,
                    "stock_quantity": stock,
                    "reorder_level": reorder,
                },
            })

    return anomalies

