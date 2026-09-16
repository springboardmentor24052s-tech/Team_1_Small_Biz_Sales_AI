"""add employee performance targets

Revision ID: a19d62c417f0
Revises: e83c4b71a205
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a19d62c417f0"
down_revision: str | None = "e83c4b71a205"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "employee_targets",
        sa.Column("tenant_id", sa.Uuid(), nullable=False),
        sa.Column("employee_id", sa.Uuid(), nullable=False),
        sa.Column("assigned_by_id", sa.Uuid(), nullable=False),
        sa.Column("metric", sa.String(length=40), nullable=False),
        sa.Column("target_value", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["employee_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "employee_id", "period_start", "period_end", "metric",
            name="uq_employee_target_period_metric",
        ),
    )
    op.create_index(op.f("ix_employee_targets_employee_id"), "employee_targets", ["employee_id"])
    op.create_index(op.f("ix_employee_targets_tenant_id"), "employee_targets", ["tenant_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_employee_targets_tenant_id"), table_name="employee_targets")
    op.drop_index(op.f("ix_employee_targets_employee_id"), table_name="employee_targets")
    op.drop_table("employee_targets")
