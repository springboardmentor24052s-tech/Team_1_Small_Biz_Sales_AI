"""add reversible customer snapshot to daily sales

Revision ID: f07c1a928de4
Revises: e95a6d04f173
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f07c1a928de4"
down_revision: str | None = "e95a6d04f173"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("sales_transactions") as batch_op:
        batch_op.add_column(sa.Column("customer_snapshot", sa.JSON()))


def downgrade() -> None:
    with op.batch_alter_table("sales_transactions") as batch_op:
        batch_op.drop_column("customer_snapshot")
