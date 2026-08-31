from datetime import datetime

from pydantic import BaseModel, Field


class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    severity: str
    category: str
    created_at: datetime
    destination: str
    evidence: dict = Field(default_factory=dict)


class NotificationResponse(BaseModel):
    generated_at: datetime
    items: list[NotificationItem]
