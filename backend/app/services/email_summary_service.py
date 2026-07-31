"""
Email Summary Service
Generates AI summaries for inbound email threads using the summarization agent.
"""
from __future__ import annotations

import os
import sys
import time
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.email_summary import EmailSummary
from app.repositories.email_repository import EmailRepository

# Add project root to path so we can import from ai.summarization
_root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if _root_dir not in sys.path:
    sys.path.insert(0, _root_dir)

try:
    from ai.summarization.src.agent import create_prompt, get_client, parse_response
    from ai.summarization.src.config import config as llm_config
except ImportError:
    create_prompt = None  # type: ignore[assignment]
    get_client = None  # type: ignore[assignment]
    parse_response = None  # type: ignore[assignment]
    llm_config = None  # type: ignore[assignment]

logger = get_logger(__name__)


class EmailSummaryService:
    """Thin wrapper around the summarization agent that persists results to email_summaries."""

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
        if create_prompt is None or get_client is None:
            logger.warning("Summarization agent not available – skipping")
            return None

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

        result = await self._call_llm(messages)

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

    async def _call_llm(self, messages: list[dict]) -> dict:
        """Call Groq via the summarization agent with retry and return parsed dict."""
        start = time.time()

        prompt = create_prompt(messages)
        model = llm_config.LLM_MODEL

        for attempt in range(llm_config.MAX_RETRIES + 1):
            try:
                response = get_client().chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an AI sales assistant. Return ONLY valid JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=llm_config.LLM_TEMPERATURE,
                    max_tokens=llm_config.LLM_MAX_TOKENS,
                )
                result_text = response.choices[0].message.content
                result = parse_response(result_text)

                if result.get("confidence", 0) >= llm_config.MIN_CONFIDENCE_THRESHOLD:
                    break
            except Exception as e:
                logger.warning("LLM call failed (attempt %d): %s", attempt + 1, e)
                if attempt == llm_config.MAX_RETRIES:
                    result = {
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

        processing_ms = int((time.time() - start) * 1000)
        result["processing_time_ms"] = processing_ms
        result["model_version"] = llm_config.LLM_MODEL
        return result
