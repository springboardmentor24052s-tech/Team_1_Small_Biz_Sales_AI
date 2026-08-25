from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RecommendedProductItem(BaseModel):
    product_id: UUID | str
    sku: str
    name: str
    category: str | None = None
    style: str | None = None
    color: str | None = None
    size: str | None = None
    confidence: float | None = None
    lift: float | None = None
    reason: str
    upsell_factor: str | None = None


class RecommendationFeedbackRequest(BaseModel):
    product_id: UUID
    customer_id: UUID | None = None
    recommendation_type: str  # cross_sell, upsell, personalized
    action: str  # clicked, added_to_cart, purchased, dismissed


class RecommendationMetricsResponse(BaseModel):
    model_version: str
    algorithm: str
    precision_at_k: float
    recall_at_k: float
    coverage_rate: float
    rule_count: int
    trained_at: datetime
    metrics: dict[str, Any]

