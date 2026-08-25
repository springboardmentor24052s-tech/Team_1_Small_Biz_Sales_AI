from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from app.models.inventory import Inventory, Product
from app.models.sales import SalesTransaction, TransactionStatus
from tests.conftest import auth_header, create_user, login


def seed_anomaly_scenarios(db: Session, tenant: Tenant, store: Store, user):
    now = datetime.now(UTC)
    # Normal sales
    for i in range(10):
        tx = SalesTransaction(
            tenant_id=tenant.id,
            store_id=store.id,
            seller_id=user.id,
            occurred_at=now - timedelta(days=i),
            currency="INR",
            total_amount=Decimal("1500"),
            item_count=2,
            discount_amount=Decimal("50"),
            status=TransactionStatus.COMPLETED,
        )
        db.add(tx)

    # Anomaly sale (massive volume / discount)
    anom_tx = SalesTransaction(
        tenant_id=tenant.id,
        store_id=store.id,
        seller_id=user.id,
        occurred_at=now,
        currency="INR",
        total_amount=Decimal("95000"),
        item_count=120,
        discount_amount=Decimal("25000"),
        status=TransactionStatus.COMPLETED,
    )
    db.add(anom_tx)

    # Inventory shrinkage scenario
    prod = Product(tenant_id=tenant.id, sku="SKU-SHRINK", name="Premium Watch", category="Accessories", is_active=True)
    db.add(prod)
    db.flush()

    inv = Inventory(
        tenant_id=tenant.id,
        store_id=store.id,
        product_id=prod.id,
        stock_quantity=0,
        reorder_level=10,
    )
    db.add(inv)
    db.commit()


def test_anomalies_detection_and_resolution(client: TestClient, db: Session, tenant: Tenant, store: Store):
    owner = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="owner.anom@marketmind.example.com",
    )
    seed_anomaly_scenarios(db, tenant, store, owner)

    token = login(client, "owner.anom@marketmind.example.com")
    headers = auth_header(token)

    # 1. Summary
    res = client.get("/api/v1/anomalies/summary", headers=headers)
    assert res.status_code == 200, res.text
    summary = res.json()
    assert summary["total_open"] > 0

    # 2. List events
    res = client.get("/api/v1/anomalies", headers=headers)
    assert res.status_code == 200, res.text
    events = res.json()
    assert len(events) > 0

    target_event = events[0]
    assert "severity" in target_event
    assert "score" in target_event
    assert target_event["status"] == "open"

    # 3. Update status to resolved
    res = client.patch(
        f"/api/v1/anomalies/{target_event['id']}/status",
        headers=headers,
        json={"status": "resolved", "resolution_notes": "Reviewed with store manager and approved."},
    )
    assert res.status_code == 200, res.text
    updated = res.json()
    assert updated["status"] == "resolved"
    assert updated["resolution_notes"] is not None
