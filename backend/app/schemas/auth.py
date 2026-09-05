from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=160)
    store_name: str = Field(min_length=2, max_length=160)
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str
    currency: str = Field(default="INR", min_length=3, max_length=3)
    timezone: str = Field(default="Asia/Kolkata", max_length=64)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: str | None = Field(default=None, min_length=6, max_length=8)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    mfa_setup_required: bool = False


class DevelopmentTokenResponse(BaseModel):
    message: str
    token: str | None = None


class TokenRequest(BaseModel):
    token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class ReauthenticateRequest(BaseModel):
    password: str
    mfa_code: str | None = None


class ReauthenticateResponse(BaseModel):
    reauth_token: str
    expires_in: int


class MFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str


class MFAConfirmRequest(BaseModel):
    code: str = Field(min_length=6, max_length=8)


class SessionContext(BaseModel):
    user_id: UUID
    tenant_id: UUID
    store_id: UUID | None
    role: str
    permissions: list[str]


class DeveloperOtpRequest(BaseModel):
    target_email: str = Field(default="garvit2005k@gmail.com")


class DeveloperOtpVerify(BaseModel):
    otp: str = Field(min_length=6, max_length=12)

