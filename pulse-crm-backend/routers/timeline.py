from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from database import get_db
from models import Activity, Email
from schemas import TimelineItemResponse

router = APIRouter(prefix="/timeline", tags=["timeline"])

@router.get("", response_model=List[TimelineItemResponse])
def get_timeline(deal_id: Optional[UUID] = None, contact_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    """
    Aggregates activities and synchronized emails in reverse chronological order.
    """
    items = []

    # 1. Query activities
    act_query = db.query(Activity)
    if deal_id:
        act_query = act_query.filter(Activity.deal_id == deal_id)
    if contact_id:
        act_query = act_query.filter(Activity.contact_id == contact_id)
    
    activities = act_query.all()
    for act in activities:
        items.append({
            "id": f"act_{act.id}",
            "type": "activity",
            "action_type": act.type,
            "subject": act.subject,
            "date": act.created_at,
            "is_incoming": None
        })

    # 2. Query emails
    email_query = db.query(Email)
    if deal_id:
        email_query = email_query.filter(Email.deal_id == deal_id)
    if contact_id:
        email_query = email_query.filter(Email.contact_id == contact_id)
        
    emails = email_query.all()
    for em in emails:
        items.append({
            "id": f"em_{em.id}",
            "type": "email",
            "action_type": em.sender,
            "subject": em.subject or "(No Subject)",
            "date": em.sent_at,
            "is_incoming": em.is_incoming
        })

    # Sort items by date descending (newest first)
    items.sort(key=lambda x: x["date"], reverse=True)
    return items
