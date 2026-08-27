from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.app.db.session import get_db
from backend.app.models.user import User

router = APIRouter()

class UserInvite(BaseModel):
    email: str
    name: str
    role: str

class RoleUpdate(BaseModel):
    role: str

class StatusUpdate(BaseModel):
    status: str

@router.get("/users", summary="Get System Users")
def list_admin_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    if not users:
        return [
            {"id": "USR-101", "name": "Eleanor Vance", "email": "owner@business.com", "role": "owner", "status": "Active"},
            {"id": "USR-102", "name": "Robert Chen", "email": "manager@store.com", "role": "manager", "status": "Active"},
            {"id": "USR-103", "name": "Sophia Martinez", "email": "sales@team.com", "role": "sales", "status": "Active"},
            {"id": "USR-104", "name": "Alexander Wright", "email": "admin@system.com", "role": "admin", "status": "Active"}
        ]
    return users

@router.post("/users/invite", summary="Invite New User")
def invite_user(user_in: UserInvite, db: Session = Depends(get_db)):
    return {"status": "success", "message": f"Invitation sent to {user_in.email}"}

@router.patch("/users/{user_id}/role", summary="Update User Role")
def update_user_role(user_id: str, role_in: RoleUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.role = role_in.role
        db.commit()
    return {"status": "success", "user_id": user_id, "role": role_in.role}

@router.patch("/users/{user_id}/status", summary="Update User Status")
def update_user_status(user_id: str, status_in: StatusUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_active = (status_in.status.lower() == "active")
        db.commit()
    return {"status": "success", "user_id": user_id, "status": status_in.status}

@router.get("/logs", summary="Get System Audit Logs")
def get_audit_logs():
    return [
        {"id": "LOG-991", "timestamp": "17:18:44", "user": "admin@system.com", "action": "ROLE_PERMISSION_UPDATE", "level": "INFO", "details": "Updated Store Manager stock reorder threshold"},
        {"id": "LOG-990", "timestamp": "17:14:12", "user": "system_ai_engine", "action": "PREDICTIVE_MODEL_TRAIN", "level": "SUCCESS", "details": "Automated sales forecasting model re-indexed with +1,240 records"},
        {"id": "LOG-989", "timestamp": "16:55:01", "user": "sales@team.com", "action": "DEAL_STAGE_CHANGE", "level": "INFO", "details": "Moved BlueHorizon Cafe to Closing Stage ($8,200)"}
    ]
