from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CustomerChurnRiskResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    customer_id: UUID
    customer_external_id: str | None = None
    churn_probability: float
    risk_level: str
    inactivity_days: int
    order_frequency_30d: Decimal
    total_spend: Decimal
    risk_factors: list[str]
    recommended_actions: list[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChurnSummaryResponse(BaseModel):
    total_customers: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    high_risk_revenue: Decimal
    average_churn_probability: float
    model_version: str | None = None
    accuracy: float | None = None
    precision: float | None = None
    recall: float | None = None
    f1_score: float | None = None
    roc_auc: float | None = None
    last_trained_at: datetime | None = None


class ChurnCustomerListResponse(BaseModel):
    items: list[CustomerChurnRiskResponse]
    total: int

