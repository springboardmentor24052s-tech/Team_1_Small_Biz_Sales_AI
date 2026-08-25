from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import CurrentUser, DBSession, require_permissions
from app.core.permissions import Permissions
from app.schemas.ai_config import (
    AIConfigResponse,
    AIHyperparameterUpdate,
    AIRetrainRequest,
)
from app.schemas.common import MessageResponse
from app.services.ai_config import (
    get_ai_config,
    get_model_registry,
    retrain_models,
    update_ai_config,
)

router = APIRouter(prefix="/admin/ai-config", tags=["AI Configuration & Administration"])


@router.get("", response_model=AIConfigResponse)
def get_configuration_and_registry(
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.MODELS_MANAGE)),
):
    """Returns active model registry, validation metrics, and current hyperparameters."""
    return get_model_registry(db, user.tenant_id)


@router.put("", response_model=dict)
def update_hyperparameters(
    payload: AIHyperparameterUpdate,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.MODELS_MANAGE)),
):
    """Updates model hyperparameters and sensitivity thresholds."""
    updates = payload.model_dump(exclude_unset=True)
    return update_ai_config(user.tenant_id, updates)


@router.post("/retrain", response_model=dict)
def trigger_retraining(
    payload: AIRetrainRequest,
    user: CurrentUser,
    db: DBSession,
    _auth: None = Depends(require_permissions(Permissions.MODELS_MANAGE)),
):
    """Manually triggers training for specified or all AI modules."""
    return retrain_models(db, user.tenant_id, modules=payload.modules)

