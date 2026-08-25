import pyotp
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from tests.conftest import auth_header, create_user, login


def enable_admin_mfa(client: TestClient, email: str) -> str:
    initial_token = login(client, email)
    setup = client.post("/api/v1/auth/mfa/setup", headers=auth_header(initial_token))
    secret = setup.json()["secret"]
    confirmation = client.post(
        "/api/v1/auth/mfa/confirm",
        json={"code": pyotp.TOTP(secret).now()},
        headers=auth_header(initial_token),
    )
    assert confirmation.status_code == 200
    return login(client, email, pyotp.TOTP(secret).now())


def test_admin_ai_config_and_retrain(client: TestClient, db: Session, tenant: Tenant, store: Store):
    admin = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="administrator",
        email="admin.ai@marketmind.example.com",
    )
    token = enable_admin_mfa(client, "admin.ai@marketmind.example.com")
    headers = auth_header(token)

    # 1. Get AI config & model registry
    res = client.get("/api/v1/admin/ai-config", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "models" in data
    assert "config" in data
    assert "churn" in data["config"]

    # 2. Update hyperparameters
    update_payload = {
        "churn": {"high_risk_threshold": 0.75},
        "anomalies": {"contamination": 0.08},
    }
    res = client.put("/api/v1/admin/ai-config", headers=headers, json=update_payload)
    assert res.status_code == 200, res.text
    updated_cfg = res.json()
    assert updated_cfg["churn"]["high_risk_threshold"] == 0.75

    # 3. Trigger retrain
    res = client.post("/api/v1/admin/ai-config/retrain", headers=headers, json={"modules": ["churn", "recommendations"]})
    assert res.status_code == 200, res.text
    retrain_res = res.json()
    assert "churn" in retrain_res

