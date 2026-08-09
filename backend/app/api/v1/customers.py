from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select

from app.api.dependencies import DBSession, require_permissions
from app.core.permissions import Permissions
from app.models.customers import Customer
from app.models.identity import User
from app.schemas.customers import CustomerList, CustomerResponse, CustomerSummary
from app.services.customers import scoped_customer_query

router = APIRouter(prefix="/customers", tags=["Customers"])

customer_reader = require_permissions(
    Permissions.CUSTOMERS_READ_ALL,
    Permissions.CUSTOMERS_READ_SUMMARY,
    Permissions.CUSTOMERS_READ_ASSIGNED,
    require_all=False,
)


@router.get("/summary", response_model=CustomerSummary)
def customer_summary(
    db: DBSession,
    user: User = Depends(customer_reader),
):
    scoped, scope = scoped_customer_query(select(Customer), user)
    subquery = scoped.subquery()
    count, revenue, orders = db.execute(
        select(
            func.count(subquery.c.id),
            func.coalesce(func.sum(subquery.c.total_revenue), 0),
            func.coalesce(func.sum(subquery.c.order_count), 0),
        )
    ).one()
    revenue = Decimal(revenue or 0)
    return CustomerSummary(
        scope=scope,
        tenant_id=user.tenant_id,
        customer_count=count,
        total_revenue=revenue,
        total_orders=orders,
        average_customer_value=revenue / count if count else Decimal("0"),
    )


@router.get("", response_model=CustomerList)
def list_customers(
    db: DBSession,
    user: User = Depends(customer_reader),
    search: str | None = Query(default=None, max_length=80),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    if (
        Permissions.CUSTOMERS_READ_ALL not in user.permission_codes
        and Permissions.CUSTOMERS_READ_ASSIGNED not in user.permission_codes
    ):
        raise HTTPException(
            status_code=403,
            detail="Store Managers can access customer summaries only",
        )
    query, _ = scoped_customer_query(select(Customer), user)
    if search:
        query = query.where(Customer.external_customer_id.ilike(f"%{search.strip()}%"))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(
        query.order_by(Customer.total_revenue.desc()).limit(limit).offset(offset)
    ).all()
    return CustomerList(items=items, total=total, limit=limit, offset=offset)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: UUID,
    db: DBSession,
    user: User = Depends(customer_reader),
):
    if (
        Permissions.CUSTOMERS_READ_ALL not in user.permission_codes
        and Permissions.CUSTOMERS_READ_ASSIGNED not in user.permission_codes
    ):
        raise HTTPException(
            status_code=403,
            detail="Store Managers can access customer summaries only",
        )
    query, _ = scoped_customer_query(
        select(Customer).where(Customer.id == customer_id),
        user,
    )
    customer = db.scalar(query)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
