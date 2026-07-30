import pyotp
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from tests.conftest import TEST_PASSWORD, auth_header, create_user, login


def enable_admin_mfa(client: TestClient, email: str) -> tuple[str, str]:
    initial_token = login(client, email)
    setup = client.post("/api/v1/auth/mfa/setup", headers=auth_header(initial_token))
    secret = setup.json()["secret"]
    confirmation = client.post(
        "/api/v1/auth/mfa/confirm",
        json={"code": pyotp.TOTP(secret).now()},
        headers=auth_header(initial_token),
    )
    assert confirmation.status_code == 200
    return secret, login(client, email, pyotp.TOTP(secret).now())


def test_admin_invitation_role_change_and_audit(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
):
    admin = create_user(
        db,
        tenant=tenant,
        store=None,
        role_code="administrator",
        email="security.admin@example.com",
    )
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="existing.manager@example.com",
    )
    secret, admin_token = enable_admin_mfa(client, admin.email)

    reauth = client.post(
        "/api/v1/auth/reauthenticate",
        json={"password": TEST_PASSWORD, "mfa_code": pyotp.TOTP(secret).now()},
        headers=auth_header(admin_token),
    )
    assert reauth.status_code == 200
    privileged_headers = {
        **auth_header(admin_token),
        "X-Reauth-Token": reauth.json()["reauth_token"],
    }

    stores = client.get("/api/v1/users/stores/catalog", headers=auth_header(admin_token))
    assert stores.status_code == 200
    assert stores.json() == [
        {
            "id": str(store.id),
            "name": store.name,
            "code": store.code,
            "timezone": store.timezone,
            "is_active": True,
        }
    ]

    invite = client.post(
        "/api/v1/users/invite",
        json={
            "email": "new.sales@example.com",
            "full_name": "New Sales Executive",
            "role_code": "sales_executive",
            "store_id": str(store.id),
        },
        headers=privileged_headers,
    )
    assert invite.status_code == 201, invite.text

    accepted = client.post(
        "/api/v1/users/accept-invitation",
        json={"token": invite.json()["token"], "password": TEST_PASSWORD},
    )
    assert accepted.status_code == 200
    sales_token = login(client, "new.sales@example.com")
    profile = client.get("/api/v1/users/me", headers=auth_header(sales_token))
    assert profile.json()["role"]["code"] == "sales_executive"

    without_reauth = client.patch(
        f"/api/v1/users/{manager.id}/role",
        json={"role_code": "business_owner", "store_id": str(store.id)},
        headers=auth_header(admin_token),
    )
    assert without_reauth.status_code == 401

    changed = client.patch(
        f"/api/v1/users/{manager.id}/role",
        json={"role_code": "business_owner", "store_id": str(store.id)},
        headers=privileged_headers,
    )
    assert changed.status_code == 200, changed.text
    assert changed.json()["role"]["code"] == "business_owner"

    audit = client.get("/api/v1/audit", headers=auth_header(admin_token))
    assert audit.status_code == 200
    event_types = {event["event_type"] for event in audit.json()}
    assert "admin.user_invited" in event_types
    assert "admin.user_role_changed" in event_types


def test_password_reset_revokes_existing_sessions(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
):
    user = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="reset.owner@example.com",
    )
    existing_token = login(client, user.email)
    reset = client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": user.email},
    )
    assert reset.status_code == 200
    completed = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": reset.json()["token"], "new_password": "AnotherStrongPass456!"},
    )
    assert completed.status_code == 200

    revoked = client.get("/api/v1/users/me", headers=auth_header(existing_token))
    assert revoked.status_code == 401
