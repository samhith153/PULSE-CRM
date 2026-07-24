import hashlib
import hmac
import json
import logging
from datetime import datetime
from typing import Any, Dict, Iterable, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import config
from database import get_db
from models import Email, EmailEvent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])

SUPPORTED_EVENTS = {
    "sent",
    "delivered",
    "opened",
    "clicked",
    "bounce",
    "bounced",
    "deferred",
    "spam",
    "unsubscribed",
    "unsubscribe",
}
STATUS_ALIASES = {"bounce": "bounced", "unsubscribe": "unsubscribed"}
TIMESTAMP_FIELDS = {
    "sent": "sent_at",
    "delivered": "delivered_at",
    "opened": "opened_at",
    "clicked": "clicked_at",
    "bounced": "bounced_at",
    "deferred": "deferred_at",
    "spam": "spam_at",
    "unsubscribed": "unsubscribed_at",
}


def _verify_signature(raw_body: bytes, signature: Optional[str]) -> None:
    if not config.BREVO_WEBHOOK_SECRET:
        return
    if not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing webhook signature")
    digest = hmac.new(config.BREVO_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    candidates = {signature, signature.replace("sha256=", "")}
    if not any(hmac.compare_digest(digest, candidate) for candidate in candidates):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")


def _parse_event_time(payload: Dict[str, Any]) -> datetime:
    for key in ("ts_event", "ts", "timestamp"):
        value = payload.get(key)
        if isinstance(value, (int, float)):
            return datetime.utcfromtimestamp(value)
        if isinstance(value, str) and value.isdigit():
            return datetime.utcfromtimestamp(int(value))
    value = payload.get("date")
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
    return datetime.utcnow()


def _extract_custom_identifier(payload: Dict[str, Any]) -> Optional[str]:
    for key in ("pulse_email_id", "pulse_message_id", "custom_id", "customId", "custom-id"):
        value = payload.get(key)
        if value:
            return str(value)
    for parent_key in ("params", "headers", "message_headers", "X-Mailin-custom"):
        value = payload.get(parent_key)
        if isinstance(value, dict):
            for key in ("pulse_email_id", "pulse_message_id", "X-Pulse-Email-Id", "X-Pulse-Message-Id"):
                if value.get(key):
                    return str(value[key])
        if isinstance(value, str):
            for chunk in value.replace(";", "|").split("|"):
                if ":" in chunk:
                    name, raw = chunk.split(":", 1)
                elif "=" in chunk:
                    name, raw = chunk.split("=", 1)
                else:
                    continue
                if name.strip() in {"pulse_email_id", "pulse_message_id", "X-Pulse-Email-Id", "X-Pulse-Message-Id"}:
                    return raw.strip()
    return None


def _message_identifiers(payload: Dict[str, Any]) -> Iterable[str]:
    keys = ("message-id", "message_id", "messageId", "MessageId", "id", "uuid")
    for key in keys:
        value = payload.get(key)
        if value:
            yield str(value)


def _find_email(db: Session, payload: Dict[str, Any]) -> Optional[Email]:
    custom_identifier = _extract_custom_identifier(payload)
    if custom_identifier:
        try:
            email = db.query(Email).filter(Email.id == UUID(custom_identifier)).first()
            if email:
                return email
        except ValueError:
            email = db.query(Email).filter(Email.message_id == custom_identifier).first()
            if email:
                return email

    for identifier in _message_identifiers(payload):
        email = db.query(Email).filter(
            (Email.message_id == identifier) | (Email.brevo_message_id == identifier)
        ).first()
        if email:
            return email
    return None


def _event_key(payload: Dict[str, Any], event_type: str, event_at: datetime) -> str:
    identifier = _extract_custom_identifier(payload) or next(iter(_message_identifiers(payload)), "unknown-message")
    raw = payload.get("event_id") or payload.get("uuid") or payload.get("id") or event_at.isoformat()
    return f"brevo:{identifier}:{event_type}:{raw}"


def _events_from_payload(payload: Any) -> Iterable[Dict[str, Any]]:
    if isinstance(payload, list):
        for item in payload:
            if isinstance(item, dict):
                yield item
    elif isinstance(payload, dict):
        yield payload


@router.post("/brevo", status_code=status.HTTP_202_ACCEPTED)
async def brevo_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_brevo_signature: Optional[str] = Header(default=None),
    x_mailin_signature: Optional[str] = Header(default=None),
):
    raw_body = await request.body()
    _verify_signature(raw_body, x_brevo_signature or x_mailin_signature)

    try:
        body = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc

    processed = 0
    ignored = 0
    duplicates = 0

    for payload in _events_from_payload(body):
        raw_event = str(payload.get("event", "")).lower().strip()
        if raw_event not in SUPPORTED_EVENTS:
            ignored += 1
            logger.info("Ignoring unsupported Brevo event=%s", raw_event)
            continue

        event_type = STATUS_ALIASES.get(raw_event, raw_event)
        event_at = _parse_event_time(payload)
        email = _find_email(db, payload)
        if not email:
            ignored += 1
            logger.warning("Brevo webhook event could not be matched payload=%s", payload)
            continue

        event_key = _event_key(payload, event_type, event_at)
        if db.query(EmailEvent).filter(EmailEvent.event_key == event_key).first():
            duplicates += 1
            continue

        db.add(EmailEvent(
            email_id=email.id,
            event_key=event_key,
            event_type=event_type,
            event_at=event_at,
            payload=json.dumps(payload, sort_keys=True),
        ))

        timestamp_field = TIMESTAMP_FIELDS.get(event_type)
        if timestamp_field and getattr(email, timestamp_field) is None:
            setattr(email, timestamp_field, event_at)

        if email.last_event_at is None or event_at >= email.last_event_at:
            email.status = event_type
            email.last_event_at = event_at

        try:
            db.commit()
            processed += 1
        except IntegrityError:
            db.rollback()
            duplicates += 1
            logger.info("Duplicate Brevo event ignored event_key=%s", event_key)
        except Exception:
            db.rollback()
            logger.exception("Failed processing Brevo webhook event for email_id=%s", email.id)
            raise HTTPException(status_code=500, detail="Failed processing webhook event")

    return {"status": "accepted", "processed": processed, "duplicates": duplicates, "ignored": ignored}
