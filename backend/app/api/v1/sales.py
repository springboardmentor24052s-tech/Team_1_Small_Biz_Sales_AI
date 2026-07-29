from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select

from app.api.dependencies import DBSession, require_permissions
from app.core.permissions import Permissions
from app.models.identity import Store, User
from app.models.sales import SalesTransaction, TransactionStatus
from app.schemas.common import MessageResponse
from app.schemas.sales import (
    SalesTransactionCreate,
    SalesTransactionResponse,
    SalesTransactionUpdate,
    TransactionList,
)
from app.services.audit import record_audit
from app.services.sales import can_update_transaction, scoped_sales_query

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post(
    "/transactions",
    response_model=SalesTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    payload: SalesTransactionCreate,
    request: Request,
    db: DBSession,
    user: User = Depends(require_permissions(Permissions.SALES_CREATE)),
):
    store = db.get(Store, payload.store_id)
    if not store or store.tenant_id != user.tenant_id:
        raise HTTPException(status_code=422, detail="Store does not belong to this tenant")
    if user.store_id and user.store_id != store.id:
        raise HTTPException(status_code=403, detail="Transaction is outside your store scope")
    if payload.external_reference and db.scalar(
        select(SalesTransaction.id).where(
            SalesTransaction.tenant_id == user.tenant_id,
            SalesTransaction.store_id == store.id,
            SalesTransaction.source_system == "manual",
            SalesTransaction.external_reference == payload.external_reference,
        )
    ):
        raise HTTPException(status_code=409, detail="Transaction reference already exists")

    transaction = SalesTransaction(
        tenant_id=user.tenant_id,
        store_id=store.id,
        seller_id=user.id,
        **payload.model_dump(exclude={"store_id"}),
    )
    db.add(transaction)
    db.flush()
    record_audit(
        db,
        event_type="sales.transaction_created",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        target_type="sales_transaction",
        target_id=str(transaction.id),
        details={"amount": str(transaction.total_amount), "currency": transaction.currency},
    )
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/transactions", response_model=TransactionList)
def list_transactions(
    db: DBSession,
    user: User = Depends(
        require_permissions(
            Permissions.SALES_READ_ALL,
            Permissions.SALES_READ_STORE,
            Permissions.SALES_READ_OWN,
            require_all=False,
        )
    ),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    base = scoped_sales_query(select(SalesTransaction), user)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = db.scalars(
        base.order_by(SalesTransaction.occurred_at.desc()).limit(limit).offset(offset)
    ).all()
    return TransactionList(items=items, total=total, limit=limit, offset=offset)


@router.get("/transactions/{transaction_id}", response_model=SalesTransactionResponse)
def get_transaction(
    transaction_id: UUID,
    db: DBSession,
    user: User = Depends(
        require_permissions(
            Permissions.SALES_READ_ALL,
            Permissions.SALES_READ_STORE,
            Permissions.SALES_READ_OWN,
            require_all=False,
        )
    ),
):
    item = db.scalar(
        scoped_sales_query(
            select(SalesTransaction).where(SalesTransaction.id == transaction_id),
            user,
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return item


@router.patch("/transactions/{transaction_id}", response_model=SalesTransactionResponse)
def update_transaction(
    transaction_id: UUID,
    payload: SalesTransactionUpdate,
    request: Request,
    db: DBSession,
    user: User = Depends(
        require_permissions(
            Permissions.SALES_UPDATE_STORE,
            Permissions.SALES_UPDATE_OWN,
            require_all=False,
        )
    ),
):
    item = db.get(SalesTransaction, transaction_id)
    if not item or not can_update_transaction(user, item):
        raise HTTPException(status_code=404, detail="Transaction not found")
    if item.status == TransactionStatus.VOIDED:
        raise HTTPException(status_code=409, detail="A voided transaction cannot be changed")
    if payload.external_reference and db.scalar(
        select(SalesTransaction.id).where(
            SalesTransaction.id != item.id,
            SalesTransaction.tenant_id == item.tenant_id,
            SalesTransaction.store_id == item.store_id,
            SalesTransaction.source_system == item.source_system,
            SalesTransaction.external_reference == payload.external_reference,
        )
    ):
        raise HTTPException(status_code=409, detail="Transaction reference already exists")
    before = {key: str(getattr(item, key)) for key in payload.model_dump(exclude_unset=True)}
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    record_audit(
        db,
        event_type="sales.transaction_updated",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        target_type="sales_transaction",
        target_id=str(item.id),
        details={"before": before},
    )
    db.commit()
    db.refresh(item)
    return item


@router.post("/transactions/{transaction_id}/void", response_model=MessageResponse)
def void_transaction(
    transaction_id: UUID,
    request: Request,
    db: DBSession,
    user: User = Depends(require_permissions(Permissions.SALES_VOID)),
):
    item = db.get(SalesTransaction, transaction_id)
    if (
        not item
        or item.tenant_id != user.tenant_id
        or (user.store_id and item.store_id != user.store_id)
    ):
        raise HTTPException(status_code=404, detail="Transaction not found")
    if item.status == TransactionStatus.VOIDED:
        return MessageResponse(message="Transaction was already voided")
    item.status = TransactionStatus.VOIDED
    record_audit(
        db,
        event_type="sales.transaction_voided",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        target_type="sales_transaction",
        target_id=str(item.id),
    )
    db.commit()
    return MessageResponse(message="Transaction voided")
