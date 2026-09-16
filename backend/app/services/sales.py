from fastapi import HTTPException
from sqlalchemy import Select

from app.core.permissions import Permissions
from app.models.identity import User
from app.models.sales import SalesTransaction


def scoped_sales_query(query: Select, user: User) -> Select:
    query = query.where(SalesTransaction.tenant_id == user.tenant_id)
    permissions = user.permission_codes
    if Permissions.SALES_READ_ALL in permissions:
        return query
    if Permissions.SALES_READ_STORE in permissions and user.store_id:
        return query.where(SalesTransaction.store_id == user.store_id)
    if Permissions.SALES_READ_OWN in permissions:
        return query.where(SalesTransaction.seller_id == user.id)
    raise HTTPException(status_code=403, detail="Permission denied")


def can_update_transaction(user: User, transaction: SalesTransaction) -> bool:
    if transaction.tenant_id != user.tenant_id:
        return False
    permissions = user.permission_codes
    if Permissions.SALES_READ_ALL in permissions and Permissions.SALES_UPDATE_STORE in permissions:
        return True
    if Permissions.SALES_UPDATE_STORE in permissions and user.store_id == transaction.store_id:
        return True
    return Permissions.SALES_UPDATE_OWN in permissions and transaction.seller_id == user.id
