from uuid import UUID

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit import AuditEvent


def record_audit(
    db: Session,
    *,
    event_type: str,
    request: Request | None = None,
    tenant_id: UUID | None = None,
    actor_user_id: UUID | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    details: dict | None = None,
) -> AuditEvent:
    event = AuditEvent(
        tenant_id=tenant_id,
        actor_user_id=actor_user_id,
        event_type=event_type,
        target_type=target_type,
        target_id=target_id,
        correlation_id=getattr(request.state, "correlation_id", None) if request else None,
        ip_address=request.client.host if request and request.client else None,
        details=details or {},
    )
    db.add(event)
    return event
