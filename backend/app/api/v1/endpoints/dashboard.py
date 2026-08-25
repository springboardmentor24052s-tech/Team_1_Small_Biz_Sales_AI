from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.app.db.session import get_db
from backend.app.models.product import Product
from backend.app.models.customer import Customer
from backend.app.models.sale import SaleTransaction

router = APIRouter()

@router.get("/owner", summary="Get Owner Strategic Dashboard Metrics")
def get_owner_dashboard(db: Session = Depends(get_db)) -> Dict[str, Any]:
    products_count = db.query(Product).count()
    customers_count = db.query(Customer).count()
    sales_count = db.query(SaleTransaction).count()

    return {
        "kpis": {
            "totalRevenue": {"value": "$148,520", "change": "+18.4%", "isPositive": True},
            "totalOrders": {"value": str(sales_count if sales_count > 0 else 1842), "change": "+12.1%", "isPositive": True},
            "totalCustomers": {"value": str(customers_count if customers_count > 0 else 2450), "change": "+8.6%", "isPositive": True},
            "grossProfit": {"value": "$42,180", "change": "+14.2%", "isPositive": True}
        },
        "salesTrend": [
            {"month": "Jan", "revenue": 68000, "expenses": 42000, "profit": 26000},
            {"month": "Feb", "revenue": 74000, "expenses": 45000, "profit": 29000},
            {"month": "Mar", "revenue": 89000, "expenses": 48000, "profit": 41000},
            {"month": "Apr", "revenue": 95000, "expenses": 51000, "profit": 44000},
            {"month": "May", "revenue": 112000, "expenses": 58000, "profit": 54000},
            {"month": "Jun", "revenue": 128000, "expenses": 62000, "profit": 66000},
            {"month": "Jul", "revenue": 148520, "expenses": 68000, "profit": 80520}
        ],
        "categoryDistribution": [
            {"name": "Electronics & Smart Gear", "value": 45, "color": "#4f46e5"},
            {"name": "Office Equipment", "value": 25, "color": "#06b6d4"},
            {"name": "POS & Peripherals", "value": 18, "color": "#10b981"},
            {"name": "Software Licenses", "value": 12, "color": "#f59e0b"}
        ],
        "topProducts": [
            {"name": "AI POS Terminal X1", "sales": 420, "revenue": "$63,000", "growth": "+24%"},
            {"name": "Wireless Thermal Printer", "sales": 310, "revenue": "$27,900", "growth": "+18%"},
            {"name": "Smart Barcode Scanner", "sales": 280, "revenue": "$22,400", "growth": "+12%"},
            {"name": "Cloud Retail Pro License", "sales": 210, "revenue": "$18,900", "growth": "+30%"}
        ],
        "aiRecommendations": [
            {
                "id": 1,
                "title": "Stock Reorder Recommendation",
                "description": "Predictive analytics forecast 35% higher demand for AI POS Terminal X1 next month due to holiday retail rush.",
                "impact": "High Impact (+ $12.4k Est. Revenue)",
                "type": "warning",
                "actionLabel": "Generate Supplier PO"
            },
            {
                "id": 2,
                "title": "Customer Retargeting Opportunity",
                "description": "142 recurring business accounts have not ordered in 45 days. AI suggests automated promotional workflow.",
                "impact": "Medium Impact ($6.8k Retention)",
                "type": "insight",
                "actionLabel": "Launch Email Campaign"
            }
        ]
    }

@router.get("/manager", summary="Get Store Manager Inventory Metrics")
def get_manager_dashboard(db: Session = Depends(get_db)) -> Dict[str, Any]:
    low_stock = db.query(Product).filter(Product.stock <= 5).all()
    return {
        "kpis": {
            "totalSKUs": {"value": "1,240 SKUs", "change": "+32 new", "isPositive": True},
            "lowStockItems": {"value": f"{len(low_stock)} Items", "change": "Action Required", "isPositive": False},
            "outOfStock": {"value": "3 Items", "change": "Critical Alert", "isPositive": False},
            "pendingOrders": {"value": "6 Orders", "change": "In Transit", "isPositive": True}
        }
    }

@router.get("/sales", summary="Get Sales Rep Pipeline Metrics")
def get_sales_dashboard(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return {
        "kpis": {
            "monthlyTarget": {"value": "$45,000 / $50,000", "percentage": "90%", "isPositive": True},
            "closedDeals": {"value": "34 Deals", "change": "+6 this week", "isPositive": True},
            "pipelineValue": {"value": "$124,800", "change": "18 Active Leads", "isPositive": True},
            "winRate": {"value": "68.4%", "change": "+4.2% vs avg", "isPositive": True}
        }
    }

@router.get("/admin", summary="Get System Admin Metrics")
def get_admin_dashboard(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return {
        "systemMetrics": {
            "apiLatency": "38 ms",
            "cpuUsage": "14%",
            "memoryUsage": "3.4 GB / 8 GB",
            "uptime": "99.99%",
            "activeSessions": 142
        }
    }
