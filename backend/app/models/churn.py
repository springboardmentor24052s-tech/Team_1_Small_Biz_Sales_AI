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
            "source_system",
            "model_version",
            name="uq_churn_model_run_version",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    source_system: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    model_version: Mapped[str] = mapped_column(String(80), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False)  # e.g., LogisticRegression, RandomForest
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    precision: Mapped[float] = mapped_column(Float, nullable=False)
    recall: Mapped[float] = mapped_column(Float, nullable=False)
    f1_score: Mapped[float] = mapped_column(Float, nullable=False)
    feature_names: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

    predictions: Mapped[list["ChurnPredictionRecord"]] = relationship(
        back_populates="model_run", cascade="all, delete-orphan"
    )


class ChurnPredictionRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "churn_prediction_records"
    __table_args__ = (
        UniqueConstraint(
            "model_run_id",
            "customer_id",
            name="uq_churn_prediction_run_customer",
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
    risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # High Risk, Medium Risk, Low Risk
    inactivity_days: Mapped[int] = mapped_column(nullable=False)
    retention_recommendation: Mapped[str] = mapped_column(String(255), nullable=False)

    model_run: Mapped[ChurnModelRun] = relationship(back_populates="predictions")
