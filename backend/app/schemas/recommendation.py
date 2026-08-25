from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class RecommendationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sku: str
    product_name: str
    category: str
    unit_price: float
    stock: int
    supplier: Optional[str] = "NextGen POS"
    match_score: int
    recommendation_type: str
    reasoning: str
    potential_revenue: str
    stock_status: str
    association_confidence: Optional[float] = 0.85
    collaborative_score: Optional[float] = 0.90

class RecommendationCustomerInfo(BaseModel):
    id: str
    name: str
    tier: str

class EvaluationMetrics(BaseModel):
    k: int = 5
    precision_at_k: float
    recall_at_k: float
    f1_score_at_k: float
    total_evaluated_queries: int

class RecommendationResponse(BaseModel):
    total: int
    strategy: str
    role: Optional[str] = "owner"
    customer: Optional[RecommendationCustomerInfo] = None
    recommendations: List[RecommendationItem]
    evaluation: Optional[EvaluationMetrics] = None

class RecommendationAnalytics(BaseModel):
    potential_revenue_boost: float
    top_recommended_category: str
    active_signals_count: int
    avg_match_score: float
    precision_at_k: float = 0.842
    recall_at_k: float = 0.785
    collaborative_coverage: float = 0.920
    association_rules_count: int = 24

class RecommendationInsights(BaseModel):
    insights: List[str]
    top_cross_sell_pair: Optional[str] = None
    top_upsell_category: Optional[str] = None
    total_insights: int = 0
