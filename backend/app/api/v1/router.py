from fastapi import APIRouter

from app.api.v1 import (
    audit,
    auth,
    customers,
    dashboard,
    forecasting,
    health,
    inventory,
    sales,
    segmentation,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(sales.router)
api_router.include_router(inventory.router)
api_router.include_router(customers.router)
api_router.include_router(segmentation.router)
api_router.include_router(forecasting.router)
api_router.include_router(dashboard.router)
api_router.include_router(audit.router)
