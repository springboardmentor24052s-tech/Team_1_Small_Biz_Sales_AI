from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from backend.database.database import Base

class Role(Base):

    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50),unique=True,nullable=False)
    users = relationship("User",back_populates="role")

class User(Base):

    __tablename__ = "users"

    id = Column(Integer,primary_key=True,index=True)
    username = Column(String(100),nullable=False)
    email = Column(String(100),unique=True,nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer,ForeignKey("roles.id"))
    is_active = Column(Boolean,default=True)
    role = relationship("Role",back_populates="users")

class Inventory(Base):

    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)