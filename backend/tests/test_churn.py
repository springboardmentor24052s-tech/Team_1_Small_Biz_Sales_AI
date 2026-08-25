from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.identity import Store, Tenant
from app.models.sales import SalesTransaction, TransactionStatus
from tests.conftest import auth_header, create_user, login


def seed_customers_and_sales(db: Session, tenant: Tenant, store: Store, user):
    now = datetime.now(UTC)
    for i in range(12):
        c = Customer(
            tenant_id=tenant.id,
            assigned_seller_id=user.id,
            source_system="manual",
            external_customer_id=f"CUST-{i:03d}",
            last_purchase=now - timedelta(days=i * 15),
            order_count=max(1, 10 - i),
            item_quantity=max(1, (10 - i) * 3),
            total_revenue=Decimal(str((10 - i) * 1000)),
            recency_days=i * 15,
        )
        db.add(c)
        db.flush()

        tx = SalesTransaction(
            tenant_id=tenant.id,
            store_id=store.id,
            seller_id=user.id,
            customer_id=c.id,
            occurred_at=c.last_purchase,
            currency="INR",
            total_amount=Decimal(str(1000)),
            item_count=3,
            status=TransactionStatus.COMPLETED,
        )
        db.add(tx)
    db.commit()


def test_churn_summary_and_customer_list(client: TestClient, db: Session, tenant: Tenant, store: Store):
    owner = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="owner.churn@marketmind.example.com",
    )
    seed_customers_and_sales(db, tenant, store, owner)

    token = login(client, "owner.churn@marketmind.example.com")
    headers = auth_header(token)

    # 1. Summary
    res = client.get("/api/v1/churn/summary", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["total_customers"] > 0
    assert "high_risk_count" in data
    assert "average_churn_probability" in data
    assert data["accuracy"] is not None

    # 2. Customers list
    res = client.get("/api/v1/churn/customers", headers=headers)
    assert res.status_code == 200, res.text
    cust_data = res.json()
    assert cust_data["total"] > 0
    assert len(cust_data["items"]) > 0

    first_item = cust_data["items"][0]
    assert "churn_probability" in first_item
    assert "recommended_actions" in first_item
    assert len(first_item["recommended_actions"]) > 0

    # 3. Customer detail
    cust_id = first_item["customer_id"]
    res = client.get(f"/api/v1/churn/customers/{cust_id}", headers=headers)
    assert res.status_code == 200, res.text
    detail = res.json()
    assert detail["customer_id"] == cust_id
