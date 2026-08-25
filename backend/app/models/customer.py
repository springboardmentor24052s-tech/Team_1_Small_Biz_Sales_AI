from sqlalchemy import Column, String, Float
from backend.app.db.session import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True)  # e.g. 'CUST-001'
    name = Column(String, nullable=False, index=True)
    tier = Column(String, default="Silver Tier")  # Enterprise Platinum, Gold Tier, Silver Tier
    lifetime_value = Column(Float, default=0.0)
    last_purchase = Column(String, nullable=True)
    status = Column(String, default="Active")
    churn_risk = Column(Float, default=0.1)  # percentage like 0.12 (12%)
