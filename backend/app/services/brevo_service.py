"""
Brevo (Sendinblue) webhook event processing service.

Handles:
  - Email event tracking (delivered, opened, clicked, bounced, etc.)
  - Blacklist / unsubscribes
  - Invalid email reporting
"""
import logging
from datetime import datetime

from app.repositories.email_repository import EmailRepository

logger = logging.getLogger(__name__)

# Known Brevo event types
BREVO_EVENT_TYPES = frozenset({
    "delivered",
    "hard_bounce",
    "soft_bounce",
    "opened",
    "click",
    "unsubscribed",
    "spam",
    "invalid_email",
    "error",
    "blocked",
    "request",
    "deferred",
})


class BrevoEventError(Exception):
    """Raised when a Brevo event cannot be processed."""


class BrevoService:

    def __init__(self, db):
        self.db = db
        self.email_repo = EmailRepository(db)

    async def process_event(self, payload: dict) -> dict:
        """
        Process an incoming Brevo webhook event.

        Brevo sends events in this format:
        {
            "event": "delivered"|"opened"|"click"|"hard_bounce"|...,
            "email": "recipient@example.com",
            "id": 12345,              // Brevo message ID
            "date": "2025-01-01T12:00:00+00:00",
            "ts": 1234567890,         // Unix timestamp
            "subject": "Re: ...",
            "message-id": "<...>",     // SMTP Message-ID
            "tag": "my-tag",
            ...event-specific fields...
        }
        """
        event_type = payload.get("event", "")
        recipient = payload.get("email", "")
        message_id = payload.get("message-id") or payload.get("id")
        ts = payload.get("ts")
        event_date = payload.get("date")

        logger.info(
            "Brevo event: type=%s recipient=%s message_id=%s",
            event_type,
            recipient,
            message_id,
        )

        # Validate required fields
        if not event_type:
            logger.error("Brevo payload missing 'event' field: %s", payload)
            raise BrevoEventError("Missing 'event' field in payload")

        if event_type not in BREVO_EVENT_TYPES:
            logger.warning(
                "Unknown Brevo event type '%s' — payload keys: %s",
                event_type,
                list(payload.keys()),
            )

        # TODO: Persist event to event_outbox / email_events table
        # Once the email events model is set up, add something like:
        #
        #   await self.email_repo.create_event(
        #       event_type=event_type,
        #       recipient=recipient,
        #       message_id=message_id,
        #       event_date=event_date,
        #       raw_payload=payload,
        #   )

        logger.debug("Brevo event processed successfully: %s", event_type)

        return {
            "event": event_type,
            "recipient": recipient,
            "status": "processed",
        }
