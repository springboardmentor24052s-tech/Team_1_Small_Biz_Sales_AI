from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import Select

from app.core.permissions import Permissions
from app.models.identity import User
from app.models.inventory import Inventory


def scoped_inventory_query(
    query: Select,
    user: User,
    requested_store_id: UUID | None = None,
) -> Select:
    query = query.where(Inventory.tenant_id == user.tenant_id)
    permissions = user.permission_codes

    if Permissions.INVENTORY_READ_ALL in permissions:
        if requested_store_id:
            return query.where(Inventory.store_id == requested_store_id)
        return query

    if Permissions.INVENTORY_READ_STORE in permissions and user.store_id:
        if requested_store_id and requested_store_id != user.store_id:
            raise HTTPException(status_code=403, detail="Inventory is outside your store scope")
        return query.where(Inventory.store_id == user.store_id)

    raise HTTPException(status_code=403, detail="Permission denied")


def can_update_inventory(user: User, item: Inventory) -> bool:
    if item.tenant_id != user.tenant_id:
        return False
    permissions = user.permission_codes
    if Permissions.INVENTORY_UPDATE_STORE not in permissions:
        return False
    if Permissions.INVENTORY_READ_ALL in permissions:
        return True
    return user.store_id == item.store_id
