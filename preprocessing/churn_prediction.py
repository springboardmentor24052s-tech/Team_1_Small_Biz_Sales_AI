from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler

MODEL_VERSION = "churn-prediction-v1"
CHURN_INACTIVITY_THRESHOLD_DAYS = 90

CHURN_FEATURES = [
    "recency_days",
    "order_count",
    "total_revenue",
    "avg_order_value",
    "avg_basket_size",
    "tenure_days",
    "purchase_frequency_30d",
    "return_rate",
]


@dataclass
class ChurnPipelineResult:
    predictions: pd.DataFrame
    metrics: dict[str, Any]
    candidate_metrics: list[dict[str, Any]]
    model_version: str
    feature_names: list[str]


def engineer_churn_features(df_transactions: pd.DataFrame, reference_date: datetime | None = None) -> pd.DataFrame:
    """Computes customer-level RFM, inactivity and behavioral features for churn prediction."""
    if df_transactions.empty:
        return pd.DataFrame()

    df = df_transactions.copy()
    if not pd.api.types.is_datetime64_any_dtype(df["invoice_date"]):
        df["invoice_date"] = pd.to_datetime(df["invoice_date"])

    ref_date = reference_date or df["invoice_date"].max()

    # Aggregate by customer
    records = []
    for customer_id, group in df.groupby("customer_id"):
        if pd.isna(customer_id):
            continue
        first_date = group["invoice_date"].min()
        last_date = group["invoice_date"].max()
        recency = max(0, (ref_date - last_date).days)
        tenure = max(1, (ref_date - first_date).days)
        orders = group["invoice_id"].nunique()
        total_rev = float(group["line_revenue"].sum())
        total_items = float(group["quantity"].sum())

        avg_aov = total_rev / max(1, orders)
        avg_basket = total_items / max(1, orders)

        # 30-day recent orders
        recent_cutoff = ref_date - pd.Timedelta(days=30)
        recent_orders = group[group["invoice_date"] >= recent_cutoff]["invoice_id"].nunique()
        frequency_30d = recent_orders / 1.0

        # Return rate if negative quantity exists
        returns = group[group["quantity"] < 0]["invoice_id"].nunique()
        return_rate = returns / max(1, orders)

        # Churn label for training (inactivity > threshold)
        is_churned = 1 if recency >= CHURN_INACTIVITY_THRESHOLD_DAYS else 0

        records.append({
            "customer_id": str(customer_id),
            "recency_days": float(recency),
            "order_count": float(orders),
            "total_revenue": max(0.0, total_rev),
            "avg_order_value": max(0.0, avg_aov),
            "avg_basket_size": max(0.0, avg_basket),
            "tenure_days": float(tenure),
            "purchase_frequency_30d": float(frequency_30d),
            "return_rate": float(min(1.0, return_rate)),
            "is_churned": is_churned,
        })

    return pd.DataFrame(records)


def train_churn_models(features_df: pd.DataFrame) -> ChurnPipelineResult:
    """Trains Logistic Regression baseline and Random Forest / Gradient Boosting candidates."""
    if len(features_df) < 10:
        raise ValueError("Insufficient customer records for churn model training (minimum 10 required).")

    X = features_df[CHURN_FEATURES].copy()
    y = np.array(features_df["is_churned"].values, dtype=int, copy=True)

    # If only single class present, add slight variation for training
    if len(np.unique(y)) < 2:
        y[0] = 1 - y[0]

    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)

    # Train / test split
    test_size = 0.25 if len(features_df) >= 20 else 0.2
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=test_size, random_state=42
    )
    y_train = np.array(y_train, dtype=int, copy=True)
    y_test = np.array(y_test, dtype=int, copy=True)
    if len(np.unique(y_train)) < 2:
        y_train[0] = 1 - y_train[0]
    if len(np.unique(y_test)) < 2:
        y_test[0] = 1 - y_test[0]

    # 1. Baseline: Logistic Regression
    lr = LogisticRegression(max_iter=500, random_state=42)
    lr.fit(X_train, y_train)
    lr_preds = lr.predict(X_test)
    lr_probs = lr.predict_proba(X_test)[:, 1] if hasattr(lr, "predict_proba") else lr_preds

    lr_metrics = {
        "algorithm": "Logistic Regression (Baseline)",
        "accuracy": float(accuracy_score(y_test, lr_preds)),
        "precision": float(precision_score(y_test, lr_preds, zero_division=0)),
        "recall": float(recall_score(y_test, lr_preds, zero_division=0)),
        "f1": float(f1_score(y_test, lr_preds, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, lr_probs)) if len(np.unique(y_test)) > 1 else None,
    }

    # 2. Candidate: Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    rf.fit(X_train, y_train)
    rf_preds = rf.predict(X_test)
    rf_probs = rf.predict_proba(X_test)[:, 1]

    rf_metrics = {
        "algorithm": "Random Forest Classifier",
        "accuracy": float(accuracy_score(y_test, rf_preds)),
        "precision": float(precision_score(y_test, rf_preds, zero_division=0)),
        "recall": float(recall_score(y_test, rf_preds, zero_division=0)),
        "f1": float(f1_score(y_test, rf_preds, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, rf_probs)) if len(np.unique(y_test)) > 1 else None,
    }

    # 3. Candidate: Gradient Boosting
    gb = GradientBoostingClassifier(n_estimators=80, max_depth=3, random_state=42)
    gb.fit(X_train, y_train)
    gb_preds = gb.predict(X_test)
    gb_probs = gb.predict_proba(X_test)[:, 1]

    gb_metrics = {
        "algorithm": "Gradient Boosting Classifier",
        "accuracy": float(accuracy_score(y_test, gb_preds)),
        "precision": float(precision_score(y_test, gb_preds, zero_division=0)),
        "recall": float(recall_score(y_test, gb_preds, zero_division=0)),
        "f1": float(f1_score(y_test, gb_preds, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, gb_probs)) if len(np.unique(y_test)) > 1 else None,
    }

    candidates = [lr_metrics, rf_metrics, gb_metrics]
    # Pick winning model based on F1 / Accuracy
    best_candidate = max(candidates, key=lambda m: (m["f1"], m["accuracy"]))
    winning_model = rf if best_candidate["algorithm"] == rf_metrics["algorithm"] else (
        gb if best_candidate["algorithm"] == gb_metrics["algorithm"] else lr
    )

    # Score all customers
    all_probs = winning_model.predict_proba(X_scaled)[:, 1]
    
    scored_df = features_df.copy()
    scored_df["churn_probability"] = [round(float(p), 4) for p in all_probs]
    
    # Assign risk level and retention suggestions
    def assign_risk_tier(prob: float) -> str:
        if prob >= 0.70:
            return "high"
        if prob >= 0.40:
            return "medium"
        return "low"

    def generate_recommendations(row: pd.Series) -> list[str]:
        actions = []
        if row["churn_probability"] >= 0.70:
            actions.append("Trigger VIP re-engagement discount voucher (15-20% off)")
            actions.append("Schedule personal check-in call by dedicated account seller")
        elif row["churn_probability"] >= 0.40:
            actions.append("Send seasonal product catalog & personalized recommendations email")
            actions.append("Offer limited-time free delivery on next order")
        else:
            actions.append("Maintain standard loyalty points updates")
            actions.append("Highlight new arrivals matching previous purchase category")
        if row["recency_days"] > 60:
            actions.append("Send 'We miss you' reminder with favorite category highlights")
        return actions

    def extract_risk_factors(row: pd.Series) -> list[str]:
        factors = []
        if row["recency_days"] >= 60:
            factors.append(f"High inactivity: {int(row['recency_days'])} days since last purchase")
        if row["purchase_frequency_30d"] == 0:
            factors.append("Zero purchases in last 30 days")
        if row["return_rate"] > 0.15:
            factors.append(f"Elevated return rate ({row['return_rate'] * 100:.1f}%)")
        if row["order_count"] <= 1:
            factors.append("Single-purchase buyer (unestablished loyalty)")
        if not factors:
            factors.append("Consistent regular purchasing pattern")
        return factors

    scored_df["risk_level"] = scored_df["churn_probability"].apply(assign_risk_tier)
    scored_df["recommended_actions"] = scored_df.apply(generate_recommendations, axis=1)
    scored_df["risk_factors"] = scored_df.apply(extract_risk_factors, axis=1)

    return ChurnPipelineResult(
        predictions=scored_df,
        metrics=best_candidate,
        candidate_metrics=candidates,
        model_version=MODEL_VERSION,
        feature_names=CHURN_FEATURES,
    )
