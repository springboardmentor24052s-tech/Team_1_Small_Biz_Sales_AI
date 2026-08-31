from datetime import datetime
from typing import Any

from pydantic import BaseModel


class EngineStatusItem(BaseModel):
    engine_name: str  # Forecasting, Customer Segmentation, Product Recommendations, Churn Prediction, Anomaly Detection
    status: str  # active, training, not_ready
    model_version: str | None = None
    algorithm: str | None = None
    last_run: datetime | None = None
    accuracy_score: float | None = None
    details: str


class SystemMonitoringResponse(BaseModel):
    overall_health: str  # healthy, degraded, initial
    api_status: str
    db_status: str
    active_engines_count: int
    engines: list[EngineStatusItem]
    recent_events: list[dict[str, Any]]
