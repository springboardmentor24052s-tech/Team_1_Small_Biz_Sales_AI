from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from tests.conftest import auth_header, create_user, login


def transaction_payload(store_id: str, amount: str, reference: str) -> dict:
    return {
        "store_id": store_id,
        "external_reference": reference,
        "occurred_at": datetime.now(UTC).isoformat(),
        "currency": "INR",
        "total_amount": amount,
        "item_count": 2,
    }


def test_sales_and_dashboard_are_scoped_by_role_and_tenant(
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
        email="owner.scope@example.com",
    )
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="manager.scope@example.com",
    )
    executive = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="sales.scope@example.com",
    )

    manager_token = login(client, manager.email)
    executive_token = login(client, executive.email)
    owner_token = login(client, owner.email)

    manager_sale = client.post(
        "/api/v1/sales/transactions",
        json=transaction_payload(str(store.id), "1000.00", "MGR-1"),
        headers=auth_header(manager_token),
    )
    assert manager_sale.status_code == 201, manager_sale.text

    executive_sale = client.post(
        "/api/v1/sales/transactions",
        json=transaction_payload(str(store.id), "250.00", "EXEC-1"),
        headers=auth_header(executive_token),
    )
    assert executive_sale.status_code == 201, executive_sale.text

    executive_list = client.get(
        "/api/v1/sales/transactions",
        headers=auth_header(executive_token),
    )
    assert executive_list.status_code == 200
    assert executive_list.json()["total"] == 1
    assert executive_list.json()["items"][0]["external_reference"] == "EXEC-1"

    owner_dashboard = client.get(
        "/api/v1/dashboard/sales",
        headers=auth_header(owner_token),
    )
    assert owner_dashboard.status_code == 200, owner_dashboard.text
    assert owner_dashboard.json()["scope"] == "business"
    assert owner_dashboard.json()["revenue"]["value"] == "1250.00"

    manager_dashboard = client.get(
        "/api/v1/dashboard/sales",
        headers=auth_header(manager_token),
    )
    assert manager_dashboard.status_code == 200
    assert manager_dashboard.json()["scope"] == "store"

    executive_dashboard = client.get(
        "/api/v1/dashboard/sales",
        headers=auth_header(executive_token),
    )
    assert executive_dashboard.status_code == 200
    assert executive_dashboard.json()["scope"] == "personal"
    assert executive_dashboard.json()["revenue"]["value"] == "250.00"

    other_tenant = Tenant(
        name="Other Business",
        slug="other-business",
        currency="INR",
        timezone="Asia/Kolkata",
    )
    db.add(other_tenant)
    db.flush()
    other_store = Store(
        tenant_id=other_tenant.id,
        name="Other Store",
        code="OTHER",
        timezone="Asia/Kolkata",
    )
    db.add(other_store)
    db.commit()
    outsider = create_user(
        db,
        tenant=other_tenant,
        store=other_store,
        role_code="store_manager",
        email="outsider@example.com",
    )
    outsider_token = login(client, outsider.email)
    outside_sale = client.post(
        "/api/v1/sales/transactions",
        json=transaction_payload(str(other_store.id), "9999.00", "OTHER-1"),
        headers=auth_header(outsider_token),
    )
    assert outside_sale.status_code == 201

    refreshed_owner_dashboard = client.get(
        "/api/v1/dashboard/sales",
        headers=auth_header(owner_token),
    )
    assert refreshed_owner_dashboard.json()["revenue"]["value"] == "1250.00"

    cross_tenant_read = client.get(
        f"/api/v1/sales/transactions/{outside_sale.json()['id']}",
        headers=auth_header(owner_token),
    )
    assert cross_tenant_read.status_code == 404
