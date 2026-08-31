from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from tests.conftest import auth_header, create_user, login


def test_anomaly_detection_endpoints(
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
        email="owner.anomaly@example.com",
    )
    headers = auth_header(login(client, owner.email))

    # Test GET /api/v1/anomalies
    resp = client.get(f"/api/v1/anomalies?tenant_id={tenant.id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["algorithm"] == "IsolationForest"
    assert data["total_anomalies_detected"] >= 1
    assert len(data["items"]) >= 1

    event_id = data["items"][0]["id"]

    # Test POST /api/v1/anomalies/{event_id}/acknowledge
    ack_resp = client.post(f"/api/v1/anomalies/{event_id}/acknowledge", headers=headers)
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "acknowledged"

    # Test POST /api/v1/anomalies/{event_id}/resolve
    res_resp = client.post(f"/api/v1/anomalies/{event_id}/resolve", headers=headers)
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "resolved"
