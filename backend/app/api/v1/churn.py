from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DBSession, require_permissions
from app.core.permissions import Permissions
from app.models.churn import ChurnModelRun, CustomerChurnRisk
from app.models.customers import Customer
from app.schemas.churn import (
    ChurnCustomerListResponse,
    ChurnSummaryResponse,
    CustomerChurnRiskResponse,
)
from app.services.churn import get_latest_churn_model_run, train_tenant_churn_model

router = APIRouter(prefix="/churn", tags=["Customer Churn Prediction"])


@router.get("/summary", response_model=ChurnSummaryResponse)
def get_churn_summary(
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.DASHBOARD_CHURN_VIEW, Permissions.DASHBOARD_CHURN_CONFIGURE, require_all=False)),
):
    """Returns high-level churn metrics, risk distributions, and model performance."""
    model_run = get_latest_churn_model_run(db, user.tenant_id)
    if not model_run:
        # Trigger initial run if available
        model_run = train_tenant_churn_model(db, user.tenant_id)

    risks = db.scalars(
        select(CustomerChurnRisk).where(CustomerChurnRisk.tenant_id == user.tenant_id)
    ).all()

    if not risks:
        return ChurnSummaryResponse(
            total_customers=0,
            high_risk_count=0,
            medium_risk_count=0,
            low_risk_count=0,
            high_risk_revenue=Decimal("0"),
            average_churn_probability=0.0,
            model_version=model_run.model_version if model_run else None,
            accuracy=model_run.accuracy if model_run else None,
            precision=model_run.precision_score if model_run else None,
            recall=model_run.recall_score if model_run else None,
            f1_score=model_run.f1_score if model_run else None,
            roc_auc=model_run.roc_auc if model_run else None,
            last_trained_at=model_run.trained_at if model_run else None,
        )

    high = [r for r in risks if r.risk_level == "high"]
    med = [r for r in risks if r.risk_level == "medium"]
    low = [r for r in risks if r.risk_level == "low"]

    high_rev = sum((r.total_spend for r in high), Decimal("0"))
    avg_prob = sum(r.churn_probability for r in risks) / len(risks)

    return ChurnSummaryResponse(
        total_customers=len(risks),
        high_risk_count=len(high),
        medium_risk_count=len(med),
        low_risk_count=len(low),
        high_risk_revenue=high_rev,
        average_churn_probability=round(avg_prob, 4),
        model_version=model_run.model_version if model_run else None,
        accuracy=model_run.accuracy if model_run else None,
        precision=model_run.precision_score if model_run else None,
        recall=model_run.recall_score if model_run else None,
        f1_score=model_run.f1_score if model_run else None,
        roc_auc=model_run.roc_auc if model_run else None,
        last_trained_at=model_run.trained_at if model_run else None,
    )


@router.get("/customers", response_model=ChurnCustomerListResponse)
def list_churn_customers(
    user: CurrentUser,
    db: DBSession,
    risk_level: str | None = Query(None, description="Filter by risk level: high, medium, low"),
    search: str | None = Query(None, description="Search by customer external reference"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _auth: None = Depends(require_permissions(Permissions.DASHBOARD_CHURN_VIEW, Permissions.DASHBOARD_CHURN_CONFIGURE, require_all=False)),
):
    """Returns paginated customer retention risk predictions."""
    query = (
        select(CustomerChurnRisk)
        .join(Customer, CustomerChurnRisk.customer_id == Customer.id)
        .where(CustomerChurnRisk.tenant_id == user.tenant_id)
    )

    if risk_level:
        query = query.where(CustomerChurnRisk.risk_level == risk_level.lower())
    if search:
        query = query.where(Customer.external_customer_id.ilike(f"%{search}%"))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(CustomerChurnRisk.churn_probability.desc()).offset(offset).limit(limit)).all()

    serialized = []
    for item in items:
        serialized.append(
            CustomerChurnRiskResponse(
                id=item.id,
                tenant_id=item.tenant_id,
                customer_id=item.customer_id,
                customer_external_id=item.customer.external_customer_id if item.customer else str(item.customer_id)[:8],
                churn_probability=item.churn_probability,
                risk_level=item.risk_level,
                inactivity_days=item.inactivity_days,
                order_frequency_30d=item.order_frequency_30d,
                total_spend=item.total_spend,
                risk_factors=item.risk_factors,
                recommended_actions=item.recommended_actions,
                created_at=item.created_at,
            )
        )

    return ChurnCustomerListResponse(items=serialized, total=total)


@router.get("/customers/{customer_id}", response_model=CustomerChurnRiskResponse)
def get_customer_churn_detail(
    customer_id: UUID,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.DASHBOARD_CHURN_VIEW, Permissions.DASHBOARD_CHURN_CONFIGURE, require_all=False)),
):
    """Returns churn risk details and personalized retention actions for a specific customer."""
    risk = db.scalar(
        select(CustomerChurnRisk).where(
            CustomerChurnRisk.customer_id == customer_id,
            CustomerChurnRisk.tenant_id == user.tenant_id,
        )
    )
    if not risk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer churn evaluation not found")

    return CustomerChurnRiskResponse(
        id=risk.id,
        tenant_id=risk.tenant_id,
        customer_id=risk.customer_id,
        customer_external_id=risk.customer.external_customer_id if risk.customer else str(risk.customer_id)[:8],
        churn_probability=risk.churn_probability,
        risk_level=risk.risk_level,
        inactivity_days=risk.inactivity_days,
        order_frequency_30d=risk.order_frequency_30d,
        total_spend=risk.total_spend,
        risk_factors=risk.risk_factors,
        recommended_actions=risk.recommended_actions,
        created_at=risk.created_at,
    )
