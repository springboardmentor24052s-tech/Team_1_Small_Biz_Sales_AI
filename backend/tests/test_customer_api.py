from datetime import UTC, datetime
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.identity import Store, Tenant
from tests.conftest import auth_header, create_user, login


def test_customer_access_is_business_summary_or_assigned(
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
        email="owner.customers@example.com",
    )
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="manager.customers@example.com",
    )
    assigned_sales = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="assigned.customers@example.com",
    )
    other_sales = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="other.customers@example.com",
    )
    db.add_all(
        [
            Customer(
                tenant_id=tenant.id,
                assigned_seller_id=assigned_sales.id,
                source_system="online_retail_ii",
                external_customer_id="CUST-1",
                last_purchase=datetime(2011, 12, 1, tzinfo=UTC),
                order_count=4,
                item_quantity=20,
                total_revenue=Decimal("500.00"),
                recency_days=10,
            ),
            Customer(
                tenant_id=tenant.id,
                assigned_seller_id=assigned_sales.id,
                source_system="online_retail_ii",
                external_customer_id="CUST-2",
                last_purchase=datetime(2011, 11, 1, tzinfo=UTC),
                order_count=2,
                item_quantity=8,
                total_revenue=Decimal("200.00"),
                recency_days=40,
            ),
        ]
    )
    db.commit()

    owner_response = client.get(
        "/api/v1/customers",
        headers=auth_header(login(client, owner.email)),
    )
    assert owner_response.status_code == 200
    assert owner_response.json()["total"] == 2

    manager_summary = client.get(
        "/api/v1/customers/summary",
        headers=auth_header(login(client, manager.email)),
    )
    assert manager_summary.status_code == 200
    assert manager_summary.json()["scope"] == "summary"
    assert manager_summary.json()["customer_count"] == 2

    assigned_response = client.get(
        "/api/v1/customers",
        headers=auth_header(login(client, assigned_sales.email)),
    )
    assert assigned_response.status_code == 200
    assert assigned_response.json()["total"] == 2

    other_response = client.get(
        "/api/v1/customers",
        headers=auth_header(login(client, other_sales.email)),
    )
    assert other_response.status_code == 200
    assert other_response.json()["total"] == 0
