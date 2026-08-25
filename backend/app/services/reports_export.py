from __future__ import annotations

import csv
import io
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.churn import CustomerChurnRisk
from app.models.customers import Customer
from app.models.forecasting import ForecastModelRun, ForecastPrediction
from app.models.invoices import Invoice
from app.models.sales import SalesTransaction, TransactionStatus
from app.models.segmentation import CustomerSegmentAssignment


def export_sales_csv(db: Session, tenant_id: UUID) -> str:
    """Generates CSV for all sales transactions."""
    transactions = db.scalars(
        select(SalesTransaction)
        .where(SalesTransaction.tenant_id == tenant_id)
        .order_by(SalesTransaction.occurred_at.desc())
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID",
        "Reference",
        "Date",
        "Status",
        "Currency",
        "Total Amount",
        "Items Count",
        "Payment Method",
        "Notes",
    ])

    for tx in transactions:
        writer.writerow([
            str(tx.id),
            tx.external_reference or "",
            tx.occurred_at.strftime("%Y-%m-%d %H:%M:%S"),
            tx.status,
            tx.currency,
            f"{tx.total_amount:.2f}",
            tx.item_count,
            tx.payment_method or "N/A",
            tx.notes or "",
        ])

    return output.getvalue()


def export_churn_csv(db: Session, tenant_id: UUID) -> str:
    """Generates CSV for high-risk customer churn predictions."""
    risks = db.scalars(
        select(CustomerChurnRisk)
        .where(CustomerChurnRisk.tenant_id == tenant_id)
        .order_by(CustomerChurnRisk.churn_probability.desc())
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Customer ID",
        "Risk Level",
        "Churn Probability",
        "Inactivity Days",
        "Order Freq 30d",
        "Total Spend",
        "Risk Factors",
        "Recommended Actions",
    ])

    for r in risks:
        writer.writerow([
            str(r.customer_id),
            r.risk_level.upper(),
            f"{r.churn_probability:.2%}",
            r.inactivity_days,
            f"{r.order_frequency_30d:.2f}",
            f"{r.total_spend:.2f}",
            "; ".join(r.risk_factors),
            "; ".join(r.recommended_actions),
        ])

    return output.getvalue()


def export_invoice_html(db: Session, tenant_id: UUID, invoice_id: UUID) -> str:
    """Generates clean, printable HTML Tax Invoice."""
    invoice = db.scalar(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    items_html = "".join([
        f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{item.sku}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{item.description}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">{item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹{item.unit_price:,.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">{item.tax_rate * 100:.0f}%</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹{item.line_amount:,.2f}</td>
        </tr>
        """
        for item in invoice.items
    ])

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>Tax Invoice {invoice.invoice_number}</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 40px; }}
            .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }}
            .logo {{ font-size: 24px; font-weight: bold; color: #4f46e5; }}
            .meta {{ text-align: right; }}
            .details {{ margin: 30px 0; display: flex; justify-content: space-between; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th {{ background: #f8fafc; padding: 12px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; }}
            .totals {{ margin-top: 30px; margin-left: auto; width: 300px; }}
            .total-row {{ display: flex; justify-content: space-between; padding: 6px 0; }}
            .grand-total {{ border-top: 2px solid #4f46e5; font-weight: bold; font-size: 18px; color: #4f46e5; padding-top: 10px; }}
            .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
            .badge-paid {{ background: #dcfce7; color: #15803d; }}
            .badge-pending {{ background: #fef3c7; color: #b45309; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="logo">MarketMind AI</div>
                <p style="margin: 4px 0; color: #64748b;">Tax Invoice / Bill of Supply</p>
            </div>
            <div class="meta">
                <h2 style="margin: 0; color: #0f172a;">{invoice.invoice_number}</h2>
                <p style="margin: 4px 0; color: #64748b;">Date: {invoice.invoice_date.strftime('%d %b %Y')}</p>
                <p style="margin: 4px 0; color: #64748b;">Due Date: {invoice.due_date.strftime('%d %b %Y')}</p>
                <div style="margin-top: 8px;">
                    <span class="badge {'badge-paid' if invoice.status == 'paid' else 'badge-pending'}">{invoice.status}</span>
                </div>
            </div>
        </div>

        <div class="details">
            <div>
                <strong style="color: #475569;">Billed To:</strong>
                <p style="margin: 4px 0; font-weight: 600;">{invoice.customer.external_customer_id if invoice.customer else 'Direct Retail Customer'}</p>
            </div>
            <div>
                <strong style="color: #475569;">Issued By:</strong>
                <p style="margin: 4px 0; font-weight: 600;">{invoice.seller.full_name if invoice.seller else 'Store Sales Team'}</p>
                <p style="margin: 4px 0; color: #64748b;">Store: {invoice.store.name if invoice.store else 'Main Store'}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Tax Rate</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>₹{invoice.subtotal_amount:,.2f}</span></div>
            <div class="total-row"><span>Discounts:</span><span>- ₹{invoice.discount_amount:,.2f}</span></div>
            <div class="total-row"><span>Taxes (GST):</span><span>+ ₹{invoice.tax_amount:,.2f}</span></div>
            <div class="total-row grand-total"><span>Total Amount:</span><span>₹{invoice.total_amount:,.2f}</span></div>
            <div class="total-row" style="color: #16a34a;"><span>Paid Amount:</span><span>₹{invoice.paid_amount:,.2f}</span></div>
            <div class="total-row" style="font-weight: bold; color: #dc2626;"><span>Balance Due:</span><span>₹{invoice.balance_amount:,.2f}</span></div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            Thank you for your business. Generated by MarketMind AI Enterprise Platform.
        </div>
    </body>
    </html>
    """
    return html

