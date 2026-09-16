from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth,
    dashboard,
    sales,
    inventory,
    customers,
    admin,
    users,
    recommendations,
)

api_router = APIRouter()

# Register all Milestone 1, Milestone 2, and Milestone 3 routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboards"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales Management"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory Management"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customer Intelligence"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration & Audit"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Product Recommendations"])
