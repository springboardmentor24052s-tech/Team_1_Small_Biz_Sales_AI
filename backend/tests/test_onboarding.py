from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from app.models.sales import SalesLineItem, SalesTransaction
from tests.conftest import TEST_PASSWORD, auth_header, create_user, login


def reauth_headers(client: TestClient, token: str):
    response = client.post(
        "/api/v1/auth/reauthenticate",
        json={"password": TEST_PASSWORD},
        headers=auth_header(token),
    )
    return {**auth_header(token), "X-Reauth-Token": response.json()["reauth_token"]}


def test_owner_onboarding_preview_commit_and_sample_data(
    client: TestClient, db: Session, tenant: Tenant, store: Store
):
    owner = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="onboarding.owner@example.com",
    )
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="onboarding.manager@example.com",
    )
    token = login(client, owner.email)
    headers = auth_header(token)

    initial = client.get("/api/v1/onboarding/status", headers=headers)
    assert initial.status_code == 200
    assert initial.json()["counts"]["products"] == 0
    assert initial.json()["checklist"]["store_ready"] is True

    product_csv = "sku,name,category\nNEW-1,New Product,General\nNEW-2,,General\n"
    preview = client.post(
        "/api/v1/onboarding/imports/preview",
        data={"kind": "products"},
        files={"upload": ("products.csv", product_csv, "text/csv")},
        headers=headers,
    )
    assert preview.status_code == 201, preview.text
    assert preview.json()["valid_rows"] == 1
    assert preview.json()["invalid_rows"] == 1

    committed = client.post(
        f"/api/v1/onboarding/imports/{preview.json()['id']}/commit",
        headers=reauth_headers(client, token),
    )
    assert committed.status_code == 200, committed.text
    assert committed.json()["report"]["created"] == 1

    inventory_csv = "sku,stock_quantity,reorder_level\nNEW-1,15,5\nMISSING,3,2\n"
    inventory_preview = client.post(
        "/api/v1/onboarding/imports/preview",
        data={"kind": "inventory", "store_id": str(store.id)},
        files={"upload": ("inventory.csv", inventory_csv, "text/csv")},
        headers=headers,
    )
    assert inventory_preview.status_code == 201
    assert inventory_preview.json()["valid_rows"] == 1
    assert inventory_preview.json()["errors"][0]["row"] == 3

    first_sample = client.post(
        "/api/v1/onboarding/sample-data", headers=reauth_headers(client, token)
    )
    second_sample = client.post(
        "/api/v1/onboarding/sample-data", headers=reauth_headers(client, token)
    )
    assert first_sample.status_code == 200
    assert first_sample.json()["report"]["sales"] == 45
    assert second_sample.json()["report"]["sales"] == 0

    ready = client.get("/api/v1/onboarding/status", headers=headers).json()
    assert ready["forecast_readiness"]["revenue"]["ready"] is True
    assert ready["forecast_readiness"]["demand"]["ready"] is True
    assert ready["forecast_readiness"]["segmentation"]["ready"] is True

    manager_token = login(client, manager.email)
    forbidden = client.get("/api/v1/onboarding/status", headers=auth_header(manager_token))
    assert forbidden.status_code == 403


def test_sales_upload_links_customer_and_combines_product_rows_per_order(
    client: TestClient, db: Session, tenant: Tenant, store: Store
):
    owner = create_user(
        db, tenant=tenant, store=store, role_code="business_owner", email="upload.owner@example.com"
    )
    seller = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="upload.seller@example.com",
    )
    token = login(client, owner.email)
    headers = auth_header(token)

    def upload(kind, content, **fields):
        preview = client.post(
            "/api/v1/onboarding/imports/preview",
            data={"kind": kind, **fields},
            files={"upload": (f"{kind}.csv", content, "text/csv")},
            headers=headers,
        )
        assert preview.status_code == 201, preview.text
        result = client.post(
            f"/api/v1/onboarding/imports/{preview.json()['id']}/commit",
            headers=reauth_headers(client, token),
        )
        assert result.status_code == 200, result.text
        return result.json()["report"]

    upload("products", "sku,name\nSKU-A,Product A\nSKU-B,Product B\n")
    upload(
        "customers",
        "customer_id,last_purchase,order_count,item_quantity,total_revenue,recency_days\n"
        "BUYER-1,2026-08-01,1,3,300,19\n",
        seller_id=str(seller.id),
    )
    sales_csv = (
        "order_id,order_date,customer_id,sku,quantity,amount,currency\n"
        "ORDER-1,2026-08-01,BUYER-1,SKU-A,1,100,INR\n"
        "ORDER-1,2026-08-01,BUYER-1,SKU-B,2,200,INR\n"
    )
    first = upload(
        "sales", sales_csv, store_id=str(store.id), seller_id=str(seller.id)
    )
    second = upload(
        "sales", sales_csv, store_id=str(store.id), seller_id=str(seller.id)
    )
    transaction = db.scalar(select(SalesTransaction))
    assert first["created"] == 1
    assert second["unchanged"] == 1
    assert transaction.total_amount == 300
    assert transaction.item_count == 3
    assert transaction.customer_id is not None
    assert db.scalar(select(func.count(SalesLineItem.id))) == 2
