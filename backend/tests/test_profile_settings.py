from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from tests.conftest import auth_header, create_user, login


def test_profile_details_preferences_and_avatar(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
):
    owner = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="profile.owner@example.com",
    )
    headers = auth_header(login(client, owner.email))

    updated = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={
            "full_name": "Aarav Sharma",
            "phone_number": "+91 98765 43210",
            "job_title": "Founder",
            "location": "Jaipur, Rajasthan",
            "bio": "Runs store operations and reviews business performance.",
            "date_of_birth": "1998-05-14",
            "avatar_emoji": "🚀",
            "locale": "hi-IN",
            "timezone": "Asia/Kolkata",
            "theme_preference": "light",
            "date_format": "DD/MM/YYYY",
            "dashboard_density": "compact",
            "email_notifications": False,
            "role_preferences": {
                "default_period": "90",
                "weekly_summary": True,
                "revenue_alerts": False,
            },
        },
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["location"] == "Jaipur, Rajasthan"
    assert body["theme_preference"] == "light"
    assert body["email_notifications"] is False
    assert body["date_of_birth"] == "1998-05-14"
    assert body["avatar_emoji"] == "🚀"
    assert body["role_preferences"]["default_period"] == "90"
    assert body["joined_at"]
    assert body["tenant_name"] == tenant.name
    assert body["store"]["id"] == str(store.id)

    uploaded = client.post(
        "/api/v1/users/me/avatar",
        headers=headers,
        files={"avatar": ("profile.png", b"\x89PNG\r\n\x1a\nprofile-image", "image/png")},
    )
    assert uploaded.status_code == 200, uploaded.text
    assert uploaded.json()["avatar_url"].startswith("/uploads/avatars/")

    removed = client.delete("/api/v1/users/me/avatar", headers=headers)
    assert removed.status_code == 200
    assert removed.json()["avatar_url"] is None


def test_profile_validation_rejects_bad_preferences(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
):
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="profile.manager@example.com",
    )
    headers = auth_header(login(client, manager.email))
    invalid = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={
            "theme_preference": "purple",
            "phone_number": "not-a-phone",
            "role_preferences": {"revenue_alerts": True},
        },
    )
    assert invalid.status_code == 422

    wrong_role_setting = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"role_preferences": {"revenue_alerts": True}},
    )
    assert wrong_role_setting.status_code == 422
