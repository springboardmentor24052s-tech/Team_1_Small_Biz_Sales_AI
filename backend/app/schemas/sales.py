from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class SalesTransactionCreate(BaseModel):
    store_id: UUID
    external_reference: str | None = Field(default=None, max_length=80)
    occurred_at: datetime
    currency: str = Field(min_length=3, max_length=3)
    total_amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    item_count: int = Field(gt=0, le=10000)
    notes: str | None = Field(default=None, max_length=500)


class SalesTransactionUpdate(BaseModel):
    external_reference: str | None = Field(default=None, max_length=80)
    occurred_at: datetime | None = None
    total_amount: Decimal | None = Field(default=None, gt=0, max_digits=14, decimal_places=2)
    item_count: int | None = Field(default=None, gt=0, le=10000)
    notes: str | None = Field(default=None, max_length=500)


class SalesTransactionResponse(ORMModel):
    id: UUID
    tenant_id: UUID
    store_id: UUID
    seller_id: UUID
    external_reference: str | None
    occurred_at: datetime
    currency: str
    total_amount: Decimal
    item_count: int
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


class TransactionList(BaseModel):
    items: list[SalesTransactionResponse]
    total: int
    limit: int
    offset: int
