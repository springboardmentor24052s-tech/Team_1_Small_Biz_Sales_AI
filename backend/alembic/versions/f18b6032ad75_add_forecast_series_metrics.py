"""add per-series forecast model metrics

Revision ID: f18b6032ad75
Revises: e42a71c09f34
Create Date: 2026-08-09 22:20:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f18b6032ad75"
down_revision: Union[str, None] = "e42a71c09f34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("forecast_predictions") as batch_op:
        batch_op.add_column(sa.Column("algorithm", sa.String(length=40), nullable=True))
        batch_op.add_column(sa.Column("metrics", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("candidate_metrics", sa.JSON(), nullable=True))
    op.execute(
        "UPDATE forecast_predictions SET algorithm = 'unknown', metrics = '{}', "
        "candidate_metrics = '[]'"
    )
    with op.batch_alter_table("forecast_predictions") as batch_op:
        batch_op.alter_column("algorithm", nullable=False)
        batch_op.alter_column("metrics", nullable=False)
        batch_op.alter_column("candidate_metrics", nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("forecast_predictions") as batch_op:
        batch_op.drop_column("candidate_metrics")
        batch_op.drop_column("metrics")
        batch_op.drop_column("algorithm")
