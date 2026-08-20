from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select

from app.api.dependencies import DBSession, require_permissions, require_reauthentication
from app.core.permissions import Permissions
from app.models.customers import Customer
from app.models.identity import Role, RoleCode, Store, User, UserStatus
from app.models.inventory import Inventory, Product
from app.models.onboarding import OnboardingImportJob
from app.models.sales import SalesLineItem, SalesTransaction, TransactionStatus
from app.schemas.onboarding import (
    ImportJobResponse,
    OnboardingStatusResponse,
    ReadinessItem,
    SampleDataResponse,
    StoreCreate,
    StoreCreateResponse,
)
from app.services.audit import record_audit
from app.services.onboarding import parse_csv, seed_business_sample, upsert_upload, validate_upload

router = APIRouter(prefix="/onboarding", tags=["Business onboarding"])
MAX_CSV_BYTES = 2 * 1024 * 1024


def require_owner(user: User) -> None:
    if user.role.code != RoleCode.BUSINESS_OWNER:
        raise HTTPException(status_code=403, detail="Business Owner access is required")


def serialize_job(job: OnboardingImportJob) -> ImportJobResponse:
    return ImportJobResponse(
        id=job.id,
        kind=job.kind,
        filename=job.filename,
        status=job.status,
        total_rows=job.total_rows,
        valid_rows=job.valid_rows,
        invalid_rows=job.invalid_rows,
        preview=job.preview,
        errors=job.errors,
        report=job.report,
        created_at=job.created_at,
    )


def scoped_store(db: DBSession, tenant_id: UUID, store_id: UUID | None) -> Store | None:
    if not store_id:
        return None
    return db.scalar(select(Store).where(Store.id == store_id, Store.tenant_id == tenant_id))


def scoped_seller(db: DBSession, actor: User, seller_id: UUID | None) -> User:
    if not seller_id:
        return actor
    seller = db.scalar(
        select(User)
        .join(Role)
        .where(
            User.id == seller_id,
            User.tenant_id == actor.tenant_id,
            User.status == UserStatus.ACTIVE,
            Role.code == RoleCode.SALES_EXECUTIVE,
        )
    )
    if not seller:
        raise HTTPException(
            status_code=422, detail="Select an active Sales Executive in this business"
        )
    return seller


@router.get("/status", response_model=OnboardingStatusResponse)
def onboarding_status(
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.USERS_MANAGE)),
):
    require_owner(actor)
    counts = {
        "stores": db.scalar(select(func.count(Store.id)).where(Store.tenant_id == actor.tenant_id))
        or 0,
        "employees": db.scalar(
            select(func.count(User.id)).where(
                User.tenant_id == actor.tenant_id, User.id != actor.id
            )
        )
        or 0,
        "products": db.scalar(
            select(func.count(Product.id)).where(Product.tenant_id == actor.tenant_id)
        )
        or 0,
        "inventory": db.scalar(
            select(func.count(Inventory.id)).where(Inventory.tenant_id == actor.tenant_id)
        )
        or 0,
        "sales": db.scalar(
            select(func.count(SalesTransaction.id)).where(
                SalesTransaction.tenant_id == actor.tenant_id,
                SalesTransaction.status == TransactionStatus.COMPLETED,
            )
        )
        or 0,
        "sales_lines": db.scalar(
            select(func.count(SalesLineItem.id)).where(SalesLineItem.tenant_id == actor.tenant_id)
        )
        or 0,
        "customers": db.scalar(
            select(func.count(Customer.id)).where(Customer.tenant_id == actor.tenant_id)
        )
        or 0,
    }
    sales_days = (
        db.scalar(
            select(func.count(func.distinct(func.date(SalesTransaction.occurred_at)))).where(
                SalesTransaction.tenant_id == actor.tenant_id,
                SalesTransaction.status == TransactionStatus.COMPLETED,
            )
        )
        or 0
    )
    checklist = {
        "business_created": True,
        "store_ready": counts["stores"] > 0,
        "team_ready": counts["employees"] >= 2,
        "products_ready": counts["products"] > 0,
        "inventory_ready": counts["inventory"] > 0,
        "sales_ready": counts["sales"] > 0,
        "customers_ready": counts["customers"] > 0,
    }
    completed = sum(checklist.values())
    revenue_ready = counts["sales"] >= 30 and sales_days >= 30
    customer_ready = counts["customers"] >= 20
    eligible_demand_series = (
        db.scalar(
            select(func.count()).select_from(
                select(SalesLineItem.product_id)
                .join(
                    SalesTransaction,
                    SalesTransaction.id == SalesLineItem.transaction_id,
                )
                .where(
                    SalesLineItem.tenant_id == actor.tenant_id,
                    SalesTransaction.status == TransactionStatus.COMPLETED,
                )
                .group_by(SalesTransaction.store_id, SalesLineItem.product_id)
                .having(func.count(SalesLineItem.id) >= 30)
                .having(func.count(func.distinct(func.date(SalesTransaction.occurred_at))) >= 30)
                .subquery()
            )
        )
        or 0
    )
    demand_ready = eligible_demand_series > 0
    jobs = db.scalars(
        select(OnboardingImportJob)
        .where(OnboardingImportJob.tenant_id == actor.tenant_id)
        .order_by(OnboardingImportJob.created_at.desc())
        .limit(10)
    ).all()
    return OnboardingStatusResponse(
        completion_percentage=round(completed / len(checklist) * 100),
        counts=counts,
        checklist=checklist,
        forecast_readiness={
            "revenue": ReadinessItem(
                ready=revenue_ready,
                label="Revenue forecast",
                detail=(
                    f"{counts['sales']} transactions across {sales_days} days; recommended "
                    "minimum is 30 transactions across 30 days."
                ),
            ),
            "demand": ReadinessItem(
                ready=demand_ready,
                label="Demand forecast",
                detail=(
                    f"{counts['sales_lines']} SKU-linked sale lines; {eligible_demand_series} "
                    "store-product series have at least 30 records across 30 days."
                ),
            ),
            "segmentation": ReadinessItem(
                ready=customer_ready,
                label="Customer segmentation",
                detail=f"{counts['customers']} customers available; recommended minimum is 20.",
            ),
        },
        recent_imports=[serialize_job(job) for job in jobs],
    )


@router.post(
    "/stores",
    response_model=StoreCreateResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_reauthentication)],
)
def create_store(
    payload: StoreCreate,
    request: Request,
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.USERS_MANAGE)),
):
    require_owner(actor)
    code = payload.code.strip().upper()
    if db.scalar(select(Store.id).where(Store.tenant_id == actor.tenant_id, Store.code == code)):
        raise HTTPException(
            status_code=409, detail="This store code is already used in your business"
        )
    store = Store(
        tenant_id=actor.tenant_id, name=payload.name.strip(), code=code, timezone=payload.timezone
    )
    db.add(store)
    db.flush()
    record_audit(
        db,
        event_type="owner.store_created",
        request=request,
        tenant_id=actor.tenant_id,
        actor_user_id=actor.id,
        target_type="store",
        target_id=str(store.id),
        details={"code": code},
    )
    db.commit()
    db.refresh(store)
    return store


@router.post("/imports/preview", response_model=ImportJobResponse, status_code=201)
async def preview_import(
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.USERS_MANAGE)),
    kind: Literal["products", "inventory", "sales", "customers"] = Form(...),
    store_id: UUID | None = Form(default=None),
    seller_id: UUID | None = Form(default=None),
    upload: UploadFile = File(...),
):
    require_owner(actor)
    if not upload.filename or not upload.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=422, detail="Upload a CSV file")
    content = await upload.read(MAX_CSV_BYTES + 1)
    if not content or len(content) > MAX_CSV_BYTES:
        raise HTTPException(status_code=413, detail="CSV must be between 1 byte and 2 MB")
    try:
        raw_csv = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=422, detail="CSV must use UTF-8 encoding") from exc
    if kind in {"inventory", "sales"} and not scoped_store(db, actor.tenant_id, store_id):
        raise HTTPException(status_code=422, detail="Select a store in this business")
    seller = scoped_seller(db, actor, seller_id) if kind in {"sales", "customers"} else None
    valid, preview, errors = validate_upload(
        db, tenant_id=actor.tenant_id, kind=kind, raw_csv=raw_csv
    )
    _, rows = parse_csv(raw_csv)
    job = OnboardingImportJob(
        tenant_id=actor.tenant_id,
        actor_user_id=actor.id,
        store_id=store_id,
        seller_id=seller.id if seller else None,
        kind=kind,
        filename=upload.filename[:255],
        status="ready" if valid else "invalid",
        total_rows=len(rows),
        valid_rows=len(valid),
        invalid_rows=len(rows) - len(valid),
        preview=preview,
        errors=errors,
        report={},
        raw_csv=raw_csv,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return serialize_job(job)


@router.post(
    "/imports/{job_id}/commit",
    response_model=ImportJobResponse,
    dependencies=[Depends(require_reauthentication)],
)
def commit_import(
    job_id: UUID,
    request: Request,
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.USERS_MANAGE)),
):
    require_owner(actor)
    job = db.scalar(
        select(OnboardingImportJob).where(
            OnboardingImportJob.id == job_id, OnboardingImportJob.tenant_id == actor.tenant_id
        )
    )
    if not job:
        raise HTTPException(status_code=404, detail="Import preview not found")
    if job.status == "imported":
        return serialize_job(job)
    if not job.valid_rows:
        raise HTTPException(status_code=422, detail="Fix the CSV errors before importing")
    try:
        job.status = "importing"
        job.report = upsert_upload(
            db,
            tenant_id=actor.tenant_id,
            store_id=job.store_id,
            seller_id=job.seller_id or actor.id,
            kind=job.kind,
            raw_csv=job.raw_csv,
        )
        job.status = "imported"
        job.raw_csv = ""
        record_audit(
            db,
            event_type="owner.data_imported",
            request=request,
            tenant_id=actor.tenant_id,
            actor_user_id=actor.id,
            target_type="onboarding_import",
            target_id=str(job.id),
            details={"kind": job.kind, **job.report},
        )
        db.commit()
    except Exception:
        db.rollback()
        job = db.get(OnboardingImportJob, job_id)
        job.status = "failed"
        db.commit()
        raise
    db.refresh(job)
    return serialize_job(job)


@router.post(
    "/sample-data",
    response_model=SampleDataResponse,
    dependencies=[Depends(require_reauthentication)],
)
def add_sample_data(
    request: Request,
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.USERS_MANAGE)),
):
    require_owner(actor)
    store = db.scalar(
        select(Store).where(Store.tenant_id == actor.tenant_id).order_by(Store.created_at)
    )
    if not store:
        raise HTTPException(status_code=422, detail="Create a store before adding sample data")
    report = seed_business_sample(
        db, tenant_id=actor.tenant_id, store_id=store.id, seller_id=actor.id
    )
    record_audit(
        db,
        event_type="owner.sample_data_added",
        request=request,
        tenant_id=actor.tenant_id,
        actor_user_id=actor.id,
        details=report,
    )
    db.commit()
    return SampleDataResponse(message="Evaluation sample data is ready", report=report)
