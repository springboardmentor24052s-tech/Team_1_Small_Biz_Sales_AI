from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.api.dependencies import DBSession, rate_limit_public

router = APIRouter(prefix="/health", tags=["Health"], dependencies=[Depends(rate_limit_public)])


@router.get("/live")
def liveness():
    return {"status": "ok"}


@router.get("/ready")
def readiness(db: DBSession):
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc
    return {"status": "ready"}
