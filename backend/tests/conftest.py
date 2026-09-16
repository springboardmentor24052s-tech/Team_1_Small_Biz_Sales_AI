from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
from app.core.config import settings
from app.core.rate_limiter import rate_limiter
from app.core.security import hash_password
from app.db.base import Base
from app.main import app
from app.models.identity import Role, Store, Tenant, User, UserStatus
from app.services.identity import get_role, seed_authorization

TEST_PASSWORD = "StrongTestPass123!"


@pytest.fixture(autouse=True)
def isolate_test_environment():
    orig_env = settings.environment
    orig_enabled = settings.rate_limit_enabled
    settings.environment = "testing"
    settings.rate_limit_enabled = False
    rate_limiter.reset()
    yield
    settings.environment = orig_env
    settings.rate_limit_enabled = orig_enabled
    rate_limiter.reset()


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    with session_factory() as session:
        seed_authorization(session)
        yield session
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def tenant(db: Session) -> Tenant:
    item = Tenant(
        name="Northwind Retail",
        slug="northwind-retail",
        currency="INR",
        timezone="Asia/Kolkata",
    )
    db.add(item)
    db.flush()
    return item


@pytest.fixture()
def store(db: Session, tenant: Tenant) -> Store:
    item = Store(
        tenant_id=tenant.id,
        name="Jaipur Store",
        code="JAI-01",
        timezone="Asia/Kolkata",
    )
    db.add(item)
    db.commit()
    return item


def create_user(
    db: Session,
    *,
    tenant: Tenant,
    store: Store | None,
    role_code: str,
    email: str,
    mfa_secret: str | None = None,
    mfa_enabled: bool = False,
) -> User:
    role: Role | None = get_role(db, role_code)
    assert role
    user = User(
        tenant_id=tenant.id,
        store_id=store.id if store else None,
        role_id=role.id,
        email=email,
        full_name=email.split("@")[0].replace(".", " ").title(),
        password_hash=hash_password(TEST_PASSWORD),
        status=UserStatus.ACTIVE,
        email_verified_at=datetime.now(UTC),
        password_changed_at=datetime.now(UTC),
        mfa_secret=mfa_secret,
        mfa_enabled=mfa_enabled,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login(client: TestClient, email: str, mfa_code: str | None = None) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": TEST_PASSWORD, "mfa_code": mfa_code},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}
