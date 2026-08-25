"""add daily sale detail fields

Revision ID: e95a6d04f173
Revises: d84f2cb901ae
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e95a6d04f173"
down_revision: str | None = "d84f2cb901ae"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("sales_transactions") as batch_op:
        batch_op.add_column(sa.Column("subtotal_amount", sa.Numeric(14, 2)))
        batch_op.add_column(sa.Column("discount_amount", sa.Numeric(14, 2)))
        batch_op.add_column(sa.Column("tax_amount", sa.Numeric(14, 2)))
        batch_op.add_column(sa.Column("payment_method", sa.String(30)))
        batch_op.add_column(sa.Column("customer_id", sa.Uuid()))
        batch_op.create_foreign_key(
            "fk_sales_transactions_customer_id_customers",
            "customers",
            ["customer_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index("ix_sales_transactions_customer_id", ["customer_id"])
        batch_op.create_index("ix_sales_transactions_payment_method", ["payment_method"])
    with op.batch_alter_table("sales_line_items") as batch_op:
        batch_op.add_column(sa.Column("unit_price", sa.Numeric(14, 2)))
        batch_op.add_column(sa.Column("discount_amount", sa.Numeric(14, 2)))


def downgrade() -> None:
    with op.batch_alter_table("sales_line_items") as batch_op:
        batch_op.drop_column("discount_amount")
        batch_op.drop_column("unit_price")
    with op.batch_alter_table("sales_transactions") as batch_op:
        batch_op.drop_index("ix_sales_transactions_payment_method")
        batch_op.drop_index("ix_sales_transactions_customer_id")
        batch_op.drop_constraint(
            "fk_sales_transactions_customer_id_customers", type_="foreignkey"
        )
        batch_op.drop_column("customer_id")
        batch_op.drop_column("payment_method")
        batch_op.drop_column("tax_amount")
        batch_op.drop_column("discount_amount")
        batch_op.drop_column("subtotal_amount")
