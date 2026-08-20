from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select

from app.api.dependencies import DBSession, require_permissions, require_reauthentication
from app.core.permissions import Permissions
from app.models.customers import Customer
from app.models.forecasting import ForecastJob
from app.models.identity import RoleCode, User
from app.models.sales import SalesTransaction, TransactionStatus
from app.schemas.intelligence import (
    IntelligenceModuleReadiness,
    IntelligenceReadinessResponse,
    IntelligenceTrainingResponse,
)
from app.services.audit import record_audit
from app.services.intelligence import readiness, train_tenant_intelligence

router = APIRouter(prefix="/intelligence", tags=["Tenant intelligence training"])
owner_access = require_permissions(Permissions.USERS_MANAGE)


def _require_owner(actor: User) -> None:
    if actor.role.code != RoleCode.BUSINESS_OWNER:
        raise HTTPException(status_code=403, detail="Business Owner access is required")


@router.get("/readiness", response_model=IntelligenceReadinessResponse)
def intelligence_readiness(db: DBSession, actor: User = Depends(owner_access)):
    _require_owner(actor)
    state = readiness(db, actor.tenant_id)
    last_job = db.scalar(
        select(ForecastJob)
        .where(
            ForecastJob.tenant_id == actor.tenant_id,
            ForecastJob.job_type == "tenant_intelligence_refresh",
        )
        .order_by(ForecastJob.started_at.desc())
        .limit(1)
    )
    changed_after = last_job.completed_at if last_job and last_job.completed_at else None
    new_sales = (
        db.scalar(
            select(func.count(SalesTransaction.id)).where(
                SalesTransaction.tenant_id == actor.tenant_id,
                SalesTransaction.status == TransactionStatus.COMPLETED,
                *([SalesTransaction.updated_at > changed_after] if changed_after else []),
            )
        )
        or 0
    )
    new_customers = (
        db.scalar(
            select(func.count(Customer.id)).where(
                Customer.tenant_id == actor.tenant_id,
                *([Customer.updated_at > changed_after] if changed_after else []),
            )
        )
        or 0
    )
    new_records = new_sales + new_customers
    return IntelligenceReadinessResponse(
        ready_to_train=any(item["ready"] for item in state.values()),
        refresh_recommended=bool(last_job and new_records)
        or (last_job is None and new_records > 0),
        new_records_since_last_training=new_records,
        **{key: IntelligenceModuleReadiness(**value) for key, value in state.items()},
        last_job=(
            {
                "reference": last_job.external_reference,
                "status": last_job.status,
                "started_at": last_job.started_at.isoformat(),
                "completed_at": (
                    last_job.completed_at.isoformat() if last_job.completed_at else None
                ),
                "details": last_job.details,
            }
            if last_job
            else None
        ),
    )


@router.post(
    "/train",
    response_model=IntelligenceTrainingResponse,
    dependencies=[Depends(require_reauthentication)],
)
def train_intelligence(
    request: Request,
    db: DBSession,
    actor: User = Depends(owner_access),
):
    _require_owner(actor)
    state = readiness(db, actor.tenant_id)
    if not any(item["ready"] for item in state.values()):
        raise HTTPException(
            status_code=422,
            detail={
                "message": "No intelligence module has enough real data to train.",
                "readiness": state,
            },
        )
    started = datetime.now(UTC)
    reference = f"tenant-refresh-{uuid4()}"
    job = ForecastJob(
        tenant_id=actor.tenant_id,
        external_reference=reference,
        job_type="tenant_intelligence_refresh",
        status="running",
        record_count=sum(item["observed_records"] for item in state.values()),
        started_at=started,
        completed_at=None,
        details={"readiness_at_start": state},
    )
    db.add(job)
    db.commit()
    try:
        modules = train_tenant_intelligence(db, actor.tenant_id)
        completed = datetime.now(UTC)
        published = sum(
            1
            for value in modules.values()
            for item in (value if isinstance(value, list) else [value])
            if item.get("status") == "published"
        )
        job.status = "success" if published else "rejected"
        job.completed_at = completed
        job.details = {"readiness_at_start": state, "modules": modules, "published": published}
        record_audit(
            db,
            event_type="intelligence.training_completed",
            request=request,
            tenant_id=actor.tenant_id,
            actor_user_id=actor.id,
            target_type="forecast_job",
            target_id=str(job.id),
            details={"reference": reference, "published": published},
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        failed_job = db.scalar(
            select(ForecastJob).where(ForecastJob.external_reference == reference)
        )
        if failed_job:
            failed_job.status = "failed"
            failed_job.completed_at = datetime.now(UTC)
            failed_job.details = {"error": type(exc).__name__}
            db.commit()
        raise
    return IntelligenceTrainingResponse(
        reference=reference,
        status=job.status,
        started_at=started,
        completed_at=completed,
        modules=modules,
        message=(
            f"Training finished. {published} verified model outputs were published; rejected "
            "outputs remain hidden from dashboards."
        ),
    )
