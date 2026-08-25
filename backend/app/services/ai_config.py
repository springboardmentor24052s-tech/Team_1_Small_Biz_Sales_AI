from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.anomalies import AnomalyModelRun
from app.models.churn import ChurnModelRun
from app.models.forecasting import ForecastModelRun
from app.models.recommendations import RecommendationModelRun
from app.models.segmentation import SegmentationModelRun
from app.services.anomalies import train_and_scan_anomalies
from app.services.churn import train_tenant_churn_model
from app.services.recommendations import train_tenant_recommendations

DEFAULT_AI_CONFIG = {
    "churn": {
        "high_risk_threshold": 0.70,
        "medium_risk_threshold": 0.40,
        "inactivity_threshold_days": 90,
        "active_algorithm": "Random Forest / Gradient Boosting",
    },
    "recommendations": {
        "min_support": 0.005,
        "min_confidence": 0.05,
        "min_lift": 1.0,
        "top_k": 5,
        "active_algorithm": "Association Rule Mining (Apriori)",
    },
    "anomalies": {
        "contamination": 0.05,
        "z_score_threshold": 2.5,
        "active_algorithm": "Isolation Forest",
    },
    "forecasting": {
        "horizons_days": [7, 14, 30],
        "active_algorithm": "Linear Trend Regression",
    },
    "segmentation": {
        "clusters_k": 4,
        "active_algorithm": "K-Means Clustering",
    },
}

_tenant_configs: dict[UUID, dict[str, Any]] = {}


def get_ai_config(tenant_id: UUID) -> dict[str, Any]:
    """Returns AI hyperparameters and configuration for tenant."""
    if tenant_id not in _tenant_configs:
        _tenant_configs[tenant_id] = DEFAULT_AI_CONFIG.copy()
    return _tenant_configs[tenant_id]


def update_ai_config(tenant_id: UUID, new_config: dict[str, Any]) -> dict[str, Any]:
    """Updates AI hyperparameters for tenant."""
    current = get_ai_config(tenant_id)
    for module_name, params in new_config.items():
        if module_name in current and isinstance(params, dict):
            current[module_name].update(params)
    _tenant_configs[tenant_id] = current
    return current


def get_model_registry(db: Session, tenant_id: UUID) -> dict[str, Any]:
    """Fetches all registered and active model runs with their performance metrics."""
    churn_run = db.scalar(
        select(ChurnModelRun)
        .where(ChurnModelRun.tenant_id == tenant_id)
        .order_by(ChurnModelRun.trained_at.desc())
    )
    rec_run = db.scalar(
        select(RecommendationModelRun)
        .where(RecommendationModelRun.tenant_id == tenant_id)
        .order_by(RecommendationModelRun.trained_at.desc())
    )
    anom_run = db.scalar(
        select(AnomalyModelRun)
        .where(AnomalyModelRun.tenant_id == tenant_id)
        .order_by(AnomalyModelRun.trained_at.desc())
    )
    forecast_run = db.scalar(
        select(ForecastModelRun)
        .where(ForecastModelRun.tenant_id == tenant_id)
        .order_by(ForecastModelRun.trained_at.desc())
    )
    seg_run = db.scalar(
        select(SegmentationModelRun)
        .where(SegmentationModelRun.tenant_id == tenant_id)
        .order_by(SegmentationModelRun.trained_at.desc())
    )

    models = []
    if churn_run:
        models.append({
            "module": "Customer Churn Prediction",
            "model_version": churn_run.model_version,
            "algorithm": churn_run.algorithm,
            "status": churn_run.status,
            "accuracy": churn_run.accuracy,
            "precision": churn_run.precision_score,
            "recall": churn_run.recall_score,
            "f1_score": churn_run.f1_score,
            "trained_at": churn_run.trained_at,
        })
    if rec_run:
        models.append({
            "module": "Product Recommendations",
            "model_version": rec_run.model_version,
            "algorithm": rec_run.algorithm,
            "status": rec_run.status,
            "precision_at_k": rec_run.precision_at_k,
            "recall_at_k": rec_run.recall_at_k,
            "coverage_rate": rec_run.coverage_rate,
            "rule_count": rec_run.rule_count,
            "trained_at": rec_run.trained_at,
        })
    if anom_run:
        models.append({
            "module": "Anomaly Detection",
            "model_version": anom_run.model_version,
            "algorithm": anom_run.algorithm,
            "status": anom_run.status,
            "detection_rate": anom_run.detection_rate,
            "false_positive_rate": anom_run.false_positive_rate,
            "trained_at": anom_run.trained_at,
        })
    if forecast_run:
        models.append({
            "module": "Sales & Demand Forecasting",
            "model_version": forecast_run.model_version,
            "algorithm": forecast_run.algorithm,
            "status": forecast_run.status,
            "metrics": forecast_run.metrics,
            "trained_at": forecast_run.trained_at,
        })
    if seg_run:
        models.append({
            "module": "Customer Segmentation",
            "model_version": seg_run.model_version,
            "algorithm": seg_run.algorithm,
            "status": "active",
            "silhouette_score": seg_run.silhouette_score,
            "cluster_count": seg_run.cluster_count,
            "trained_at": seg_run.trained_at,
        })

    return {
        "models": models,
        "config": get_ai_config(tenant_id),
    }


def retrain_models(db: Session, tenant_id: UUID, modules: list[str] | None = None) -> dict[str, Any]:
    """Retrains specified AI models or all models for tenant."""
    results = {}
    target_modules = set(modules or ["churn", "recommendations", "anomalies", "forecasting", "segmentation"])

    if "churn" in target_modules:
        run = train_tenant_churn_model(db, tenant_id)
        results["churn"] = "trained" if run else "insufficient_data"

    if "recommendations" in target_modules:
        run = train_tenant_recommendations(db, tenant_id)
        results["recommendations"] = "trained" if run else "insufficient_data"

    if "anomalies" in target_modules:
        run = train_and_scan_anomalies(db, tenant_id)
        results["anomalies"] = "trained" if run else "insufficient_data"

    return results

