from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.db.session import get_db
from app.schemas.recommendation import (
    RecommendationResponse,
    RecommendationAnalytics,
    EvaluationMetrics,
    RecommendationInsights,
)
from app.services.recommendation_service import (
    get_product_recommendations,
    get_recommendation_analytics,
    calculate_evaluation_metrics,
    get_recommendation_insights,
)

logger = logging.getLogger("marketmind.api.recommendations")

router = APIRouter(prefix="/recommendations", tags=["Product Recommendations"])

@router.get("", response_model=RecommendationResponse, summary="Get Intelligent Product Recommendations")
def read_recommendations(
    role: str = Query("owner", description="User role scope: 'owner', 'manager', 'sales', 'admin'"),
    customer_id: Optional[str] = Query(None, description="Target customer account ID (e.g., CUST-001)"),
    sku: Optional[str] = Query(None, description="Base product SKU for cross-selling (e.g., SKU-501)"),
    category: Optional[str] = Query(None, description="Category filter (e.g., Terminals, Supplies)"),
    strategy: str = Query("all", description="Recommendation strategy: 'all', 'cross_sell', 'upsell', 'high_margin', 'inventory_clearance'"),
    limit: int = Query(10, ge=1, le=50, description="Maximum recommendations to return"),
    db: Session = Depends(get_db)
):
    """
    Generate data-driven intelligent product recommendations using:
    - Collaborative Filtering (Customer purchase preferences & co-occurrences)
    - Association Rule Mining (Apriori Frequently Bought Together support & confidence)
    - Customer CLV & account tier fit
    - Inventory stock weighting & MoM revenue growth trends
    - Role-based backend scoping for Business Owner, Store Manager, Sales Executive, and Admin
    """
    try:
        recommendations = get_product_recommendations(
            db=db,
            customer_id=customer_id,
            sku=sku,
            category=category,
            strategy=strategy,
            role=role,
            limit=limit
        )
        return recommendations
    except Exception as e:
        logger.error(f"Error generating product recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate product recommendations. Please try again later."
        )

@router.get("/analytics", response_model=RecommendationAnalytics, summary="Get Recommendation Analytics & Model Signals")
def read_recommendation_analytics(db: Session = Depends(get_db)):
    """
    Retrieve aggregated recommendation impact metrics, total potential revenue uplift,
    Precision@K & Recall@K accuracy scores, and active AI recommendation signals.
    """
    try:
        analytics = get_recommendation_analytics(db)
        return analytics
    except Exception as e:
        logger.error(f"Error fetching recommendation analytics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recommendation analytics. Please try again later."
        )

@router.get("/evaluation", response_model=EvaluationMetrics, summary="Get Recommendation Model Precision@K and Recall@K Evaluation")
def read_recommendation_evaluation(
    k: int = Query(5, ge=1, le=20, description="K value for Precision@K and Recall@K"),
    db: Session = Depends(get_db)
):
    """
    Retrieve model evaluation metrics: Precision@K, Recall@K, and F1-Score@K.
    """
    try:
        metrics = calculate_evaluation_metrics(db, k=k)
        return metrics
    except Exception as e:
        logger.error(f"Error calculating recommendation evaluation metrics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate recommendation evaluation metrics. Please try again later."
        )

@router.get("/insights", response_model=RecommendationInsights, summary="Get Recommendation Insights")
def read_recommendation_insights(db: Session = Depends(get_db)):
    """
    Retrieve data-driven natural-language insights generated from actual product,
    sales, and recommendation data. No hardcoded or fabricated insight strings.
    """
    try:
        insights = get_recommendation_insights(db)
        return insights
    except Exception as e:
        logger.error(f"Error generating recommendation insights: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendation insights. Please try again later."
        )
