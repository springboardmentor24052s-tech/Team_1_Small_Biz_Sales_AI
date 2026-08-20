"""add onboarding import jobs

Revision ID: b2d3814fa620
Revises: a19d62c417f0
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b2d3814fa620"
down_revision: str | None = "a19d62c417f0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "onboarding_import_jobs",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=False),
        sa.Column("store_id", sa.Uuid(), nullable=True),
        sa.Column("seller_id", sa.Uuid(), nullable=True),
        sa.Column("kind", sa.String(length=30), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("total_rows", sa.Integer(), nullable=False),
        sa.Column("valid_rows", sa.Integer(), nullable=False),
        sa.Column("invalid_rows", sa.Integer(), nullable=False),
        sa.Column("preview", sa.JSON(), nullable=False),
        sa.Column("errors", sa.JSON(), nullable=False),
        sa.Column("report", sa.JSON(), nullable=False),
        sa.Column("raw_csv", sa.Text(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_onboarding_import_jobs_kind"), "onboarding_import_jobs", ["kind"])
    op.create_index(op.f("ix_onboarding_import_jobs_seller_id"), "onboarding_import_jobs", ["seller_id"])
    op.create_index(op.f("ix_onboarding_import_jobs_status"), "onboarding_import_jobs", ["status"])
    op.create_index(op.f("ix_onboarding_import_jobs_store_id"), "onboarding_import_jobs", ["store_id"])
    op.create_index(op.f("ix_onboarding_import_jobs_tenant_id"), "onboarding_import_jobs", ["tenant_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_onboarding_import_jobs_tenant_id"), table_name="onboarding_import_jobs")
    op.drop_index(op.f("ix_onboarding_import_jobs_store_id"), table_name="onboarding_import_jobs")
    op.drop_index(op.f("ix_onboarding_import_jobs_status"), table_name="onboarding_import_jobs")
    op.drop_index(op.f("ix_onboarding_import_jobs_seller_id"), table_name="onboarding_import_jobs")
    op.drop_index(op.f("ix_onboarding_import_jobs_kind"), table_name="onboarding_import_jobs")
    op.drop_table("onboarding_import_jobs")
