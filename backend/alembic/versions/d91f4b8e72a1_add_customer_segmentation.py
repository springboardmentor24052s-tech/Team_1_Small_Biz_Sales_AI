"""add customer segmentation model runs and assignments

Revision ID: d91f4b8e72a1
Revises: b74e921fa3c0
Create Date: 2026-08-06 12:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d91f4b8e72a1"
down_revision: Union[str, None] = "b74e921fa3c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "segmentation_model_runs",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("source_system", sa.String(length=40), nullable=False),
        sa.Column("model_version", sa.String(length=80), nullable=False),
        sa.Column("algorithm", sa.String(length=40), nullable=False),
        sa.Column("cluster_count", sa.Integer(), nullable=False),
        sa.Column("silhouette_score", sa.Float(), nullable=False),
        sa.Column("davies_bouldin_score", sa.Float(), nullable=False),
        sa.Column("calinski_harabasz_score", sa.Float(), nullable=False),
        sa.Column("feature_names", sa.JSON(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("trained_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_segmentation_model_runs_tenant_id_tenants"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_segmentation_model_runs")),
        sa.UniqueConstraint(
            "tenant_id",
            "source_system",
            "model_version",
            name="uq_segmentation_model_run_version",
        ),
    )
    op.create_index(
        op.f("ix_segmentation_model_runs_source_system"),
        "segmentation_model_runs",
        ["source_system"],
        unique=False,
    )
    op.create_index(
        op.f("ix_segmentation_model_runs_tenant_id"),
        "segmentation_model_runs",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_segmentation_model_runs_trained_at"),
        "segmentation_model_runs",
        ["trained_at"],
        unique=False,
    )

    op.create_table(
        "customer_segment_assignments",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("model_run_id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("cluster_id", sa.Integer(), nullable=False),
        sa.Column("segment_code", sa.String(length=20), nullable=False),
        sa.Column("segment_name", sa.String(length=80), nullable=False),
        sa.Column("first_purchase", sa.DateTime(timezone=True), nullable=False),
        sa.Column("average_order_value", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("average_basket_size", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("active_days", sa.Integer(), nullable=False),
        sa.Column("active_months", sa.Integer(), nullable=False),
        sa.Column("product_variety", sa.Integer(), nullable=False),
        sa.Column("tenure_days", sa.Integer(), nullable=False),
        sa.Column(
            "average_days_between_orders", sa.Numeric(precision=12, scale=4), nullable=False
        ),
        sa.Column("return_order_count", sa.Integer(), nullable=False),
        sa.Column("returned_value", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("return_rate", sa.Numeric(precision=8, scale=6), nullable=False),
        sa.Column("purchase_frequency_30d", sa.Numeric(precision=12, scale=4), nullable=False),
        sa.Column("engagement_score", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.id"],
            name=op.f("fk_customer_segment_assignments_customer_id_customers"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["model_run_id"],
            ["segmentation_model_runs.id"],
            name=op.f(
                "fk_customer_segment_assignments_model_run_id_segmentation_model_runs"
            ),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_customer_segment_assignments_tenant_id_tenants"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_customer_segment_assignments")),
        sa.UniqueConstraint(
            "model_run_id",
            "customer_id",
            name="uq_customer_segment_assignment_run_customer",
        ),
    )
    for column in (
        "customer_id",
        "model_run_id",
        "segment_code",
        "segment_name",
        "tenant_id",
    ):
        op.create_index(
            op.f(f"ix_customer_segment_assignments_{column}"),
            "customer_segment_assignments",
            [column],
            unique=False,
        )


def downgrade() -> None:
    for column in (
        "tenant_id",
        "segment_name",
        "segment_code",
        "model_run_id",
        "customer_id",
    ):
        op.drop_index(
            op.f(f"ix_customer_segment_assignments_{column}"),
            table_name="customer_segment_assignments",
        )
    op.drop_table("customer_segment_assignments")
    op.drop_index(
        op.f("ix_segmentation_model_runs_trained_at"),
        table_name="segmentation_model_runs",
    )
    op.drop_index(
        op.f("ix_segmentation_model_runs_tenant_id"),
        table_name="segmentation_model_runs",
    )
    op.drop_index(
        op.f("ix_segmentation_model_runs_source_system"),
        table_name="segmentation_model_runs",
    )
    op.drop_table("segmentation_model_runs")
