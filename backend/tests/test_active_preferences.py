from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.identity import Store, Tenant
from app.models.inventory import Inventory, Product
from app.models.sales import SalesTransaction
from tests.conftest import auth_header, create_user, login


def test_dashboard_period_and_role_alert_preferences_are_applied(
    client: TestClient, db: Session, tenant: Tenant, store: Store
):
    owner = create_user(
        db, tenant=tenant, store=store, role_code="business_owner", email="prefs.owner@example.com"
    )
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="prefs.manager@example.com",
    )
    seller = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="prefs.sales@example.com",
    )

    now = datetime.now(UTC)
    for reference, occurred_at, amount in [
        ("PREF-OLD", now - timedelta(days=10), "5000"),
        ("PREF-NEW", now, "9000"),
    ]:
        db.add(
            SalesTransaction(
                tenant_id=tenant.id,
                store_id=store.id,
                seller_id=seller.id,
                source_system="test",
                external_reference=reference,
                occurred_at=occurred_at,
                currency="INR",
                total_amount=Decimal(amount),
                item_count=1,
                status="completed",
            )
        )
    product = Product(tenant_id=tenant.id, sku="PREF-SKU", name="Preference Product")
    db.add(product)
    db.flush()
    db.add(
        Inventory(
            tenant_id=tenant.id,
            store_id=store.id,
            product_id=product.id,
            stock_quantity=2,
            reorder_level=5,
        )
    )
    db.add_all(
        [
            Customer(
                tenant_id=tenant.id,
                assigned_seller_id=seller.id,
                source_system="test",
                external_customer_id="FOLLOW-UP",
                last_purchase=datetime(2026, 1, 1, tzinfo=UTC),
                order_count=1,
                item_quantity=1,
                total_revenue=Decimal("1000"),
                recency_days=90,
            ),
            Customer(
                tenant_id=tenant.id,
                assigned_seller_id=seller.id,
                source_system="test",
                external_customer_id="ACTIVE",
                last_purchase=datetime(2026, 8, 15, tzinfo=UTC),
                order_count=2,
                item_quantity=2,
                total_revenue=Decimal("2000"),
                recency_days=10,
            ),
        ]
    )
    db.commit()

    owner_headers = auth_header(login(client, owner.email))
    seven_days = client.get("/api/v1/dashboard/sales?days=7", headers=owner_headers)
    assert seven_days.status_code == 200
    assert seven_days.json()["transaction_count"]["value"] == 1

    owner_disabled = client.patch(
        "/api/v1/users/me",
        json={"role_preferences": {"weekly_summary": False, "revenue_alerts": False}},
        headers=owner_headers,
    )
    assert owner_disabled.status_code == 200
    assert client.get("/api/v1/notifications", headers=owner_headers).json()["items"] == []

    manager_headers = auth_header(login(client, manager.email))
    manager_items = client.get("/api/v1/notifications", headers=manager_headers).json()["items"]
    assert {item["id"] for item in manager_items} == {
        "manager-stock-risk",
        "manager-daily-summary",
    }

    seller_headers = auth_header(login(client, seller.email))
    seller_items = client.get("/api/v1/notifications", headers=seller_headers).json()["items"]
    assert {item["id"] for item in seller_items} == {
        "sales-followups",
        "sales-customer-activity",
    }
