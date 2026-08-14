"""
Email detail routes.
"""
from __future__ import annotations

import asyncio
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select, update

from app.api.deps import CurrentUser, DBSession, require_permission
from app.core.logging import get_logger
from app.models.email import Email
from app.models.email_summary import EmailSummary
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.email import EmailDetailResponse, EmailDraftRequest, EmailDraftResponse, EmailResponse
from app.services.email_service import EmailService
from app.services.email_summary_service import EmailSummaryService, is_failed_summary
from app.utils.enums import EmailDirection, SortOrder
from app.services.ai_client import AIClient

router = APIRouter()
logger = get_logger(__name__)


class EmailReadStatusRequest(BaseModel):
    is_read: bool = True


class EmailReadStatusResponse(BaseModel):
    id: UUID
    is_read: bool
    unread_count: int


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[EmailResponse]],
    summary="List synced emails",
    description="Compatibility alias for /gmail/emails so frontend clients can use /emails.",
    dependencies=[Depends(require_permission("email:read"))],
)
async def list_emails(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    direction: Optional[EmailDirection] = Query(default=None),
    thread_id: Optional[str] = Query(default=None),
    contact_id: Optional[UUID] = Query(default=None),
    deal_id: Optional[UUID] = Query(default=None),
    sort_order: SortOrder = Query(default=SortOrder.DESC),
) -> dict:
    service = EmailService(db)
    entity_type = None
    entity_id = None
    if contact_id:
        entity_type = "contact"
        entity_id = contact_id
    elif deal_id:
        entity_type = "deal"
        entity_id = deal_id

    emails, total = await service.list_emails(
        current_user.organization_id,
        search,
        direction,
        thread_id,
        entity_type,
        entity_id,
        page,
        page_size,
        sort_order=sort_order,
    )
    paginated = PaginatedResponse.create(
        data=[EmailResponse.model_validate(email) for email in emails],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.get(
    "/unread-count",
    response_model=StandardResponse[dict],
    summary="Get unread email count",
    description="Returns the count of unread inbound emails for the current organisation. Reflects real-time database state.",
    dependencies=[Depends(require_permission("email:read"))],
)
async def get_unread_count(current_user: CurrentUser, db: DBSession) -> dict:
    stmt = select(func.count(Email.id)).where(
        Email.organization_id == current_user.organization_id,
        Email.is_active.is_(True),
        Email.is_read.is_(False),
        Email.direction == EmailDirection.INBOUND.value,
    )
    count = int((await db.execute(stmt)).scalar_one() or 0)
    return {"success": True, "message": "OK", "data": {"unread_count": count}}


@router.get(
    "/{email_id}",
    response_model=StandardResponse[EmailDetailResponse],
    summary="Get an email by id",
    dependencies=[Depends(require_permission("email:read"))],
)
async def get_email(email_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    service = EmailService(db)
    db_email = await service.get_email(current_user.organization_id, email_id)
    db_email.is_read = True
    await db.commit()
    email_response = EmailDetailResponse.model_validate(db_email)
    return {"success": True, "message": "OK", "data": email_response}


@router.patch(
    "/{email_id}/read",
    response_model=StandardResponse[EmailReadStatusResponse],
    summary="Mark an email as read or unread",
    description=(
        "Persists the read/unread state to the database. "
        "Returns the updated state and the current unread count for the organisation."
    ),
    dependencies=[Depends(require_permission("email:read"))],
)
async def mark_email_read(
    email_id: UUID,
    payload: EmailReadStatusRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    # Fetch and validate ownership
    stmt = select(Email).where(
        Email.id == email_id,
        Email.organization_id == current_user.organization_id,
        Email.is_active.is_(True),
    )
    result = await db.execute(stmt)
    email = result.scalar_one_or_none()
    if not email:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Email", email_id)

    # Persist the new read state
    await db.execute(
        update(Email)
        .where(Email.id == email_id, Email.organization_id == current_user.organization_id)
        .values(is_read=payload.is_read)
    )
    await db.flush()

    # Return up-to-date unread count so the frontend can update its badge
    unread_stmt = select(func.count(Email.id)).where(
        Email.organization_id == current_user.organization_id,
        Email.is_active.is_(True),
        Email.is_read.is_(False),
        Email.direction == EmailDirection.INBOUND.value,
    )
    unread_count = int((await db.execute(unread_stmt)).scalar_one() or 0)

    data = EmailReadStatusResponse(
        id=email_id,
        is_read=payload.is_read,
        unread_count=unread_count,
    )
    return {"success": True, "message": "Email read status updated.", "data": data}


@router.get(
    "/summary/{thread_id}",
    response_model=StandardResponse[Optional[dict[str, Any]]],
    summary="Get AI summary for an email thread",
    dependencies=[Depends(require_permission("email:read"))],
)
async def get_email_summary(thread_id: str, current_user: CurrentUser, db: DBSession) -> dict:
    stmt = select(EmailSummary).where(
        EmailSummary.thread_id == thread_id,
        EmailSummary.organization_id == current_user.organization_id,
    )
    result = await db.execute(stmt)
    summary = result.scalar_one_or_none()
    if not summary:
        return {"success": True, "message": "No summary found", "data": None}
    if is_failed_summary(summary):
        # Retry failed summaries lazily so stale "Unable to process thread"
        # rows self-heal once the AI service is available again.
        svc = EmailSummaryService(db)
        refreshed = await svc.summarize_thread(current_user.organization_id, thread_id)
        if refreshed:
            summary = refreshed
    data = {
        "summary": summary.summary,
        "summary_word": summary.summary_word,
        "sentiment": summary.sentiment,
        "intent": summary.intent,
        "confidence": summary.confidence,
        "key_points": summary.key_points or [],
        "action_items": summary.action_items or [],
        "category": summary.category,
        "draft_reply": summary.draft_reply,
        "follow_up_suggestion": summary.follow_up_suggestion,
        "follow_up_timing": summary.follow_up_timing,
        "model_version": summary.model_version,
    }
    return {"success": True, "message": "OK", "data": data}


@router.post(
    "/backfill/{lead_id}",
    response_model=StandardResponse[dict],
    summary="Summarize all existing emails for a lead and run assessment pipeline",
    dependencies=[Depends(require_permission("lead:update"))],
)
async def backfill_lead_email_summaries(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """Backfill email summaries + trigger assessment for leads that were
    imported before the summarization pipeline was active.

    Steps:
      1. Find all unique thread_ids linked to this lead (inbound only)
      2. Summarize each thread via the ai-service
      3. Collect the latest intent
      4. Run the assessment pipeline with that intent
    """
    from app.services.email_summary_service import EmailSummaryService
    from app.services.ai_pipeline import run_lead_assessment
    from app.database.connection import AsyncSessionFactory

    stmt = (
        select(Email.thread_id)
        .where(
            Email.organization_id == current_user.organization_id,
            Email.external_entity_type == "lead",
            Email.external_entity_id == lead_id,
            Email.direction == EmailDirection.INBOUND.value,
            Email.is_active.is_(True),
        )
        .distinct()
    )
    result = await db.execute(stmt)
    thread_ids = [row[0] for row in result.all() if row[0]]

    if not thread_ids:
        return {
            "success": True,
            "message": "No inbound email threads found for this lead.",
            "data": {"threads_summarized": 0, "scores_updated": False},
        }

    logger.info("[BACKFILL] Found %d threads for lead %s: %s", len(thread_ids), lead_id, thread_ids)

    # Step 0: Delete existing summaries for these threads to force re-summarization
    from sqlalchemy import delete as sa_delete
    await db.execute(
        sa_delete(EmailSummary).where(
            EmailSummary.thread_id.in_(thread_ids),
            EmailSummary.organization_id == current_user.organization_id,
        )
    )
    await db.flush()
    logger.info("[BACKFILL] Deleted existing summaries for %d threads", len(thread_ids))

    # Step 1: Summarize each thread
    svc = EmailSummaryService(db)
    latest_intent = None
    summarized = 0
    for tid in thread_ids:
        try:
            summary = await svc.summarize_thread(current_user.organization_id, tid)
            if summary:
                summarized += 1
                word = summary.summary_word or summary.intent
                if word:
                    latest_intent = word
                logger.info("[BACKFILL] Thread %s → intent=%s summary_word=%s", tid, summary.intent, summary.summary_word)
        except Exception as exc:
            logger.warning("[BACKFILL] Failed to summarize thread %s: %s", tid, exc)

    if summarized:
        await db.commit()

    # Step 2: Run assessment with intent
    async with AsyncSessionFactory() as assess_db:
        result = await run_lead_assessment(
            assess_db, lead_id, current_user.organization_id,
            current_user.id, trigger="inbound_email", intent=latest_intent,
        )
        if result:
            await assess_db.commit()

    return {
        "success": True,
        "message": f"Backfill complete: {summarized}/{len(thread_ids)} threads summarized, assessment {'updated' if result else 'skipped'}.",
        "data": {
            "threads_summarized": summarized,
            "total_threads": len(thread_ids),
            "latest_intent": latest_intent,
            "scores_updated": result is not None,
            "engagement_score": result.get("engagement", {}).get("score") if result else None,
            "overall_score": result.get("overall", {}).get("score") if result else None,
            "tier": result.get("overall", {}).get("tier") if result else None,
        },
    }


@router.post(
    "/draft-outreach",
    response_model=StandardResponse[EmailDraftResponse],
    summary="Generate an AI outreach email draft",
    description="Generates a brand-new (not-a-reply) subject + body draft for a contact/lead, enriched with past email history.",
    dependencies=[Depends(require_permission("email:read"))],
)
async def draft_outreach_email(payload: EmailDraftRequest, current_user: CurrentUser, db: DBSession) -> dict:
    client = AIClient()
    try:
        sender_name = getattr(current_user, "full_name", None) or getattr(current_user, "name", None) or None
        
        # 1. Start with any CRM notes passed directly from the frontend UI
        enriched_context = payload.context or ""
        
        # 2. Fetch past email thread history from the database to inject into the LLM
        if payload.external_entity_id:
            stmt = select(Email).where(
                Email.external_entity_id == payload.external_entity_id,
                Email.organization_id == current_user.organization_id
            ).order_by(Email.sent_at.desc()).limit(3)
            
            result = await db.execute(stmt)
            past_emails = result.scalars().all()
            
            if past_emails:
                enriched_context += "\n\n--- RECENT EMAIL HISTORY ---\n"
                # Reverse to chronological order (oldest first) so the AI reads it like a timeline
                for msg in reversed(past_emails):
                    direction_label = "Sent to Lead" if msg.direction == "outbound" else "Received from Lead"
                    date_str = msg.sent_at.strftime('%Y-%m-%d') if msg.sent_at else "Unknown Date"
                    body_snippet = msg.body_preview or "No body text available."
                    enriched_context += f"[{date_str}] {direction_label} | Subject: {msg.subject}\nBody: {body_snippet}\n\n"

        # 3. Send the deeply enriched context to the stateless AI service
        raw = await client.draft_email(
            recipient_name=payload.recipient_name,
            recipient_email=payload.recipient_email,
            company=payload.company,
            designation=payload.designation,
            purpose=payload.purpose,
            context=enriched_context,
            sender_name=sender_name,
        )
    finally:
        await client.close()

    if not raw:
        data = EmailDraftResponse(
            subject=f"Following up, {payload.recipient_name.split(' ')[0]}",
            body=(
                f"Hi {payload.recipient_name.split(' ')[0]},\n\n"
                "Wanted to reach out and follow up. Let me know if you have a few minutes to connect this week.\n\n"
                "Best regards"
            ),
            model_version=None,
        )
        return {"success": True, "message": "AI service unavailable, returned a fallback draft.", "data": data}

    data = EmailDraftResponse(
        subject=raw.get("subject") or "Following up",
        body=raw.get("body") or "",
        model_version=raw.get("model_version"),
    )
    return {"success": True, "message": "OK", "data": data}