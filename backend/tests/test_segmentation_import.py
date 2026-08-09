import csv
import json

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.identity import Store, Tenant
from app.models.segmentation import CustomerSegmentAssignment, SegmentationModelRun
from app.services.segmentation_import import import_customer_segments
from tests.conftest import create_user


def test_segmentation_import_is_repeatable(db: Session, tenant: Tenant, store: Store, tmp_path):
    seller = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="segment.import@example.com",
    )
    assignment_path = tmp_path / "customer_segments.csv"
    fields = [
        "customer_id",
        "last_purchase",
        "order_count",
        "item_quantity",
        "total_revenue",
        "recency_days",
        "first_purchase",
        "average_order_value",
        "average_basket_size",
        "active_days",
        "active_months",
        "product_variety",
        "tenure_days",
        "average_days_between_orders",
        "return_order_count",
        "returned_value",
        "return_rate",
        "purchase_frequency_30d",
        "engagement_score",
        "cluster_id",
        "segment_code",
        "segment_name",
        "model_version",
    ]
    with assignment_path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerow(
            {
                "customer_id": "12345",
                "last_purchase": "2011-12-01T00:00:00+00:00",
                "order_count": "4",
                "item_quantity": "20",
                "total_revenue": "500.00",
                "recency_days": "10",
                "first_purchase": "2011-01-01T00:00:00+00:00",
                "average_order_value": "125.00",
                "average_basket_size": "5.0",
                "active_days": "4",
                "active_months": "3",
                "product_variety": "8",
                "tenure_days": "334",
                "average_days_between_orders": "70.0",
                "return_order_count": "1",
                "returned_value": "10.00",
                "return_rate": "0.2",
                "purchase_frequency_30d": "0.36",
                "engagement_score": "82.5",
                "cluster_id": "0",
                "segment_code": "SEG-01",
                "segment_name": "Champions",
                "model_version": "customer-segmentation-v1",
            }
        )
    report_path = tmp_path / "segmentation_report.json"
    report_path.write_text(
        json.dumps(
            {
                "model_version": "customer-segmentation-v1",
                "algorithm": "kmeans",
                "generated_at": "2026-08-06T12:00:00+00:00",
                "feature_names": ["recency_days", "order_count", "total_revenue"],
                "selected_cluster_count": 2,
                "selected_metrics": {
                    "silhouette_score": 0.6,
                    "davies_bouldin_score": 0.7,
                    "calinski_harabasz_score": 90.0,
                },
            }
        ),
        encoding="utf-8",
    )

    first = import_customer_segments(
        db,
        tenant_id=tenant.id,
        assignments_path=assignment_path,
        report_path=report_path,
        assigned_seller_id=seller.id,
    )
    db.commit()
    second = import_customer_segments(
        db,
        tenant_id=tenant.id,
        assignments_path=assignment_path,
        report_path=report_path,
        assigned_seller_id=seller.id,
    )
    db.commit()

    assert first.model_run_created is True
    assert first.customers_created == 1
    assert first.assignments_created == 1
    assert second.model_run_created is False
    assert second.customers_unchanged == 1
    assert second.assignments_unchanged == 1
    assert db.scalar(select(func.count(Customer.id))) == 1
    assert db.scalar(select(func.count(SegmentationModelRun.id))) == 1
    assert db.scalar(select(func.count(CustomerSegmentAssignment.id))) == 1
