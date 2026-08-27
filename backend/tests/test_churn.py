from datetime import UTC, datetime
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.identity import Store, Tenant
from tests.conftest import auth_header, create_user, login


def test_churn_prediction_endpoints(
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
        email="owner.churn@example.com",
    )
    db.add_all(
        [
            Customer(
                tenant_id=tenant.id,
                assigned_seller_id=owner.id,
                source_system="test_system",
                external_customer_id="CHURN-CUST-1",
                last_purchase=datetime(2026, 1, 1, tzinfo=UTC),
                order_count=1,
                item_quantity=2,
                total_revenue=Decimal("150.00"),
                recency_days=95,
            ),
            Customer(
                tenant_id=tenant.id,
                assigned_seller_id=owner.id,
                source_system="test_system",
                external_customer_id="CHURN-CUST-2",
                last_purchase=datetime(2026, 8, 20, tzinfo=UTC),
                order_count=15,
                item_quantity=80,
                total_revenue=Decimal("4500.00"),
                recency_days=5,
            ),
        ]
    )
    db.commit()

    headers = auth_header(login(client, owner.email))

    # Test GET /api/v1/churn/summary
    resp_summary = client.get(f"/api/v1/churn/summary?tenant_id={tenant.id}", headers=headers)
    assert resp_summary.status_code == 200
    data_summary = resp_summary.json()
    assert data_summary["algorithm"] == "LogisticRegression"
    assert data_summary["total_customers_analyzed"] == 2
    assert data_summary["high_risk_count"] >= 1

    # Test GET /api/v1/churn/customers
    resp_list = client.get(f"/api/v1/churn/customers?tenant_id={tenant.id}", headers=headers)
    assert resp_list.status_code == 200
    data_list = resp_list.json()
    assert data_list["total"] == 2
    assert len(data_list["items"]) == 2
    assert data_list["items"][0]["risk_level"] == "High Risk"
