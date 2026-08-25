"""add milestone 3 and 4 schema: churn, recommendations, anomalies, invoices

Revision ID: g29c7142be81
Revises: f07c1a928de4
Create Date: 2026-08-23 22:25:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "g29c7142be81"
down_revision: str | None = "f07c1a928de4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Churn Model Runs & Predictions
    op.create_table(
        "churn_model_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("model_version", sa.String(length=80), nullable=False),
        sa.Column("algorithm", sa.String(length=40), nullable=False),
        sa.Column("baseline_algorithm", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("accuracy", sa.Float(), nullable=False),
        sa.Column("precision_score", sa.Float(), nullable=False),
        sa.Column("recall_score", sa.Float(), nullable=False),
        sa.Column("f1_score", sa.Float(), nullable=False),
        sa.Column("roc_auc", sa.Float(), nullable=True),
        sa.Column("feature_names", sa.JSON(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "model_version", name="uq_churn_model_run_version"),
    )
    op.create_index(op.f("ix_churn_model_runs_tenant_id"), "churn_model_runs", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_churn_model_runs_status"), "churn_model_runs", ["status"], unique=False)
    op.create_index(op.f("ix_churn_model_runs_trained_at"), "churn_model_runs", ["trained_at"], unique=False)

    op.create_table(
        "customer_churn_risks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("model_run_id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("churn_probability", sa.Float(), nullable=False),
        sa.Column("risk_level", sa.String(length=20), nullable=False),
        sa.Column("inactivity_days", sa.Integer(), nullable=False),
        sa.Column("order_frequency_30d", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("total_spend", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("risk_factors", sa.JSON(), nullable=False),
        sa.Column("recommended_actions", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["model_run_id"], ["churn_model_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("model_run_id", "customer_id", name="uq_customer_churn_risk_run_customer"),
    )
    op.create_index(op.f("ix_customer_churn_risks_tenant_id"), "customer_churn_risks", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_customer_churn_risks_model_run_id"), "customer_churn_risks", ["model_run_id"], unique=False)
    op.create_index(op.f("ix_customer_churn_risks_customer_id"), "customer_churn_risks", ["customer_id"], unique=False)
    op.create_index(op.f("ix_customer_churn_risks_risk_level"), "customer_churn_risks", ["risk_level"], unique=False)

    # 2. Recommendation Model Runs & Feedback
    op.create_table(
        "recommendation_model_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("model_version", sa.String(length=80), nullable=False),
        sa.Column("algorithm", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("precision_at_k", sa.Float(), nullable=False),
        sa.Column("recall_at_k", sa.Float(), nullable=False),
        sa.Column("coverage_rate", sa.Float(), nullable=False),
        sa.Column("rule_count", sa.Integer(), nullable=False),
        sa.Column("rules", sa.JSON(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "model_version", name="uq_recommendation_model_run_version"),
    )
    op.create_index(op.f("ix_recommendation_model_runs_tenant_id"), "recommendation_model_runs", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_recommendation_model_runs_status"), "recommendation_model_runs", ["status"], unique=False)
    op.create_index(op.f("ix_recommendation_model_runs_trained_at"), "recommendation_model_runs", ["trained_at"], unique=False)

    op.create_table(
        "recommendation_feedbacks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("customer_id", sa.Uuid(), nullable=True),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("recommendation_type", sa.String(length=30), nullable=False),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recommendation_feedbacks_tenant_id"), "recommendation_feedbacks", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_recommendation_feedbacks_user_id"), "recommendation_feedbacks", ["user_id"], unique=False)
    op.create_index(op.f("ix_recommendation_feedbacks_customer_id"), "recommendation_feedbacks", ["customer_id"], unique=False)
    op.create_index(op.f("ix_recommendation_feedbacks_product_id"), "recommendation_feedbacks", ["product_id"], unique=False)

    # 3. Anomaly Model Runs & Events
    op.create_table(
        "anomaly_model_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("model_version", sa.String(length=80), nullable=False),
        sa.Column("algorithm", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("detection_rate", sa.Float(), nullable=False),
        sa.Column("false_positive_rate", sa.Float(), nullable=False),
        sa.Column("contamination", sa.Float(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "model_version", name="uq_anomaly_model_run_version"),
    )
    op.create_index(op.f("ix_anomaly_model_runs_tenant_id"), "anomaly_model_runs", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_anomaly_model_runs_status"), "anomaly_model_runs", ["status"], unique=False)
    op.create_index(op.f("ix_anomaly_model_runs_trained_at"), "anomaly_model_runs", ["trained_at"], unique=False)

    op.create_table(
        "anomaly_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("model_run_id", sa.Uuid(), nullable=True),
        sa.Column("store_id", sa.Uuid(), nullable=True),
        sa.Column("anomaly_type", sa.String(length=40), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("entity_type", sa.String(length=40), nullable=True),
        sa.Column("entity_id", sa.String(length=80), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by_id", sa.Uuid(), nullable=True),
        sa.Column("resolution_notes", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["model_run_id"], ["anomaly_model_runs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["resolved_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_anomaly_events_tenant_id"), "anomaly_events", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_anomaly_events_model_run_id"), "anomaly_events", ["model_run_id"], unique=False)
    op.create_index(op.f("ix_anomaly_events_store_id"), "anomaly_events", ["store_id"], unique=False)
    op.create_index(op.f("ix_anomaly_events_anomaly_type"), "anomaly_events", ["anomaly_type"], unique=False)
    op.create_index(op.f("ix_anomaly_events_severity"), "anomaly_events", ["severity"], unique=False)
    op.create_index(op.f("ix_anomaly_events_status"), "anomaly_events", ["status"], unique=False)
    op.create_index(op.f("ix_anomaly_events_entity_type"), "anomaly_events", ["entity_type"], unique=False)
    op.create_index(op.f("ix_anomaly_events_entity_id"), "anomaly_events", ["entity_id"], unique=False)

    # 4. Invoices, InvoiceItems, PaymentTransactions
    op.create_table(
        "invoices",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("store_id", sa.Uuid(), nullable=False),
        sa.Column("seller_id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=True),
        sa.Column("invoice_number", sa.String(length=50), nullable=False),
        sa.Column("invoice_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("subtotal_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("paid_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("balance_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("terms", sa.String(length=500), nullable=True),
        sa.Column("last_reminded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "invoice_number", name="uq_invoices_tenant_number"),
    )
    op.create_index(op.f("ix_invoices_tenant_id"), "invoices", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_invoices_store_id"), "invoices", ["store_id"], unique=False)
    op.create_index(op.f("ix_invoices_seller_id"), "invoices", ["seller_id"], unique=False)
    op.create_index(op.f("ix_invoices_customer_id"), "invoices", ["customer_id"], unique=False)
    op.create_index(op.f("ix_invoices_invoice_number"), "invoices", ["invoice_number"], unique=False)
    op.create_index(op.f("ix_invoices_status"), "invoices", ["status"], unique=False)

    op.create_table(
        "invoice_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("invoice_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=True),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=250), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("tax_rate", sa.Numeric(precision=6, scale=4), nullable=False),
        sa.Column("line_amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_invoice_items_tenant_id"), "invoice_items", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_invoice_items_invoice_id"), "invoice_items", ["invoice_id"], unique=False)
    op.create_index(op.f("ix_invoice_items_product_id"), "invoice_items", ["product_id"], unique=False)

    op.create_table(
        "payment_transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("invoice_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("payment_method", sa.String(length=30), nullable=False),
        sa.Column("reference_number", sa.String(length=80), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.String(length=300), nullable=True),
        sa.Column("recorded_by_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recorded_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payment_transactions_tenant_id"), "payment_transactions", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_payment_transactions_invoice_id"), "payment_transactions", ["invoice_id"], unique=False)


def downgrade() -> None:
    op.drop_table("payment_transactions")
    op.drop_table("invoice_items")
    op.drop_table("invoices")
    op.drop_table("anomaly_events")
    op.drop_table("anomaly_model_runs")
    op.drop_table("recommendation_feedbacks")
    op.drop_table("recommendation_model_runs")
    op.drop_table("customer_churn_risks")
    op.drop_table("churn_model_runs")

