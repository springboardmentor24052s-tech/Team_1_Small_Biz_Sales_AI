from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChurnCustomerRecord(BaseModel):
    customer_id: UUID
    external_customer_id: str
    customer_name: str | None = None
    assigned_seller_id: UUID | None = None
    churn_probability: float
    risk_score: Decimal
    risk_level: str  # High Risk, Medium Risk, Low Risk
    inactivity_days: int
    last_purchase_date: datetime | None = None
    total_revenue: Decimal
    order_count: int
    retention_recommendation: str

    model_config = ConfigDict(from_attributes=True)


class ChurnSummaryResponse(BaseModel):
    scope: str
    tenant_id: UUID
    store_id: UUID | None = None
    model_version: str
    algorithm: str
    trained_at: datetime
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    total_customers_analyzed: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    overall_churn_rate: float
    potential_revenue_at_risk: Decimal
    insights: list[str]


class ChurnCustomerListResponse(BaseModel):
    model_version: str
    items: list[ChurnCustomerRecord]
    total: int
    limit: int
    offset: int
