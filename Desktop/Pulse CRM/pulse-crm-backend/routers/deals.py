from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List
from database import get_db
from models import Deal, PipelineStage
from schemas import DealResponse, DealStageUpdate

router = APIRouter(prefix="/deals", tags=["deals"])

@router.get("", response_model=List[DealResponse])
def get_deals(db: Session = Depends(get_db)):
    """
    Returns list of deals across active pipelines for Kanban visualization.
    """
    return db.query(Deal).all()

@router.put("/{deal_id}/stage", response_model=DealResponse)
def update_deal_stage(deal_id: UUID, payload: DealStageUpdate, db: Session = Depends(get_db)):
    """
    Updates a deal position when moving items across the pipeline Kanban.
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    # Validate that the target stage exists
    stage = db.query(PipelineStage).filter(PipelineStage.id == payload.stage_id).first()
    if not stage:
        raise HTTPException(status_code=400, detail="Invalid pipeline stage ID")

    deal.stage_id = payload.stage_id
    
    # Optional logic: if the stage is 'Won' or 'Lost', update closed_at and status
    if stage.name.lower() == 'won':
        deal.status = 'Won'
        deal.closed_at = datetime.utcnow()
    elif stage.name.lower() == 'lost':
        deal.status = 'Lost'
        deal.closed_at = datetime.utcnow()
    else:
        deal.status = 'Open'
        deal.closed_at = None

    db.commit()
    db.refresh(deal)
    return deal
