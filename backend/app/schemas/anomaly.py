from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AnomalyEventRecord(BaseModel):
    id: UUID
    tenant_id: UUID
    anomaly_type: str  # sales_spike, inventory_shrinkage, forecast_residual
    severity: str  # Critical, Warning, Info
    entity_type: str
    entity_id: str
    anomaly_score: float
    title: str
    description: str
    status: str  # detected, acknowledged, resolved
    acknowledged_by: str | None = None
    acknowledged_at: datetime | None = None
    resolved_by: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnomalySummaryResponse(BaseModel):
    scope: str
    tenant_id: UUID
    model_version: str
    algorithm: str
    contamination_rate: float
    total_anomalies_detected: int
    critical_count: int
    warning_count: int
    info_count: int
    unresolved_count: int
    items: list[AnomalyEventRecord]
    insights: list[str]


class AnomalyStatusActionRequest(BaseModel):
    action_by: str | None = "admin"
    notes: str | None = None
