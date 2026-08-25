from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class RecommendationModelRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "recommendation_model_runs"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "model_version",
            name="uq_recommendation_model_run_version",
        ),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    model_version: Mapped[str] = mapped_column(String(80), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(40), nullable=False)  # apriori_association, collaborative_filtering
    status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    precision_at_k: Mapped[float] = mapped_column(Float, nullable=False)
    recall_at_k: Mapped[float] = mapped_column(Float, nullable=False)
    coverage_rate: Mapped[float] = mapped_column(Float, nullable=False)
    rule_count: Mapped[int] = mapped_column(nullable=False)
    rules: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )


class RecommendationFeedback(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "recommendation_feedbacks"

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    customer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("customers.id", ondelete="SET NULL"), index=True
    )
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    recommendation_type: Mapped[str] = mapped_column(String(30), nullable=False)  # cross_sell, upsell, personalized
    action: Mapped[str] = mapped_column(String(20), nullable=False)  # impression, clicked, added_to_cart, purchased, dismissed

