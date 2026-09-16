"""Move employee account management from Administrator to Business Owner.

Revision ID: c31d8a74e902
Revises: f18b6032ad75
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import text

revision: str = "c31d8a74e902"
down_revision: str | None = "f18b6032ad75"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

EMPLOYEE_PERMISSIONS = ("users.read", "users.manage")


def assign_permissions(role_code: str) -> None:
    connection = op.get_bind()
    for permission_code in EMPLOYEE_PERMISSIONS:
        connection.execute(
            text(
                """
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT roles.id, permissions.id
                FROM roles, permissions
                WHERE roles.code = :role_code
                  AND permissions.code = :permission_code
                  AND NOT EXISTS (
                    SELECT 1 FROM role_permissions
                    WHERE role_permissions.role_id = roles.id
                      AND role_permissions.permission_id = permissions.id
                  )
                """
            ),
            {"role_code": role_code, "permission_code": permission_code},
        )


def remove_permissions(role_code: str) -> None:
    connection = op.get_bind()
    for permission_code in EMPLOYEE_PERMISSIONS:
        connection.execute(
            text(
                """
                DELETE FROM role_permissions
                WHERE role_id = (SELECT id FROM roles WHERE code = :role_code)
                  AND permission_id = (
                    SELECT id FROM permissions WHERE code = :permission_code
                  )
                """
            ),
            {"role_code": role_code, "permission_code": permission_code},
        )


def upgrade() -> None:
    assign_permissions("business_owner")
    remove_permissions("administrator")


def downgrade() -> None:
    remove_permissions("business_owner")
    assign_permissions("administrator")
