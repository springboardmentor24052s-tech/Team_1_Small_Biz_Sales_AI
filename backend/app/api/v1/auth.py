from datetime import timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DBSession, oauth2_scheme
from app.core.config import settings
from app.core.security import (
    create_jwt,
    hash_password,
    mfa_uri,
    new_mfa_secret,
    utcnow,
    verify_mfa_code,
    verify_password,
)
from app.models.auth import AuthSession, SecurityTokenPurpose
from app.models.identity import Role, RoleCode, Store, Tenant, User, UserStatus
from app.schemas.auth import (
    DevelopmentTokenResponse,
    LoginRequest,
    MFAConfirmRequest,
    MFASetupResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    ReauthenticateRequest,
    ReauthenticateResponse,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    TokenRequest,
)
from app.schemas.common import MessageResponse
from app.services.audit import record_audit
from app.services.auth import (
    authenticate_user,
    consume_security_token,
    find_user_by_email,
    issue_security_token,
    issue_token_pair,
    revoke_user_sessions,
    rotate_refresh_token,
)
from app.services.identity import normalize_email, slugify

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=DevelopmentTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, request: Request, db: DBSession):
    if find_user_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    base_slug = slugify(payload.business_name)
    slug = base_slug
    if db.scalar(select(Tenant.id).where(Tenant.slug == slug)):
        slug = f"{base_slug}-{uuid4().hex[:8]}"

    owner_role = db.scalar(select(Role).where(Role.code == RoleCode.BUSINESS_OWNER))
    if not owner_role:
        raise HTTPException(status_code=503, detail="Authorization data has not been initialized")

    tenant = Tenant(
        name=payload.business_name.strip(),
        slug=slug,
        currency=payload.currency.upper(),
        timezone=payload.timezone,
    )
    db.add(tenant)
    db.flush()
    store = Store(
        tenant_id=tenant.id,
        name=payload.store_name.strip(),
        code="MAIN",
        timezone=payload.timezone,
    )
    db.add(store)
    db.flush()
    user = User(
        tenant_id=tenant.id,
        store_id=store.id,
        role_id=owner_role.id,
        email=normalize_email(payload.email),
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        status=UserStatus.INVITED,
        locale="en-IN",
        timezone=payload.timezone,
        password_changed_at=utcnow(),
    )
    db.add(user)
    db.flush()
    token = issue_security_token(
        db,
        user=user,
        purpose=SecurityTokenPurpose.EMAIL_VERIFICATION,
    )
    record_audit(
        db,
        event_type="auth.registered",
        request=request,
        tenant_id=tenant.id,
        actor_user_id=user.id,
    )
    db.commit()
    return DevelopmentTokenResponse(
        message="Registration succeeded. Verify the email address before signing in.",
        token=token if settings.expose_development_tokens and not settings.is_production else None,
    )


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(payload: TokenRequest, request: Request, db: DBSession):
    user = consume_security_token(
        db,
        raw_token=payload.token,
        purpose=SecurityTokenPurpose.EMAIL_VERIFICATION,
    )
    user.email_verified_at = utcnow()
    user.status = UserStatus.ACTIVE
    record_audit(
        db,
        event_type="auth.email_verified",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
    )
    db.commit()
    return MessageResponse(message="Email address verified")


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, request: Request, db: DBSession):
    user = authenticate_user(
        db,
        email=payload.email,
        password=payload.password,
        mfa_code=payload.mfa_code,
        request=request,
    )
    return issue_token_pair(
        db,
        user=user,
        request=request,
        mfa_verified=user.mfa_enabled,
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, request: Request, db: DBSession):
    return rotate_refresh_token(db, payload.refresh_token, request)


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    db: DBSession,
    user: CurrentUser,
    token: str = Depends(oauth2_scheme),
):
    from app.core.security import decode_jwt

    payload = decode_jwt(token, "access")
    session = db.get(AuthSession, UUID(payload["sid"]))
    if session and not session.revoked_at:
        session.revoked_at = utcnow()
        session.revoke_reason = "logout"
    record_audit(
        db,
        event_type="auth.logout",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
    )
    db.commit()
    return MessageResponse(message="Signed out")


@router.post("/password-reset/request", response_model=DevelopmentTokenResponse)
def request_password_reset(payload: PasswordResetRequest, request: Request, db: DBSession):
    user = find_user_by_email(db, payload.email)
    raw_token = None
    if user and user.status != UserStatus.DISABLED:
        raw_token = issue_security_token(
            db,
            user=user,
            purpose=SecurityTokenPurpose.PASSWORD_RESET,
        )
        record_audit(
            db,
            event_type="auth.password_reset_requested",
            request=request,
            tenant_id=user.tenant_id,
            actor_user_id=user.id,
        )
        db.commit()
    return DevelopmentTokenResponse(
        message="If the account exists, password reset instructions have been issued.",
        token=(
            raw_token
            if raw_token and settings.expose_development_tokens and not settings.is_production
            else None
        ),
    )


@router.post("/password-reset/confirm", response_model=MessageResponse)
def confirm_password_reset(payload: PasswordResetConfirm, request: Request, db: DBSession):
    user = consume_security_token(
        db,
        raw_token=payload.token,
        purpose=SecurityTokenPurpose.PASSWORD_RESET,
    )
    user.password_hash = hash_password(payload.new_password)
    user.password_changed_at = utcnow()
    user.failed_login_count = 0
    user.locked_until = None
    user.status = UserStatus.ACTIVE
    revoke_user_sessions(db, user.id, "password_reset")
    record_audit(
        db,
        event_type="auth.password_reset_completed",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
    )
    db.commit()
    return MessageResponse(message="Password updated")


@router.post("/reauthenticate", response_model=ReauthenticateResponse)
def reauthenticate(
    payload: ReauthenticateRequest,
    request: Request,
    db: DBSession,
    user: CurrentUser,
):
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Password is incorrect")
    if user.mfa_enabled and not verify_mfa_code(user.mfa_secret, payload.mfa_code):
        raise HTTPException(status_code=401, detail="A valid MFA code is required")
    token = create_jwt(
        subject=user.id,
        token_type="reauth",
        expires_delta=timedelta(minutes=settings.reauth_token_minutes),
        tenant_id=user.tenant_id,
        mfa_verified=user.mfa_enabled,
    )
    record_audit(
        db,
        event_type="auth.reauthenticated",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
    )
    db.commit()
    return ReauthenticateResponse(
        reauth_token=token,
        expires_in=settings.reauth_token_minutes * 60,
    )


@router.post("/mfa/setup", response_model=MFASetupResponse)
def setup_mfa(user: CurrentUser, db: DBSession):
    secret = new_mfa_secret()
    user.mfa_secret = secret
    user.mfa_enabled = False
    db.commit()
    return MFASetupResponse(secret=secret, provisioning_uri=mfa_uri(user.email, secret))


@router.post("/mfa/confirm", response_model=MessageResponse)
def confirm_mfa(payload: MFAConfirmRequest, request: Request, user: CurrentUser, db: DBSession):
    if not verify_mfa_code(user.mfa_secret, payload.code):
        raise HTTPException(status_code=400, detail="MFA code is invalid")
    user.mfa_enabled = True
    record_audit(
        db,
        event_type="auth.mfa_enabled",
        request=request,
        tenant_id=user.tenant_id,
        actor_user_id=user.id,
    )
    db.commit()
    return MessageResponse(message="MFA enabled")
