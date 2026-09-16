"""allow unavailable customer segment features

Revision ID: d84f2cb901ae
Revises: c46e9af7d812
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d84f2cb901ae"
down_revision: str | None = "c46e9af7d812"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

OPTIONAL_COLUMNS = {
    "first_purchase": sa.DateTime(timezone=True),
    "active_days": sa.Integer(),
    "active_months": sa.Integer(),
    "product_variety": sa.Integer(),
    "tenure_days": sa.Integer(),
    "average_days_between_orders": sa.Numeric(12, 4),
    "return_order_count": sa.Integer(),
    "returned_value": sa.Numeric(14, 2),
    "return_rate": sa.Numeric(8, 6),
}


def upgrade() -> None:
    with op.batch_alter_table("customer_segment_assignments") as batch_op:
        for name, column_type in OPTIONAL_COLUMNS.items():
            batch_op.alter_column(name, existing_type=column_type, nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("customer_segment_assignments") as batch_op:
        for name, column_type in OPTIONAL_COLUMNS.items():
            batch_op.alter_column(name, existing_type=column_type, nullable=False)
