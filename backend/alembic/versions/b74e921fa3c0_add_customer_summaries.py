"""add customer summaries

Revision ID: b74e921fa3c0
Revises: a90f3c21d6b8
Create Date: 2026-07-29 13:00:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b74e921fa3c0"
down_revision: Union[str, None] = "a90f3c21d6b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("assigned_seller_id", sa.Uuid(), nullable=True),
        sa.Column("source_system", sa.String(length=40), nullable=False),
        sa.Column("external_customer_id", sa.String(length=80), nullable=False),
        sa.Column("last_purchase", sa.DateTime(timezone=True), nullable=False),
        sa.Column("order_count", sa.Integer(), nullable=False),
        sa.Column("item_quantity", sa.Integer(), nullable=False),
        sa.Column("total_revenue", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("recency_days", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["assigned_seller_id"],
            ["users.id"],
            name=op.f("fk_customers_assigned_seller_id_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name=op.f("fk_customers_tenant_id_tenants"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_customers")),
        sa.UniqueConstraint(
            "tenant_id",
            "source_system",
            "external_customer_id",
            name="uq_customers_import_key",
        ),
    )
    op.create_index(
        op.f("ix_customers_assigned_seller_id"),
        "customers",
        ["assigned_seller_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_customers_last_purchase"), "customers", ["last_purchase"], unique=False
    )
    op.create_index(
        op.f("ix_customers_source_system"), "customers", ["source_system"], unique=False
    )
    op.create_index(op.f("ix_customers_tenant_id"), "customers", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_customers_tenant_id"), table_name="customers")
    op.drop_index(op.f("ix_customers_source_system"), table_name="customers")
    op.drop_index(op.f("ix_customers_last_purchase"), table_name="customers")
    op.drop_index(op.f("ix_customers_assigned_seller_id"), table_name="customers")
    op.drop_table("customers")
