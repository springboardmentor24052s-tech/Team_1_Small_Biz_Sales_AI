from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AnomalyEventResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    store_id: UUID | None = None
    anomaly_type: str
    severity: str
    score: float
    title: str
    description: str
    details: dict[str, Any]
    status: str
    entity_type: str | None = None
    entity_id: str | None = None
    resolved_at: datetime | None = None
    resolved_by_id: UUID | None = None
    resolution_notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnomalySummaryResponse(BaseModel):
    total_open: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    fraud_risk_count: int
    inventory_shrinkage_count: int
    sales_trend_count: int
    resolution_rate: float
    model_version: str | None = None
    detection_rate: float | None = None
    false_positive_rate: float | None = None


class AnomalyStatusUpdateRequest(BaseModel):
    status: str  # acknowledged, resolved, false_positive
    resolution_notes: str | None = None

