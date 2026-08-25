from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ChurnModelRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "churn_model_runs"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "model_version",
            name="uq_churn_model_run_version",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    model_version: Mapped[str] = mapped_column(String(80), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False)
    baseline_algorithm: Mapped[str] = mapped_column(String(40), default="logistic_regression", nullable=False)
    status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    precision_score: Mapped[float] = mapped_column(Float, nullable=False)
    recall_score: Mapped[float] = mapped_column(Float, nullable=False)
    f1_score: Mapped[float] = mapped_column(Float, nullable=False)
    roc_auc: Mapped[float | None] = mapped_column(Float)
    feature_names: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

    predictions: Mapped[list[CustomerChurnRisk]] = relationship(
        back_populates="model_run", cascade="all, delete-orphan"
    )


class CustomerChurnRisk(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "customer_churn_risks"
    __table_args__ = (
        UniqueConstraint(
            "model_run_id",
            "customer_id",
            name="uq_customer_churn_risk_run_customer",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    model_run_id: Mapped[UUID] = mapped_column(
        ForeignKey("churn_model_runs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    customer_id: Mapped[UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    churn_probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # high, medium, low
    inactivity_days: Mapped[int] = mapped_column(nullable=False)
    order_frequency_30d: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    total_spend: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    risk_factors: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    recommended_actions: Mapped[list[str]] = mapped_column(JSON, nullable=False)

    model_run: Mapped[ChurnModelRun] = relationship(back_populates="predictions")
    customer = relationship("Customer", lazy="joined")

