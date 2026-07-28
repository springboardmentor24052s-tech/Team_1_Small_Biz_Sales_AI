from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TransactionStatus(StrEnum):
    COMPLETED = "completed"
    VOIDED = "voided"


class SalesTransaction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "sales_transactions"

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    store_id: Mapped[UUID] = mapped_column(
        ForeignKey("stores.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    seller_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    external_reference: Mapped[str | None] = mapped_column(String(80), index=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    item_count: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=TransactionStatus.COMPLETED, index=True, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(String(500))
