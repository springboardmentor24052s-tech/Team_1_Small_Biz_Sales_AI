import csv
from datetime import UTC, datetime
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from app.models.inventory import Inventory, Product
from app.models.sales import SalesTransaction
from app.services.data_import import import_milestone1_data
from tests.conftest import auth_header, create_user, login


def write_csv(path: Path, rows: list[dict]) -> Path:
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    return path


def sales_rows() -> list[dict]:
    return [
        {
            "order_id": "ORDER-1",
            "order_date": "2022-04-10",
            "sku": "SKU-1",
            "category": "Kurta",
            "style": "STYLE-1",
            "size": "M",
            "quantity": "2",
            "currency": "INR",
            "amount": "100.00",
            "transaction_type": "sale",
        },
        {
            "order_id": "ORDER-1",
            "order_date": "2022-04-10",
            "sku": "SKU-2",
            "category": "Kurta",
            "style": "STYLE-2",
            "size": "L",
            "quantity": "1",
            "currency": "INR",
            "amount": "50.00",
            "transaction_type": "sale",
        },
        {
            "order_id": "ORDER-2",
            "order_date": "2022-04-11",
            "sku": "SKU-1",
            "category": "Kurta",
            "style": "STYLE-1",
            "size": "M",
            "quantity": "0",
            "currency": "INR",
            "amount": "100.00",
            "transaction_type": "cancelled",
        },
    ]


def inventory_rows(stock_quantity: int = 3) -> list[dict]:
    return [
        {
            "sku": "SKU-1",
            "design_number": "STYLE-1",
            "stock_quantity": str(stock_quantity),
            "category": "Kurta",
            "size": "M",
            "color": "Blue",
            "reorder_level": "5",
        }
    ]


def test_import_is_repeatable_and_dashboard_uses_imported_sales(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
    tmp_path: Path,
):
    owner = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="owner.import@example.com",
    )
    sales_path = write_csv(tmp_path / "sales.csv", sales_rows())
    inventory_path = write_csv(tmp_path / "inventory.csv", inventory_rows())

    first = import_milestone1_data(
        db,
        tenant_id=tenant.id,
        store_id=store.id,
        seller_id=owner.id,
        sales_path=sales_path,
        inventory_path=inventory_path,
    )
    db.commit()
    second = import_milestone1_data(
        db,
        tenant_id=tenant.id,
        store_id=store.id,
        seller_id=owner.id,
        sales_path=sales_path,
        inventory_path=inventory_path,
    )
    db.commit()

    assert first.products.created == 2
    assert first.inventory.created == 1
    assert first.sales.created == 1
    assert first.sales.skipped == 1
    assert second.products.created == 0
    assert second.inventory.created == 0
    assert second.sales.created == 0
    assert second.inventory.unchanged == 1
    assert second.sales.unchanged == 1
    assert db.scalar(select(func.count(Product.id))) == 2
    assert db.scalar(select(func.count(Inventory.id))) == 1
    assert db.scalar(select(func.count(SalesTransaction.id))) == 1

    token = login(client, owner.email)
    response = client.get(
        "/api/v1/dashboard/sales",
        params={
            "date_from": datetime(2022, 4, 1, tzinfo=UTC).isoformat(),
            "date_to": datetime(2022, 5, 1, tzinfo=UTC).isoformat(),
        },
        headers=auth_header(token),
    )
    assert response.status_code == 200, response.text
    assert response.json()["revenue"]["value"] == "150.00"
    assert response.json()["transaction_count"]["value"] == 1
    assert response.json()["quantity"]["value"] == 3


def test_rerun_updates_inventory_without_creating_duplicates(
    db: Session,
    tenant: Tenant,
    store: Store,
    tmp_path: Path,
):
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="manager.import@example.com",
    )
    sales_path = write_csv(tmp_path / "sales.csv", sales_rows())
    inventory_path = write_csv(tmp_path / "inventory.csv", inventory_rows())
    import_milestone1_data(
        db,
        tenant_id=tenant.id,
        store_id=store.id,
        seller_id=manager.id,
        sales_path=sales_path,
        inventory_path=inventory_path,
    )
    db.commit()

    write_csv(inventory_path, inventory_rows(stock_quantity=12))
    report = import_milestone1_data(
        db,
        tenant_id=tenant.id,
        store_id=store.id,
        seller_id=manager.id,
        sales_path=sales_path,
        inventory_path=inventory_path,
    )
    db.commit()

    item = db.scalar(select(Inventory))
    assert report.inventory.updated == 1
    assert report.inventory.created == 0
    assert item
    assert item.stock_quantity == 12
    assert db.scalar(select(func.count(Inventory.id))) == 1


def test_committed_milestone1_samples_are_importable(
    db: Session,
    tenant: Tenant,
    store: Store,
):
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="manager.samples@example.com",
    )
    repository_root = Path(__file__).resolve().parents[2]
    sales_path = repository_root / "data" / "processed" / "sales_cleaned_sample.csv"
    inventory_path = repository_root / "data" / "processed" / "inventory_cleaned_sample.csv"
    customer_path = repository_root / "data" / "processed" / "customer_summary_sample.csv"

    first = import_milestone1_data(
        db,
        tenant_id=tenant.id,
        store_id=store.id,
        seller_id=manager.id,
        sales_path=sales_path,
        inventory_path=inventory_path,
        customer_path=customer_path,
    )
    db.commit()
    second = import_milestone1_data(
        db,
        tenant_id=tenant.id,
        store_id=store.id,
        seller_id=manager.id,
        sales_path=sales_path,
        inventory_path=inventory_path,
        customer_path=customer_path,
    )
    db.commit()

    assert first.products.created > 0
    assert first.inventory.created > 0
    assert first.sales.created > 0
    assert first.customers.created > 0
    assert second.products.created == 0
    assert second.inventory.created == 0
    assert second.sales.created == 0
    assert second.customers.created == 0
