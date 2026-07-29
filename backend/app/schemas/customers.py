from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORMModel


class CustomerResponse(ORMModel):
    id: UUID
    tenant_id: UUID
    assigned_seller_id: UUID | None
    source_system: str
    external_customer_id: str
    last_purchase: datetime
    order_count: int
    item_quantity: int
    total_revenue: Decimal
    recency_days: int


class CustomerList(BaseModel):
    items: list[CustomerResponse]
    total: int
    limit: int
    offset: int


class CustomerSummary(BaseModel):
    scope: str
    tenant_id: UUID
    customer_count: int
    total_revenue: Decimal
    total_orders: int
    average_customer_value: Decimal
