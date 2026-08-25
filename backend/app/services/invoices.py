from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import utcnow
from app.models.customers import Customer
from app.models.identity import Store, User
from app.models.inventory import Inventory, Product
from app.models.invoices import Invoice, InvoiceItem, PaymentTransaction


def generate_invoice_number(db: Session, tenant_id: UUID) -> str:
    """Generates the next sequential invoice number for the tenant."""
    current_year = datetime.now().year
    prefix = f"INV-{current_year}-"
    
    count = db.scalar(
        select(func.count(Invoice.id)).where(
            Invoice.tenant_id == tenant_id,
            Invoice.invoice_number.like(f"{prefix}%"),
        )
    ) or 0
    return f"{prefix}{count + 1:04d}"


def create_invoice(
    db: Session,
    tenant_id: UUID,
    seller_id: UUID,
    store_id: UUID,
    customer_id: UUID | None,
    invoice_date: date,
    due_date: date,
    items_data: list[dict[str, Any]],
    discount_amount: Decimal = Decimal("0"),
    notes: str | None = None,
    terms: str | None = None,
    currency: str = "INR",
) -> Invoice:
    """Creates a new tax invoice with calculated line totals, taxes, and balance."""
    if not items_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invoice must contain at least one line item",
        )

    inv_num = generate_invoice_number(db, tenant_id)

    subtotal = Decimal("0")
    total_tax = Decimal("0")
    total_discount = discount_amount

    if not store_id:
        store = db.scalar(select(Store).where(Store.tenant_id == tenant_id).limit(1))
        if not store:
            store = Store(tenant_id=tenant_id, name="Main Store", code="MAIN", timezone="Asia/Kolkata")
            db.add(store)
            db.flush()
        store_id = store.id

    if not seller_id:
        seller = db.scalar(select(User).where(User.tenant_id == tenant_id).limit(1))
        seller_id = seller.id if seller else None

    invoice = Invoice(
        tenant_id=tenant_id,
        store_id=store_id,
        seller_id=seller_id,
        customer_id=customer_id,
        invoice_number=inv_num,
        invoice_date=invoice_date,
        due_date=due_date,
        currency=currency.upper(),
        subtotal_amount=Decimal("0"),
        discount_amount=total_discount,
        tax_amount=Decimal("0"),
        total_amount=Decimal("0"),
        paid_amount=Decimal("0"),
        balance_amount=Decimal("0"),
        status="pending",
        notes=notes,
        terms=terms,
    )
    db.add(invoice)
    db.flush()

    for item in items_data:
        qty = int(item.get("quantity", 1))
        unit_price = Decimal(str(item.get("unit_price", 0)))
        item_disc = Decimal(str(item.get("discount_amount", 0)))
        tax_rate = Decimal(str(item.get("tax_rate", "0.18")))  # Default 18% GST

        line_net = max(Decimal("0"), (unit_price * qty) - item_disc)
        line_tax = line_net * tax_rate
        line_total = line_net + line_tax

        subtotal += (unit_price * qty)
        total_tax += line_tax
        total_discount += item_disc

        raw_pid = item.get("product_id")
        product_id = UUID(str(raw_pid)) if raw_pid else None
        sku = item.get("sku", "CUSTOM-ITEM")
        description = item.get("description", "Custom Service / Item")

        if product_id:
            prod = db.scalar(select(Product).where(Product.id == product_id, Product.tenant_id == tenant_id))
            if prod:
                sku = prod.sku
                description = prod.name

        inv_item = InvoiceItem(
            tenant_id=tenant_id,
            invoice_id=invoice.id,
            product_id=product_id,
            sku=sku,
            description=description,
            quantity=qty,
            unit_price=unit_price,
            discount_amount=item_disc,
            tax_rate=tax_rate,
            line_amount=line_total,
        )
        db.add(inv_item)

    final_total = max(Decimal("0"), subtotal - total_discount + total_tax)
    invoice.subtotal_amount = subtotal
    invoice.discount_amount = total_discount
    invoice.tax_amount = total_tax
    invoice.total_amount = final_total
    invoice.balance_amount = final_total

    db.commit()
    db.refresh(invoice)
    return invoice


def record_invoice_payment(
    db: Session,
    invoice_id: UUID,
    tenant_id: UUID,
    amount: Decimal,
    payment_method: str,
    reference_number: str | None = None,
    notes: str | None = None,
    recorded_by_id: UUID | None = None,
) -> PaymentTransaction:
    """Records a payment against an invoice and updates balance and status."""
    invoice = db.scalar(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
    )
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Payment amount must be greater than zero",
        )

    if amount > invoice.balance_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Payment amount (₹{amount}) exceeds outstanding balance (₹{invoice.balance_amount})",
        )

    payment = PaymentTransaction(
        tenant_id=tenant_id,
        invoice_id=invoice.id,
        amount=amount,
        payment_method=payment_method,
        reference_number=reference_number,
        recorded_at=utcnow(),
        notes=notes,
        recorded_by_id=recorded_by_id,
    )
    db.add(payment)

    invoice.paid_amount += amount
    invoice.balance_amount -= amount

    if invoice.balance_amount == 0:
        invoice.status = "paid"
    else:
        invoice.status = "partially_paid"

    db.commit()
    db.refresh(payment)
    return payment
