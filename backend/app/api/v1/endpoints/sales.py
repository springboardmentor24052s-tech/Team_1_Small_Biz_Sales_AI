from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from backend.app.db.session import get_db
from backend.app.models.sale import SaleTransaction

router = APIRouter()

class SaleSchema(BaseModel):
    id: str
    name: str
    contact: Optional[str] = None
    amount: float
    stage: str
    ai_probability: Optional[float] = 0.75
    priority: Optional[str] = "Medium"

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    name: str
    contact: Optional[str] = None
    amount: float
    stage: Optional[str] = "New Prospect"
    ai_probability: Optional[float] = 0.75
    priority: Optional[str] = "Medium"

@router.get("", response_model=List[SaleSchema], summary="List Sales Deals")
def list_sales(limit: int = Query(200, ge=1, le=500), db: Session = Depends(get_db)):
    sales = db.query(SaleTransaction).limit(limit).all()
    if not sales:
        # Fallback dataset if empty
        return [
            {"id": "SALE-101", "name": "Apex Logistics Inc", "contact": "Marcus Vance", "amount": 14500.0, "stage": "Proposal Sent", "ai_probability": 0.88, "priority": "High"},
            {"id": "SALE-102", "name": "BlueHorizon Cafe Chain", "contact": "Sarah Jenkins", "amount": 8200.0, "stage": "Closing Stage", "ai_probability": 0.94, "priority": "High"},
            {"id": "SALE-103", "name": "Urban Style Outlets", "contact": "David Kim", "amount": 18000.0, "stage": "Demo Scheduled", "ai_probability": 0.72, "priority": "Medium"}
        ]
    return sales

@router.get("/transactions", summary="Get Sales Transactions")
def get_sales_transactions(limit: int = Query(200, ge=1, le=500), db: Session = Depends(get_db)):
    items = list_sales(limit=limit, db=db)
    return {"items": items, "total": len(items)}

@router.post("", response_model=SaleSchema, summary="Create Sales Deal")
def create_sale(sale_in: SaleCreate, db: Session = Depends(get_db)):
    new_sale = SaleTransaction(
        id=f"SALE-{db.query(SaleTransaction).count() + 101}",
        name=sale_in.name,
        contact=sale_in.contact or "Direct Contact",
        amount=sale_in.amount,
        stage=sale_in.stage or "New Prospect",
        ai_probability=sale_in.ai_probability or 0.75,
        priority=sale_in.priority or "Medium"
    )
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    return new_sale

@router.get("/{sale_id}", response_model=SaleSchema, summary="Get Sale Deal By ID")
def get_sale_by_id(sale_id: str, db: Session = Depends(get_db)):
    sale = db.query(SaleTransaction).filter(SaleTransaction.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail=f"Sale deal '{sale_id}' not found")
    return sale

@router.put("/{sale_id}", response_model=SaleSchema, summary="Update Sale Deal")
def update_sale(sale_id: str, sale_in: SaleCreate, db: Session = Depends(get_db)):
    sale = db.query(SaleTransaction).filter(SaleTransaction.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail=f"Sale deal '{sale_id}' not found")
    
    sale.name = sale_in.name
    sale.contact = sale_in.contact
    sale.amount = sale_in.amount
    sale.stage = sale_in.stage
    db.commit()
    db.refresh(sale)
    return sale

@router.delete("/{sale_id}", summary="Delete Sale Deal")
def delete_sale(sale_id: str, db: Session = Depends(get_db)):
    sale = db.query(SaleTransaction).filter(SaleTransaction.id == sale_id).first()
    if sale:
        db.delete(sale)
        db.commit()
    return {"status": "success", "message": f"Sale '{sale_id}' deleted successfully"}
