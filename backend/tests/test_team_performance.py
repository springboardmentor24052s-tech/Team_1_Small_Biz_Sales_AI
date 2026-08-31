from datetime import UTC, datetime
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from app.models.sales import SalesTransaction
from tests.conftest import TEST_PASSWORD, auth_header, create_user, login


def add_sale(db, tenant, store, seller, reference, amount, day):
    db.add(
        SalesTransaction(
            tenant_id=tenant.id,
            store_id=store.id,
            seller_id=seller.id,
            source_system="test",
            external_reference=reference,
            occurred_at=datetime(2026, 8, day, tzinfo=UTC),
            currency="INR",
            total_amount=Decimal(amount),
            item_count=2,
            status="completed",
        )
    )
    db.commit()


def test_team_performance_scope_and_targets(
    client: TestClient, db: Session, tenant: Tenant, store: Store
):
    owner = create_user(
        db, tenant=tenant, store=store, role_code="business_owner", email="owner.team@example.com"
    )
    manager = create_user(
        db, tenant=tenant, store=store, role_code="store_manager", email="manager.team@example.com"
    )
    seller = create_user(
        db, tenant=tenant, store=store, role_code="sales_executive", email="seller.team@example.com"
    )
    add_sale(db, tenant, store, seller, "TEAM-1", "12000", 10)
    add_sale(db, tenant, store, seller, "TEAM-2", "8000", 11)

    owner_token = login(client, owner.email)
    overview = client.get("/api/v1/team/overview", headers=auth_header(owner_token))
    assert overview.status_code == 200, overview.text
    assert overview.json()["total_employees"] == 2
    performances = {item["role_code"]: item for item in overview.json()["employees"]}
    assert Decimal(performances["sales_executive"]["metrics"]["revenue"]) == Decimal("20000")
    assert Decimal(performances["store_manager"]["metrics"]["revenue"]) == Decimal("20000")

    manager_token = login(client, manager.email)
    manager_view = client.get("/api/v1/team/overview", headers=auth_header(manager_token))
    assert manager_view.status_code == 200
    assert [item["employee_id"] for item in manager_view.json()["employees"]] == [str(seller.id)]

    seller_token = login(client, seller.email)
    seller_view = client.get("/api/v1/team/overview", headers=auth_header(seller_token))
    assert seller_view.status_code == 200
    assert seller_view.json()["employees"][0]["employee_id"] == str(seller.id)

    reauth = client.post(
        "/api/v1/auth/reauthenticate",
        json={"password": TEST_PASSWORD},
        headers=auth_header(owner_token),
    )
    target = client.post(
        f"/api/v1/team/employees/{seller.id}/targets",
        json={
            "target_value": "25000",
            "period_start": "2026-08-01",
            "period_end": "2026-08-31",
            "metric": "revenue",
        },
        headers={
            **auth_header(owner_token),
            "X-Reauth-Token": reauth.json()["reauth_token"],
        },
    )
    assert target.status_code == 201, target.text
    assert target.json()["target"]["completion_percentage"] == 80.0
    assert target.json()["target"]["remaining_value"] == "5000.00"

    forbidden = client.post(
        f"/api/v1/team/employees/{seller.id}/targets",
        json={
            "target_value": "30000",
            "period_start": "2026-09-01",
            "period_end": "2026-09-30",
            "metric": "revenue",
        },
        headers=auth_header(manager_token),
    )
    assert forbidden.status_code in {401, 403}
