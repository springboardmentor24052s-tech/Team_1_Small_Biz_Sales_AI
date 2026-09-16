from collections.abc import Callable
from datetime import timedelta
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import rate_limit_auth, rate_limit_authenticated, rate_limit_public, rate_limiter
from app.core.security import as_utc, decode_jwt, utcnow
from app.db.session import get_db
from app.models.auth import AuthSession
from app.models.identity import RoleCode, User, UserStatus

bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description="Paste the access token returned by POST /api/v1/auth/login.",
)
DBSession = Annotated[Session, Depends(get_db)]


def get_bearer_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    if credentials is None or credentials.scheme.casefold() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer access token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def get_current_user(
    request: Request,
    db: DBSession,
    token: Annotated[str, Depends(get_bearer_token)],
) -> User:
    rate_limiter.check_rate_limit(request, tier="authenticated")
    payload = decode_jwt(token, "access")
    try:
        user_id = UUID(payload["sub"])
        session_id = UUID(payload["sid"])
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=401, detail="Invalid authentication token") from exc

    session = db.get(AuthSession, session_id)
    now = utcnow()
    if (
        not session
        or session.user_id != user_id
        or session.revoked_at
        or as_utc(session.expires_at) <= now
    ):
        raise HTTPException(status_code=401, detail="Session is no longer active")
    if as_utc(session.last_seen_at) + timedelta(minutes=settings.session_idle_minutes) <= now:
        session.revoked_at = now
        session.revoke_reason = "idle_timeout"
        db.commit()
        raise HTTPException(status_code=401, detail="Session expired due to inactivity")

    user = session.user
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Account is not active")
    if str(user.tenant_id) != payload.get("tenant_id"):
        raise HTTPException(status_code=401, detail="Invalid tenant context")

    session.last_seen_at = now
    db.commit()
    user._mfa_verified = bool(payload.get("mfa"))
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_permissions(*required: str, require_all: bool = True) -> Callable:
    def dependency(user: CurrentUser) -> User:
        if user.role.code == RoleCode.ADMINISTRATOR and (
            not user.mfa_enabled or not getattr(user, "_mfa_verified", False)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator MFA enrollment and verification are required",
            )
        granted = user.permission_codes
        permitted = (
            all(item in granted for item in required)
            if require_all
            else any(item in granted for item in required)
        )
        if not permitted:
            raise HTTPException(status_code=403, detail="Permission denied")
        return user

    return dependency


def require_reauthentication(
    user: CurrentUser,
    reauth_token: Annotated[str | None, Header(alias="X-Reauth-Token")] = None,
) -> User:
    if not reauth_token:
        raise HTTPException(status_code=401, detail="Recent re-authentication is required")
    payload = decode_jwt(reauth_token, "reauth")
    if payload.get("sub") != str(user.id):
        raise HTTPException(status_code=401, detail="Re-authentication token does not match user")
    return user
