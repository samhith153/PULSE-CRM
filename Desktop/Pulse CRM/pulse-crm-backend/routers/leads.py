from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
from database import get_db
from models import Lead, Deal, Contact, PipelineStage
from schemas import LeadCreate, LeadResponse, LeadConvertRequest, LeadConvertResponse

router = APIRouter(prefix="/leads", tags=["leads"])

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    """
    Registers an unqualified interest lead mapped to a target contact.
    """
    # Check if contact exists
    contact = db.query(Contact).filter(Contact.id == payload.contact_id).first()
    if not contact:
        raise HTTPException(status_code=400, detail="Target contact does not exist")

    lead = Lead(
        contact_id=payload.contact_id,
        title=payload.title,
        description=payload.description,
        value=payload.value,
        status="New",
        source=payload.source
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.put("/{lead_id}/convert", response_model=LeadConvertResponse)
def convert_lead(lead_id: UUID, payload: LeadConvertRequest, db: Session = Depends(get_db)):
    """
    Converts a verified lead into an active pipeline deal.
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead.status == "Converted":
        raise HTTPException(status_code=400, detail="Lead has already been converted")

    # Get contact to find company
    contact = db.query(Contact).filter(Contact.id == lead.contact_id).first()
    if not contact:
        raise HTTPException(status_code=400, detail="Lead contact is missing or invalid")

    # Fetch initial pipeline stage
    # First stage by display order or select stage
    stage = db.query(PipelineStage).order_by(PipelineStage.display_order).first()
    if not stage:
        # Fallback default stage UUID if not seeded
        raise HTTPException(status_code=500, detail="Pipeline stages are not initialized")

    # Create new deal
    deal = Deal(
        lead_id=lead.id,
        company_id=contact.company_id,
        contact_id=contact.id,
        stage_id=stage.id,
        name=payload.name,
        value=lead.value or 0.0,
        status="Open"
    )
    db.add(deal)
    
    # Update lead status
    lead.status = "Converted"
    
    db.commit()
    db.refresh(deal)
    
    return {
        "deal_id": deal.id,
        "lead_id": lead.id,
        "company_id": deal.company_id,
        "value": float(deal.value),
        "status": deal.status,
        "stage_id": deal.stage_id
    }

@router.get("", response_model=List[LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    """
    Retrieves all leads.
    """
    return db.query(Lead).all()
