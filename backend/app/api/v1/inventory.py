from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import case, func, select

from app.api.dependencies import DBSession, require_permissions
from app.core.permissions import Permissions
from app.models.identity import User
from app.models.inventory import Inventory, Product
from app.schemas.inventory import (
    InventoryList,
    InventoryResponse,
    InventorySummary,
    InventoryUpdate,
)
from app.services.audit import record_audit
from app.services.inventory import can_update_inventory, scoped_inventory_query

router = APIRouter(prefix="/inventory", tags=["Inventory"])

inventory_reader = require_permissions(
    Permissions.INVENTORY_READ_ALL,
    Permissions.INVENTORY_READ_STORE,
    require_all=False,
)


@router.get("/summary", response_model=InventorySummary)
def inventory_summary(
    db: DBSession,
    user: User = Depends(inventory_reader),
    store_id: UUID | None = Query(default=None),
):
    base = scoped_inventory_query(select(Inventory), user, store_id)
    scoped = base.subquery()
    product_count, total_units, low_stock_count, out_of_stock_count = db.execute(
        select(
            func.count(scoped.c.id),
            func.coalesce(func.sum(scoped.c.stock_quantity), 0),
            func.coalesce(
                func.sum(
                    case(
                        (
                            (scoped.c.stock_quantity > 0)
                            & (scoped.c.stock_quantity <= scoped.c.reorder_level),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ),
            func.coalesce(
                func.sum(case((scoped.c.stock_quantity == 0, 1), else_=0)),
                0,
            ),
        )
    ).one()
    effective_store = store_id
    scope = "business"
    if Permissions.INVENTORY_READ_ALL not in user.permission_codes:
        effective_store = user.store_id
        scope = "store"
    elif store_id:
        scope = "store"
    return InventorySummary(
        scope=scope,
        tenant_id=user.tenant_id,
        store_id=effective_store,
        product_count=product_count,
        total_units=total_units,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
    )


@router.get("", response_model=InventoryList)
def list_inventory(
    db: DBSession,
    user: User = Depends(inventory_reader),
    store_id: UUID | None = Query(default=None),
    sku: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=120),
    stock_status: str | None = Query(
        default=None,
        pattern="^(in_stock|low_stock|out_of_stock)$",
    ),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = scoped_inventory_query(
        select(Inventory).join(Product),
        user,
        store_id,
    )
    if sku:
        query = query.where(Product.sku.ilike(f"%{sku.strip()}%"))
    if category:
        query = query.where(Product.category.ilike(f"%{category.strip()}%"))
    if stock_status == "out_of_stock":
        query = query.where(Inventory.stock_quantity == 0)
    elif stock_status == "low_stock":
        query = query.where(
            Inventory.stock_quantity > 0,
            Inventory.stock_quantity <= Inventory.reorder_level,
        )
    elif stock_status == "in_stock":
        query = query.where(Inventory.stock_quantity > Inventory.reorder_level)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Product.sku).limit(limit).offset(offset)).unique().all()
    return InventoryList(items=items, total=total, limit=limit, offset=offset)


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory(
    inventory_id: UUID,
    db: DBSession,
    user: User = Depends(inventory_reader),
):
    item = db.scalar(
        scoped_inventory_query(
            select(Inventory).where(Inventory.id == inventory_id),
            user,
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return item


@router.patch("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(
    inventory_id: UUID,
    payload: InventoryUpdate,
    request: Request,
    db: DBSession,
    user: User = Depends(require_permissions(Permissions.INVENTORY_UPDATE_STORE)),
):
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="At least one inventory field is required")

    item = db.get(Inventory, inventory_id)
    if not item or not can_update_inventory(user, item):
        raise HTTPException(status_code=404, detail="Inventory record not found")

    before = {field: getattr(item, field) for field in changes}
    for field, value in changes.items():
        setattr(item, field, value)
    record_audit(
        db,
        event_type="inventory.updated",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
        target_type="inventory",
        target_id=str(item.id),
        details={"before": before, "after": changes},
    )
    db.commit()
    db.refresh(item)
    return item
