import csv
import json
from datetime import date, timedelta

import pyotp
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.forecasting import ForecastModelRun, ForecastPrediction
from app.models.identity import Store, Tenant
from app.models.inventory import Inventory, Product
from app.services.forecast_import import import_forecasts
from tests.conftest import auth_header, create_user, login

FIELDS = [
    "forecast_type",
    "target",
    "unit",
    "granularity",
    "source_store_id",
    "source_product_id",
    "source_category_id",
    "forecast_date",
    "horizon_day",
    "actual",
    "predicted",
    "lower_bound",
    "upper_bound",
]


def _forecast_files(tmp_path, name: str, forecast_type: str):
    predictions = tmp_path / f"{name}.csv"
    report = tmp_path / f"{name}.json"
    target = "daily_net_revenue_inr" if forecast_type == "revenue" else "predicted_demand"
    unit = "INR" if forecast_type == "revenue" else "source_unit"
    with predictions.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS)
        writer.writeheader()
        for horizon in range(1, 31):
            writer.writerow(
                {
                    "forecast_type": forecast_type,
                    "target": target,
                    "unit": unit,
                    "granularity": "day",
                    "source_store_id": "12" if forecast_type == "demand" else "ALL",
                    "source_product_id": "SKU-101" if forecast_type == "demand" else "ALL",
                    "source_category_id": "10" if forecast_type == "demand" else "ALL",
                    "forecast_date": (date(2026, 8, 10) + timedelta(days=horizon)).isoformat(),
                    "horizon_day": horizon,
                    "actual": "",
                    "predicted": 10 + horizon,
                    "lower_bound": 8 + horizon,
                    "upper_bound": 12 + horizon,
                }
            )
    report.write_text(
        json.dumps(
            {
                "model_version": "forecast-v1",
                "forecast_type": forecast_type,
                "source_system": "test_source",
                "target": target,
                "unit": unit,
                "granularity": "day",
                "horizons": [7, 14, 30],
                "generated_at": "2026-08-09T12:00:00+00:00",
                "selected_algorithm": "xgboost",
                "selected_metrics": {
                    "algorithm": "xgboost",
                    "mae": 1.2,
                    "rmse": 1.5,
                    "bias": 0.1,
                    "r2": 0.89,
                },
                "candidate_metrics": [
                    {
                        "algorithm": "seasonal_naive",
                        "mae": 2.0,
                        "rmse": 2.5,
                        "bias": 0.2,
                        "r2": 0.7,
                    },
                    {
                        "algorithm": "xgboost",
                        "mae": 1.2,
                        "rmse": 1.5,
                        "bias": 0.1,
                        "r2": 0.89,
                    },
                ],
                "training_start": "2025-01-01",
                "training_end": "2026-08-08",
            }
        ),
        encoding="utf-8",
    )
    return predictions, report


def _enable_admin_mfa(client: TestClient, email: str) -> str:
    initial = login(client, email)
    setup = client.post("/api/v1/auth/mfa/setup", headers=auth_header(initial))
    secret = setup.json()["secret"]
    confirmed = client.post(
        "/api/v1/auth/mfa/confirm",
        json={"code": pyotp.TOTP(secret).now()},
        headers=auth_header(initial),
    )
    assert confirmed.status_code == 200
    return login(client, email, pyotp.TOTP(secret).now())


def test_forecast_import_is_repeatable(db: Session, tenant: Tenant, tmp_path):
    predictions, report = _forecast_files(tmp_path, "revenue", "revenue")
    first = import_forecasts(
        db,
        tenant_id=tenant.id,
        predictions_path=predictions,
        report_path=report,
        scope_type="business",
    )
    db.commit()
    second = import_forecasts(
        db,
        tenant_id=tenant.id,
        predictions_path=predictions,
        report_path=report,
        scope_type="business",
    )
    db.commit()
    assert first.model_run_created is True
    assert first.predictions_created == 30
    assert second.model_run_created is False
    assert second.predictions_unchanged == 30
    assert db.scalar(select(func.count(ForecastModelRun.id))) == 1
    assert db.scalar(select(func.count(ForecastPrediction.id))) == 30


def test_four_forecast_views_follow_role_scope(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
    tmp_path,
):
    owner = create_user(
        db, tenant=tenant, store=store, role_code="business_owner", email="forecast.owner@test.com"
    )
    manager = create_user(
        db, tenant=tenant, store=store, role_code="store_manager", email="forecast.manager@test.com"
    )
    seller = create_user(
        db,
        tenant=tenant,
        store=store,
        role_code="sales_executive",
        email="forecast.seller@test.com",
    )
    admin = create_user(
        db, tenant=tenant, store=None, role_code="administrator", email="forecast.admin@test.com"
    )
    product = Product(tenant_id=tenant.id, sku="SKU-101", name="Test Product", category="10")
    db.add(product)
    db.flush()
    db.add(
        Inventory(
            tenant_id=tenant.id,
            store_id=store.id,
            product_id=product.id,
            stock_quantity=15,
            reorder_level=5,
        )
    )
    revenue_csv, revenue_report = _forecast_files(tmp_path, "revenue", "revenue")
    demand_csv, demand_report = _forecast_files(tmp_path, "demand", "demand")
    import_forecasts(
        db,
        tenant_id=tenant.id,
        predictions_path=revenue_csv,
        report_path=revenue_report,
        scope_type="business",
    )
    import_forecasts(
        db,
        tenant_id=tenant.id,
        predictions_path=revenue_csv,
        report_path=revenue_report,
        scope_type="personal",
        seller_id=seller.id,
    )
    import_forecasts(
        db,
        tenant_id=tenant.id,
        predictions_path=demand_csv,
        report_path=demand_report,
        scope_type="store",
        store_id=store.id,
        source_store_id="12",
    )
    db.commit()

    owner_headers = auth_header(login(client, owner.email))
    manager_headers = auth_header(login(client, manager.email))
    seller_headers = auth_header(login(client, seller.email))
    admin_headers = auth_header(_enable_admin_mfa(client, admin.email))

    revenue = client.get("/api/v1/forecasts/revenue?horizon=7", headers=owner_headers)
    assert revenue.status_code == 200, revenue.text
    assert revenue.json()["scope"] == "business"
    assert len(revenue.json()["series"]) == 7
    assert client.get("/api/v1/forecasts/demand", headers=owner_headers).status_code == 403

    demand = client.get("/api/v1/forecasts/demand?horizon=14", headers=manager_headers)
    assert demand.status_code == 200, demand.text
    assert demand.json()["scope_id"] == str(store.id)
    assert demand.json()["products"][0]["stock_risk"] == "high"
    assert client.get("/api/v1/forecasts/revenue", headers=manager_headers).status_code == 403

    personal = client.get("/api/v1/forecasts/personal?horizon=30", headers=seller_headers)
    assert personal.status_code == 200, personal.text
    assert personal.json()["scope_id"] == str(seller.id)
    assert len(personal.json()["series"]) == 30
    assert client.get("/api/v1/forecasts/revenue", headers=seller_headers).status_code == 403

    monitoring = client.get("/api/v1/forecasts/monitoring", headers=admin_headers)
    assert monitoring.status_code == 200, monitoring.text
    assert monitoring.json()["engine_status"] == "active"
    assert monitoring.json()["successful_jobs"] == 3
