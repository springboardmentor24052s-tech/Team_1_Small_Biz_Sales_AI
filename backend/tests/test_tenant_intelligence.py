from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.forecasting import ForecastModelRun
from app.models.identity import Store, Tenant
from app.models.sales import SalesLineItem
from app.models.segmentation import SegmentationModelRun
from tests.conftest import TEST_PASSWORD, auth_header, create_user, login


def _reauth_headers(client: TestClient, token: str):
    response = client.post(
        "/api/v1/auth/reauthenticate",
        json={"password": TEST_PASSWORD},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    return {**auth_header(token), "X-Reauth-Token": response.json()["reauth_token"]}


def test_owner_trains_only_verified_tenant_models(
    client: TestClient, db: Session, tenant: Tenant, store: Store
):
    owner = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="business_owner",
        email="intelligence.owner@example.com",
    )
    token = login(client, owner.email)

    before = client.get("/api/v1/intelligence/readiness", headers=auth_header(token))
    assert before.status_code == 200
    assert before.json()["ready_to_train"] is False

    sample = client.post(
        "/api/v1/onboarding/sample-data",
        headers=_reauth_headers(client, token),
    )
    assert sample.status_code == 200, sample.text
    assert len(db.scalars(select(SalesLineItem)).all()) == 225

    ready = client.get("/api/v1/intelligence/readiness", headers=auth_header(token))
    assert ready.status_code == 200
    assert ready.json()["revenue"]["ready"] is True
    assert ready.json()["demand"]["ready"] is True
    assert ready.json()["segmentation"]["ready"] is True

    trained = client.post(
        "/api/v1/intelligence/train",
        headers=_reauth_headers(client, token),
    )
    assert trained.status_code == 200, trained.text
    payload = trained.json()
    assert payload["modules"]["revenue"]["status"] == "published"
    assert payload["modules"]["segmentation"]["status"] == "published"
    assert payload["modules"]["demand"][0]["status"] in {
        "published",
        "rejected_quality_gate",
    }

    active_runs = db.scalars(
        select(ForecastModelRun).where(
            ForecastModelRun.tenant_id == tenant.id,
            ForecastModelRun.status == "active",
        )
    ).all()
    assert active_runs
    assert all(run.source_system == "evaluation_sample_data" for run in active_runs)
    segment_run = db.scalar(
        select(SegmentationModelRun)
        .where(SegmentationModelRun.tenant_id == tenant.id)
        .order_by(SegmentationModelRun.trained_at.desc())
    )
    assert segment_run
    assert segment_run.silhouette_score >= 0.20


def test_non_owner_cannot_train_tenant_models(
    client: TestClient, db: Session, tenant: Tenant, store: Store
):
    manager = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="store_manager",
        email="intelligence.manager@example.com",
    )
    token = login(client, manager.email)
    response = client.get("/api/v1/intelligence/readiness", headers=auth_header(token))
    assert response.status_code == 403
