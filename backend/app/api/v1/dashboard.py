from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DBSession, require_permissions
from app.core.permissions import Permissions
from app.core.security import utcnow
from app.models.identity import User
from app.models.sales import SalesTransaction, TransactionStatus
from app.schemas.dashboard import (
    DashboardAccessResponse,
    DashboardModule,
    KPIValue,
    RevenueSeriesPoint,
    SalesDashboardResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def module(code: str, access: str, *actions: str) -> DashboardModule:
    return DashboardModule(code=code, access=access, actions=list(actions))


@router.get("/access", response_model=DashboardAccessResponse)
def dashboard_access(user: CurrentUser):
    permissions = user.permission_codes
    modules: list[DashboardModule] = []

    if Permissions.DASHBOARD_SALES_ALL in permissions:
        modules.append(module("sales", "business", "view", "filter", "drill_down", "export"))
    elif Permissions.DASHBOARD_SALES_STORE in permissions:
        modules.append(module("sales", "store", "view", "filter", "drill_down"))
    elif Permissions.DASHBOARD_SALES_PERSONAL in permissions:
        modules.append(module("sales", "personal", "view", "filter"))

    if Permissions.DASHBOARD_INVENTORY_MANAGE in permissions:
        modules.append(module("inventory", "manage", "view", "update", "alerts"))
    elif Permissions.DASHBOARD_INVENTORY_VIEW in permissions:
        modules.append(module("inventory", "view", "analytics", "alerts"))

    if Permissions.DASHBOARD_FORECASTS_CONFIGURE in permissions:
        modules.append(module("forecasts", "configure", "view", "export", "configure"))
    elif Permissions.DASHBOARD_FORECASTS_MONITOR in permissions:
        modules.append(module("forecasts", "monitor", "view"))
    elif Permissions.DASHBOARD_FORECASTS_VIEW in permissions:
        actions = ["view"]
        if {
            Permissions.REPORTS_EXPORT_BUSINESS,
            Permissions.REPORTS_EXPORT_OPERATIONAL,
        } & permissions:
            actions.append("export")
        modules.append(module("forecasts", "view", *actions))
    elif Permissions.DASHBOARD_FORECASTS_PERSONAL in permissions:
        modules.append(module("forecasts", "personal", "view"))

    if Permissions.DASHBOARD_CHURN_CONFIGURE in permissions:
        modules.append(module("churn", "configure", "view", "export", "configure"))
    elif Permissions.DASHBOARD_CHURN_VIEW in permissions:
        modules.append(module("churn", "view", "view"))

    if Permissions.DASHBOARD_RECOMMENDATIONS_CONFIGURE in permissions:
        modules.append(module("recommendations", "configure", "view", "configure"))
    elif Permissions.DASHBOARD_RECOMMENDATIONS_VIEW in permissions:
        modules.append(module("recommendations", "view", "view"))
    elif Permissions.DASHBOARD_RECOMMENDATIONS_ASSIGNED in permissions:
        modules.append(module("recommendations", "assigned", "view"))

    if Permissions.DASHBOARD_SEGMENTS_VIEW in permissions:
        actions = ["view", "filter", "drill_down"]
        if Permissions.REPORTS_EXPORT_BUSINESS in permissions:
            actions.append("export")
        modules.append(module("customer_segments", "business", *actions))
    elif Permissions.DASHBOARD_SEGMENTS_SUMMARY in permissions:
        modules.append(module("customer_segments", "summary", "view"))
    elif Permissions.DASHBOARD_SEGMENTS_ASSIGNED in permissions:
        modules.append(module("customer_segments", "assigned", "view", "filter", "drill_down"))

    if Permissions.USERS_MANAGE in permissions:
        modules.append(
            module("business_setup", "business", "view", "stores", "preview", "import", "sample")
        )
        modules.append(
            module(
                "team_management",
                "business",
                "view",
                "analyse",
                "targets",
                "invite",
                "assign",
                "disable",
            )
        )
    elif Permissions.DASHBOARD_SALES_STORE in permissions:
        modules.append(module("team_performance", "store", "view", "analyse"))
    elif Permissions.DASHBOARD_SALES_PERSONAL in permissions:
        modules.append(module("team_performance", "personal", "view"))

    if Permissions.SECURITY_MANAGE in permissions:
        modules.append(
            module(
                "administration",
                "manage",
                "roles",
                "security",
                "audit",
                "datasets",
                "models",
            )
        )

    return DashboardAccessResponse(
        role=user.role.code,
        tenant_id=user.tenant_id,
        store_id=user.store_id,
        modules=modules,
    )


@router.get("/sales", response_model=SalesDashboardResponse)
def sales_dashboard(
    db: DBSession,
    user: User = Depends(
        require_permissions(
            Permissions.DASHBOARD_SALES_ALL,
            Permissions.DASHBOARD_SALES_STORE,
            Permissions.DASHBOARD_SALES_PERSONAL,
            require_all=False,
        )
    ),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    days: int = Query(default=30, ge=1, le=90),
):
    if bool(date_from) != bool(date_to):
        raise HTTPException(status_code=422, detail="Provide both date_from and date_to")
    permissions = user.permission_codes
    scope = "business"
    store_id = None
    seller_id = None
    scope_conditions = [SalesTransaction.tenant_id == user.tenant_id]
    if Permissions.DASHBOARD_SALES_ALL not in permissions:
        if Permissions.DASHBOARD_SALES_STORE in permissions and user.store_id:
            scope_conditions.append(SalesTransaction.store_id == user.store_id)
            scope = "store"
            store_id = user.store_id
        elif Permissions.DASHBOARD_SALES_PERSONAL in permissions:
            scope_conditions.append(SalesTransaction.seller_id == user.id)
            scope = "personal"
            store_id = user.store_id
            seller_id = user.id
        else:
            raise HTTPException(status_code=403, detail="No dashboard scope is assigned")

    if date_from and date_to:
        start, end = date_from, date_to
    else:
        latest = db.scalar(
            select(func.max(SalesTransaction.occurred_at)).where(
                *scope_conditions,
                SalesTransaction.status == TransactionStatus.COMPLETED,
            )
        )
        end = (latest or utcnow()) + timedelta(microseconds=1)
        start = end - timedelta(days=days)
    if start >= end:
        raise HTTPException(status_code=422, detail="date_from must be earlier than date_to")
    if (end - start).days > 366:
        raise HTTPException(status_code=422, detail="Dashboard range cannot exceed 366 days")

    conditions = [
        *scope_conditions,
        SalesTransaction.status == TransactionStatus.COMPLETED,
        SalesTransaction.occurred_at >= start,
        SalesTransaction.occurred_at < end,
    ]
    query = select(
        func.coalesce(func.sum(SalesTransaction.total_amount), 0),
        func.count(SalesTransaction.id),
        func.coalesce(func.sum(SalesTransaction.item_count), 0),
        func.max(SalesTransaction.updated_at),
    ).where(*conditions)

    revenue, count, quantity, freshness = db.execute(query).one()
    revenue = Decimal(revenue or 0)
    average = revenue / count if count else Decimal("0")
    daily_totals: dict = defaultdict(lambda: [Decimal("0"), 0])
    series_rows = db.execute(
        select(SalesTransaction.occurred_at, SalesTransaction.total_amount).where(*conditions)
    ).all()
    for occurred_at, amount in series_rows:
        bucket = occurred_at.date()
        daily_totals[bucket][0] += Decimal(amount)
        daily_totals[bucket][1] += 1
    revenue_series = [
        RevenueSeriesPoint(
            date=bucket,
            revenue=values[0],
            transaction_count=values[1],
        )
        for bucket, values in sorted(daily_totals.items())
    ]
    state = "ready" if count else "empty"
    return SalesDashboardResponse(
        scope=scope,
        tenant_id=user.tenant_id,
        store_id=store_id,
        seller_id=seller_id,
        date_from=start,
        date_to=end,
        currency=user.tenant.currency,
        generated_at=utcnow(),
        data_freshness=freshness,
        revenue=KPIValue(
            value=revenue,
            unit=user.tenant.currency,
            definition="Sum of completed transaction totals in the selected scope",
        ),
        transaction_count=KPIValue(
            value=count,
            unit="transactions",
            definition="Number of completed transactions in the selected scope",
        ),
        quantity=KPIValue(
            value=quantity,
            unit="items",
            definition="Sum of item counts across completed transactions",
        ),
        average_order_value=KPIValue(
            value=average,
            unit=user.tenant.currency,
            definition="Completed transaction revenue divided by transaction count",
        ),
        revenue_series=revenue_series,
        state=state,
        message="No completed transactions match this scope and date range" if not count else None,
    )
