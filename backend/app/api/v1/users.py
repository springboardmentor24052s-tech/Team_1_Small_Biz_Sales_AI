from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.dependencies import (
    CurrentUser,
    DBSession,
    require_permissions,
    require_reauthentication,
)
from app.core.config import settings
from app.core.permissions import Permissions
from app.core.security import hash_password, random_token, utcnow
from app.models.auth import SecurityTokenPurpose
from app.models.identity import Role, Store, User, UserStatus
from app.schemas.auth import DevelopmentTokenResponse
from app.schemas.common import MessageResponse
from app.schemas.users import (
    AccountStateRequest,
    InvitationAcceptRequest,
    ProfileUpdate,
    RoleChangeRequest,
    RoleResponse,
    StoreResponse,
    UserInvitationRequest,
    UserResponse,
)
from app.services.audit import record_audit
from app.services.auth import (
    consume_security_token,
    find_user_by_email,
    issue_security_token,
    revoke_user_sessions,
)
from app.services.identity import get_role, normalize_email, validate_store_scope

router = APIRouter(prefix="/users", tags=["Users and RBAC"])


def serialize_role(role: Role) -> RoleResponse:
    return RoleResponse(
        id=role.id,
        code=role.code,
        name=role.name,
        description=role.description,
        permissions=sorted(permission.code for permission in role.permissions),
    )


def serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        tenant_id=user.tenant_id,
        store_id=user.store_id,
        email=user.email,
        full_name=user.full_name,
        status=user.status,
        locale=user.locale,
        timezone=user.timezone,
        email_verified_at=user.email_verified_at,
        mfa_enabled=user.mfa_enabled,
        role=serialize_role(user.role),
    )


@router.get("/me", response_model=UserResponse)
def get_profile(user: CurrentUser):
    return serialize_user(user)


@router.patch("/me", response_model=UserResponse)
def update_profile(payload: ProfileUpdate, user: CurrentUser, db: DBSession):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.get("", response_model=list[UserResponse])
def list_users(
    db: DBSession,
    user: User = Depends(require_permissions(Permissions.USERS_READ)),
):
    users = db.scalars(
        select(User)
        .where(User.tenant_id == user.tenant_id)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .order_by(User.full_name)
    ).all()
    return [serialize_user(item) for item in users]


@router.post(
    "/invite",
    response_model=DevelopmentTokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_reauthentication)],
)
def invite_user(
    payload: UserInvitationRequest,
    request: Request,
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.USERS_MANAGE)),
):
    if find_user_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    role = get_role(db, payload.role_code)
    if not role:
        raise HTTPException(status_code=422, detail="Unknown role")
    if not validate_store_scope(db, actor.tenant_id, payload.store_id):
        raise HTTPException(status_code=422, detail="Store does not belong to this tenant")
    if payload.role_code in {"store_manager", "sales_executive"} and not payload.store_id:
        raise HTTPException(status_code=422, detail="This role requires a store assignment")

    user = User(
        tenant_id=actor.tenant_id,
        store_id=payload.store_id,
        role_id=role.id,
        email=normalize_email(payload.email),
        full_name=payload.full_name.strip(),
        password_hash=hash_password(f"Aa1{random_token()}"),
        status=UserStatus.INVITED,
        locale=actor.locale,
        timezone=actor.timezone,
    )
    db.add(user)
    db.flush()
    token = issue_security_token(db, user=user, purpose=SecurityTokenPurpose.INVITATION)
    record_audit(
        db,
        event_type="admin.user_invited",
        request=request,
        tenant_id=actor.tenant_id,
        actor_user_id=actor.id,
        target_type="user",
        target_id=str(user.id),
        details={"email": user.email, "role": role.code, "store_id": str(user.store_id)},
    )
    db.commit()
    return DevelopmentTokenResponse(
        message="Invitation created",
        token=token if settings.expose_development_tokens and not settings.is_production else None,
    )


@router.post("/accept-invitation", response_model=MessageResponse)
def accept_invitation(payload: InvitationAcceptRequest, request: Request, db: DBSession):
    user = consume_security_token(
        db,
        raw_token=payload.token,
        purpose=SecurityTokenPurpose.INVITATION,
    )
    user.password_hash = hash_password(payload.password)
    user.password_changed_at = utcnow()
    user.email_verified_at = utcnow()
    user.status = UserStatus.ACTIVE
    record_audit(
        db,
        event_type="auth.invitation_accepted",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
    )
    db.commit()
    return MessageResponse(message="Invitation accepted")


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    dependencies=[Depends(require_reauthentication)],
)
def change_role(
    user_id: UUID,
    payload: RoleChangeRequest,
    request: Request,
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.ROLES_MANAGE)),
):
    target = db.get(User, user_id)
    if not target or target.tenant_id != actor.tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    role = get_role(db, payload.role_code)
    if not role:
        raise HTTPException(status_code=422, detail="Unknown role")
    if not validate_store_scope(db, actor.tenant_id, payload.store_id):
        raise HTTPException(status_code=422, detail="Store does not belong to this tenant")
    if payload.role_code in {"store_manager", "sales_executive"} and not payload.store_id:
        raise HTTPException(status_code=422, detail="This role requires a store assignment")
    before = {"role": target.role.code, "store_id": str(target.store_id)}
    target.role_id = role.id
    target.store_id = payload.store_id
    revoke_user_sessions(db, target.id, "role_changed")
    record_audit(
        db,
        event_type="admin.user_role_changed",
        request=request,
        tenant_id=actor.tenant_id,
        actor_user_id=actor.id,
        target_type="user",
        target_id=str(target.id),
        details={
            "before": before,
            "after": {"role": role.code, "store_id": str(payload.store_id)},
        },
    )
    db.commit()
    db.refresh(target)
    return serialize_user(target)


@router.patch(
    "/{user_id}/state",
    response_model=UserResponse,
    dependencies=[Depends(require_reauthentication)],
)
def change_account_state(
    user_id: UUID,
    payload: AccountStateRequest,
    request: Request,
    db: DBSession,
    actor: User = Depends(require_permissions(Permissions.USERS_MANAGE)),
):
    target = db.get(User, user_id)
    if not target or target.tenant_id != actor.tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == actor.id and not payload.enabled:
        raise HTTPException(status_code=422, detail="You cannot disable your own account")
    target.status = UserStatus.ACTIVE if payload.enabled else UserStatus.DISABLED
    if not payload.enabled:
        revoke_user_sessions(db, target.id, "account_disabled")
    record_audit(
        db,
        event_type="admin.user_state_changed",
        request=request,
        tenant_id=actor.tenant_id,
        actor_user_id=actor.id,
        target_type="user",
        target_id=str(target.id),
        details={"enabled": payload.enabled},
    )
    db.commit()
    db.refresh(target)
    return serialize_user(target)


@router.get("/roles/catalog", response_model=list[RoleResponse])
def role_catalog(
    db: DBSession,
    _: User = Depends(require_permissions(Permissions.USERS_READ)),
):
    roles = db.scalars(
        select(Role).options(selectinload(Role.permissions)).order_by(Role.name)
    ).all()
    return [serialize_role(role) for role in roles]


@router.get("/stores/catalog", response_model=list[StoreResponse])
def store_catalog(
    db: DBSession,
    user: User = Depends(require_permissions(Permissions.USERS_READ)),
):
    return db.scalars(
        select(Store)
        .where(Store.tenant_id == user.tenant_id, Store.is_active.is_(True))
        .order_by(Store.name)
    ).all()
