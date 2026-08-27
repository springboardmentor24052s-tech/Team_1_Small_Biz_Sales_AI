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
            "source_system",
            "model_version",
            name="uq_anomaly_model_run_version",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    source_system: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    model_version: Mapped[str] = mapped_column(String(80), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False)  # IsolationForest, ZScore
    contamination_rate: Mapped[float] = mapped_column(Float, nullable=False)
    detected_count: Mapped[int] = mapped_column(nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

    events: Mapped[list["AnomalyEvent"]] = relationship(
        back_populates="model_run", cascade="all, delete-orphan"
    )


class AnomalyEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "anomaly_events"

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    model_run_id: Mapped[UUID] = mapped_column(
        ForeignKey("anomaly_model_runs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    anomaly_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)  # sales_spike, inventory_shrinkage, forecast_residual
    severity: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # Critical, Warning, Info
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)  # Transaction, Inventory, Forecast
    entity_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(20), index=True, default="detected")  # detected, acknowledged, resolved
    acknowledged_by: Mapped[str | None] = mapped_column(String(80))
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_by: Mapped[str | None] = mapped_column(String(80))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    model_run: Mapped[AnomalyModelRun] = relationship(back_populates="events")
