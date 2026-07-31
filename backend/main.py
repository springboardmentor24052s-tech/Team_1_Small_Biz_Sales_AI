# FastAPI
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm

# Models
from backend.database.database import SessionLocal
from backend.database.models import User, Role, Inventory

# Schemas
from backend.database.schemas import (
    UserRegister,
    UserResponse,
    RoleUpdate,
    StatusUpdate,
    InventoryCreate,
    InventoryResponse,
    InventoryUpdate
)

# Authentication
from backend.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)

from backend.auth.dependencies import get_current_user
from backend.auth.role_checker import require_roles

# Other Libraries
from pydantic import BaseModel
import pandas as pd
import joblib

model = joblib.load("backend/sales_model.pkl")

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = SessionLocal()

class SalesInput(BaseModel):
    Status: int
    Fulfilment: int
    Sales_Channel: int
    ship_service_level: int
    Category: int
    Size: int
    Courier_Status: int
    Qty: int
    ship_city: int
    ship_state: int
    ship_postal_code: int
    promotion_ids: int
    B2B: bool
    fulfilled_by: int
    Year: int
    Month: int
    Day: int
    DayOfWeek: int  

@app.get("/")
def home():
    return {
        "message": "Welcome to Small Business Sales AI Backend"
    }

@app.get("/kpi")
def get_kpi():

    df = pd.read_csv("backend/data/train_data.csv")

    total_revenue = float(df["Amount"].sum())
    total_orders = len(df)
    average_order_value = total_revenue / total_orders
    total_quantity_sold = int(df["Qty"].sum())

    return {
        "Total Revenue": round(total_revenue, 2),
        "Total Orders": total_orders,
        "Average Order Value": round(average_order_value, 2),
        "Total Quantity Sold": total_quantity_sold
    }


@app.get("/sales-trend")
def get_sales_trend():

    df = pd.read_csv("backend/data/train_data.csv")

    df["Date"] = pd.to_datetime(df["Date"])
    df["Month"] = df["Date"].dt.month_name()

    monthly_sales = df.groupby("Month")["Amount"].sum()

    return monthly_sales.to_dict()


@app.get("/top-category")
def get_top_category():

    df = pd.read_csv("backend/data/train_data.csv")

    category_sales = df.groupby("Category")["Qty"].sum()

    top_category = category_sales.idxmax()
    top_quantity = int(category_sales.max())

    return {
        "Top Selling Category": top_category,
        "Quantity Sold": top_quantity,
        "Category Wise Sales": category_sales.to_dict()
    }

@app.get("/state-revenue")
def get_state_revenue():

    df = pd.read_csv("backend/data/train_data.csv")

    # Clean state names
    df["ship-state"] = (
        df["ship-state"]
        .astype(str)
        .str.upper()
        .str.strip()
    )

    # Revenue by state
    state_revenue = df.groupby("ship-state")["Amount"].sum()

    # Highest revenue state
    highest_state = state_revenue.idxmax()
    highest_revenue = float(state_revenue.max())

    return {
        "Highest Revenue State": highest_state,
        "Revenue": round(highest_revenue, 2),
        "State Wise Revenue": {
            state: round(value, 2)
            for state, value in state_revenue.items()
        }
    }
@app.get("/category-revenue")
def get_category_revenue():

    # Load dataset
    df = pd.read_csv("backend/data/train_data.csv")

    # Revenue by category
    category_revenue = df.groupby("Category")["Amount"].sum()

    # Highest revenue category
    highest_category = category_revenue.idxmax()
    highest_revenue = float(category_revenue.max())

    return {
        "Highest Revenue Category": highest_category,
        "Revenue": round(highest_revenue, 2),
        "Category Wise Revenue": {
            category: round(revenue, 2)
            for category, revenue in category_revenue.items()
        }
    }

@app.post("/predict")
def predict_sales(data: SalesInput):

    input_data = pd.DataFrame([{
        "Status": data.Status,
        "Fulfilment": data.Fulfilment,
        "Sales Channel ": data.Sales_Channel,
        "ship-service-level": data.ship_service_level,
        "Category": data.Category,
        "Size": data.Size,
        "Courier Status": data.Courier_Status,
        "Qty": data.Qty,
        "ship-city": data.ship_city,
        "ship-state": data.ship_state,
        "ship-postal-code": data.ship_postal_code,
        "promotion-ids": data.promotion_ids,
        "B2B": data.B2B,
        "fulfilled-by": data.fulfilled_by,
        "Year": data.Year,
        "Month": data.Month,
        "Day": data.Day,
        "DayOfWeek": data.DayOfWeek
    }])

    prediction = model.predict(input_data)

    return {
        "Predicted Sales Amount": round(float(prediction[0]), 2)
    }

@app.post("/register")
def register(user: UserRegister):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Check if role exists
    role = db.query(Role).filter(Role.id == user.role_id).first()

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Invalid Role"
        )

    # Create new user
    new_user = User(
    username=user.username,
    email=user.email,
    hashed_password=hash_password(user.password),
    role_id=user.role_id
)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully",
        "username": new_user.username,
        "role": role.name
    }

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):

    # Check if user exists
    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    result = verify_password(
        form_data.password,
        db_user.hashed_password
    )

    if not result:
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    token = create_access_token(
        {
            "sub": db_user.email,
            "role_id": db_user.role_id
        }
    )

    return {
        "message": "Login Successful",
        "access_token": token,
        "token_type": "bearer",
        "username": db_user.username,
        "role_id": db_user.role_id
    }

@app.get("/profile")
def profile(current_user = Depends(get_current_user)):

    return {
        "message": "Token Verified Successfully",
        "user": current_user
    }

@app.get("/admin-dashboard")
def admin_dashboard(
    current_user=Depends(require_roles(1))
):

    return {
        "message": "Welcome Administrator",
        "user": current_user
    }

@app.get("/owner-dashboard")
def owner_dashboard(
    current_user=Depends(require_roles(1, 2))
):
    return {
        "message": "Welcome Business Owner",
        "user": current_user
    }

@app.get("/manager-dashboard")
def manager_dashboard(
    current_user=Depends(require_roles(1, 2, 3))
):
    return {
        "message": "Welcome Store Manager",
        "user": current_user
    }

@app.get("/sales-dashboard")
def sales_dashboard(
    current_user=Depends(require_roles(1, 2, 3, 4))
):
    return {
        "message": "Welcome Sales Executive",
        "user": current_user
    }

@app.get("/users", response_model=list[UserResponse])
def get_all_users(
    current_user=Depends(require_roles(1))
):

    users = db.query(User).all()

    return users

@app.put("/users/{id}/role")
def update_user_role(
    id: int,
    role_data: RoleUpdate,
    current_user=Depends(require_roles(1))
):

    user = db.query(User).filter(User.id == id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.role_id = role_data.role_id

    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated successfully",
        "user_id": user.id,
        "new_role_id": user.role_id
    }

@app.put("/users/{id}/status")
def update_user_status(
    id: int,
    status_data: StatusUpdate,
    current_user=Depends(require_roles(1))
):

    user = db.query(User).filter(User.id == id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = status_data.is_active

    db.commit()
    db.refresh(user)

    return {
        "message": "User status updated successfully",
        "user_id": user.id,
        "is_active": user.is_active
    }

@app.delete("/users/{id}")
def delete_user(
    id: int,
    current_user=Depends(require_roles(1))
):

    user = db.query(User).filter(User.id == id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully",
        "deleted_user_id": id
    }

@app.get("/inventory", response_model=list[InventoryResponse])
def get_inventory(
    current_user=Depends(require_roles(1, 2, 3))
):

    inventory = db.query(Inventory).all()

    return inventory

@app.post("/inventory", response_model=InventoryResponse)
def add_inventory(
    item: InventoryCreate,
    current_user=Depends(require_roles(1, 2, 3))
):

    new_item = Inventory(
        product_name=item.product_name,
        category=item.category,
        quantity=item.quantity,
        price=item.price
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item

@app.put("/inventory/{id}", response_model=InventoryResponse)
def update_inventory(
    id: int,
    item: InventoryUpdate,
    current_user=Depends(require_roles(1, 2, 3))
):

    inventory = db.query(Inventory).filter(
        Inventory.id == id
    ).first()

    if inventory is None:
        raise HTTPException(
            status_code=404,
            detail="Inventory item not found"
        )

    inventory.product_name = item.product_name
    inventory.category = item.category
    inventory.quantity = item.quantity
    inventory.price = item.price

    db.commit()
    db.refresh(inventory)
    return inventory

@app.delete("/inventory/{id}")
def delete_inventory(
    id: int,
    current_user=Depends(require_roles(1, 2))
):

    inventory = db.query(Inventory).filter(
        Inventory.id == id
    ).first()

    if inventory is None:
        raise HTTPException(
            status_code=404,
            detail="Inventory item not found"
        )

    db.delete(inventory)
    db.commit()

    return {
        "message": "Inventory item deleted successfully"
    }

    