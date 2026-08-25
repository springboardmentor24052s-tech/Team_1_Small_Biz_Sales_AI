from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import HTMLResponse

from app.api.dependencies import CurrentUser, DBSession, require_permissions
from app.core.permissions import Permissions
from app.services.reports_export import (
    export_churn_csv,
    export_invoice_html,
    export_sales_csv,
)

router = APIRouter(prefix="/reports", tags=["Business Reports & Exports"])


@router.get("/export/sales")
def export_sales(
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.REPORTS_EXPORT_BUSINESS, Permissions.REPORTS_EXPORT_OPERATIONAL, require_all=False)),
):
    """Exports sales transactions in CSV format."""
    csv_data = export_sales_csv(db, user.tenant_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="sales_export.csv"'},
    )


@router.get("/export/churn")
def export_churn(
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.REPORTS_EXPORT_BUSINESS, Permissions.DASHBOARD_CHURN_VIEW, require_all=False)),
):
    """Exports customer churn risk analysis in CSV format."""
    csv_data = export_churn_csv(db, user.tenant_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="churn_risk_export.csv"'},
    )


@router.get("/export/invoices/{invoice_id}")
def export_invoice_printable(
    invoice_id: UUID,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.INVOICES_READ, Permissions.INVOICES_MANAGE, require_all=False)),
):
    """Exports a printable Tax Invoice / Bill of Supply in HTML/Print format."""
    html_content = export_invoice_html(db, user.tenant_id, invoice_id)
    return HTMLResponse(content=html_content)

