"""Add date, default avatar, and role-specific preferences.

Revision ID: e83c4b71a205
Revises: d7f49a12bc30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e83c4b71a205"
down_revision: str | None = "d7f49a12bc30"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("avatar_emoji", sa.String(length=16), server_default="🙂", nullable=False),
    )
    op.add_column("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column(
        "users",
        sa.Column("role_preferences", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "role_preferences")
    op.drop_column("users", "date_of_birth")
    op.drop_column("users", "avatar_emoji")
