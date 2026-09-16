"""add forecasting model runs, predictions and jobs

Revision ID: e42a71c09f34
Revises: d91f4b8e72a1
Create Date: 2026-08-09 22:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e42a71c09f34"
down_revision: Union[str, None] = "d91f4b8e72a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "forecast_model_runs",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("store_id", sa.Uuid(), nullable=True),
        sa.Column("seller_id", sa.Uuid(), nullable=True),
        sa.Column("model_version", sa.String(length=80), nullable=False),
        sa.Column("forecast_type", sa.String(length=30), nullable=False),
        sa.Column("scope_type", sa.String(length=20), nullable=False),
        sa.Column("scope_key", sa.String(length=100), nullable=False),
        sa.Column("target", sa.String(length=80), nullable=False),
        sa.Column("unit", sa.String(length=30), nullable=False),
        sa.Column("granularity", sa.String(length=20), nullable=False),
        sa.Column("source_system", sa.String(length=50), nullable=False),
        sa.Column("algorithm", sa.String(length=40), nullable=False),
        sa.Column("baseline_algorithm", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("horizons", sa.JSON(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("candidate_metrics", sa.JSON(), nullable=False),
        sa.Column("training_start", sa.Date(), nullable=False),
        sa.Column("training_end", sa.Date(), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id", "model_version", "forecast_type", "scope_key",
            name="uq_forecast_model_run_scope",
        ),
    )
    for column in ("forecast_type", "seller_id", "status", "store_id", "tenant_id", "trained_at"):
        op.create_index(op.f(f"ix_forecast_model_runs_{column}"), "forecast_model_runs", [column])

    op.create_table(
        "forecast_predictions",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("model_run_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=True),
        sa.Column("source_store_id", sa.String(length=80), nullable=False),
        sa.Column("source_product_id", sa.String(length=80), nullable=False),
        sa.Column("source_category_id", sa.String(length=80), nullable=False),
        sa.Column("forecast_date", sa.Date(), nullable=False),
        sa.Column("horizon_day", sa.Integer(), nullable=False),
        sa.Column("actual", sa.Numeric(precision=16, scale=4), nullable=True),
        sa.Column("predicted", sa.Numeric(precision=16, scale=4), nullable=False),
        sa.Column("lower_bound", sa.Numeric(precision=16, scale=4), nullable=False),
        sa.Column("upper_bound", sa.Numeric(precision=16, scale=4), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["model_run_id"], ["forecast_model_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "model_run_id", "source_store_id", "source_product_id", "source_category_id",
            "forecast_date", name="uq_forecast_prediction_series_date",
        ),
    )
    for column in ("forecast_date", "model_run_id", "product_id", "tenant_id"):
        op.create_index(op.f(f"ix_forecast_predictions_{column}"), "forecast_predictions", [column])

    op.create_table(
        "forecast_jobs",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("external_reference", sa.String(length=120), nullable=False),
        sa.Column("job_type", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("record_count", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "external_reference", name="uq_forecast_job_reference"),
    )
    for column in ("status", "tenant_id"):
        op.create_index(op.f(f"ix_forecast_jobs_{column}"), "forecast_jobs", [column])


def downgrade() -> None:
    for column in ("tenant_id", "status"):
        op.drop_index(op.f(f"ix_forecast_jobs_{column}"), table_name="forecast_jobs")
    op.drop_table("forecast_jobs")
    for column in ("tenant_id", "product_id", "model_run_id", "forecast_date"):
        op.drop_index(op.f(f"ix_forecast_predictions_{column}"), table_name="forecast_predictions")
    op.drop_table("forecast_predictions")
    for column in ("trained_at", "tenant_id", "store_id", "status", "seller_id", "forecast_type"):
        op.drop_index(op.f(f"ix_forecast_model_runs_{column}"), table_name="forecast_model_runs")
    op.drop_table("forecast_model_runs")
