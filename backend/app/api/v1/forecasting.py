from collections import Counter
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from app.api.dependencies import DBSession, require_permissions
from app.core.permissions import Permissions
from app.models.forecasting import ForecastJob, ForecastModelRun, ForecastPrediction
from app.models.identity import RoleCode, User
from app.schemas.forecasting import (
    DemandForecastResponse,
    ForecastJobStatus,
    ForecastModelStatus,
    ForecastMonitoringResponse,
    ForecastPoint,
    ForecastResponse,
    ModelMetric,
    ProductDemandForecast,
)
from app.services.forecasting import demand_groups, latest_forecast_run, prediction_rows

router = APIRouter(prefix="/forecasts", tags=["AI Forecasting"])

forecast_reader = require_permissions(Permissions.DASHBOARD_FORECASTS_VIEW)
personal_reader = require_permissions(Permissions.DASHBOARD_FORECASTS_PERSONAL)
monitor_reader = require_permissions(Permissions.DASHBOARD_FORECASTS_MONITOR)


def _metric(item: dict) -> ModelMetric:
    return ModelMetric(**item)


def _point(item: ForecastPrediction) -> ForecastPoint:
    return ForecastPoint(
        date=item.forecast_date,
        actual=item.actual,
        predicted=item.predicted,
        lower_bound=item.lower_bound,
        upper_bound=item.upper_bound,
    )


def _comparison(model_run: ForecastModelRun) -> list[ModelMetric]:
    return [_metric(item) for item in model_run.candidate_metrics]


def _forecast_response(
    model_run: ForecastModelRun,
    rows: list[ForecastPrediction],
    horizon: int,
) -> ForecastResponse:
    predicted_total = sum((row.predicted for row in rows), Decimal("0"))
    series_model = rows[0] if rows else None
    direction = "increase" if rows and rows[-1].predicted >= rows[0].predicted else "decrease"
    return ForecastResponse(
        model_version=model_run.model_version,
        generated_at=model_run.trained_at,
        forecast_type=model_run.forecast_type,
        target=model_run.target,
        unit=model_run.unit,
        granularity=model_run.granularity,
        horizon_days=horizon,
        scope=model_run.scope_type,
        scope_id=model_run.seller_id or model_run.store_id,
        algorithm=series_model.algorithm if series_model else model_run.algorithm,
        metrics=_metric(series_model.metrics if series_model else model_run.metrics),
        model_comparison=[
            _metric(item)
            for item in (
                series_model.candidate_metrics if series_model else model_run.candidate_metrics
            )
        ],
        series=[_point(row) for row in rows],
        insights=[
            f"The selected model expects a {direction} over the next {horizon} days.",
            f"Predicted total for the selected period is {predicted_total:.2f} {model_run.unit}.",
        ],
    )


def _role_required(user: User, allowed: set[RoleCode]) -> None:
    if user.role.code not in allowed:
        raise HTTPException(status_code=403, detail="This forecast is not available for your role")


def _validate_horizon(horizon: int) -> None:
    if horizon not in {7, 14, 30}:
        raise HTTPException(status_code=422, detail="horizon must be 7, 14 or 30 days")


@router.get("/revenue", response_model=ForecastResponse)
def revenue_forecast(
    db: DBSession,
    horizon: int = Query(default=14),
    category: str = Query(default="ALL", max_length=80),
    user: User = Depends(forecast_reader),
):
    _role_required(user, {RoleCode.BUSINESS_OWNER, RoleCode.ADMINISTRATOR})
    _validate_horizon(horizon)
    model_run = latest_forecast_run(
        db, tenant_id=user.tenant_id, forecast_type="revenue", scope_type="business"
    )
    if model_run is None:
        raise HTTPException(status_code=404, detail="No revenue forecast is available")
    rows = prediction_rows(db, model_run_id=model_run.id, horizon=horizon, category=category)
    if not rows:
        raise HTTPException(status_code=404, detail="No forecast matches the selected category")
    return _forecast_response(model_run, rows, horizon)


@router.get("/personal", response_model=ForecastResponse)
def personal_forecast(
    db: DBSession,
    horizon: int = Query(default=14),
    seller_id: UUID | None = Query(default=None),
    user: User = Depends(personal_reader),
):
    _role_required(user, {RoleCode.SALES_EXECUTIVE, RoleCode.ADMINISTRATOR})
    _validate_horizon(horizon)
    target_seller = seller_id if user.role.code == RoleCode.ADMINISTRATOR else user.id
    if target_seller is None:
        raise HTTPException(status_code=422, detail="seller_id is required for administrators")
    model_run = latest_forecast_run(
        db,
        tenant_id=user.tenant_id,
        forecast_type="revenue",
        scope_type="personal",
        seller_id=target_seller,
    )
    if model_run is None:
        raise HTTPException(status_code=404, detail="No personal forecast is available")
    rows = prediction_rows(db, model_run_id=model_run.id, horizon=horizon, category="ALL")
    return _forecast_response(model_run, rows, horizon)


@router.get("/demand", response_model=DemandForecastResponse)
def demand_forecast(
    db: DBSession,
    horizon: int = Query(default=14),
    store_id: UUID | None = Query(default=None),
    category: str | None = Query(default=None, max_length=80),
    product: str | None = Query(default=None, max_length=80),
    user: User = Depends(forecast_reader),
):
    _role_required(user, {RoleCode.STORE_MANAGER, RoleCode.ADMINISTRATOR})
    _validate_horizon(horizon)
    target_store = store_id if user.role.code == RoleCode.ADMINISTRATOR else user.store_id
    if target_store is None:
        raise HTTPException(status_code=422, detail="store_id is required")
    model_run = latest_forecast_run(
        db,
        tenant_id=user.tenant_id,
        forecast_type="demand",
        scope_type="store",
        store_id=target_store,
    )
    if model_run is None:
        raise HTTPException(status_code=404, detail="No product demand forecast is available")
    groups = demand_groups(
        db,
        model_run_id=model_run.id,
        store_id=target_store,
        horizon=horizon,
        category=category,
        source_product_id=product,
    )
    products = [
        ProductDemandForecast(
            **{key: value for key, value in item.items() if key != "rows"},
            series=[_point(row) for row in item["rows"]],
        )
        for item in groups
    ]
    increasing = sum(1 for item in groups if item["rows"][-1].predicted > item["rows"][0].predicted)
    decreasing = sum(1 for item in groups if item["rows"][-1].predicted < item["rows"][0].predicted)
    risks = sum(1 for item in groups if item["stock_risk"] in {"high", "medium"})
    return DemandForecastResponse(
        model_version=model_run.model_version,
        generated_at=model_run.trained_at,
        forecast_type=model_run.forecast_type,
        target=model_run.target,
        unit=model_run.unit,
        granularity=model_run.granularity,
        horizon_days=horizon,
        scope=model_run.scope_type,
        scope_id=target_store,
        algorithm=model_run.algorithm,
        metrics=_metric(model_run.metrics),
        model_comparison=_comparison(model_run),
        total_products=len(products),
        increasing_demand=increasing,
        decreasing_demand=decreasing,
        potential_stock_risk=risks,
        products=products,
        insights=[
            f"Demand was forecast for {len(products)} products over {horizon} days.",
            f"{risks} mapped products need inventory attention.",
        ],
    )


@router.get("/monitoring", response_model=ForecastMonitoringResponse)
def forecast_monitoring(
    db: DBSession,
    user: User = Depends(monitor_reader),
):
    _role_required(user, {RoleCode.ADMINISTRATOR})
    models = list(
        db.scalars(
            select(ForecastModelRun)
            .where(ForecastModelRun.tenant_id == user.tenant_id)
            .order_by(ForecastModelRun.trained_at.desc())
        ).all()
    )
    jobs = list(
        db.scalars(
            select(ForecastJob)
            .where(ForecastJob.tenant_id == user.tenant_id)
            .order_by(ForecastJob.completed_at.desc())
            .limit(20)
        ).all()
    )
    counts = Counter(job.status for job in jobs)
    latest = models[0] if models else None
    return ForecastMonitoringResponse(
        engine_status="active" if models else "not_trained",
        api_status="healthy",
        model_version=latest.model_version if latest else None,
        current_model=latest.algorithm if latest else None,
        last_forecast_generated=latest.trained_at if latest else None,
        successful_jobs=counts["success"],
        failed_jobs=counts["failed"],
        supported_horizons=[7, 14, 30],
        models=[
            ForecastModelStatus(
                model_version=item.model_version,
                forecast_type=item.forecast_type,
                scope=item.scope_type,
                algorithm=item.algorithm,
                status=item.status,
                metrics=_metric(item.metrics),
                trained_at=item.trained_at,
            )
            for item in models
        ],
        recent_jobs=[
            ForecastJobStatus(
                reference=item.external_reference,
                job_type=item.job_type,
                status=item.status,
                record_count=item.record_count,
                started_at=item.started_at,
                completed_at=item.completed_at,
            )
            for item in jobs
        ],
    )
