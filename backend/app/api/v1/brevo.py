"""
Brevo (Sendinblue) webhook handler.

Supports:
  - GET requests for Brevo URL verification (returns "OK")
  - POST with JSON body for actual event processing
  - Empty body / non-JSON gracefully handled
  - Webhook signature verification via X-Mailin-signature header
"""
import hashlib
import hmac
import logging

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.connection import get_db
from app.services.brevo_service import BrevoService

logger = logging.getLogger(__name__)

router = APIRouter()

# Maximum bytes of the raw body to keep in memory for signature verification.
_MAX_BODY_BYTES = 1_048_576  # 1 MB


def _verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    """Verify Brevo webhook signature (MD5 of body + secret key).

    In production, BREVO_WEBHOOK_SECRET **must** be set and the signature
    must be valid.  In development, a missing secret skips verification
    for convenience.
    """
    secret = settings.BREVO_WEBHOOK_SECRET
    if not secret:
        if settings.is_production:
            logger.error(
                "BREVO_WEBHOOK_SECRET is not configured — rejecting webhook in production"
            )
            return False
        # Dev-only: skip verification when secret is not set
        logger.warning("BREVO_WEBHOOK_SECRET not set — skipping signature verification (dev only)")
        return True
    if not signature:
        logger.warning("Brevo webhook missing X-Mailin-signature header")
        return False
    expected = hashlib.md5(raw_body + secret.encode()).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.get("/webhook")
async def verify_webhook():
    """
    Brevo sends a GET request to verify the webhook URL.
    """
    logger.info("Brevo webhook URL verification (GET)")
    return Response(content="OK", status_code=200)


@router.post("/webhook")
async def webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Receive Brevo event webhook (e.g. email events).
    """
    # Read raw body — cap size to prevent memory abuse
    raw_body = await request.body()
    if len(raw_body) > _MAX_BODY_BYTES:
        logger.warning("Brevo webhook body exceeds %d bytes — rejecting", _MAX_BODY_BYTES)
        return {"status": "error", "reason": "payload too large"}

    if not raw_body or raw_body.strip() == b"":
        logger.warning("Brevo webhook received empty body — ignoring")
        return {"status": "ignored", "reason": "empty body"}

    # Verify webhook signature
    signature = request.headers.get("X-Mailin-signature")
    if not _verify_webhook_signature(raw_body, signature):
        logger.warning("Brevo webhook signature verification failed")
        return {"status": "error", "reason": "invalid signature"}

    # Validate content type hint (log type only, NOT the body bytes)
    content_type = request.headers.get("content-type", "").lower()
    if "json" not in content_type and "text" not in content_type:
        logger.warning(
            "Brevo webhook received non-JSON content-type '%s' — discarding body from logs",
            content_type,
        )

    # Attempt JSON parse
    try:
        payload = await request.json()
    except Exception:
        # Do NOT log the body or the exception detail — either could contain
        # sensitive data (PII, credentials, webhook secrets).
        logger.error("Brevo webhook body is not valid JSON")
        return {
            "status": "error",
            "reason": "invalid JSON payload",
        }

    if not isinstance(payload, dict):
        logger.error(
            "Brevo webhook payload is not a dict — got %s",
            type(payload).__name__,
        )
        return {
            "status": "error",
            "reason": "payload must be a JSON object",
        }

    service = BrevoService(db)
    await service.process_event(payload)

    return {"status": "ok"}
