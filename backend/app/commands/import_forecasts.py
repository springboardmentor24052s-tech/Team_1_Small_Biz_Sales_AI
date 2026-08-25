import argparse
import json
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.identity import Store, Tenant, User
from app.services.forecast_import import import_forecasts
from app.services.identity import normalize_email


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import versioned MarketMind forecasts.")
    parser.add_argument("--tenant", required=True, help="Tenant slug")
    parser.add_argument("--predictions", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--scope", choices=("business", "store", "personal"), required=True)
    parser.add_argument("--store", help="Store code for store scope")
    parser.add_argument("--seller", help="Seller email for personal scope")
    parser.add_argument("--source-store-id", help="Optional source store filter")
    parser.add_argument(
        "--product-mapping",
        type=Path,
        help=(
            "Optional validated CSV mapping source_store_id/source_product_id to "
            "store_code/product_sku"
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    with SessionLocal() as db:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == args.tenant))
        if tenant is None:
            raise SystemExit(f"Tenant not found: {args.tenant}")
        store = None
        if args.store:
            store = db.scalar(
                select(Store).where(Store.tenant_id == tenant.id, Store.code == args.store)
            )
            if store is None:
                raise SystemExit(f"Store not found in tenant: {args.store}")
        seller = None
        if args.seller:
            seller = db.scalar(
                select(User).where(
                    User.tenant_id == tenant.id,
                    User.email == normalize_email(args.seller),
                )
            )
            if seller is None:
                raise SystemExit(f"Seller not found in tenant: {args.seller}")
        try:
            result = import_forecasts(
                db,
                tenant_id=tenant.id,
                predictions_path=args.predictions,
                report_path=args.report,
                scope_type=args.scope,
                store_id=store.id if store else None,
                seller_id=seller.id if seller else None,
                source_store_id=args.source_store_id,
                product_mapping_path=args.product_mapping,
            )
            db.commit()
        except Exception:
            db.rollback()
            raise
    print(json.dumps(result.to_dict(), indent=2))


if __name__ == "__main__":
    main()
