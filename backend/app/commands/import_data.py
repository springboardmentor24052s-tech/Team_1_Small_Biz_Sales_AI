import argparse
import json
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.identity import Store, Tenant, User
from app.services.data_import import import_milestone1_data
from app.services.identity import normalize_email


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import cleaned MarketMind sales and inventory data."
    )
    parser.add_argument("--tenant", required=True, help="Tenant slug")
    parser.add_argument("--store", required=True, help="Store code")
    parser.add_argument("--seller", required=True, help="Seller email for imported transactions")
    parser.add_argument("--sales", required=True, type=Path, help="Cleaned sales CSV")
    parser.add_argument("--inventory", required=True, type=Path, help="Cleaned inventory CSV")
    parser.add_argument("--customers", required=True, type=Path, help="Customer summary CSV")
    parser.add_argument("--source-system", default="amazon_sales")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    with SessionLocal() as db:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == args.tenant))
        if not tenant:
            raise SystemExit(f"Tenant not found: {args.tenant}")

        store = db.scalar(
            select(Store).where(
                Store.tenant_id == tenant.id,
                Store.code == args.store,
            )
        )
        if not store:
            raise SystemExit(f"Store not found for tenant: {args.store}")

        seller = db.scalar(
            select(User).where(
                User.tenant_id == tenant.id,
                User.email == normalize_email(args.seller),
            )
        )
        if not seller:
            raise SystemExit(f"Seller not found for tenant: {args.seller}")
        if seller.store_id and seller.store_id != store.id:
            raise SystemExit("Seller is assigned to a different store")

        try:
            report = import_milestone1_data(
                db,
                tenant_id=tenant.id,
                store_id=store.id,
                seller_id=seller.id,
                sales_path=args.sales,
                inventory_path=args.inventory,
                customer_path=args.customers,
                source_system=args.source_system,
            )
            db.commit()
        except Exception:
            db.rollback()
            raise
        print(json.dumps(report.to_dict(), indent=2))


if __name__ == "__main__":
    main()
