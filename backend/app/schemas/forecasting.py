from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ForecastPoint(BaseModel):
    date: date
    actual: Decimal | None
    predicted: Decimal
    lower_bound: Decimal
    upper_bound: Decimal


class ModelMetric(BaseModel):
    algorithm: str
    mae: float | None = None
    rmse: float | None = None
    bias: float | None = None
    r2: float | None = None


class ForecastResponse(BaseModel):
    model_version: str
    generated_at: datetime
    forecast_type: str
    target: str
    unit: str
    granularity: str
    horizon_days: int
    scope: str
    scope_id: UUID | None
    algorithm: str
    metrics: ModelMetric
    model_comparison: list[ModelMetric]
    series: list[ForecastPoint]
    insights: list[str]


class ProductDemandForecast(BaseModel):
    source_store_id: str
    source_product_id: str
    source_category_id: str
    product_id: UUID | None
    predicted_demand: Decimal
    available_stock: int | None
    stock_risk: str
    series: list[ForecastPoint]


class DemandForecastResponse(BaseModel):
    model_version: str
    generated_at: datetime
    forecast_type: str
    target: str
    unit: str
    granularity: str
    horizon_days: int
    scope: str
    scope_id: UUID
    algorithm: str
    metrics: ModelMetric
    model_comparison: list[ModelMetric]
    total_products: int
    increasing_demand: int
    decreasing_demand: int
    potential_stock_risk: int
    products: list[ProductDemandForecast]
    insights: list[str]


class ForecastModelStatus(BaseModel):
    model_version: str
    forecast_type: str
    scope: str
    algorithm: str
    status: str
    metrics: ModelMetric
    trained_at: datetime


class ForecastJobStatus(BaseModel):
    reference: str
    job_type: str
    status: str
    record_count: int
    started_at: datetime
    completed_at: datetime | None


class ForecastMonitoringResponse(BaseModel):
    engine_status: str
    api_status: str
    model_version: str | None
    current_model: str | None
    last_forecast_generated: datetime | None
    successful_jobs: int
    failed_jobs: int
    supported_horizons: list[int]
    models: list[ForecastModelStatus]
    recent_jobs: list[ForecastJobStatus]
