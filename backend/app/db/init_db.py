from sqlalchemy.orm import Session
import logging

from backend.app.db.session import engine, Base
from backend.app.models.product import Product
from backend.app.models.customer import Customer
from backend.app.models.sale import SaleTransaction
from backend.app.models.user import User
from backend.app.core.security import get_password_hash

logger = logging.getLogger("marketmind.init_db")

def init_db(db: Session) -> None:
    # Create all tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # Seed Initial Products if database is empty
    if db.query(Product).count() == 0:
        logger.info("Seeding initial products into database...")
        initial_products = [
            Product(id="SKU-501", name="AI POS Terminal X1", category="Terminals", stock=68, min_stock=15, unit_price=499.00, status="In Stock", supplier="NextGen POS", sales_count=420, revenue=63000.0, growth=24.0),
            Product(id="SKU-902", name="Thermal Receipt Paper (Box of 50)", category="Supplies", stock=4, min_stock=25, unit_price=45.00, status="Low Stock", supplier="Papyrus Tech", sales_count=550, revenue=24750.0, growth=15.0),
            Product(id="SKU-441", name="Bluetooth Barcode Scanner HD", category="Hardware", stock=2, min_stock=15, unit_price=129.00, status="Critical", supplier="OptiScan", sales_count=280, revenue=36120.0, growth=12.0),
            Product(id="SKU-108", name="USB-C Heavy Duty Cash Drawer", category="Hardware", stock=1, min_stock=10, unit_price=189.00, status="Critical", supplier="SecureVault", sales_count=190, revenue=35910.0, growth=8.0),
            Product(id="SKU-312", name="Dual Screen Customer Display", category="Terminals", stock=45, min_stock=10, unit_price=299.00, status="In Stock", supplier="NextGen POS", sales_count=160, revenue=47840.0, growth=18.0),
            Product(id="SKU-774", name="Cloud Router Enterprise", category="Networking", stock=32, min_stock=10, unit_price=149.00, status="In Stock", supplier="NetPulse Corp", sales_count=210, revenue=31290.0, growth=22.0),
            Product(id="SKU-602", name="Label Roll Sticker Pack", category="Supplies", stock=120, min_stock=30, unit_price=18.00, status="In Stock", supplier="Papyrus Tech", sales_count=680, revenue=12240.0, growth=10.0),
            Product(id="SKU-801", name="Cloud Retail Pro License", category="Software Licenses", stock=999, min_stock=50, unit_price=89.00, status="In Stock", supplier="MarketMind Tech", sales_count=310, revenue=27590.0, growth=30.0),
        ]
        db.add_all(initial_products)
        db.commit()

    # Seed Initial Customers if empty
    if db.query(Customer).count() == 0:
        logger.info("Seeding initial customers into database...")
        initial_customers = [
            Customer(id="CUST-001", name="Apex Logistics Inc", tier="Enterprise Platinum", lifetime_value=142500.0, last_purchase="2026-07-24", status="Active", churn_risk=0.12),
            Customer(id="CUST-002", name="BlueHorizon Cafe Chain", tier="Gold Tier", lifetime_value=68400.0, last_purchase="2026-07-26", status="Active", churn_risk=0.08),
            Customer(id="CUST-003", name="Urban Style Outlets", tier="Gold Tier", lifetime_value=52100.0, last_purchase="2026-06-18", status="Needs Followup", churn_risk=0.42),
            Customer(id="CUST-004", name="Metro Health Pharmacy", tier="Silver Tier", lifetime_value=28900.0, last_purchase="2026-07-10", status="Active", churn_risk=0.15),
            Customer(id="CUST-005", name="GreenBite Organics", tier="Silver Tier", lifetime_value=19800.0, last_purchase="2026-07-02", status="Active", churn_risk=0.10),
        ]
        db.add_all(initial_customers)
        db.commit()

    # Seed Initial Users if empty
    if db.query(User).count() == 0:
        logger.info("Seeding system admin and owner users...")
        initial_users = [
            User(id="USR-101", email="owner@business.com", name="Eleanor Vance", role="owner", hashed_password=get_password_hash("owner123")),
            User(id="USR-102", email="manager@store.com", name="Robert Chen", role="manager", hashed_password=get_password_hash("manager123")),
            User(id="USR-103", email="sales@team.com", name="Sophia Martinez", role="sales", hashed_password=get_password_hash("sales123")),
            User(id="USR-104", email="admin@system.com", name="Alexander Wright", role="admin", hashed_password=get_password_hash("admin123")),
        ]
        db.add_all(initial_users)
        db.commit()

    # Seed Initial Sale Transactions if empty
    if db.query(SaleTransaction).count() == 0:
        logger.info("Seeding initial sales transactions into database...")
        initial_sales = [
            SaleTransaction(id="SALE-101", customer_id="CUST-001", product_id="SKU-501", name="Apex Logistics Deal", contact="Marcus Vance", amount=14500.0, stage="Proposal Sent", ai_probability=0.88, priority="High"),
            SaleTransaction(id="SALE-102", customer_id="CUST-002", product_id="SKU-902", name="BlueHorizon Cafe POS Bundle", contact="Sarah Jenkins", amount=8200.0, stage="Closing Stage", ai_probability=0.94, priority="High"),
            SaleTransaction(id="SALE-103", customer_id="CUST-003", product_id="SKU-441", name="Urban Style Hardware Upgrade", contact="David Kim", amount=18000.0, stage="Demo Scheduled", ai_probability=0.72, priority="Medium"),
            SaleTransaction(id="SALE-104", customer_id="CUST-004", product_id="SKU-108", name="Metro Health Cash Drawer Rollout", contact="Dr. Elena Rostova", amount=22500.0, stage="New Prospect", ai_probability=0.65, priority="Medium"),
            SaleTransaction(id="SALE-105", customer_id="CUST-005", product_id="SKU-602", name="GreenBite Organics Supplies Order", contact="Liam O'Connor", amount=6400.0, stage="Proposal Sent", ai_probability=0.82, priority="High"),
        ]
        db.add_all(initial_sales)
        db.commit()

