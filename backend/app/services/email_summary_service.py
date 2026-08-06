"""
Email Summary Service
Generates AI summaries for inbound email threads by calling the AI service
over HTTP, and persists the results to the email_summaries table.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.email_summary import EmailSummary
from app.repositories.email_repository import EmailRepository
from app.services.ai_client import AIClient

logger = get_logger(__name__)


class EmailSummaryService:
    """Thin wrapper around the AI summarization service that persists results."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.email_repo = EmailRepository(db)

    # ── public ────────────────────────────────────────────────────────────
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

        messages = [
            {
                "sender": e.sender,
                "body": e.body_preview or "",
                "direction": "incoming" if e.direction == "inbound" else "outgoing",
            }
            for e in emails
        ]

        result = await self._call_ai_service(thread_id, messages)

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
            processing_time_ms=result.get("processing_time_ms", 0),
            model_version=result.get("model_version", "unknown"),
        )
        self.db.add(summary)
        await self.db.flush()
        logger.info("Stored email summary for thread %s", thread_id)
        return summary

    # ── private ───────────────────────────────────────────────────────────
    async def _get_existing(self, thread_id: str) -> Optional[EmailSummary]:
        stmt = select(EmailSummary).where(EmailSummary.thread_id == thread_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _call_ai_service(self, thread_id: str, messages: list[dict]) -> dict:
        """Call the AI summarization service and return the parsed result dict."""
        ai_client = AIClient()
        try:
            result = await ai_client.summarise(thread_id=thread_id, messages=messages)
        finally:
            await ai_client.close()

        if not result:
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
                "model_version": "unknown",
            }

        result.setdefault("model_version", "unknown")
        return result
