from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class SegmentationModelRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "segmentation_model_runs"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "source_system",
            "model_version",
            name="uq_segmentation_model_run_version",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    source_system: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    model_version: Mapped[str] = mapped_column(String(80), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False)
    cluster_count: Mapped[int] = mapped_column(nullable=False)
    silhouette_score: Mapped[float] = mapped_column(Float, nullable=False)
    davies_bouldin_score: Mapped[float] = mapped_column(Float, nullable=False)
    calinski_harabasz_score: Mapped[float] = mapped_column(Float, nullable=False)
    feature_names: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

    assignments: Mapped[list["CustomerSegmentAssignment"]] = relationship(
        back_populates="model_run", cascade="all, delete-orphan"
    )


class CustomerSegmentAssignment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "customer_segment_assignments"
    __table_args__ = (
        UniqueConstraint(
            "model_run_id",
            "customer_id",
            name="uq_customer_segment_assignment_run_customer",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    model_run_id: Mapped[UUID] = mapped_column(
        ForeignKey("segmentation_model_runs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    customer_id: Mapped[UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    cluster_id: Mapped[int] = mapped_column(nullable=False)
    segment_code: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    segment_name: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    first_purchase: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    average_order_value: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    average_basket_size: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    active_days: Mapped[int] = mapped_column(nullable=False)
    active_months: Mapped[int] = mapped_column(nullable=False)
    product_variety: Mapped[int] = mapped_column(nullable=False)
    tenure_days: Mapped[int] = mapped_column(nullable=False)
    average_days_between_orders: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    return_order_count: Mapped[int] = mapped_column(nullable=False)
    returned_value: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    return_rate: Mapped[Decimal] = mapped_column(Numeric(8, 6), nullable=False)
    purchase_frequency_30d: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    engagement_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)

    model_run: Mapped[SegmentationModelRun] = relationship(back_populates="assignments")
