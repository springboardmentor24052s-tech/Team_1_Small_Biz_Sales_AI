from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from app.models.inventory import Product
from tests.conftest import auth_header, create_user, login


def test_invoice_creation_payments_and_rbac(client: TestClient, db: Session, tenant: Tenant, store: Store):
    seller = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="seller.inv@marketmind.example.com",
    )
    owner = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="owner.inv@marketmind.example.com",
    )

    prod = Product(tenant_id=tenant.id, sku="SKU-INV-01", name="Wireless Headset", category="Electronics", is_active=True)
    db.add(prod)
    db.commit()

    seller_token = login(client, "seller.inv@marketmind.example.com")
    seller_headers = auth_header(seller_token)

    owner_token = login(client, "owner.inv@marketmind.example.com")
    owner_headers = auth_header(owner_token)

    # 1. Seller creates invoice
    create_payload = {
        "store_id": str(store.id),
        "invoice_date": str(date.today()),
        "due_date": str(date.today() + timedelta(days=15)),
        "currency": "INR",
        "discount_amount": "100.00",
        "notes": "Net 15 terms",
        "items": [
            {
                "product_id": str(prod.id),
                "sku": "SKU-INV-01",
                "description": "Wireless Headset",
                "quantity": 2,
                "unit_price": "2000.00",
                "discount_amount": "0.00",
                "tax_rate": "0.18",
            }
        ],
    }

    res = client.post("/api/v1/invoices", headers=seller_headers, json=create_payload)
    assert res.status_code == 201, res.text
    inv_data = res.json()
    assert inv_data["invoice_number"].startswith("INV-")
    assert Decimal(str(inv_data["subtotal_amount"])) == Decimal("4000.00")
    assert inv_data["status"] == "pending"
    inv_id = inv_data["id"]

    # 2. Owner can view list and detail (INVOICES_READ)
    res = client.get("/api/v1/invoices", headers=owner_headers)
    assert res.status_code == 200, res.text
    list_data = res.json()
    assert list_data["total"] >= 1

    res = client.get(f"/api/v1/invoices/{inv_id}", headers=owner_headers)
    assert res.status_code == 200, res.text
    assert res.json()["id"] == inv_id

    # 3. Owner cannot create invoices (view only)
    res = client.post("/api/v1/invoices", headers=owner_headers, json=create_payload)
    assert res.status_code == 403

    # 4. Seller records partial payment
    pay_payload = {
        "amount": "2000.00",
        "payment_method": "upi",
        "reference_number": "UPI-TXN-123456",
        "notes": "Advance payment",
    }
    res = client.post(f"/api/v1/invoices/{inv_id}/payments", headers=seller_headers, json=pay_payload)
    assert res.status_code == 200, res.text
    pay_data = res.json()
    assert Decimal(str(pay_data["amount"])) == Decimal("2000.00")

    # Verify updated balance and status
    res = client.get(f"/api/v1/invoices/{inv_id}", headers=seller_headers)
    assert res.status_code == 200
    inv_after_pay = res.json()
    assert inv_after_pay["status"] == "partially_paid"
    assert Decimal(str(inv_after_pay["paid_amount"])) == Decimal("2000.00")

    # 5. Send reminder
    res = client.post(f"/api/v1/invoices/{inv_id}/remind", headers=seller_headers)
    assert res.status_code == 200, res.text
