import argparse
import json
from pathlib import Path

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.identity import Tenant, User
from app.services.identity import normalize_email
from app.services.segmentation_import import import_customer_segments


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import versioned customer segment assignments into MarketMind."
    )
    parser.add_argument("--tenant", required=True, help="Tenant slug")
    parser.add_argument("--seller", required=True, help="Seller email for customer assignment")
    parser.add_argument("--assignments", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--source-system", default="online_retail_ii")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    with SessionLocal() as db:
        tenant = db.scalar(select(Tenant).where(Tenant.slug == args.tenant))
        if tenant is None:
            raise SystemExit(f"Tenant not found: {args.tenant}")
        seller = db.scalar(
            select(User).where(
                User.tenant_id == tenant.id,
                User.email == normalize_email(args.seller),
            )
        )
        if seller is None:
            raise SystemExit(f"Seller not found in tenant: {args.seller}")
        try:
            result = import_customer_segments(
                db,
                tenant_id=tenant.id,
                assignments_path=args.assignments,
                report_path=args.report,
                source_system=args.source_system,
                assigned_seller_id=seller.id,
            )
            db.commit()
        except Exception:
            db.rollback()
            raise
    print(json.dumps(result.to_dict(), indent=2))


if __name__ == "__main__":
    main()
