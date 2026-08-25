"""add product-level sales line items

Revision ID: c46e9af7d812
Revises: b2d3814fa620
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c46e9af7d812"
down_revision: str | None = "b2d3814fa620"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sales_line_items",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("line_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["transaction_id"], ["sales_transactions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "transaction_id", "product_id", name="uq_sales_line_items_transaction_product"
        ),
    )
    op.create_index(op.f("ix_sales_line_items_product_id"), "sales_line_items", ["product_id"])
    op.create_index(
        op.f("ix_sales_line_items_transaction_id"), "sales_line_items", ["transaction_id"]
    )
    op.create_index(op.f("ix_sales_line_items_tenant_id"), "sales_line_items", ["tenant_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_sales_line_items_tenant_id"), table_name="sales_line_items")
    op.drop_index(op.f("ix_sales_line_items_transaction_id"), table_name="sales_line_items")
    op.drop_index(op.f("ix_sales_line_items_product_id"), table_name="sales_line_items")
    op.drop_table("sales_line_items")
