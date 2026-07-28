from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password, utcnow
from app.db.session import SessionLocal
from app.models.identity import Role, RoleCode, Tenant, User, UserStatus
from app.services.identity import normalize_email, seed_authorization


def bootstrap() -> None:
    with SessionLocal() as db:
        seed_authorization(db)
        if not settings.initial_admin_email or not settings.initial_admin_password:
            return

        email = normalize_email(settings.initial_admin_email)
        if db.scalar(select(User.id).where(User.email == email)):
            return

        tenant = db.scalar(select(Tenant).where(Tenant.slug == "marketmind-platform"))
        if not tenant:
            tenant = Tenant(
                name="MarketMind Platform",
                slug="marketmind-platform",
                currency="INR",
                timezone="Asia/Kolkata",
            )
            db.add(tenant)
            db.flush()

        role = db.scalar(select(Role).where(Role.code == RoleCode.ADMINISTRATOR))
        if not role:
            raise RuntimeError("Administrator role was not initialized")
        password = settings.initial_admin_password.get_secret_value()
        admin = User(
            tenant_id=tenant.id,
            role_id=role.id,
            email=email,
            full_name="MarketMind Administrator",
            password_hash=hash_password(password),
            status=UserStatus.ACTIVE,
            email_verified_at=utcnow(),
            password_changed_at=utcnow(),
        )
        db.add(admin)
        db.commit()


if __name__ == "__main__":
    bootstrap()
