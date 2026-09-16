from __future__ import annotations

import csv
from collections.abc import Iterable
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.inventory import Inventory, Product
from app.models.sales import SalesTransaction, TransactionStatus

SALES_REQUIRED_COLUMNS = {
    "order_id",
    "order_date",
    "sku",
    "category",
    "style",
    "size",
    "quantity",
    "currency",
    "amount",
    "transaction_type",
}
INVENTORY_REQUIRED_COLUMNS = {
    "sku",
    "design_number",
    "stock_quantity",
    "category",
    "size",
    "color",
    "reorder_level",
}
CUSTOMER_REQUIRED_COLUMNS = {
    "customer_id",
    "last_purchase",
    "order_count",
    "item_quantity",
    "total_revenue",
    "recency_days",
}


@dataclass
class ImportCounts:
    created: int = 0
    updated: int = 0
    unchanged: int = 0
    skipped: int = 0


@dataclass
class DataImportReport:
    products: ImportCounts = field(default_factory=ImportCounts)
    inventory: ImportCounts = field(default_factory=ImportCounts)
    sales: ImportCounts = field(default_factory=ImportCounts)
    customers: ImportCounts = field(default_factory=ImportCounts)

    def to_dict(self) -> dict[str, dict[str, int]]:
        return asdict(self)


def _read_rows(path: Path, required: set[str], dataset_name: str) -> list[dict[str, str]]:
    if not path.is_file():
        raise ValueError(f"{dataset_name} file does not exist: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        available = set(reader.fieldnames or [])
        missing = sorted(required - available)
        if missing:
            raise ValueError(f"{dataset_name} is missing columns: {', '.join(missing)}")
        return list(reader)


def _text(value: str | None, *, upper: bool = False) -> str | None:
    cleaned = " ".join((value or "").split())
    if not cleaned:
        return None
    return cleaned.upper() if upper else cleaned


def _integer(value: str | None) -> int:
    try:
        return int(Decimal(value or ""))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"Invalid integer value: {value!r}") from exc


def _money(value: str | None) -> Decimal:
    try:
        return Decimal(value or "").quantize(Decimal("0.01"))
    except InvalidOperation as exc:
        raise ValueError(f"Invalid money value: {value!r}") from exc


def _timestamp(value: str | None) -> datetime:
    if not value:
        raise ValueError("Missing order date")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"Invalid order date: {value!r}") from exc
    return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed


def _merge_product(
    products: dict[str, dict[str, str | None]],
    sku: str | None,
    **fields: str | None,
) -> None:
    normalized_sku = _text(sku, upper=True)
    if not normalized_sku:
        return
    candidate = products.setdefault(
        normalized_sku,
        {
            "name": normalized_sku,
            "category": None,
            "style": None,
            "size": None,
            "color": None,
        },
    )
    for key, value in fields.items():
        cleaned = _text(value)
        if cleaned:
            candidate[key] = cleaned


def _set_changed(model: Any, values: dict[str, Any]) -> bool:
    changed = False
    for field_name, value in values.items():
        current = getattr(model, field_name)
        if isinstance(current, datetime) and isinstance(value, datetime):
            current = current.replace(tzinfo=current.tzinfo or UTC).astimezone(UTC)
            value = value.replace(tzinfo=value.tzinfo or UTC).astimezone(UTC)
        if current != value:
            setattr(model, field_name, value)
            changed = True
    return changed


def _prepare_products(
    sales_rows: Iterable[dict[str, str]],
    inventory_rows: Iterable[dict[str, str]],
) -> dict[str, dict[str, str | None]]:
    candidates: dict[str, dict[str, str | None]] = {}
    for row in sales_rows:
        _merge_product(
            candidates,
            row.get("sku"),
            name=row.get("style"),
            category=row.get("category"),
            style=row.get("style"),
            size=row.get("size"),
        )
    for row in inventory_rows:
        _merge_product(
            candidates,
            row.get("sku"),
            name=row.get("design_number"),
            category=row.get("category"),
            size=row.get("size"),
            color=row.get("color"),
        )
    return candidates


def _upsert_products(
    db: Session,
    tenant_id: UUID,
    candidates: dict[str, dict[str, str | None]],
    counts: ImportCounts,
) -> dict[str, Product]:
    products = {
        product.sku: product
        for product in db.scalars(select(Product).where(Product.tenant_id == tenant_id)).all()
    }
    for sku, values in candidates.items():
        product = products.get(sku)
        if not product:
            product = Product(tenant_id=tenant_id, sku=sku, **values)
            db.add(product)
            products[sku] = product
            counts.created += 1
        elif _set_changed(product, values):
            counts.updated += 1
        else:
            counts.unchanged += 1
    db.flush()
    return products


def _upsert_inventory(
    db: Session,
    tenant_id: UUID,
    store_id: UUID,
    rows: Iterable[dict[str, str]],
    products: dict[str, Product],
    counts: ImportCounts,
) -> None:
    existing = {
        item.product_id: item
        for item in db.scalars(
            select(Inventory).where(
                Inventory.tenant_id == tenant_id,
                Inventory.store_id == store_id,
            )
        ).all()
    }
    for row in rows:
        sku = _text(row.get("sku"), upper=True)
        product = products.get(sku or "")
        try:
            stock_quantity = _integer(row.get("stock_quantity"))
            reorder_level = _integer(row.get("reorder_level"))
        except ValueError:
            counts.skipped += 1
            continue
        if not product or stock_quantity < 0 or reorder_level < 0:
            counts.skipped += 1
            continue

        values = {
            "stock_quantity": stock_quantity,
            "reorder_level": reorder_level,
        }
        item = existing.get(product.id)
        if not item:
            item = Inventory(
                tenant_id=tenant_id,
                store_id=store_id,
                product_id=product.id,
                **values,
            )
            db.add(item)
            existing[product.id] = item
            counts.created += 1
        elif _set_changed(item, values):
            counts.updated += 1
        else:
            counts.unchanged += 1


def _aggregate_sales(
    rows: Iterable[dict[str, str]],
    counts: ImportCounts,
) -> dict[str, dict[str, Any]]:
    orders: dict[str, dict[str, Any]] = {}
    for row in rows:
        try:
            order_id = _text(row.get("order_id"))
            quantity = _integer(row.get("quantity"))
            amount = _money(row.get("amount"))
            occurred_at = _timestamp(row.get("order_date"))
        except ValueError:
            counts.skipped += 1
            continue
        if not order_id or row.get("transaction_type") != "sale" or quantity <= 0 or amount <= 0:
            counts.skipped += 1
            continue

        order = orders.setdefault(
            order_id,
            {
                "occurred_at": occurred_at,
                "currency": _text(row.get("currency"), upper=True) or "INR",
                "total_amount": Decimal("0.00"),
                "item_count": 0,
            },
        )
        order["occurred_at"] = min(order["occurred_at"], occurred_at)
        order["total_amount"] += amount
        order["item_count"] += quantity
    return orders


def _upsert_sales(
    db: Session,
    tenant_id: UUID,
    store_id: UUID,
    seller_id: UUID,
    source_system: str,
    rows: Iterable[dict[str, str]],
    counts: ImportCounts,
) -> None:
    orders = _aggregate_sales(rows, counts)
    existing = {
        item.external_reference: item
        for item in db.scalars(
            select(SalesTransaction).where(
                SalesTransaction.tenant_id == tenant_id,
                SalesTransaction.store_id == store_id,
                SalesTransaction.source_system == source_system,
                SalesTransaction.external_reference.in_(orders),
            )
        ).all()
    }
    for external_reference, values in orders.items():
        transaction = existing.get(external_reference)
        record = {
            "seller_id": seller_id,
            "occurred_at": values["occurred_at"],
            "currency": values["currency"],
            "total_amount": values["total_amount"].quantize(Decimal("0.01")),
            "item_count": values["item_count"],
            "status": TransactionStatus.COMPLETED,
            "notes": "Imported from cleaned sales data",
        }
        if not transaction:
            db.add(
                SalesTransaction(
                    tenant_id=tenant_id,
                    store_id=store_id,
                    source_system=source_system,
                    external_reference=external_reference,
                    **record,
                )
            )
            counts.created += 1
        elif _set_changed(transaction, record):
            counts.updated += 1
        else:
            counts.unchanged += 1


def _upsert_customers(
    db: Session,
    tenant_id: UUID,
    assigned_seller_id: UUID,
    source_system: str,
    rows: Iterable[dict[str, str]],
    counts: ImportCounts,
) -> None:
    existing = {
        item.external_customer_id: item
        for item in db.scalars(
            select(Customer).where(
                Customer.tenant_id == tenant_id,
                Customer.source_system == source_system,
            )
        ).all()
    }
    for row in rows:
        external_customer_id = _text(row.get("customer_id"))
        try:
            values = {
                "assigned_seller_id": assigned_seller_id,
                "last_purchase": _timestamp(row.get("last_purchase")),
                "order_count": _integer(row.get("order_count")),
                "item_quantity": _integer(row.get("item_quantity")),
                "total_revenue": _money(row.get("total_revenue")),
                "recency_days": _integer(row.get("recency_days")),
            }
        except ValueError:
            counts.skipped += 1
            continue
        if (
            not external_customer_id
            or values["order_count"] < 0
            or values["item_quantity"] < 0
            or values["total_revenue"] < 0
            or values["recency_days"] < 0
        ):
            counts.skipped += 1
            continue
        customer = existing.get(external_customer_id)
        if not customer:
            customer = Customer(
                tenant_id=tenant_id,
                source_system=source_system,
                external_customer_id=external_customer_id,
                **values,
            )
            db.add(customer)
            existing[external_customer_id] = customer
            counts.created += 1
        elif _set_changed(customer, values):
            counts.updated += 1
        else:
            counts.unchanged += 1


def import_milestone1_data(
    db: Session,
    *,
    tenant_id: UUID,
    store_id: UUID,
    seller_id: UUID,
    sales_path: Path,
    inventory_path: Path,
    customer_path: Path | None = None,
    source_system: str = "amazon_sales",
    customer_source_system: str = "online_retail_ii",
) -> DataImportReport:
    if not source_system or len(source_system) > 40:
        raise ValueError("source_system must contain between 1 and 40 characters")

    sales_rows = _read_rows(sales_path, SALES_REQUIRED_COLUMNS, "sales")
    inventory_rows = _read_rows(
        inventory_path,
        INVENTORY_REQUIRED_COLUMNS,
        "inventory",
    )
    customer_rows = (
        _read_rows(customer_path, CUSTOMER_REQUIRED_COLUMNS, "customers") if customer_path else []
    )
    report = DataImportReport()
    candidates = _prepare_products(sales_rows, inventory_rows)
    products = _upsert_products(db, tenant_id, candidates, report.products)
    _upsert_inventory(
        db,
        tenant_id,
        store_id,
        inventory_rows,
        products,
        report.inventory,
    )
    _upsert_sales(
        db,
        tenant_id,
        store_id,
        seller_id,
        source_system,
        sales_rows,
        report.sales,
    )
    if customer_rows:
        _upsert_customers(
            db,
            tenant_id,
            seller_id,
            customer_source_system,
            customer_rows,
            report.customers,
        )
    db.flush()
    return report
