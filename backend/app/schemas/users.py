from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class RoleResponse(ORMModel):
    id: UUID
    code: str
    name: str
    description: str
    permissions: list[str] = []


class UserResponse(ORMModel):
    id: UUID
    tenant_id: UUID
    store_id: UUID | None
    email: EmailStr
    full_name: str
    status: str
    locale: str
    timezone: str
    email_verified_at: datetime | None
    mfa_enabled: bool
    role: RoleResponse


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    locale: str | None = Field(default=None, min_length=2, max_length=16)
    timezone: str | None = Field(default=None, min_length=2, max_length=64)


class UserInvitationRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=160)
    role_code: str
    store_id: UUID | None = None


class InvitationAcceptRequest(BaseModel):
    token: str
    password: str


class RoleChangeRequest(BaseModel):
    role_code: str
    store_id: UUID | None = None


class AccountStateRequest(BaseModel):
    enabled: bool
