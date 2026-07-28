from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.api.dependencies import DBSession, require_permissions
from app.core.permissions import Permissions
from app.models.audit import AuditEvent
from app.models.identity import User
from app.schemas.common import ORMModel


class AuditEventResponse(ORMModel):
    id: UUID
    created_at: datetime
    actor_user_id: UUID | None
    event_type: str
    target_type: str | None
    target_id: str | None
    correlation_id: str | None
    details: dict


router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=list[AuditEventResponse])
def list_audit_events(
    db: DBSession,
    user: User = Depends(require_permissions(Permissions.AUDIT_READ)),
    limit: int = Query(default=100, ge=1, le=500),
):
    return db.scalars(
        select(AuditEvent)
        .where(AuditEvent.tenant_id == user.tenant_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
    ).all()
