from datetime import UTC, datetime
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.identity import Store, Tenant
from app.models.inventory import Product
from app.models.sales import SalesLineItem, SalesTransaction, TransactionStatus
from tests.conftest import auth_header, create_user, login


def seed_basket_data(db: Session, tenant: Tenant, store: Store, user):
    p1 = Product(tenant_id=tenant.id, sku="SKU-SHIRT", name="Classic Oxford Shirt", category="Apparel", is_active=True)
    p2 = Product(tenant_id=tenant.id, sku="SKU-TIE", name="Silk Tie", category="Apparel", is_active=True)
    p3 = Product(tenant_id=tenant.id, sku="SKU-BLAZER", name="Wool Blazer", category="Apparel", is_active=True)
    db.add_all([p1, p2, p3])
    db.flush()

    cust = Customer(
        tenant_id=tenant.id,
        assigned_seller_id=user.id,
        source_system="manual",
        external_customer_id="CUST-REC-01",
        last_purchase=datetime.now(UTC),
        order_count=2,
        item_quantity=4,
        total_revenue=Decimal("5000"),
        recency_days=5,
    )
    db.add(cust)
    db.flush()

    for _ in range(5):
        tx = SalesTransaction(
            tenant_id=tenant.id,
            store_id=store.id,
            seller_id=user.id,
            customer_id=cust.id,
            occurred_at=datetime.now(UTC),
            currency="INR",
            total_amount=Decimal("2500"),
            item_count=2,
            status=TransactionStatus.COMPLETED,
        )
        db.add(tx)
        db.flush()

        li1 = SalesLineItem(tenant_id=tenant.id, transaction_id=tx.id, product_id=p1.id, quantity=1, line_amount=Decimal("1500"))
        li2 = SalesLineItem(tenant_id=tenant.id, transaction_id=tx.id, product_id=p2.id, quantity=1, line_amount=Decimal("1000"))
        db.add_all([li1, li2])

    db.commit()
    return p1, p2, p3, cust


def test_recommendations_and_feedback(client: TestClient, db: Session, tenant: Tenant, store: Store):
    sales_rep = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="sales.rec@marketmind.example.com",
    )
    p1, p2, p3, cust = seed_basket_data(db, tenant, store, sales_rep)

    token = login(client, "sales.rec@marketmind.example.com")
    headers = auth_header(token)

    # 1. Frequently bought together
    res = client.get(f"/api/v1/recommendations/frequently-bought-together?product_id={p1.id}", headers=headers)
    assert res.status_code == 200, res.text
    recs = res.json()
    assert len(recs) > 0
    assert any(r["sku"] == "SKU-TIE" for r in recs)

    # 2. Upsell suggestions
    res = client.get(f"/api/v1/recommendations/upsell?product_id={p1.id}", headers=headers)
    assert res.status_code == 200, res.text
    upsells = res.json()
    assert len(upsells) > 0

    # 3. Customer personalized recommendations
    res = client.get(f"/api/v1/recommendations/customer/{cust.id}", headers=headers)
    assert res.status_code == 200, res.text
    cust_recs = res.json()
    assert len(cust_recs) > 0

    # 4. Record feedback
    res = client.post(
        "/api/v1/recommendations/feedback",
        headers=headers,
        json={
            "product_id": str(p2.id),
            "customer_id": str(cust.id),
            "recommendation_type": "cross_sell",
            "action": "added_to_cart",
        },
    )
    assert res.status_code == 200, res.text

    # 5. Metrics
    res = client.get("/api/v1/recommendations/metrics", headers=headers)
    assert res.status_code == 200, res.text
    metrics = res.json()
    assert "precision_at_k" in metrics
    assert "recall_at_k" in metrics
