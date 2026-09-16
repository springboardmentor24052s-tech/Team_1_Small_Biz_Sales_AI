from datetime import UTC, datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter
from sqlalchemy import case, func, select

from app.api.dependencies import CurrentUser, DBSession
from app.core.security import as_utc, utcnow
from app.models.audit import AuditEvent
from app.models.customers import Customer
from app.models.forecasting import ForecastJob
from app.models.identity import Role, RoleCode, User
from app.models.inventory import Inventory, Product
from app.models.performance import EmployeeTarget
from app.models.sales import SalesTransaction, TransactionStatus
from app.schemas.notifications import NotificationItem, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def enabled(user: User, key: str, default: bool = True) -> bool:
    preferences = user.role_preferences or {}
    if key in preferences:
        return bool(preferences[key])
    return default if not preferences else False


def item(
    identifier,
    title,
    message,
    severity,
    category,
    destination,
    created_at=None,
    evidence=None,
):
    return NotificationItem(
        id=identifier,
        title=title,
        message=message,
        severity=severity,
        category=category,
        destination=destination,
        created_at=created_at or utcnow(),
        evidence=evidence or {},
    )


def sales_total(db, user, start, end):
    conditions = [
        SalesTransaction.tenant_id == user.tenant_id,
        SalesTransaction.status == TransactionStatus.COMPLETED,
        SalesTransaction.occurred_at >= start,
        SalesTransaction.occurred_at < end,
    ]
    if user.role.code == RoleCode.STORE_MANAGER:
        conditions.append(SalesTransaction.store_id == user.store_id)
    elif user.role.code == RoleCode.SALES_EXECUTIVE:
        conditions.append(SalesTransaction.seller_id == user.id)
    return Decimal(
        db.scalar(
            select(func.coalesce(func.sum(SalesTransaction.total_amount), 0)).where(*conditions)
        )
        or 0
    )


def sales_scope(user: User) -> list:
    conditions = [SalesTransaction.tenant_id == user.tenant_id]
    if user.role.code == RoleCode.STORE_MANAGER:
        conditions.append(SalesTransaction.store_id == user.store_id)
    elif user.role.code == RoleCode.SALES_EXECUTIVE:
        conditions.append(SalesTransaction.seller_id == user.id)
    return conditions


def user_local_time(user: User, now: datetime) -> datetime:
    try:
        timezone = ZoneInfo(user.timezone or "Asia/Kolkata")
    except ZoneInfoNotFoundError:
        timezone = ZoneInfo("Asia/Kolkata")
    return now.astimezone(timezone)


def inventory_alerts(db, user: User):
    if user.role.code not in {RoleCode.BUSINESS_OWNER, RoleCode.STORE_MANAGER}:
        return []
    conditions = [Inventory.tenant_id == user.tenant_id]
    if user.role.code == RoleCode.STORE_MANAGER:
        conditions.append(Inventory.store_id == user.store_id)
    rows = db.execute(
        select(Inventory, Product)
        .join(Product, Product.id == Inventory.product_id)
        .where(
            *conditions,
            Inventory.stock_quantity <= Inventory.reorder_level,
        )
        .order_by(Inventory.stock_quantity, Product.name)
        .limit(20)
    ).all()
    if not rows:
        return []
    out = sum(inventory.stock_quantity == 0 for inventory, _ in rows)
    low = len(rows) - out
    examples = ", ".join(
        f"{product.name} ({inventory.stock_quantity})" for inventory, product in rows[:3]
    )
    return [
        item(
            (
                "manager-stock-risk"
                if user.role.code == RoleCode.STORE_MANAGER
                else "owner-stock-risk"
            ),
            "Inventory action required",
            f"{out} products are out of stock and {low} are at/below reorder level. "
            f"Priority items: {examples}.",
            "error" if out else "warning",
            "inventory",
            "inventory",
            evidence={"out_of_stock": out, "low_stock": low, "examples": examples},
        )
    ]


def sales_movement_alerts(db, user: User, now: datetime):
    local_now = user_local_time(user, now)
    today_start = datetime.combine(
        local_now.date(), time.min, tzinfo=local_now.tzinfo
    ).astimezone(UTC)
    yesterday_start = today_start - timedelta(days=1)
    today = sales_total(db, user, today_start, now + timedelta(seconds=1))
    yesterday = sales_total(db, user, yesterday_start, today_start)
    latest = db.scalar(
        select(func.max(SalesTransaction.occurred_at)).where(
            *sales_scope(user), SalesTransaction.status == TransactionStatus.COMPLETED
        )
    )
    if latest is None:
        return []
    if as_utc(latest) < now - timedelta(days=2):
        latest_local_date = as_utc(latest).astimezone(local_now.tzinfo).date().isoformat()
        return [
            item(
                f"sales-data-stale-{user.id}",
                "Sales data needs an update",
                "The latest recorded sale is from "
                f"{latest_local_date}. Add daily sales "
                "before using today comparisons.",
                "warning",
                "sales",
                "sales",
                latest,
                {"latest_sale": latest.isoformat()},
            )
        ]
    if today == 0:
        return [
            item(
                f"no-sales-today-{user.id}",
                "No sales recorded today",
                "No completed sale is recorded for the current authorised scope today.",
                "warning",
                "sales",
                "sales",
                evidence={"today_revenue": "0", "yesterday_revenue": str(yesterday)},
            )
        ]
    if yesterday:
        change = float((today - yesterday) / yesterday * 100)
        if abs(change) >= 20:
            direction = "higher" if change > 0 else "lower"
            return [
                item(
                    f"daily-sales-change-{user.id}",
                    "Daily sales movement",
                    f"Today's revenue is ₹{today:,.0f}, {abs(change):.1f}% {direction} than "
                    f"yesterday's ₹{yesterday:,.0f}.",
                    "success" if change > 0 else "warning",
                    "sales",
                    "dashboard",
                    evidence={
                        "today_revenue": str(today),
                        "yesterday_revenue": str(yesterday),
                        "change_percentage": round(change, 2),
                    },
                )
            ]
    return []


def target_alerts(db, user: User, now: datetime):
    local_now = user_local_time(user, now)
    today = local_now.date()
    query = (
        select(EmployeeTarget, User)
        .join(User, User.id == EmployeeTarget.employee_id)
        .join(Role, Role.id == User.role_id)
        .where(
            EmployeeTarget.tenant_id == user.tenant_id,
            EmployeeTarget.is_active.is_(True),
            EmployeeTarget.period_start <= today,
            EmployeeTarget.period_end >= today,
            Role.code == RoleCode.SALES_EXECUTIVE,
        )
    )
    if user.role.code == RoleCode.STORE_MANAGER:
        query = query.where(User.store_id == user.store_id)
    elif user.role.code == RoleCode.SALES_EXECUTIVE:
        query = query.where(User.id == user.id)
    elif user.role.code != RoleCode.BUSINESS_OWNER:
        return []
    rows = db.execute(query).all()
    behind = []
    workday_progress = min(
        1.0, max(0.0, (local_now.hour + local_now.minute / 60 - 9) / 11)
    )
    day_start = datetime.combine(today, time.min, tzinfo=local_now.tzinfo).astimezone(UTC)
    for target, employee in rows:
        period_days = max(1, (target.period_end - target.period_start).days + 1)
        daily_target = Decimal(target.target_value) / period_days
        achieved = Decimal(
            db.scalar(
                select(func.coalesce(func.sum(SalesTransaction.total_amount), 0)).where(
                    SalesTransaction.tenant_id == user.tenant_id,
                    SalesTransaction.seller_id == employee.id,
                    SalesTransaction.status == TransactionStatus.COMPLETED,
                    SalesTransaction.occurred_at >= day_start,
                    SalesTransaction.occurred_at < day_start + timedelta(days=1),
                )
            )
            or 0
        )
        completion = float(achieved / daily_target) if daily_target else 1.0
        if completion + 0.10 < workday_progress:
            behind.append((employee, daily_target, achieved, completion))
    if not behind:
        return []
    if user.role.code == RoleCode.SALES_EXECUTIVE:
        _, daily_target, achieved, completion = behind[0]
        return [
            item(
                f"daily-target-{user.id}-{today}",
                "Daily target needs attention",
                f"You have achieved ₹{achieved:,.0f} of today's estimated ₹{daily_target:,.0f} "
                f"target ({completion * 100:.1f}%).",
                "warning",
                "target",
                "team",
                evidence={
                    "daily_target": str(round(daily_target, 2)),
                    "achieved": str(achieved),
                    "completion_percentage": round(completion * 100, 2),
                },
            )
        ]
    names = ", ".join(employee.full_name for employee, *_ in behind[:3])
    return [
        item(
            f"daily-target-team-{user.store_id or user.tenant_id}-{today}",
            "Team members behind today's target",
            f"{len(behind)} Sales Executives are behind expected daily progress: {names}.",
            "warning",
            "target",
            "team",
            evidence={"employee_count": len(behind), "employees": names},
        )
    ]


def declining_customer_alerts(db, user: User, now: datetime):
    if user.role.code == RoleCode.ADMINISTRATOR:
        return []
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)
    current_order = case((SalesTransaction.occurred_at >= current_start, 1), else_=0)
    previous_order = case(
        (
            (SalesTransaction.occurred_at >= previous_start)
            & (SalesTransaction.occurred_at < current_start),
            1,
        ),
        else_=0,
    )
    current_revenue = case(
        (SalesTransaction.occurred_at >= current_start, SalesTransaction.total_amount), else_=0
    )
    previous_revenue = case(
        (
            (SalesTransaction.occurred_at >= previous_start)
            & (SalesTransaction.occurred_at < current_start),
            SalesTransaction.total_amount,
        ),
        else_=0,
    )
    conditions = [
        *sales_scope(user),
        SalesTransaction.status == TransactionStatus.COMPLETED,
        SalesTransaction.customer_id.is_not(None),
        SalesTransaction.occurred_at >= previous_start,
    ]
    rows = db.execute(
        select(
            SalesTransaction.customer_id,
            func.sum(current_order),
            func.sum(previous_order),
            func.sum(current_revenue),
            func.sum(previous_revenue),
        )
        .where(*conditions)
        .group_by(SalesTransaction.customer_id)
    ).all()
    declining_ids = [
        customer_id
        for customer_id, current_count, previous_count, current_value, previous_value in rows
        if previous_count >= 2
        and (
            current_count <= previous_count * 0.6
            or (
                previous_value
                and Decimal(current_value or 0) <= Decimal(previous_value) * Decimal("0.7")
            )
        )
    ]
    if not declining_ids:
        return []
    references = db.scalars(
        select(Customer.external_customer_id).where(Customer.id.in_(declining_ids)).limit(3)
    ).all()
    names = ", ".join(references)
    return [
        item(
            f"customer-decline-{user.id}-{now.date()}",
            "Customer purchasing has decreased",
            f"{len(declining_ids)} linked customers show at least a 30% revenue or 40% order "
            f"decline versus the previous 30 days. Review: {names}.",
            "warning",
            "customers",
            "customers",
            evidence={"customer_count": len(declining_ids), "customer_references": names},
        )
    ]


@router.get("", response_model=NotificationResponse)
def list_notifications(db: DBSession, user: CurrentUser):
    now = utcnow()
    items = []
    role = user.role.code

    if role in {RoleCode.BUSINESS_OWNER, RoleCode.STORE_MANAGER} and enabled(user, "stock_alerts"):
        items.extend(inventory_alerts(db, user))
    if role != RoleCode.ADMINISTRATOR and enabled(user, "sales_performance_alerts"):
        items.extend(sales_movement_alerts(db, user, now))
        items.extend(target_alerts(db, user, now))
    if role != RoleCode.ADMINISTRATOR and enabled(user, "customer_decline_alerts"):
        items.extend(declining_customer_alerts(db, user, now))

    if role == RoleCode.BUSINESS_OWNER:
        latest = db.scalar(
            select(func.max(SalesTransaction.occurred_at)).where(
                SalesTransaction.tenant_id == user.tenant_id,
                SalesTransaction.status == TransactionStatus.COMPLETED,
            )
        )
        if latest:
            current = sales_total(
                db, user, latest - timedelta(days=7), latest + timedelta(seconds=1)
            )
            previous = sales_total(
                db, user, latest - timedelta(days=14), latest - timedelta(days=7)
            )
            change = float((current - previous) / previous * 100) if previous else None
            if enabled(user, "weekly_summary"):
                items.append(
                    item(
                        "owner-weekly-summary",
                        "Weekly business summary",
                        f"Revenue for the latest 7-day data period is ₹{current:,.0f}.",
                        "info",
                        "summary",
                        "dashboard",
                        latest,
                    )
                )
            if enabled(user, "revenue_alerts") and change is not None and abs(change) >= 10:
                direction = "increased" if change > 0 else "decreased"
                items.append(
                    item(
                        "owner-revenue-change",
                        "Revenue movement detected",
                        f"Revenue {direction} by {abs(change):.1f}% compared with "
                        "the previous 7-day period.",
                        "success" if change > 0 else "warning",
                        "revenue",
                        "dashboard",
                        latest,
                    )
                )

    elif role == RoleCode.STORE_MANAGER:
        inventory_conditions = [
            Inventory.tenant_id == user.tenant_id,
            Inventory.store_id == user.store_id,
        ]
        low = (
            db.scalar(
                select(func.count(Inventory.id)).where(
                    *inventory_conditions,
                    Inventory.stock_quantity > 0,
                    Inventory.stock_quantity <= Inventory.reorder_level,
                )
            )
            or 0
        )
        out = (
            db.scalar(
                select(func.count(Inventory.id)).where(
                    *inventory_conditions, Inventory.stock_quantity == 0
                )
            )
            or 0
        )
        total = db.scalar(select(func.count(Inventory.id)).where(*inventory_conditions)) or 0
        if enabled(user, "daily_store_summary"):
            items.append(
                item(
                    "manager-daily-summary",
                    "Store operations summary",
                    f"Your store has {total} tracked products, with {low + out} "
                    "currently needing stock attention.",
                    "info",
                    "summary",
                    "dashboard",
                )
            )

    elif role == RoleCode.SALES_EXECUTIVE:
        customers = db.scalars(
            select(Customer)
            .where(Customer.tenant_id == user.tenant_id, Customer.assigned_seller_id == user.id)
            .order_by(Customer.recency_days.desc())
            .limit(20)
        ).all()
        followups = [customer for customer in customers if customer.recency_days >= 60]
        active = [customer for customer in customers if customer.recency_days <= 30]
        if enabled(user, "follow_up_reminders") and followups:
            items.append(
                item(
                    "sales-followups",
                    "Customer follow-ups due",
                    f"{len(followups)} assigned customers have not purchased for at least 60 days.",
                    "warning",
                    "customers",
                    "customers",
                )
            )
        if enabled(user, "customer_activity_alerts") and active:
            items.append(
                item(
                    "sales-customer-activity",
                    "Recent customer activity",
                    f"{len(active)} assigned customers purchased within the latest "
                    "30-day customer window.",
                    "success",
                    "customers",
                    "customers",
                )
            )

    elif role == RoleCode.ADMINISTRATOR:
        if enabled(user, "model_failure_alerts"):
            failed = db.scalars(
                select(ForecastJob)
                .where(ForecastJob.status.in_(["failed", "error"]))
                .order_by(ForecastJob.created_at.desc())
                .limit(3)
            ).all()
            for job in failed:
                items.append(
                    item(
                        f"model-{job.id}",
                        "Forecast job failed",
                        f"{job.job_type} job {job.external_reference} requires review.",
                        "error",
                        "model",
                        "reports",
                        job.created_at,
                    )
                )
        audit_events = db.scalars(
            select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(20)
        ).all()
        if enabled(user, "security_alerts"):
            security = next(
                (
                    event
                    for event in audit_events
                    if any(
                        word in event.event_type
                        for word in ("login_failed", "locked", "mfa", "password")
                    )
                ),
                None,
            )
            if security:
                items.append(
                    item(
                        f"security-{security.id}",
                        "Security event",
                        f"{security.event_type.replace('.', ' ').replace('_', ' ').title()} "
                        "was recorded.",
                        "warning",
                        "security",
                        "dashboard",
                        security.created_at,
                    )
                )
        if enabled(user, "audit_alerts") and audit_events:
            event = audit_events[0]
            items.append(
                item(
                    f"audit-{event.id}",
                    "Latest audit activity",
                    event.event_type.replace(".", " ").replace("_", " ").title(),
                    "info",
                    "audit",
                    "dashboard",
                    event.created_at,
                )
            )

    return NotificationResponse(
        generated_at=now,
        items=sorted(items, key=lambda value: as_utc(value.created_at), reverse=True)[:20],
    )
