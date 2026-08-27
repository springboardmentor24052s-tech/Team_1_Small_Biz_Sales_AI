from sqlalchemy import Column, String, Float, Integer
from backend.app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)  # SKU e.g. 'SKU-501'
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=10)
    unit_price = Column(Float, nullable=False)
    status = Column(String, default="In Stock")
    supplier = Column(String, nullable=True)
    sales_count = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    growth = Column(Float, default=0.0)
