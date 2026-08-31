from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.monitoring import SystemMonitoringResponse
from app.services.monitoring_service import get_system_monitoring_status

router = APIRouter(prefix="/models", tags=["AI Models & System Monitoring"])


@router.get("/monitoring", response_model=SystemMonitoringResponse, summary="Get Platform AI Models & System Health")
def read_models_monitoring(
    tenant_id: UUID = Query(default="11111111-1111-1111-1111-111111111111", description="Target tenant ID"),
    db: Session = Depends(get_db)
):
    """
    Returns platform-wide monitoring telemetry across all 5 AI engines:
    Sales Forecasting, Customer Segmentation, Product Recommendations,
    Churn Prediction, and Isolation Forest Anomaly Detection.
    """
    try:
        telemetry = get_system_monitoring_status(db=db, tenant_id=tenant_id)
        return telemetry
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch model monitoring telemetry: {str(e)}"
        )
