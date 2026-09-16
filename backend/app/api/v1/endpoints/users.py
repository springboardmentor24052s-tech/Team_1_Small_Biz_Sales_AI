from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.api.v1.endpoints.admin import list_admin_users
from backend.app.api.v1.endpoints.auth import get_current_user_profile

router = APIRouter()

@router.get("", summary="Get Users List")
def list_users(limit: int = Query(200, ge=1, le=500), db: Session = Depends(get_db)):
    users = list_admin_users(db=db)
    return {"items": users, "total": len(users)}

@router.get("/me", summary="Get User Me Profile")
def get_user_me(db: Session = Depends(get_db)):
    return get_current_user_profile(db=db)
