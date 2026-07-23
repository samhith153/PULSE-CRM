from __future__ import annotations

from datetime import datetime, timezone
from email.message import EmailMessage
from uuid import UUID, uuid4

from app.core.config import settings
from app.schemas.email import EmailResponse
from app.services.email_service import EmailService
from app.utils.enums import EmailDirection

class SMTPService:
    def __init__(self, db):
        self.email_service = EmailService(db)

    async def send_smtp_email(
        self,
        organization_id: UUID,
        created_by: UUID,
        receiver: str,
        subject: str,
        html_body: str,
        external_entity_type: str | None = None,
        external_entity_id: UUID | None = None,
    ):
        # Build SMTP message
        message = self.email_service._build_message(
            subject=subject,
            to_email=receiver,
            html_body=html_body,
            text_body=html_body,
        )

        # Send through Brevo SMTP
        await self.email_service._send_smtp_message(message)

        # Generate our own identifiers
        message_id = str(uuid4())
        thread_id = message_id

         # Save email in CRM
        email, _ = await self.email_service.ingest_email(
            organization_id=organization_id,
            created_by=created_by,
            gmail_connection_id=None,
            gmail_message_id=message_id,
            thread_id=thread_id,
            direction=EmailDirection.OUTBOUND,
            sender=settings.SMTP_FROM_EMAIL,
            receiver=receiver,
            subject=subject,
            body_preview=html_body[:500],
            sent_at=datetime.now(timezone.utc),
            attachment_metadata=[],
            raw_payload={
                "provider": "brevo_smtp",
                "status": "sent",
            },
            external_entity_type=external_entity_type,
            external_entity_id=external_entity_id,
            is_read=True,
        )

        return EmailResponse.model_validate(email)