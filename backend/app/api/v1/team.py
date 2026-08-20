from collections import defaultdict
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.dependencies import DBSession, require_permissions, require_reauthentication
from app.core.permissions import Permissions
from app.core.security import utcnow
from app.models.customers import Customer
from app.models.identity import Role, RoleCode, User, UserStatus
from app.models.performance import EmployeeTarget
from app.models.sales import SalesTransaction, TransactionStatus
from app.schemas.team import (
    EmployeePerformanceResponse,
    PerformanceMetrics,
    TargetCreate,
    TargetResponse,
    TeamOverviewResponse,
    TrendPoint,
)
from app.services.audit import record_audit

router = APIRouter(prefix="/team", tags=["Team performance"])

team_reader = require_permissions(
    Permissions.DASHBOARD_SALES_ALL,
    Permissions.DASHBOARD_SALES_STORE,
    Permissions.DASHBOARD_SALES_PERSONAL,
    require_all=False,
)


def date_window(db: DBSession, tenant_id: UUID, start: date | None, end: date | None):
    if bool(start) != bool(end):
        raise HTTPException(status_code=422, detail="Provide both date_from and date_to")
    if not end:
        latest = db.scalar(
            select(func.max(SalesTransaction.occurred_at)).where(
                SalesTransaction.tenant_id == tenant_id,
                SalesTransaction.status == TransactionStatus.COMPLETED,
            )
        )
        end = latest.date() if latest else utcnow().date()
        start = end - timedelta(days=29)
    if start > end:
        raise HTTPException(status_code=422, detail="date_from must be on or before date_to")
    if (end - start).days > 366:
        raise HTTPException(status_code=422, detail="Performance range cannot exceed 366 days")
    return start, end


def day_bounds(start: date, end: date):
    return (
        datetime.combine(start, time.min, tzinfo=UTC),
        datetime.combine(end + timedelta(days=1), time.min, tzinfo=UTC),
    )


def employee_scope(employee: User):
    if employee.role.code == RoleCode.STORE_MANAGER:
        return SalesTransaction.store_id == employee.store_id
    return SalesTransaction.seller_id == employee.id


def build_performance(
    db: DBSession,
    employee: User,
    start: date,
    end: date,
) -> EmployeePerformanceResponse:
    start_at, end_at = day_bounds(start, end)
    days = (end - start).days + 1
    previous_end = start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=days - 1)
    previous_start_at, previous_end_at = day_bounds(previous_start, previous_end)
    base = [
        SalesTransaction.tenant_id == employee.tenant_id,
        SalesTransaction.status == TransactionStatus.COMPLETED,
        employee_scope(employee),
    ]
    revenue, transactions, items = db.execute(
        select(
            func.coalesce(func.sum(SalesTransaction.total_amount), 0),
            func.count(SalesTransaction.id),
            func.coalesce(func.sum(SalesTransaction.item_count), 0),
        ).where(
            *base, SalesTransaction.occurred_at >= start_at, SalesTransaction.occurred_at < end_at
        )
    ).one()
    previous_revenue = Decimal(
        db.scalar(
            select(func.coalesce(func.sum(SalesTransaction.total_amount), 0)).where(
                *base,
                SalesTransaction.occurred_at >= previous_start_at,
                SalesTransaction.occurred_at < previous_end_at,
            )
        )
        or 0
    )
    revenue = Decimal(revenue or 0)
    customers_handled = 0
    if employee.role.code == RoleCode.SALES_EXECUTIVE:
        customers_handled = (
            db.scalar(
                select(func.count(Customer.id)).where(
                    Customer.tenant_id == employee.tenant_id,
                    Customer.assigned_seller_id == employee.id,
                )
            )
            or 0
        )
    elif employee.store_id:
        seller_ids = (
            select(User.id)
            .join(Role)
            .where(
                User.tenant_id == employee.tenant_id,
                User.store_id == employee.store_id,
                Role.code == RoleCode.SALES_EXECUTIVE,
            )
        )
        customers_handled = (
            db.scalar(
                select(func.count(Customer.id)).where(
                    Customer.tenant_id == employee.tenant_id,
                    Customer.assigned_seller_id.in_(seller_ids),
                )
            )
            or 0
        )

    trend_rows = db.execute(
        select(
            func.date(SalesTransaction.occurred_at),
            func.coalesce(func.sum(SalesTransaction.total_amount), 0),
            func.count(SalesTransaction.id),
        )
        .where(
            *base, SalesTransaction.occurred_at >= start_at, SalesTransaction.occurred_at < end_at
        )
        .group_by(func.date(SalesTransaction.occurred_at))
        .order_by(func.date(SalesTransaction.occurred_at))
    ).all()
    target_record = db.scalar(
        select(EmployeeTarget)
        .where(
            EmployeeTarget.employee_id == employee.id,
            EmployeeTarget.is_active.is_(True),
            EmployeeTarget.period_start <= end,
            EmployeeTarget.period_end >= start,
        )
        .order_by(EmployeeTarget.period_end.desc())
    )
    target = None
    completion = None
    if target_record:
        target_value = Decimal(target_record.target_value)
        completion = float(revenue / target_value * 100) if target_value else 0
        target = TargetResponse(
            id=target_record.id,
            metric=target_record.metric,
            target_value=target_value,
            achieved_value=revenue,
            completion_percentage=round(completion, 1),
            period_start=target_record.period_start,
            period_end=target_record.period_end,
            remaining_value=max(target_value - revenue, Decimal("0")),
            remaining_days=max((target_record.period_end - utcnow().date()).days, 0),
            is_active=target_record.is_active,
        )
    revenue_change = None
    if previous_revenue:
        revenue_change = round(float((revenue - previous_revenue) / previous_revenue * 100), 1)

    insights = []
    if completion is not None and completion < 70:
        insights.append(f"Revenue is {round(100 - completion, 1)}% behind the assigned target.")
    elif completion is not None and completion >= 100:
        insights.append("The assigned revenue target has been achieved.")
    if revenue_change is not None and revenue_change < -10:
        insights.append(
            f"Revenue declined {abs(revenue_change)}% compared with the previous period."
        )
    elif revenue_change is not None and revenue_change > 10:
        insights.append(f"Revenue improved {revenue_change}% compared with the previous period.")
    average = revenue / transactions if transactions else Decimal("0")
    if transactions and average < Decimal("1000"):
        insights.append(
            "Average order value is below ₹1,000; higher-value selling may need attention."
        )
    if not transactions:
        insights.append("No completed sales were recorded in the selected period.")
    if not insights:
        insights.append("Performance is stable in the selected period.")

    level = "not_rated"
    score = completion if completion is not None else (100 + (revenue_change or 0))
    if transactions:
        level = "excellent" if score >= 100 else "on_track" if score >= 80 else "needs_attention"
    return EmployeePerformanceResponse(
        employee_id=employee.id,
        full_name=employee.full_name,
        email=employee.email,
        role_code=employee.role.code,
        role_name=employee.role.name,
        store_id=employee.store_id,
        store_name=employee.store.name if employee.store else None,
        status=employee.status,
        joined_at=employee.created_at,
        last_login_at=employee.last_login_at,
        avatar_url=employee.avatar_url,
        avatar_emoji=employee.avatar_emoji,
        period_start=start,
        period_end=end,
        metrics=PerformanceMetrics(
            revenue=revenue,
            transactions=transactions,
            items_sold=items,
            average_order_value=average,
            customers_handled=customers_handled,
            previous_revenue=previous_revenue,
            revenue_change_percentage=revenue_change,
        ),
        target=target,
        performance_level=level,
        store_rank=None,
        insights=insights,
        trend=[
            TrendPoint(date=date.fromisoformat(str(row[0])), revenue=row[1], transactions=row[2])
            for row in trend_rows
        ],
    )


def visible_employees(db: DBSession, actor: User) -> list[User]:
    query = (
        select(User)
        .join(Role)
        .where(User.tenant_id == actor.tenant_id)
        .options(selectinload(User.store), selectinload(User.role))
        .order_by(User.full_name)
    )
    if actor.role.code == RoleCode.BUSINESS_OWNER:
        query = query.where(Role.code.in_([RoleCode.STORE_MANAGER, RoleCode.SALES_EXECUTIVE]))
    elif actor.role.code == RoleCode.STORE_MANAGER:
        query = query.where(
            Role.code == RoleCode.SALES_EXECUTIVE,
            User.store_id == actor.store_id,
        )
    else:
        query = query.where(User.id == actor.id)
    return list(db.scalars(query).all())


@router.get("/overview", response_model=TeamOverviewResponse)
def team_overview(
    db: DBSession,
    actor: User = Depends(team_reader),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
):
    start, end = date_window(db, actor.tenant_id, date_from, date_to)
    employees = visible_employees(db, actor)
    performance = [build_performance(db, employee, start, end) for employee in employees]

    ranks: dict[UUID, int] = {}
    grouped: dict[UUID, list[EmployeePerformanceResponse]] = defaultdict(list)
    for item in performance:
        if item.role_code == RoleCode.SALES_EXECUTIVE and item.store_id:
            grouped[item.store_id].append(item)
    for group in grouped.values():
        for rank, item in enumerate(
            sorted(group, key=lambda value: value.metrics.revenue, reverse=True), 1
        ):
            ranks[item.employee_id] = rank
    for item in performance:
        item.store_rank = ranks.get(item.employee_id)

    top = max(performance, key=lambda item: item.metrics.revenue, default=None)
    return TeamOverviewResponse(
        total_employees=len(employees),
        active_employees=sum(item.status == UserStatus.ACTIVE for item in employees),
        invited_employees=sum(item.status == UserStatus.INVITED for item in employees),
        disabled_employees=sum(item.status == UserStatus.DISABLED for item in employees),
        store_managers=sum(item.role.code == RoleCode.STORE_MANAGER for item in employees),
        sales_executives=sum(item.role.code == RoleCode.SALES_EXECUTIVE for item in employees),
        below_target=sum(
            bool(item.target and item.target.completion_percentage < 80) for item in performance
        ),
        top_performer=top if top and top.metrics.transactions else None,
        employees=performance,
    )


@router.get("/employees/{employee_id}/performance", response_model=EmployeePerformanceResponse)
def employee_performance(
    employee_id: UUID,
    db: DBSession,
    actor: User = Depends(team_reader),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
):
    employee = next((item for item in visible_employees(db, actor) if item.id == employee_id), None)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found in your permitted scope")
    start, end = date_window(db, actor.tenant_id, date_from, date_to)
    return build_performance(db, employee, start, end)


@router.post(
    "/employees/{employee_id}/targets",
    response_model=EmployeePerformanceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_reauthentication)],
)
def set_employee_target(
    employee_id: UUID,
    payload: TargetCreate,
    request: Request,
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.USERS_MANAGE)),
):
    if actor.role.code != RoleCode.BUSINESS_OWNER:
        raise HTTPException(status_code=403, detail="Only the Business Owner can set targets")
    employee = next((item for item in visible_employees(db, actor) if item.id == employee_id), None)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    target = db.scalar(
        select(EmployeeTarget).where(
            EmployeeTarget.employee_id == employee.id,
            EmployeeTarget.period_start == payload.period_start,
            EmployeeTarget.period_end == payload.period_end,
            EmployeeTarget.metric == payload.metric,
        )
    )
    if target:
        target.target_value = payload.target_value
        target.is_active = True
        target.assigned_by_id = actor.id
    else:
        target = EmployeeTarget(
            tenant_id=actor.tenant_id,
            employee_id=employee.id,
            assigned_by_id=actor.id,
            **payload.model_dump(),
        )
        db.add(target)
    record_audit(
        db,
        event_type="owner.employee_target_set",
        request=request,
        tenant_id=actor.tenant_id,
        actor_user_id=actor.id,
        target_type="user",
        target_id=str(employee.id),
        details={"metric": payload.metric, "target_value": str(payload.target_value)},
    )
    db.commit()
    return build_performance(db, employee, payload.period_start, payload.period_end)
