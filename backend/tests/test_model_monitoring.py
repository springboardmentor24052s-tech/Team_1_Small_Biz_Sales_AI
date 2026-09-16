from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from tests.conftest import auth_header, create_user, login


def test_model_monitoring_endpoint(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
):
    admin = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="administrator",
        email="admin.monitoring@example.com",
    )
    headers = auth_header(login(client, admin.email))

    resp = client.get(f"/api/v1/models/monitoring?tenant_id={tenant.id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall_health"] == "healthy"
    assert data["active_engines_count"] == 5
    assert len(data["engines"]) == 5
