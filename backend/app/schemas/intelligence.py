from datetime import datetime

from pydantic import BaseModel


class IntelligenceModuleReadiness(BaseModel):
    ready: bool
    observed_records: int
    observed_days: int | None = None
    minimum_records: int
    minimum_days: int | None = None
    blocking_reasons: list[str]
    data_source: str


class IntelligenceReadinessResponse(BaseModel):
    ready_to_train: bool
    refresh_recommended: bool
    new_records_since_last_training: int
    revenue: IntelligenceModuleReadiness
    personal: IntelligenceModuleReadiness
    demand: IntelligenceModuleReadiness
    segmentation: IntelligenceModuleReadiness
    last_job: dict | None


class IntelligenceTrainingResponse(BaseModel):
    reference: str
    status: str
    started_at: datetime
    completed_at: datetime
    modules: dict
    message: str
