"""Conversation AI (email summarization) routes."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.conversation_schema import ConversationRequest, ConversationResponse, DraftEmailRequest, DraftEmailResponse
from app.services.conversation_service import summarise_thread, generate_outreach_draft

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

@router.post("/draft-email", response_model=DraftEmailResponse, status_code=200)
async def draft_email(payload: DraftEmailRequest) -> DraftEmailResponse:
    """Generate a brand-new outreach email draft (subject + body) for a contact."""
    try:
        result = generate_outreach_draft(
            recipient_name=payload.recipient_name,
            recipient_email=payload.recipient_email,
            company=payload.company or "",
            designation=payload.designation or "",
            purpose=payload.purpose,
            context=payload.context or "",
            sender_name=payload.sender_name or "",
        )
        return DraftEmailResponse(
            subject=result["subject"], 
            body=result["body"], 
            model_version="llama-3.3-70b-versatile"
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc