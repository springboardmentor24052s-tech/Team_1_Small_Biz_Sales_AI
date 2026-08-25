from fastapi import APIRouter

from app.api.v1 import (
    ai_config,
    anomalies,
    audit,
    auth,
    churn,
    customers,
    dashboard,
    forecasting,
    health,
    intelligence,
    inventory,
    invoices,
    notifications,
    onboarding,
    recommendations,
    reports,
    sales,
    segmentation,
    team,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(sales.router)
api_router.include_router(inventory.router)
api_router.include_router(invoices.router)
api_router.include_router(churn.router)
api_router.include_router(recommendations.router)
api_router.include_router(anomalies.router)
api_router.include_router(ai_config.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(onboarding.router)
api_router.include_router(intelligence.router)
api_router.include_router(customers.router)
api_router.include_router(segmentation.router)
api_router.include_router(team.router)
api_router.include_router(forecasting.router)
api_router.include_router(dashboard.router)
api_router.include_router(audit.router)
