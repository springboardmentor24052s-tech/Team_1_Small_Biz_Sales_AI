import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import jwt
import pyotp
from fastapi import HTTPException, status

from app.core.config import settings

# Attempt Argon2 import; fall back to PBKDF2 if DLL blocked on Windows
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import InvalidHashError, VerifyMismatchError
    _argon2_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
    HAS_ARGON2 = True
except Exception:
    _argon2_hasher = None
    HAS_ARGON2 = False

COMMON_PASSWORDS = {
    "123456789012",
    "admin123456",
    "letmein123456",
    "password1234",
    "qwerty123456",
    "welcome123456",
}


def utcnow() -> datetime:
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def validate_password(password: str) -> None:
    if len(password) < settings.password_min_length:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Password must contain at least {settings.password_min_length} characters",
        )
    lowered = password.casefold()
    if lowered in COMMON_PASSWORDS or "password" in lowered:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Choose a less common password",
        )
    if not any(character.isupper() for character in password):
        raise HTTPException(status_code=422, detail="Password must contain an uppercase letter")
    if not any(character.islower() for character in password):
        raise HTTPException(status_code=422, detail="Password must contain a lowercase letter")
    if not any(character.isdigit() for character in password):
        raise HTTPException(status_code=422, detail="Password must contain a number")


def _pbkdf2_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"$pbkdf2-sha256$100000${salt}${key.hex()}"


def hash_password(password: str, validate: bool = True) -> str:
    if validate:
        validate_password(password)
    if HAS_ARGON2 and _argon2_hasher is not None:
        try:
            return _argon2_hasher.hash(password)
        except Exception:
            pass
    return _pbkdf2_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    if password_hash.startswith("$pbkdf2-sha256$"):
        try:
            parts = password_hash.split("$")
            iterations = int(parts[2])
            salt = parts[3]
            expected_key = parts[4]
            key = hashlib.pbkdf2_hmac(
                "sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations
            )
            return hmac.compare_digest(key.hex(), expected_key)
        except Exception:
            return False
    if HAS_ARGON2 and _argon2_hasher is not None:
        try:
            return _argon2_hasher.verify(password_hash, password)
        except Exception:
            pass
    return hmac.compare_digest(hashlib.sha256(password.encode("utf-8")).hexdigest(), password_hash)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def random_token() -> str:
    return secrets.token_urlsafe(48)


def create_jwt(
    *,
    subject: UUID,
    token_type: str,
    expires_delta: timedelta,
    session_id: UUID | None = None,
    tenant_id: UUID | None = None,
    mfa_verified: bool = False,
) -> str:
    now = utcnow()
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": secrets.token_hex(16),
        "mfa": mfa_verified,
    }
    if session_id:
        payload["sid"] = str(session_id)
    if tenant_id:
        payload["tenant_id"] = str(tenant_id)
    return jwt.encode(
        payload,
        settings.jwt_secret.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def decode_jwt(token: str, expected_type: str) -> dict[str, Any]:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise credentials_error from exc
    if payload.get("type") != expected_type or not payload.get("sub"):
        raise credentials_error
    return payload


def new_mfa_secret() -> str:
    return pyotp.random_base32()


def mfa_uri(email: str, secret: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name="MarketMind")


def verify_mfa_code(secret: str | None, code: str | None) -> bool:
    return bool(secret and code and pyotp.TOTP(secret).verify(code, valid_window=1))
