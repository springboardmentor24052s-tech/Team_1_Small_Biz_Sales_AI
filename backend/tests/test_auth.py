from fastapi.testclient import TestClient

from tests.conftest import TEST_PASSWORD, auth_header


def test_registration_verification_login_refresh_and_logout(client: TestClient):
    register = client.post(
        "/api/v1/auth/register",
        json={
            "business_name": "Aravali Mart",
            "store_name": "Main Store",
            "full_name": "Aarav Sharma",
            "email": "owner@aravali.example.com",
            "password": TEST_PASSWORD,
            "currency": "INR",
            "timezone": "Asia/Kolkata",
        },
    )
    assert register.status_code == 201
    verification_token = register.json()["token"]
    assert verification_token

    blocked_login = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@aravali.example.com", "password": TEST_PASSWORD},
    )
    assert blocked_login.status_code == 403

    verified = client.post(
        "/api/v1/auth/verify-email",
        json={"token": verification_token},
    )
    assert verified.status_code == 200

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@aravali.example.com", "password": TEST_PASSWORD},
    )
    assert login.status_code == 200
    tokens = login.json()

    profile = client.get("/api/v1/users/me", headers=auth_header(tokens["access_token"]))
    assert profile.status_code == 200
    assert profile.json()["role"]["code"] == "business_owner"

    rotated = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert rotated.status_code == 200
    assert rotated.json()["refresh_token"] != tokens["refresh_token"]

    replay = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert replay.status_code == 401

    logout = client.post(
        "/api/v1/auth/logout",
        headers=auth_header(rotated.json()["access_token"]),
    )
    assert logout.status_code == 200

    rejected = client.get(
        "/api/v1/users/me",
        headers=auth_header(rotated.json()["access_token"]),
    )
    assert rejected.status_code == 401


def test_login_lockout_after_repeated_failures(client: TestClient):
    register = client.post(
        "/api/v1/auth/register",
        json={
            "business_name": "Lockout Retail",
            "store_name": "Main",
            "full_name": "Test Owner",
            "email": "lockout@example.com",
            "password": TEST_PASSWORD,
        },
    )
    client.post("/api/v1/auth/verify-email", json={"token": register.json()["token"]})

    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "lockout@example.com", "password": "WrongPassword123!"},
        )
        assert response.status_code == 401

    locked = client.post(
        "/api/v1/auth/login",
        json={"email": "lockout@example.com", "password": TEST_PASSWORD},
    )
    assert locked.status_code == 423
