from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ForecastModelRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "forecast_model_runs"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "model_version",
            "forecast_type",
            "scope_key",
            name="uq_forecast_model_run_scope",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    store_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"), index=True
    )
    seller_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    model_version: Mapped[str] = mapped_column(String(80), nullable=False)
    forecast_type: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    scope_type: Mapped[str] = mapped_column(String(20), nullable=False)
    scope_key: Mapped[str] = mapped_column(String(100), nullable=False)
    target: Mapped[str] = mapped_column(String(80), nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False)
    granularity: Mapped[str] = mapped_column(String(20), nullable=False)
    source_system: Mapped[str] = mapped_column(String(50), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False)
    baseline_algorithm: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    horizons: Mapped[list[int]] = mapped_column(JSON, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    candidate_metrics: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    training_start: Mapped[date] = mapped_column(Date, nullable=False)
    training_end: Mapped[date] = mapped_column(Date, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

    predictions: Mapped[list["ForecastPrediction"]] = relationship(
        back_populates="model_run", cascade="all, delete-orphan"
    )


class ForecastPrediction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "forecast_predictions"
    __table_args__ = (
        UniqueConstraint(
            "model_run_id",
            "source_store_id",
            "source_product_id",
            "source_category_id",
            "forecast_date",
            name="uq_forecast_prediction_series_date",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    model_run_id: Mapped[UUID] = mapped_column(
        ForeignKey("forecast_model_runs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), index=True
    )
    source_store_id: Mapped[str] = mapped_column(String(80), nullable=False)
    source_product_id: Mapped[str] = mapped_column(String(80), nullable=False)
    source_category_id: Mapped[str] = mapped_column(String(80), nullable=False)
    forecast_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    horizon_day: Mapped[int] = mapped_column(nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    candidate_metrics: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    actual: Mapped[Decimal | None] = mapped_column(Numeric(16, 4))
    predicted: Mapped[Decimal] = mapped_column(Numeric(16, 4), nullable=False)
    lower_bound: Mapped[Decimal] = mapped_column(Numeric(16, 4), nullable=False)
    upper_bound: Mapped[Decimal] = mapped_column(Numeric(16, 4), nullable=False)

    model_run: Mapped[ForecastModelRun] = relationship(back_populates="predictions")


class ForecastJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "forecast_jobs"
    __table_args__ = (
        UniqueConstraint("tenant_id", "external_reference", name="uq_forecast_job_reference"),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    external_reference: Mapped[str] = mapped_column(String(120), nullable=False)
    job_type: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    record_count: Mapped[int] = mapped_column(default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    details: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
