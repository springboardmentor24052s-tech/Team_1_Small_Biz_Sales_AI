import re
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import PERMISSION_DEFINITIONS, ROLE_DEFINITIONS
from app.models.identity import Permission, Role


def normalize_email(email: str) -> str:
    return email.strip().casefold()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")
    return slug[:70] or "business"


def seed_authorization(db: Session) -> None:
    permissions = {item.code: item for item in db.scalars(select(Permission)).all()}
    for definition in PERMISSION_DEFINITIONS:
        if definition.code not in permissions:
            permission = Permission(code=definition.code, description=definition.description)
            db.add(permission)
            permissions[definition.code] = permission

    roles = {item.code: item for item in db.scalars(select(Role)).all()}
    for role_code, definition in ROLE_DEFINITIONS.items():
        role = roles.get(role_code.value)
        if not role:
            role = Role(
                code=role_code.value,
                name=str(definition["name"]),
                description=str(definition["description"]),
                is_system=True,
            )
            db.add(role)
            roles[role_code.value] = role
        role.name = str(definition["name"])
        role.description = str(definition["description"])
        role.permissions = [permissions[code] for code in sorted(definition["permissions"])]
    db.commit()


def get_role(db: Session, role_code: str) -> Role | None:
    return db.scalar(select(Role).where(Role.code == role_code))


def validate_store_scope(db: Session, tenant_id: UUID, store_id: UUID | None) -> bool:
    if store_id is None:
        return True
    from app.models.identity import Store

    return (
        db.scalar(select(Store.id).where(Store.id == store_id, Store.tenant_id == tenant_id))
        is not None
    )
