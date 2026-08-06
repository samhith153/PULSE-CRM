"""
Email Summary Service
Generates AI summaries for inbound email threads via the ai-service
microservice and persists the results to the email_summaries table.
"""
from __future__ import annotations

import json
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.email_summary import EmailSummary
from app.repositories.email_repository import EmailRepository
from app.services.ai_client import AIClient

logger = get_logger(__name__)


class EmailSummaryService:
    """Summarizes email threads via the ai-service and persists results."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.email_repo = EmailRepository(db)

    async def summarize_thread(
        self,
        organization_id: UUID,
        thread_id: str,
    ) -> Optional[EmailSummary]:
        """Summarize an email thread and store the result.

        Returns the existing summary if one already exists for this thread,
        or ``None`` if summarization is unavailable or the thread is empty.
        """
        existing = await self._get_existing(thread_id)
        if existing:
            return existing

        emails = await self.email_repo.list_thread_history(organization_id, thread_id)
        if len(emails) < 1:
            return None

        result = await _summarize_via_ai_service(thread_id, emails)
        if not result:
            return None

        summary = EmailSummary(
            organization_id=organization_id,
            thread_id=thread_id,
            summary=result.get("summary", "Unable to generate summary"),
            summary_word=result.get("summary_word", "neutral"),
            sentiment=result.get("sentiment", "neutral"),
            intent=result.get("intent", "other"),
            confidence=result.get("confidence", 0.1),
            key_points=result.get("key_points", []),
            action_items=result.get("action_items", []),
            category=result.get("category", "general"),
            draft_reply=result.get("draft_reply", "No reply suggested."),
            follow_up_suggestion=result.get("follow_up_suggestion", "No follow-up suggested."),
            follow_up_timing=result.get("follow_up_timing", "no_followup"),
            processing_time_ms=0,
            model_version=settings.MODEL_NAME or "llama-3.1-8b-instant",
        )
        self.db.add(summary)
        try:
            await self.db.flush()
        except IntegrityError:
            await self.db.rollback()
            return await self._get_existing(thread_id)
        logger.info("Stored email summary for thread %s", thread_id)
        return summary

    async def _get_existing(self, thread_id: str) -> Optional[EmailSummary]:
        stmt = select(EmailSummary).where(EmailSummary.thread_id == thread_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


async def _summarize_via_ai_service(thread_id: str, emails: list) -> Optional[dict]:
    """Call the ai-service microservice to summarize an email thread."""
    try:
        messages = _build_messages(emails)
        if not messages:
            return None

        client = AIClient()
        raw = await client.summarise(thread_id=thread_id, messages=messages)
        await client.close()

        if not raw:
            return _fallback_result()

        return _parse_result(raw)
    except Exception as exc:
        logger.warning("ai-service summarization failed: %s", exc)
        return _fallback_result()


def _build_messages(emails: list) -> list[dict]:
    """Convert Email ORM objects to the format expected by AIClient.summarise()."""
    messages = []
    for e in sorted(emails, key=lambda x: x.sent_at):
        direction = "incoming" if e.direction == "inbound" else "outgoing"
        messages.append({
            "sender": e.sender or "unknown",
            "recipients": [e.receiver] if e.receiver else [],
            "subject": e.subject or "",
            "body": e.body_preview or "",
            "timestamp": e.sent_at.isoformat() if e.sent_at else "",
            "direction": direction,
        })
    return messages


def _parse_result(raw: dict) -> dict:
    """Normalise the ai-service response into a flat dict."""
    summary_text = raw.get("summary", "")
    if isinstance(summary_text, str):
        # If the summary itself is JSON-encoded, try to parse it
        try:
            parsed = json.loads(summary_text)
            if isinstance(parsed, dict):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass

    # Otherwise build from top-level fields
    return {
        "summary": raw.get("summary", "Unable to generate summary"),
        "summary_word": raw.get("summary_word", "neutral"),
        "sentiment": raw.get("sentiment", "neutral"),
        "intent": raw.get("intent", "other"),
        "confidence": raw.get("confidence", 0.1),
        "key_points": raw.get("key_points", []),
        "action_items": raw.get("action_items", []),
        "category": raw.get("category", "general"),
        "draft_reply": raw.get("draft_reply", "No reply suggested."),
        "follow_up_suggestion": raw.get("follow_up_suggestion", "No follow-up suggested."),
        "follow_up_timing": raw.get("follow_up_timing", "no_followup"),
    }


def _fallback_result() -> dict:
    return {
        "summary": "Unable to process thread",
        "summary_word": "neutral",
        "sentiment": "neutral",
        "intent": "other",
        "confidence": 0.1,
        "key_points": [],
        "action_items": [],
        "category": "general",
        "draft_reply": "Unable to process this thread.",
        "follow_up_suggestion": "Unable to suggest follow-up.",
        "follow_up_timing": "no_followup",
    }
