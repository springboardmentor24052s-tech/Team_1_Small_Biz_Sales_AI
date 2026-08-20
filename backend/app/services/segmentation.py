from __future__ import annotations

from collections import defaultdict
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import Select, false, select
from sqlalchemy.orm import Session

from app.core.permissions import Permissions
from app.models.customers import Customer
from app.models.identity import User
from app.models.segmentation import CustomerSegmentAssignment, SegmentationModelRun


def latest_segmentation_run(db: Session, tenant_id) -> SegmentationModelRun | None:
    return db.scalar(
        select(SegmentationModelRun)
        .where(SegmentationModelRun.tenant_id == tenant_id)
        .order_by(SegmentationModelRun.trained_at.desc(), SegmentationModelRun.created_at.desc())
        .limit(1)
    )


def scoped_segment_query(
    query: Select,
    user: User,
    *,
    allow_summary: bool,
) -> tuple[Select, str]:
    query = query.where(Customer.tenant_id == user.tenant_id)
    permissions = user.permission_codes
    if Permissions.DASHBOARD_SEGMENTS_VIEW in permissions:
        return query, "business"
    if Permissions.DASHBOARD_SEGMENTS_SUMMARY in permissions:
        if not allow_summary:
            raise HTTPException(
                status_code=403,
                detail="Store Managers can access customer segment summaries only",
            )
        if user.store_id is None:
            return query.where(false()), "store_summary"
        seller_ids = select(User.id).where(
            User.tenant_id == user.tenant_id,
            User.store_id == user.store_id,
        )
        return query.where(Customer.assigned_seller_id.in_(seller_ids)), "store_summary"
    if Permissions.DASHBOARD_SEGMENTS_ASSIGNED in permissions:
        return query.where(Customer.assigned_seller_id == user.id), "assigned"
    raise HTTPException(status_code=403, detail="Permission denied")


def summarize_behavior(rows: list[tuple[CustomerSegmentAssignment, Customer]]) -> dict:
    customer_count = len(rows)
    total_revenue = sum((Decimal(customer.total_revenue) for _, customer in rows), Decimal("0"))
    total_orders = sum(customer.order_count for _, customer in rows)
    repeat_count = sum(customer.order_count > 1 for _, customer in rows)
    segment_groups: dict[str, list[tuple[CustomerSegmentAssignment, Customer]]] = defaultdict(list)
    for assignment, customer in rows:
        segment_groups[assignment.segment_code].append((assignment, customer))

    segments = []
    for segment_code, group in sorted(segment_groups.items()):
        segment_revenue = sum(
            (Decimal(customer.total_revenue) for _, customer in group), Decimal("0")
        )
        segment_orders = sum(customer.order_count for _, customer in group)
        count = len(group)
        segments.append(
            {
                "segment_code": segment_code,
                "segment_name": group[0][0].segment_name,
                "customer_count": count,
                "customer_share": count / customer_count if customer_count else 0,
                "total_revenue": segment_revenue,
                "revenue_share": (float(segment_revenue / total_revenue) if total_revenue else 0),
                "average_order_value": (
                    segment_revenue / segment_orders if segment_orders else Decimal("0")
                ),
                "average_recency_days": (
                    sum(customer.recency_days for _, customer in group) / count if count else 0
                ),
                "average_order_count": segment_orders / count if count else 0,
                "average_engagement_score": (
                    sum(float(assignment.engagement_score) for assignment, _ in group) / count
                    if count
                    else 0
                ),
                "average_return_rate": (
                    sum(
                        float(value)
                        for value in [item.return_rate for item, _ in group]
                        if value is not None
                    )
                    / sum(item.return_rate is not None for item, _ in group)
                    if any(item.return_rate is not None for item, _ in group)
                    else None
                ),
            }
        )
    return {
        "customer_count": customer_count,
        "total_revenue": total_revenue,
        "repeat_customer_rate": repeat_count / customer_count if customer_count else 0,
        "average_order_value": total_revenue / total_orders if total_orders else Decimal("0"),
        "average_recency_days": (
            sum(customer.recency_days for _, customer in rows) / customer_count
            if customer_count
            else 0
        ),
        "average_engagement_score": (
            sum(float(assignment.engagement_score) for assignment, _ in rows) / customer_count
            if customer_count
            else 0
        ),
        "segments": segments,
    }
