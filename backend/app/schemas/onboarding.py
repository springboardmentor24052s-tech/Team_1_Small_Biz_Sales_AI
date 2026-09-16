from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.users import StoreResponse


class StoreCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    code: str = Field(min_length=2, max_length=40, pattern=r"^[A-Za-z0-9_-]+$")
    timezone: str = Field(default="Asia/Kolkata", min_length=2, max_length=64)


class ImportJobResponse(BaseModel):
    id: UUID
    kind: str
    filename: str
    status: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    preview: list[dict]
    errors: list[dict]
    report: dict
    created_at: datetime


class ReadinessItem(BaseModel):
    ready: bool
    label: str
    detail: str


class OnboardingStatusResponse(BaseModel):
    completion_percentage: int
    counts: dict[str, int]
    checklist: dict[str, bool]
    forecast_readiness: dict[str, ReadinessItem]
    recent_imports: list[ImportJobResponse]


class SampleDataResponse(BaseModel):
    message: str
    report: dict[str, int]


class StoreCreateResponse(StoreResponse):
    pass
