"""
Brevo (Sendinblue) webhook handler.

Supports:
  - GET requests for Brevo URL verification (returns "OK")
  - POST with JSON body for actual event processing
  - Empty body / non-JSON gracefully handled
"""
import logging

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.services.brevo_service import BrevoService

logger = logging.getLogger(__name__)

router = APIRouter()


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
    # Read raw body first to inspect before parsing JSON
    raw_body = await request.body()

    if not raw_body or raw_body.strip() == b"":
        logger.warning("Brevo webhook received empty body — ignoring")
        return {"status": "ignored", "reason": "empty body"}

    # Validate content type hint
    content_type = request.headers.get("content-type", "").lower()
    if "json" not in content_type and "text" not in content_type:
        logger.warning(
            "Brevo webhook received non-JSON content-type '%s' — body=%r",
            content_type,
            raw_body[:200],
        )

    # Attempt JSON parse
    try:
        payload = await request.json()
    except Exception as exc:
        logger.error(
            "Brevo webhook body is not valid JSON: %s — body=%r",
            exc,
            raw_body[:500],
        )
        return {
            "status": "error",
            "reason": "invalid JSON payload",
            "detail": str(exc),
        }

    if not isinstance(payload, dict):
        logger.error(
            "Brevo webhook payload is not a dict — got %s: %r",
            type(payload).__name__,
            payload,
        )
        return {
            "status": "error",
            "reason": "payload must be a JSON object",
        }

    service = BrevoService(db)
    await service.process_event(payload)

    return {"status": "ok"}
