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

# Summary text used when AI summarization fails. A stored summary that matches
# one of these markers is treated as failed and retried on the next call.
_FAILURE_MARKERS = frozenset({
    "unable to process thread",
    "unable to process this thread.",
    "unable to generate summary",
})


def is_failed_summary(summary: Optional[EmailSummary]) -> bool:
    """Return True when a stored summary is a failure/fallback marker.

    Failed summaries are retried on the next summarization call so they
    self-heal once the AI service is available again.
    """
    if summary is None:
        return True
    text = (summary.summary or "").strip().lower()
    if not text:
        return True
    return text in _FAILURE_MARKERS


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

        Returns the existing summary if it is already up-to-date,
        re-summarizes if new emails have arrived since the last summary,
        or returns ``None`` if summarization is unavailable or the thread is empty.
        """
        emails = await self.email_repo.list_thread_history(organization_id, thread_id)
        if len(emails) < 1:
            return None

        existing = await self._get_existing(thread_id)
        if existing:
            # Re-summarize if new emails arrived after the last summary, or if
            # the previous attempt failed (stored a fallback marker).
            new_emails = bool(
                existing.created_at
                and emails[-1].sent_at
                and emails[-1].sent_at > existing.created_at
            )
            failed = is_failed_summary(existing)
            if new_emails:
                logger.info("Thread %s has new emails, re-summarizing", thread_id)
            elif failed:
                logger.info("Thread %s has a failed summary, retrying", thread_id)
            else:
                return existing

        result = await _summarize_via_ai_service(thread_id, emails)
        if not result:
            return None

        if existing:
            # Update the existing summary
            existing.summary = result.get("summary", existing.summary)
            existing.summary_word = result.get("summary_word", existing.summary_word)
            existing.sentiment = result.get("sentiment", existing.sentiment)
            existing.intent = result.get("intent", existing.intent)
            existing.confidence = result.get("confidence", existing.confidence)
            existing.key_points = result.get("key_points", existing.key_points)
            existing.action_items = result.get("action_items", existing.action_items)
            existing.category = result.get("category", existing.category)
            existing.draft_reply = result.get("draft_reply", existing.draft_reply)
            existing.follow_up_suggestion = result.get("follow_up_suggestion", existing.follow_up_suggestion)
            existing.follow_up_timing = result.get("follow_up_timing", existing.follow_up_timing)
            existing.model_version = settings.MODEL_NAME or settings.ASSISTANT_MODEL
            summary = existing
        else:
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
                model_version=settings.MODEL_NAME or settings.ASSISTANT_MODEL,
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
    """Call the ai-service microservice to summarize an email thread.

    Falls back to a direct Groq API call when the AI service is unreachable
    (e.g. Render free-tier spin-down) so email summarization keeps working.
    """
    messages = _build_messages(emails)
    if not messages:
        return None

    # ── Primary: ai-service microservice ──────────────────────────────
    try:
        client = AIClient()
        raw = await client.summarise(thread_id=thread_id, messages=messages)
        await client.close()

        if raw and not _is_fallback(raw):
            return _parse_result(raw)
        logger.info("[EMAIL_SUMMARY] ai-service returned fallback for thread %s — trying direct Groq", thread_id)
    except Exception as exc:
        logger.warning("[EMAIL_SUMMARY] ai-service failed for thread %s: %s — trying direct Groq", thread_id, exc)

    # ── Fallback: direct Groq call from backend ───────────────────────
    try:
        result = await _summarize_via_groq_direct(messages)
        if result:
            logger.info("[EMAIL_SUMMARY] Direct Groq fallback succeeded for thread %s", thread_id)
            return result
    except Exception as exc:
        logger.warning("[EMAIL_SUMMARY] Direct Groq fallback also failed for thread %s: %s", thread_id, exc)

    return _fallback_result()


def _is_fallback(raw: dict) -> bool:
    """Check if the AI service returned a failure/fallback marker."""
    summary = (raw.get("summary") or "").strip().lower()
    return summary in _FAILURE_MARKERS


def _build_messages(emails: list) -> list[dict]:
    """Convert Email ORM objects to the format expected by AIClient.summarise()."""
    from app.services.gmail_client import decode_gmail_body, headers_map

    messages = []
    for e in sorted(emails, key=lambda x: x.sent_at):
        direction = "incoming" if e.direction == "inbound" else "outgoing"

        # Extract full body from raw_payload (Gmail format) if available
        body = ""
        if e.raw_payload and isinstance(e.raw_payload, dict):
            payload_part = e.raw_payload.get("payload")
            if payload_part:
                body = decode_gmail_body(payload_part)
        if not body:
            body = e.body_preview or ""

        # Extract full subject from raw_payload headers if available
        subject = e.subject or ""
        if not subject and e.raw_payload and isinstance(e.raw_payload, dict):
            hdrs = headers_map(e.raw_payload)
            subject = hdrs.get("subject", "")

        messages.append({
            "sender": e.sender or "unknown",
            "recipients": [e.receiver] if e.receiver else [],
            "subject": subject,
            "body": body,
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


# ── Direct Groq fallback ─────────────────────────────────────────────────
# When the ai-service microservice is unreachable (Render spin-down, etc.),
# call Groq directly from the backend using the same detailed prompt the
# AI service uses.  This keeps email summarization working even when the
# separate AI service container is sleeping.

_GROQ_SUMMARY_PROMPT_TEMPLATE = """You are an AI sales assistant for PULSE, a revenue platform.
Your task is to analyse email conversations and provide structured insights.

Email Thread:
{thread_text}

=== TASK 1: SUMMARY ===
Write a one-sentence summary of the email thread.

=== TASK 2: SUMMARY WORD (For Lead Scoring) ===
Choose ONE word that best represents this email:
- "demo_request" - Asked for demo
- "contract_signed" - Deal closed
- "pricing_negotiation" - Discussing pricing
- "interested" - Prospect shows interest
- "proposal" - Proposal sent
- "budget" - Budget discussion
- "meeting" - Meeting requested
- "follow_up" - Needs follow-up
- "inquiry" - General question
- "introduction" - Intro email
- "positive" - Very positive
- "neutral" - Neutral tone
- "negative" - Very negative
- "thank_you" - Thank you email
- "referral" - Referral given
- "support" - Support request
- "complaint" - Negative feedback
- "lost" - Deal lost
- "urgent" - Urgent action needed

=== TASK 3: SENTIMENT ===
Choose ONE: positive / neutral / negative

=== TASK 4: INTENT ===
Choose ONE: demo / buy / negotiate / followup / decline / other

=== TASK 5: CONFIDENCE ===
Rate your confidence (0.0 to 1.0)

=== TASK 6: KEY POINTS ===
Extract 2-5 key points from the conversation

=== TASK 7: ACTION ITEMS ===
Extract any action items or next steps

=== TASK 8: EMAIL CATEGORY ===
Choose ONE: sales / support / general / urgent

=== TASK 9: DRAFT REPLY ===
Write a 1-2 sentence suggested draft reply.

=== TASK 10: FOLLOW-UP SUGGESTION ===
Suggest the best follow-up action and timing.

=== TASK 11: FOLLOW-UP TIMING ===
Choose ONE: immediate / today / tomorrow / 2_days / 3_days / 1_week / 2_weeks / no_followup

Return ONLY valid JSON in this exact format:
{{
    "summary": "one sentence summary",
    "summary_word": "single_word_tag",
    "sentiment": "positive/neutral/negative",
    "intent": "demo/buy/negotiate/followup/decline/other",
    "confidence": 0.92,
    "key_points": ["point 1", "point 2"],
    "action_items": ["action 1", "action 2"],
    "category": "sales/support/general/urgent",
    "draft_reply": "Suggested reply...",
    "follow_up_suggestion": "Follow up in X days with Y",
    "follow_up_timing": "immediate/today/tomorrow/2_days/3_days/1_week/no_followup"
}}
"""


def _format_thread_for_groq(messages: list[dict]) -> str:
    """Convert message dicts into a readable thread for the Groq prompt."""
    lines = []
    for msg in messages:
        direction = "From" if msg.get("direction") == "incoming" else "To"
        sender = msg.get("sender", "unknown")
        subject = msg.get("subject", "")
        body = msg.get("body", "")
        timestamp = msg.get("timestamp", "")

        header = f"{direction} {sender}"
        if subject:
            header += f" | Subject: {subject}"
        if timestamp:
            header += f" | {timestamp}"
        lines.append(f"{header}:\n{body}\n")
    return "\n".join(lines)


async def _summarize_via_groq_direct(messages: list[dict]) -> Optional[dict]:
    """Call Groq directly from the backend as a fallback when the AI service is down."""
    import asyncio
    from groq import AsyncGroq

    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.warning("[EMAIL_SUMMARY] No GROQ_API_KEY configured — cannot use direct Groq fallback")
        return None

    thread_text = _format_thread_for_groq(messages)
    prompt = _GROQ_SUMMARY_PROMPT_TEMPLATE.format(thread_text=thread_text)

    client = AsyncGroq(api_key=api_key)
    try:
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=settings.MODEL_NAME or settings.ASSISTANT_MODEL,
                messages=[
                    {"role": "system", "content": "You are an AI sales assistant. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1500,
            ),
            timeout=(settings.AI_TIMEOUT or 30) + 5,
        )
    finally:
        await client.close()

    raw_text = response.choices[0].message.content.strip()
    cleaned = raw_text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        data = json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        logger.warning("[EMAIL_SUMMARY] Direct Groq response was not valid JSON: %s", cleaned[:200])
        return None

    # Normalize — ensure all expected fields exist with defaults
    return {
        "summary": data.get("summary", "Unable to generate summary"),
        "summary_word": data.get("summary_word", "neutral"),
        "sentiment": data.get("sentiment", "neutral"),
        "intent": data.get("intent", "other"),
        "confidence": data.get("confidence", 0.5),
        "key_points": data.get("key_points", []),
        "action_items": data.get("action_items", []),
        "category": data.get("category", "general"),
        "draft_reply": data.get("draft_reply", "No reply suggested."),
        "follow_up_suggestion": data.get("follow_up_suggestion", "No follow-up suggested."),
        "follow_up_timing": data.get("follow_up_timing", "no_followup"),
    }
