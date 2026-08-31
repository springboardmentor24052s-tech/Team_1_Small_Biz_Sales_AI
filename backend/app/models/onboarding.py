from uuid import UUID

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class OnboardingImportJob(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "onboarding_import_jobs"

    tenant_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    actor_user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    store_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("stores.id", ondelete="CASCADE"), index=True
    )
    seller_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    kind: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    total_rows: Mapped[int] = mapped_column(default=0, nullable=False)
    valid_rows: Mapped[int] = mapped_column(default=0, nullable=False)
    invalid_rows: Mapped[int] = mapped_column(default=0, nullable=False)
    preview: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    errors: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    report: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    raw_csv: Mapped[str] = mapped_column(Text, nullable=False)
