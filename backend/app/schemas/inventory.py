from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ProductResponse(ORMModel):
    id: UUID
    sku: str
    name: str
    category: str | None
    style: str | None
    size: str | None
    color: str | None


class InventoryResponse(ORMModel):
    id: UUID
    tenant_id: UUID
    store_id: UUID
    product_id: UUID
    stock_quantity: int
    reorder_level: int
    stock_status: str
    product: ProductResponse
    created_at: datetime
    updated_at: datetime


class InventoryList(BaseModel):
    items: list[InventoryResponse]
    total: int
    limit: int
    offset: int


class InventoryUpdate(BaseModel):
    stock_quantity: int | None = Field(default=None, ge=0, le=10_000_000)
    reorder_level: int | None = Field(default=None, ge=0, le=10_000_000)


class InventorySummary(BaseModel):
    scope: str
    tenant_id: UUID
    store_id: UUID | None
    product_count: int
    total_units: int
    low_stock_count: int
    out_of_stock_count: int
