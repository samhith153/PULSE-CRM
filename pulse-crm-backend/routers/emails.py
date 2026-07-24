from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas import EmailSendRequest, EmailSendResponse
from services.email_service import BrevoEmailService

router = APIRouter(prefix="/emails", tags=["emails"])


@router.post("/send", response_model=EmailSendResponse, status_code=status.HTTP_202_ACCEPTED)
def send_email(payload: EmailSendRequest, db: Session = Depends(get_db)):
    service = BrevoEmailService()
    return service.send_email(
        db=db,
        contact_id=payload.contact_id,
        deal_id=payload.deal_id,
        subject=payload.subject,
        body=payload.body,
    )
