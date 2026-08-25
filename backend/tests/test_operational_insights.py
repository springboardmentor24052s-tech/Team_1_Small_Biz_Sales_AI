from datetime import timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import utcnow
from app.models.customers import Customer
from app.models.identity import Store, Tenant
from app.models.inventory import Inventory, Product
from app.models.performance import EmployeeTarget
from app.models.sales import SalesLineItem, SalesTransaction
from tests.conftest import auth_header, create_user, login


def test_scoped_alerts_and_customer_360_use_linked_business_records(
    client: TestClient, db: Session, tenant: Tenant, store: Store
):
    owner = create_user(
        db, tenant=tenant, store=store, role_code="business_owner", email="alert.owner@example.com"
    )
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="alert.manager@example.com",
    )
    seller = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="alert.seller@example.com",
    )
    product = Product(
        tenant_id=tenant.id,
        sku="ALERT-001",
        name="Everyday Kurta",
        category="Apparel",
    )
    customer = Customer(
        tenant_id=tenant.id,
        assigned_seller_id=seller.id,
        source_system="test",
        external_customer_id="CUST-360",
        last_purchase=utcnow() - timedelta(days=10),
        order_count=4,
        item_quantity=8,
        total_revenue=Decimal("3400"),
        recency_days=10,
    )
    db.add_all([product, customer])
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
    now = utcnow()
    amounts = [Decimal("1000"), Decimal("900"), Decimal("800"), Decimal("700")]
    days_ago = [55, 45, 35, 10]
    for index, (amount, age) in enumerate(zip(amounts, days_ago, strict=True)):
        transaction = SalesTransaction(
            tenant_id=tenant.id,
            store_id=store.id,
            seller_id=seller.id,
            customer_id=customer.id,
            source_system="test",
            external_reference=f"C360-{index}",
            occurred_at=now - timedelta(days=age),
            currency="INR",
            total_amount=amount,
            item_count=2,
            status="completed",
            payment_method="upi",
        )
        db.add(transaction)
        db.flush()
        db.add(
            SalesLineItem(
                tenant_id=tenant.id,
                transaction_id=transaction.id,
                product_id=product.id,
                quantity=2,
                line_amount=amount,
                unit_price=amount / 2,
            )
        )
    db.add(
        EmployeeTarget(
            tenant_id=tenant.id,
            employee_id=seller.id,
            assigned_by_id=owner.id,
            metric="revenue",
            target_value=Decimal("31000"),
            period_start=now.date().replace(day=1),
            period_end=(now.date().replace(day=1) + timedelta(days=31)).replace(day=1)
            - timedelta(days=1),
            is_active=True,
        )
    )
    db.commit()

    owner_headers = auth_header(login(client, owner.email))
    manager_headers = auth_header(login(client, manager.email))
    seller_headers = auth_header(login(client, seller.email))

    owner_items = client.get("/api/v1/notifications", headers=owner_headers).json()["items"]
    owner_categories = {entry["category"] for entry in owner_items}
    assert {"inventory", "target", "customers"} <= owner_categories

    manager_items = client.get("/api/v1/notifications", headers=manager_headers).json()["items"]
    assert "manager-stock-risk" in {entry["id"] for entry in manager_items}
    assert "customers" in {entry["category"] for entry in manager_items}

    seller_items = client.get("/api/v1/notifications", headers=seller_headers).json()["items"]
    assert "target" in {entry["category"] for entry in seller_items}
    assert "customers" in {entry["category"] for entry in seller_items}

    for headers in (owner_headers, manager_headers, seller_headers):
        response = client.get(f"/api/v1/customers/{customer.id}/insights", headers=headers)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["decline_status"] == "decreasing"
        assert body["favourite_products"][0]["sku"] == "ALERT-001"
        assert body["preferred_payment_method"] == "upi"
        assert len(body["recent_visits"]) == 4
