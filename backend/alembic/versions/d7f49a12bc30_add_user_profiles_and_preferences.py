"""Add user profile and preference fields.

Revision ID: d7f49a12bc30
Revises: c31d8a74e902
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d7f49a12bc30"
down_revision: str | None = "c31d8a74e902"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone_number", sa.String(length=24), nullable=True))
    op.add_column("users", sa.Column("job_title", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("location", sa.String(length=160), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(length=255), nullable=True))
    op.add_column(
        "users",
        sa.Column("theme_preference", sa.String(length=16), server_default="system", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("date_format", sa.String(length=16), server_default="DD/MM/YYYY", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column(
            "dashboard_density", sa.String(length=16), server_default="comfortable", nullable=False
        ),
    )
    op.add_column(
        "users",
        sa.Column("email_notifications", sa.Boolean(), server_default=sa.true(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "email_notifications")
    op.drop_column("users", "dashboard_density")
    op.drop_column("users", "date_format")
    op.drop_column("users", "theme_preference")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "bio")
    op.drop_column("users", "location")
    op.drop_column("users", "job_title")
    op.drop_column("users", "phone_number")
