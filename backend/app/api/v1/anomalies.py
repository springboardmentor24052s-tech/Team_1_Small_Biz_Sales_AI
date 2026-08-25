from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DBSession, require_permissions
from app.core.permissions import Permissions
from app.core.security import utcnow
from app.models.anomalies import AnomalyEvent, AnomalyModelRun
from app.schemas.anomalies import (
    AnomalyEventResponse,
    AnomalyStatusUpdateRequest,
    AnomalySummaryResponse,
)
from app.schemas.common import MessageResponse
from app.services.anomalies import list_tenant_anomalies, train_and_scan_anomalies

router = APIRouter(prefix="/anomalies", tags=["Anomaly Detection"])


@router.get("", response_model=list[AnomalyEventResponse])
def get_anomalies(
    user: CurrentUser,
    db: DBSession,
    severity: str | None = Query(None, description="Filter by severity: critical, high, medium, low"),
    anomaly_type: str | None = Query(None, description="Filter by type: sales_spike, sales_drop, fraud_risk, inventory_shrinkage"),
    status: str | None = Query(None, description="Filter by status: open, acknowledged, resolved, false_positive"),
    limit: int = Query(50, ge=1, le=200),
    _auth: None = Depends(require_permissions(Permissions.ANOMALIES_READ, Permissions.ANOMALIES_MANAGE, require_all=False)),
):
    """Lists detected anomaly and fraud risk events."""
    events = list_tenant_anomalies(db, user.tenant_id, severity=severity, anomaly_type=anomaly_type, status=status, limit=limit)
    if not events and not severity and not anomaly_type and not status:
        # Trigger scan if no events exist initially
        train_and_scan_anomalies(db, user.tenant_id)
        events = list_tenant_anomalies(db, user.tenant_id, severity=severity, anomaly_type=anomaly_type, status=status, limit=limit)

    return events or []


@router.post("/scan", response_model=AnomalySummaryResponse)
def trigger_anomaly_scan(
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.ANOMALIES_READ, Permissions.ANOMALIES_MANAGE, require_all=False)),
):
    """Triggers an on-demand scan using Isolation Forest and statistical models."""
    train_and_scan_anomalies(db, user.tenant_id)
    return get_anomalies_summary(user=user, db=db)


@router.get("/summary", response_model=AnomalySummaryResponse)
def get_anomalies_summary(
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.ANOMALIES_READ, Permissions.ANOMALIES_MANAGE, require_all=False)),
):
    """Returns aggregated summary counts of open anomalies, severities, and model metrics."""
    model_run = db.scalar(
        select(AnomalyModelRun)
        .where(AnomalyModelRun.tenant_id == user.tenant_id)
        .order_by(AnomalyModelRun.trained_at.desc())
    )
    if not model_run:
        model_run = train_and_scan_anomalies(db, user.tenant_id)

    all_events = db.scalars(
        select(AnomalyEvent).where(AnomalyEvent.tenant_id == user.tenant_id)
    ).all()

    open_events = [e for e in all_events if e.status in ("open", "acknowledged")]
    critical = [e for e in open_events if e.severity == "critical"]
    high = [e for e in open_events if e.severity == "high"]
    medium = [e for e in open_events if e.severity == "medium"]
    low = [e for e in open_events if e.severity == "low"]

    fraud = [e for e in open_events if e.anomaly_type == "fraud_risk"]
    shrinkage = [e for e in open_events if e.anomaly_type == "inventory_shrinkage"]
    sales = [e for e in open_events if e.anomaly_type in ("sales_spike", "sales_drop")]

    resolved_count = len([e for e in all_events if e.status == "resolved"])
    res_rate = resolved_count / max(1, len(all_events)) if all_events else 0.0

    return AnomalySummaryResponse(
        total_open=len(open_events),
        critical_count=len(critical),
        high_count=len(high),
        medium_count=len(medium),
        low_count=len(low),
        fraud_risk_count=len(fraud),
        inventory_shrinkage_count=len(shrinkage),
        sales_trend_count=len(sales),
        resolution_rate=round(float(res_rate), 4),
        model_version=model_run.model_version if model_run else None,
        detection_rate=model_run.detection_rate if model_run else None,
        false_positive_rate=model_run.false_positive_rate if model_run else None,
    )


@router.patch("/{anomaly_id}/status", response_model=AnomalyEventResponse)
def update_anomaly_status(
    anomaly_id: UUID,
    payload: AnomalyStatusUpdateRequest,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.ANOMALIES_READ, Permissions.ANOMALIES_MANAGE, require_all=False)),
):
    """Updates anomaly status (acknowledged, resolved, false_positive)."""
    event = db.scalar(
        select(AnomalyEvent).where(AnomalyEvent.id == anomaly_id, AnomalyEvent.tenant_id == user.tenant_id)
    )
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomaly event not found")

    event.status = payload.status
    if payload.status == "resolved":
        event.resolved_at = utcnow()
        event.resolved_by_id = user.id
    if payload.resolution_notes:
        event.resolution_notes = payload.resolution_notes

    db.commit()
    db.refresh(event)
    return event
