from sqlalchemy import Column, String, Float, ForeignKey
from backend.app.db.session import Base

class SaleTransaction(Base):
    __tablename__ = "sales_transactions"

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    stage = Column(String, default="New Prospect")  # New Prospect, Demo Scheduled, Proposal Sent, Closing Stage
    ai_probability = Column(Float, default=0.75)
    priority = Column(String, default="Medium")
