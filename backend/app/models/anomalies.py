from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AnomalyModelRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "anomaly_model_runs"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "model_version",
            name="uq_anomaly_model_run_version",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    model_version: Mapped[str] = mapped_column(String(80), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False)  # isolation_forest, statistical_zscore
    status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    detection_rate: Mapped[float] = mapped_column(Float, nullable=False)
    false_positive_rate: Mapped[float] = mapped_column(Float, nullable=False)
    contamination: Mapped[float] = mapped_column(Float, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

    events: Mapped[list[AnomalyEvent]] = relationship(
        back_populates="model_run", cascade="all, delete-orphan"
    )


class AnomalyEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "anomaly_events"

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    model_run_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("anomaly_model_runs.id", ondelete="SET NULL"),
        index=True,
    )
    store_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("stores.id", ondelete="SET NULL"), index=True
    )
    anomaly_type: Mapped[str] = mapped_column(
        String(40), index=True, nullable=False
    )  # sales_spike, sales_drop, fraud_risk, inventory_shrinkage, high_discount
    severity: Mapped[str] = mapped_column(
        String(20), index=True, nullable=False
    )  # critical, high, medium, low
    score: Mapped[float] = mapped_column(Float, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    details: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="open", index=True, nullable=False
    )  # open, acknowledged, resolved, false_positive
    entity_type: Mapped[str | None] = mapped_column(String(40), index=True)  # transaction, product, customer, store
    entity_id: Mapped[str | None] = mapped_column(String(80), index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_by_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    resolution_notes: Mapped[str | None] = mapped_column(String(500))

    model_run: Mapped[AnomalyModelRun | None] = relationship(back_populates="events")

