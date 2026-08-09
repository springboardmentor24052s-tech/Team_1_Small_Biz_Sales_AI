from datetime import UTC, datetime
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.identity import Store, Tenant
from app.models.segmentation import CustomerSegmentAssignment, SegmentationModelRun
from tests.conftest import auth_header, create_user, login


def _add_assignment(
    db: Session,
    *,
    tenant: Tenant,
    run: SegmentationModelRun,
    customer: Customer,
    cluster_id: int,
    code: str,
    name: str,
    engagement: str,
) -> None:
    db.add(
        CustomerSegmentAssignment(
            tenant_id=tenant.id,
            model_run_id=run.id,
            customer_id=customer.id,
            cluster_id=cluster_id,
            segment_code=code,
            segment_name=name,
            first_purchase=datetime(2011, 1, 1, tzinfo=UTC),
            average_order_value=Decimal("125.00"),
            average_basket_size=Decimal("4.0000"),
            active_days=4,
            active_months=3,
            product_variety=8,
            tenure_days=300,
            average_days_between_orders=Decimal("45.0000"),
            return_order_count=1,
            returned_value=Decimal("20.00"),
            return_rate=Decimal("0.100000"),
            purchase_frequency_30d=Decimal("0.4000"),
            engagement_score=Decimal(engagement),
        )
    )


def test_segment_summary_and_customer_access_follow_role_scope(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
):
    owner = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="owner.segments@example.com",
    )
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="manager.segments@example.com",
    )
    assigned_sales = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="assigned.segments@example.com",
    )
    other_sales = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="other.segments@example.com",
    )
    customers = [
        Customer(
            tenant_id=tenant.id,
            assigned_seller_id=assigned_sales.id,
            source_system="online_retail_ii",
            external_customer_id=f"SEG-CUST-{index}",
            last_purchase=datetime(2011, 12, index + 1, tzinfo=UTC),
            order_count=index + 2,
            item_quantity=(index + 1) * 10,
            total_revenue=Decimal(str((index + 1) * 500)),
            recency_days=(index + 1) * 10,
        )
        for index in range(2)
    ]
    db.add_all(customers)
    run = SegmentationModelRun(
        tenant_id=tenant.id,
        source_system="online_retail_ii",
        model_version="customer-segmentation-v1",
        algorithm="kmeans",
        cluster_count=2,
        silhouette_score=0.61,
        davies_bouldin_score=0.74,
        calinski_harabasz_score=91.2,
        feature_names=["recency_days", "order_count", "total_revenue"],
        metrics={"selected_cluster_count": 2},
        trained_at=datetime(2026, 8, 6, tzinfo=UTC),
    )
    db.add(run)
    db.flush()
    _add_assignment(
        db,
        tenant=tenant,
        run=run,
        customer=customers[0],
        cluster_id=0,
        code="SEG-01",
        name="Champions",
        engagement="90.00",
    )
    _add_assignment(
        db,
        tenant=tenant,
        run=run,
        customer=customers[1],
        cluster_id=1,
        code="SEG-02",
        name="At Risk",
        engagement="35.00",
    )
    db.commit()

    owner_summary = client.get(
        "/api/v1/customer-segments/summary",
        headers=auth_header(login(client, owner.email)),
    )
    assert owner_summary.status_code == 200
    assert owner_summary.json()["scope"] == "business"
    assert owner_summary.json()["customer_count"] == 2
    assert len(owner_summary.json()["segments"]) == 2

    manager_summary = client.get(
        "/api/v1/customer-segments/summary",
        headers=auth_header(login(client, manager.email)),
    )
    assert manager_summary.status_code == 200
    assert manager_summary.json()["scope"] == "store_summary"
    assert manager_summary.json()["customer_count"] == 2

    manager_list = client.get(
        "/api/v1/customer-segments",
        headers=auth_header(login(client, manager.email)),
    )
    assert manager_list.status_code == 403

    assigned_list = client.get(
        "/api/v1/customer-segments",
        headers=auth_header(login(client, assigned_sales.email)),
    )
    assert assigned_list.status_code == 200
    assert assigned_list.json()["total"] == 2

    other_list = client.get(
        "/api/v1/customer-segments",
        headers=auth_header(login(client, other_sales.email)),
    )
    assert other_list.status_code == 200
    assert other_list.json()["total"] == 0
