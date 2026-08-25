from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DBSession, require_permissions
from app.core.permissions import Permissions
from app.core.security import utcnow
from app.models.recommendations import RecommendationFeedback, RecommendationModelRun
from app.schemas.common import MessageResponse
from app.schemas.recommendations import (
    RecommendationFeedbackRequest,
    RecommendationMetricsResponse,
    RecommendedProductItem,
)
from app.services.recommendations import (
    get_customer_personalized_recommendations,
    get_frequently_bought_together,
    get_upsell_opportunities,
    train_tenant_recommendations,
)

router = APIRouter(prefix="/recommendations", tags=["Product Recommendations"])


@router.get("/frequently-bought-together", response_model=list[RecommendedProductItem])
def frequently_bought_together(
    user: CurrentUser,
    db: DBSession,
    product_id: UUID | None = Query(None),
    sku: str | None = Query(None),
    limit: int = Query(5, ge=1, le=20),
):
    """Returns products frequently purchased together with the specified product."""
    return get_frequently_bought_together(db, user.tenant_id, product_id=product_id, sku=sku, limit=limit)


@router.get("/upsell", response_model=list[RecommendedProductItem])
def upsell_opportunities(
    product_id: UUID,
    user: CurrentUser,
    db: DBSession,
    limit: int = Query(4, ge=1, le=20),
):
    """Returns higher-value upgrade alternatives in the same product category."""
    return get_upsell_opportunities(db, user.tenant_id, product_id=product_id, limit=limit)


@router.get("/customer/{customer_id}", response_model=list[RecommendedProductItem])
def customer_recommendations(
    customer_id: UUID,
    user: CurrentUser,
    db: DBSession,
    limit: int = Query(6, ge=1, le=20),
):
    """Returns personalized recommendations for a specific customer based on past preferences."""
    return get_customer_personalized_recommendations(db, user.tenant_id, customer_id=customer_id, limit=limit)


@router.post("/feedback", response_model=MessageResponse)
def log_recommendation_feedback(
    payload: RecommendationFeedbackRequest,
    user: CurrentUser,
    db: DBSession,
):
    """Logs user/customer interactions with recommendation widgets for offline evaluation."""
    feedback = RecommendationFeedback(
        tenant_id=user.tenant_id,
        user_id=user.id,
        customer_id=payload.customer_id,
        product_id=payload.product_id,
        recommendation_type=payload.recommendation_type,
        action=payload.action,
        created_at=utcnow(),
    )
    db.add(feedback)
    db.commit()
    return MessageResponse(message="Recommendation feedback recorded")


@router.get("/metrics", response_model=RecommendationMetricsResponse)
def recommendation_metrics(
    user: CurrentUser,
    db: DBSession,
):
    """Returns offline evaluation metrics for active recommendation engine."""
    run = db.scalar(
        select(RecommendationModelRun)
        .where(RecommendationModelRun.tenant_id == user.tenant_id)
        .order_by(RecommendationModelRun.trained_at.desc())
    )
    if not run:
        run = train_tenant_recommendations(db, user.tenant_id)

    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation model not trained yet")

    return RecommendationMetricsResponse(
        model_version=run.model_version,
        algorithm=run.algorithm,
        precision_at_k=run.precision_at_k,
        recall_at_k=run.recall_at_k,
        coverage_rate=run.coverage_rate,
        rule_count=run.rule_count,
        trained_at=run.trained_at,
        metrics=run.metrics,
    )

