import logging
import uuid
from datetime import datetime
from typing import Optional

import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

import config
from models import Contact, Deal, Email

logger = logging.getLogger(__name__)


class BrevoEmailService:
    def __init__(self):
        if not config.BREVO_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="BREVO_API_KEY is not configured",
            )
        if not config.FROM_EMAIL:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="FROM_EMAIL is not configured",
            )

    def send_email(
        self,
        db: Session,
        contact_id,
        subject: str,
        body: str,
        deal_id: Optional[uuid.UUID] = None,
    ) -> Email:
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise HTTPException(status_code=400, detail="Target contact does not exist")

        if deal_id:
            deal = db.query(Deal).filter(Deal.id == deal_id).first()
            if not deal:
                raise HTTPException(status_code=400, detail="Target deal does not exist")
            if deal.contact_id != contact.id:
                raise HTTPException(status_code=400, detail="Deal does not belong to the target contact")

        now = datetime.utcnow()
        email = Email(
            contact_id=contact.id,
            deal_id=deal_id,
            message_id=f"pulse-{uuid.uuid4()}",
            subject=subject,
            body=body,
            sender=config.FROM_EMAIL,
            recipient=contact.email,
            status="sent",
            sent_at=now,
            last_event_at=now,
            is_incoming=False,
            synced_at=now,
        )
        db.add(email)
        db.flush()

        payload = {
            "sender": {"name": config.FROM_NAME, "email": config.FROM_EMAIL},
            "to": [{"email": contact.email, "name": f"{contact.first_name} {contact.last_name}".strip()}],
            "subject": subject,
            "htmlContent": body,
            "headers": {
                "X-Pulse-Email-Id": str(email.id),
                "X-Pulse-Message-Id": email.message_id,
            },
            "params": {
                "pulse_email_id": str(email.id),
                "pulse_message_id": email.message_id,
            },
            "tags": ["pulse-crm"],
        }

        try:
            response = requests.post(
                config.BREVO_API_URL,
                headers={
                    "api-key": config.BREVO_API_KEY,
                    "accept": "application/json",
                    "content-type": "application/json",
                },
                json=payload,
                timeout=15,
            )
            response.raise_for_status()
            data = response.json() if response.content else {}
        except requests.RequestException as exc:
            db.rollback()
            logger.exception("Brevo send failed for contact_id=%s", contact_id)
            raise HTTPException(status_code=502, detail="Brevo email delivery request failed") from exc

        brevo_message_id = data.get("messageId") or data.get("message_id")
        if brevo_message_id:
            email.brevo_message_id = brevo_message_id
            email.message_id = brevo_message_id

        db.commit()
        db.refresh(email)
        logger.info("Email sent via Brevo email_id=%s brevo_message_id=%s", email.id, email.brevo_message_id)
        return email
