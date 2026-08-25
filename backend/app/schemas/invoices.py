from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InvoiceItemCreate(BaseModel):
    product_id: UUID | None = None
    sku: str = "CUSTOM"
    description: str
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(ge=0)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    tax_rate: Decimal = Field(default=Decimal("0.18"), ge=0)


class InvoiceItemResponse(BaseModel):
    id: UUID
    product_id: UUID | None = None
    sku: str
    description: str
    quantity: int
    unit_price: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    line_amount: Decimal

    model_config = ConfigDict(from_attributes=True)


class PaymentTransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    payment_method: str = "upi"  # cash, upi, card, bank_transfer
    reference_number: str | None = None
    notes: str | None = None


class PaymentTransactionResponse(BaseModel):
    id: UUID
    amount: Decimal
    payment_method: str
    reference_number: str | None = None
    notes: str | None = None
    recorded_at: datetime
    recorded_by_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class InvoiceCreate(BaseModel):
    store_id: UUID | None = None
    customer_id: UUID | None = None
    invoice_date: date
    due_date: date
    currency: str = "INR"
    discount_amount: Decimal = Decimal("0")
    notes: str | None = None
    terms: str | None = None
    items: list[InvoiceItemCreate]


class InvoiceResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    store_id: UUID
    seller_id: UUID
    customer_id: UUID | None = None
    customer_name: str | None = None
    seller_name: str | None = None
    store_name: str | None = None
    invoice_number: str
    invoice_date: date
    due_date: date
    currency: str
    subtotal_amount: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    balance_amount: Decimal
    status: str
    notes: str | None = None
    terms: str | None = None
    last_reminded_at: datetime | None = None
    created_at: datetime
    items: list[InvoiceItemResponse] = []
    payments: list[PaymentTransactionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int

