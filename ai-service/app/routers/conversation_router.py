"""Conversation AI (email summarization) routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.conversation_schema import ConversationRequest, ConversationResponse
from app.services.conversation_service import summarise_thread

router = APIRouter(prefix="/conversations", tags=["Conversation AI"])


@router.post("/summarise", response_model=ConversationResponse, status_code=200)
async def summarise(payload: ConversationRequest) -> ConversationResponse:
    """Summarise an email thread and extract structured insights."""
    try:
        thread = {
            "inbound": [
                {"body": m.body}
                for m in payload.messages
                if m.direction == "incoming"
            ],
            "outbound": [
                {"body": m.body}
                for m in payload.messages
                if m.direction == "outgoing"
            ],
            "meetingNotes": [],
        }

        summary = summarise_thread(thread)

        return ConversationResponse(
            thread_id=payload.thread_id,
            summary=summary,
            contact_id=payload.contact_id,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
