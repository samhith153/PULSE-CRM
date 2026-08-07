"""Conversation AI (email summarization) routes."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from app.schemas.conversation_schema import ConversationRequest, ConversationResponse
from app.services.conversation_service import summarise_thread
from app.utils.text_utils import parse_llm_json

router = APIRouter(prefix="/conversations", tags=["Conversation AI"])


@router.post("/summarise", response_model=ConversationResponse, status_code=200)
async def summarise(payload: ConversationRequest) -> ConversationResponse:
    """Summarise an email thread and extract structured insights."""
    try:
        thread = {
            "inbound": [
                {"sender": m.sender, "subject": m.subject, "body": m.body, "timestamp": m.timestamp}
                for m in payload.messages
                if m.direction == "incoming"
            ],
            "outbound": [
                {"sender": m.sender, "subject": m.subject, "body": m.body, "timestamp": m.timestamp}
                for m in payload.messages
                if m.direction == "outgoing"
            ],
            "meetingNotes": [],
        }

        raw = summarise_thread(thread)

        # The LLM returns JSON as a string — parse it into structured fields
        data = parse_llm_json(raw) if isinstance(raw, str) else raw

        return ConversationResponse(
            thread_id=payload.thread_id,
            summary=data.get("summary", raw if isinstance(raw, str) else "Unable to generate summary"),
            summary_word=data.get("summary_word", "neutral"),
            sentiment=data.get("sentiment", "neutral"),
            intent=data.get("intent", "other"),
            confidence=data.get("confidence", 0.5),
            key_points=data.get("key_points", []),
            action_items=data.get("action_items", []),
            category=data.get("category", "general"),
            draft_reply=data.get("draft_reply", "No reply suggested."),
            follow_up_suggestion=data.get("follow_up_suggestion", "No follow-up suggested."),
            follow_up_timing=data.get("follow_up_timing", "no_followup"),
            contact_id=payload.contact_id,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
