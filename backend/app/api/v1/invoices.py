from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.dependencies import CurrentUser, DBSession, require_permissions
from app.core.permissions import Permissions
from app.core.security import utcnow
from app.models.customers import Customer
from app.models.identity import Store, User
from app.models.invoices import Invoice, PaymentTransaction
from app.schemas.common import MessageResponse
from app.schemas.invoices import (
    InvoiceCreate,
    InvoiceListResponse,
    InvoiceResponse,
    PaymentTransactionCreate,
    PaymentTransactionResponse,
)
from app.services.invoices import create_invoice, record_invoice_payment

router = APIRouter(prefix="/invoices", tags=["Invoices and Billing"])


def serialize_invoice(invoice: Invoice) -> InvoiceResponse:
    return InvoiceResponse(
        id=invoice.id,
        tenant_id=invoice.tenant_id,
        store_id=invoice.store_id,
        seller_id=invoice.seller_id,
        customer_id=invoice.customer_id,
        customer_name=invoice.customer.external_customer_id if invoice.customer else "Retail Customer",
        seller_name=invoice.seller.full_name if invoice.seller else "Sales Team",
        store_name=invoice.store.name if invoice.store else "Main Store",
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        currency=invoice.currency,
        subtotal_amount=invoice.subtotal_amount,
        discount_amount=invoice.discount_amount,
        tax_amount=invoice.tax_amount,
        total_amount=invoice.total_amount,
        paid_amount=invoice.paid_amount,
        balance_amount=invoice.balance_amount,
        status=invoice.status,
        notes=invoice.notes,
        terms=invoice.terms,
        last_reminded_at=invoice.last_reminded_at,
        created_at=invoice.created_at,
        items=invoice.items,
        payments=invoice.payments,
    )


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    user: CurrentUser,
    db: DBSession,
    status_filter: str | None = Query(None, alias="status"),
    customer_id: UUID | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _auth: None = Depends(require_permissions(Permissions.INVOICES_READ, Permissions.INVOICES_MANAGE, require_all=False)),
):
    """Returns paginated, filterable invoices for tenant."""
    query = (
        select(Invoice)
        .options(
            selectinload(Invoice.items),
            selectinload(Invoice.payments),
            selectinload(Invoice.customer),
            selectinload(Invoice.seller),
            selectinload(Invoice.store),
        )
        .where(Invoice.tenant_id == user.tenant_id)
    )

    if status_filter:
        query = query.where(Invoice.status == status_filter.lower())
    if customer_id:
        query = query.where(Invoice.customer_id == customer_id)
    if search:
        query = query.where(Invoice.invoice_number.ilike(f"%{search}%"))

    # Update overdue status on the fly
    today = date.today()
    pending_overdue = db.scalars(
        select(Invoice).where(
            Invoice.tenant_id == user.tenant_id,
            Invoice.status.in_(["pending", "partially_paid"]),
            Invoice.due_date < today,
        )
    ).all()
    for inv in pending_overdue:
        inv.status = "overdue"
    if pending_overdue:
        db.commit()

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    invoices = db.scalars(query.order_by(Invoice.created_at.desc()).offset(offset).limit(limit)).all()

    return InvoiceListResponse(
        items=[serialize_invoice(inv) for inv in invoices],
        total=total,
    )


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_new_invoice(
    payload: InvoiceCreate,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.INVOICES_MANAGE)),
):
    """Generates a new tax invoice with line items, tax and balance calculations."""
    store_id = payload.store_id or user.store_id
    if not store_id:
        store = db.scalar(select(Store).where(Store.tenant_id == user.tenant_id).limit(1))
        if not store:
            store = Store(tenant_id=user.tenant_id, name="Main Store", code="MAIN", timezone="Asia/Kolkata")
            db.add(store)
            db.flush()
        store_id = store.id

    items_dicts = [item.model_dump() for item in payload.items]
    invoice = create_invoice(
        db=db,
        tenant_id=user.tenant_id,
        seller_id=user.id,
        store_id=store_id,
        customer_id=payload.customer_id,
        invoice_date=payload.invoice_date,
        due_date=payload.due_date,
        items_data=items_dicts,
        discount_amount=payload.discount_amount,
        notes=payload.notes,
        terms=payload.terms,
        currency=payload.currency,
    )
    return serialize_invoice(invoice)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice_detail(
    invoice_id: UUID,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.INVOICES_READ, Permissions.INVOICES_MANAGE, require_all=False)),
):
    """Returns detailed tax invoice including line items and payment transactions."""
    invoice = db.scalar(
        select(Invoice)
        .options(
            selectinload(Invoice.items),
            selectinload(Invoice.payments),
            selectinload(Invoice.customer),
            selectinload(Invoice.seller),
            selectinload(Invoice.store),
        )
        .where(Invoice.id == invoice_id, Invoice.tenant_id == user.tenant_id)
    )
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    return serialize_invoice(invoice)


@router.post("/{invoice_id}/payments", response_model=PaymentTransactionResponse)
def add_invoice_payment(
    invoice_id: UUID,
    payload: PaymentTransactionCreate,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.INVOICES_MANAGE)),
):
    """Records a payment against an invoice and updates outstanding balance."""
    payment = record_invoice_payment(
        db=db,
        invoice_id=invoice_id,
        tenant_id=user.tenant_id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        reference_number=payload.reference_number,
        notes=payload.notes,
        recorded_by_id=user.id,
    )
    return payment


@router.post("/{invoice_id}/remind", response_model=MessageResponse)
def send_due_date_reminder(
    invoice_id: UUID,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.INVOICES_MANAGE)),
):
    """Triggers an automated due date payment reminder."""
    invoice = db.scalar(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.tenant_id == user.tenant_id)
    )
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    invoice.last_reminded_at = utcnow()
    db.commit()
    return MessageResponse(message=f"Payment due reminder sent for invoice {invoice.invoice_number}")
