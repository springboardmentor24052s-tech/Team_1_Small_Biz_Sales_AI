from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.anomaly import AnomalyStatusActionRequest, AnomalySummaryResponse
from app.services.anomaly_service import get_anomaly_summary, update_anomaly_status

router = APIRouter(prefix="/anomalies", tags=["Isolation Forest Anomaly Detection"])


@router.get("", response_model=AnomalySummaryResponse, summary="Get Isolation Forest Anomaly Detection Summary & Event Alerts")
def read_anomalies(
    tenant_id: UUID = Query(default="11111111-1111-1111-1111-111111111111", description="Target tenant ID"),
    severity: str | None = Query(default=None, description="Severity filter: 'critical', 'warning', 'info'"),
    contamination: float = Query(default=0.05, ge=0.01, le=0.20, description="Isolation Forest contamination factor"),
    db: Session = Depends(get_db)
):
    """
    Scans sales transactions, inventory stock movements, and revenue forecast residuals using
    Scikit-Learn Isolation Forest & z-score statistical detection to identify operational anomalies.
    """
    try:
        summary = get_anomaly_summary(
            db=db,
            tenant_id=tenant_id,
            severity_filter=severity,
            contamination=contamination
        )
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute anomaly detection: {str(e)}"
        )


@router.post("/{event_id}/acknowledge", summary="Acknowledge Anomaly Event")
def acknowledge_anomaly(
    event_id: UUID,
    payload: AnomalyStatusActionRequest | None = None
):
    """
    Updates an anomaly event status to 'acknowledged' under active investigation.
    """
    action_by = payload.action_by if payload else "admin"
    return update_anomaly_status(event_id=event_id, action="acknowledge", action_by=action_by)


@router.post("/{event_id}/resolve", summary="Resolve Anomaly Event")
def resolve_anomaly(
    event_id: UUID,
    payload: AnomalyStatusActionRequest | None = None
):
    """
    Marks an anomaly event status as 'resolved'.
    """
    action_by = payload.action_by if payload else "admin"
    return update_anomaly_status(event_id=event_id, action="resolve", action_by=action_by)
