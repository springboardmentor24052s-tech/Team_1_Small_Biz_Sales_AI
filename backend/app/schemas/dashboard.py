from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class DashboardModule(BaseModel):
    code: str
    access: str
    actions: list[str]


class DashboardAccessResponse(BaseModel):
    role: str
    tenant_id: UUID
    store_id: UUID | None
    modules: list[DashboardModule]


class KPIValue(BaseModel):
    value: Decimal | int
    unit: str
    definition: str


class SalesDashboardResponse(BaseModel):
    scope: str
    tenant_id: UUID
    store_id: UUID | None
    seller_id: UUID | None
    date_from: datetime
    date_to: datetime
    currency: str
    generated_at: datetime
    data_freshness: datetime | None
    revenue: KPIValue
    transaction_count: KPIValue
    quantity: KPIValue
    average_order_value: KPIValue
    state: str
    message: str | None = None
