from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select

from app.api.dependencies import DBSession, require_permissions
from app.core.permissions import Permissions
from app.models.customers import Customer
from app.models.identity import User
from app.models.segmentation import CustomerSegmentAssignment
from app.schemas.segmentation import (
    CustomerBehaviorSummary,
    CustomerSegmentList,
    CustomerSegmentResponse,
)
from app.services.segmentation import (
    latest_segmentation_run,
    scoped_segment_query,
    summarize_behavior,
)

router = APIRouter(prefix="/customer-segments", tags=["Customer Segmentation"])

segment_reader = require_permissions(
    Permissions.DASHBOARD_SEGMENTS_VIEW,
    Permissions.DASHBOARD_SEGMENTS_SUMMARY,
    Permissions.DASHBOARD_SEGMENTS_ASSIGNED,
    require_all=False,
)


def _base_query(model_run_id):
    return (
        select(CustomerSegmentAssignment, Customer)
        .join(Customer, Customer.id == CustomerSegmentAssignment.customer_id)
        .where(CustomerSegmentAssignment.model_run_id == model_run_id)
    )


def _response(assignment: CustomerSegmentAssignment, customer: Customer):
    return CustomerSegmentResponse(
        customer_id=customer.id,
        external_customer_id=customer.external_customer_id,
        assigned_seller_id=customer.assigned_seller_id,
        segment_code=assignment.segment_code,
        segment_name=assignment.segment_name,
        engagement_score=assignment.engagement_score,
        recency_days=customer.recency_days,
        order_count=customer.order_count,
        total_revenue=customer.total_revenue,
        average_order_value=assignment.average_order_value,
        average_basket_size=assignment.average_basket_size,
        active_months=assignment.active_months,
        product_variety=assignment.product_variety,
        return_rate=assignment.return_rate,
        purchase_frequency_30d=assignment.purchase_frequency_30d,
    )


@router.get("/summary", response_model=CustomerBehaviorSummary)
def segmentation_summary(
    db: DBSession,
    user: User = Depends(segment_reader),
):
    model_run = latest_segmentation_run(db, user.tenant_id)
    if model_run is None:
        raise HTTPException(status_code=404, detail="No customer segmentation model is available")
    query, scope = scoped_segment_query(_base_query(model_run.id), user, allow_summary=True)
    rows = list(db.execute(query).all())
    behavior = summarize_behavior(rows)
    return CustomerBehaviorSummary(
        scope=scope,
        tenant_id=user.tenant_id,
        store_id=user.store_id if scope == "store_summary" else None,
        model_version=model_run.model_version,
        algorithm=model_run.algorithm,
        trained_at=model_run.trained_at,
        silhouette_score=model_run.silhouette_score,
        **behavior,
    )


@router.get("", response_model=CustomerSegmentList)
def list_customer_segments(
    db: DBSession,
    user: User = Depends(segment_reader),
    segment_code: str | None = Query(default=None, max_length=20),
    search: str | None = Query(default=None, max_length=80),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    model_run = latest_segmentation_run(db, user.tenant_id)
    if model_run is None:
        raise HTTPException(status_code=404, detail="No customer segmentation model is available")
    query, _ = scoped_segment_query(_base_query(model_run.id), user, allow_summary=False)
    if segment_code:
        query = query.where(CustomerSegmentAssignment.segment_code == segment_code.strip())
    if search:
        query = query.where(Customer.external_customer_id.ilike(f"%{search.strip()}%"))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.execute(
        query.order_by(
            CustomerSegmentAssignment.engagement_score.desc(),
            Customer.total_revenue.desc(),
        )
        .limit(limit)
        .offset(offset)
    ).all()
    return CustomerSegmentList(
        model_version=model_run.model_version,
        items=[_response(assignment, customer) for assignment, customer in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{customer_id}", response_model=CustomerSegmentResponse)
def get_customer_segment(
    customer_id: UUID,
    db: DBSession,
    user: User = Depends(segment_reader),
):
    model_run = latest_segmentation_run(db, user.tenant_id)
    if model_run is None:
        raise HTTPException(status_code=404, detail="No customer segmentation model is available")
    query, _ = scoped_segment_query(
        _base_query(model_run.id).where(Customer.id == customer_id),
        user,
        allow_summary=False,
    )
    row = db.execute(query).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Customer segment not found")
    return _response(row[0], row[1])
