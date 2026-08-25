from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class AIHyperparameterUpdate(BaseModel):
    churn: dict[str, Any] | None = None
    recommendations: dict[str, Any] | None = None
    anomalies: dict[str, Any] | None = None
    forecasting: dict[str, Any] | None = None
    segmentation: dict[str, Any] | None = None


class AIRetrainRequest(BaseModel):
    modules: list[str] | None = None  # churn, recommendations, anomalies, forecasting, segmentation


class ModelRegistryItem(BaseModel):
    module: str
    model_version: str
    algorithm: str
    status: str
    accuracy: float | None = None
    precision: float | None = None
    recall: float | None = None
    f1_score: float | None = None
    precision_at_k: float | None = None
    recall_at_k: float | None = None
    coverage_rate: float | None = None
    rule_count: int | None = None
    detection_rate: float | None = None
    false_positive_rate: float | None = None
    silhouette_score: float | None = None
    cluster_count: int | None = None
    metrics: dict[str, Any] | None = None
    trained_at: datetime


class AIConfigResponse(BaseModel):
    models: list[ModelRegistryItem]
    config: dict[str, Any]

