"""
AI integration routes.
Future-facing endpoints return structured placeholders that can be backed by
real models later without changing the public API.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import AsyncIterator
from uuid import UUID

from fastapi import APIRouter, Depends, status

logger = logging.getLogger(__name__)
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.ai import (
    AIConversationSummaryRequest,
    AIConversationSummaryResponse,
    AIEmailSummaryRequest,
    AIEmailSummaryResponse,
    AIJobRequest,
    AIJobResponse,
    AILeadScoreRequest,
    AILeadScoreResponse,
    AINextBestActionRequest,
    AINextBestActionResponse,
    AIRecommendationRequest,
    AIRecommendationResponse,
    AIBatchRecommendationRequest,
    AIBatchRecommendationResponse,
    AIBatchRecommendationItem,
    DealInsightRequest,
    DealInsightResponse,
    SummaryRequest,
    SummaryResponse,
)
from app.services.ai_service import AIService

router = APIRouter(dependencies=[Depends(require_permission("ai:access"))])


@router.get("/stream", summary="Stream AI events")
async def stream_events(current_user: CurrentUser) -> StreamingResponse:
    async def generator() -> AsyncIterator[str]:
        yield f"event: ready\ndata: {{\"organization_id\": \"{current_user.organization_id}\", \"status\": \"placeholder\"}}\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream")


@router.post("/jobs", response_model=AIJobResponse, status_code=status.HTTP_200_OK)
async def create_job(payload: AIJobRequest, current_user: CurrentUser, db: DBSession) -> AIJobResponse:
    service = AIService(db)
    return await service.create_job(current_user.organization_id, payload.job_type, payload.entity_type, payload.entity_id)


@router.post("/lead-score", response_model=AILeadScoreResponse, status_code=status.HTTP_200_OK)
async def lead_score(payload: AILeadScoreRequest, current_user: CurrentUser, db: DBSession) -> AILeadScoreResponse:
    service = AIService(db)
    return await service.lead_score(current_user.organization_id, payload.lead_id)


@router.post("/next-best-action", response_model=AINextBestActionResponse, status_code=status.HTTP_200_OK)
async def next_best_action(
    payload: AINextBestActionRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> AINextBestActionResponse:
    service = AIService(db)
    return await service.next_best_action(current_user.organization_id, payload.entity_type, payload.entity_id)


@router.post("/conversation-summary", response_model=AIConversationSummaryResponse, status_code=status.HTTP_200_OK)
async def conversation_summary(
    payload: AIConversationSummaryRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> AIConversationSummaryResponse:
    service = AIService(db)
    return await service.conversation_summary(current_user.organization_id, payload.thread_id)


@router.post("/email-summary", response_model=AIEmailSummaryResponse, status_code=status.HTTP_200_OK)
async def email_summary(payload: AIEmailSummaryRequest, current_user: CurrentUser, db: DBSession) -> AIEmailSummaryResponse:
    service = AIService(db)
    return await service.email_summary(current_user.organization_id, payload.email_id)


@router.post("/recommendations", response_model=AIRecommendationResponse, status_code=status.HTTP_200_OK)
async def recommendations(
    payload: AIRecommendationRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> AIRecommendationResponse:
    service = AIService(db)
    return await service.recommendations(current_user.organization_id, payload.entity_type, payload.entity_id)


@router.post(
    "/recommendations/batch",
    response_model=AIBatchRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch generate recommendations for multiple leads",
)
async def batch_recommendations(
    payload: AIBatchRecommendationRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> AIBatchRecommendationResponse:
    from app.models.lead import Lead
    from app.models.email import Email
    from app.models.email_summary import EmailSummary
    from app.models.lead_score import LeadScore
    from app.models.deal import Deal
    from app.repositories.lead_repository import LeadRepository
    from app.services.ai_client import AIClient
    from app.services.email_analytics import EmailStatsService
    from sqlalchemy import select

    org_id = current_user.organization_id
    lead_repo = LeadRepository(db)
    email_stats_svc = EmailStatsService(db)

    uuid_ids = [UUID(str(lid)) for lid in payload.lead_ids]

    leads = {}
    for lid in uuid_ids:
        lead = await lead_repo.get_active_by_id(lid, org_id)
        if lead:
            leads[str(lid)] = lead

    batch_email_stats = await email_stats_svc.batch_get_lead_email_stats(uuid_ids, org_id)

    # Batch-fetch lead scores
    score_map: dict[str, int] = {}
    if uuid_ids:
        score_stmt = select(LeadScore).where(
            LeadScore.organization_id == org_id,
            LeadScore.lead_id.in_(uuid_ids),
        )
        score_result = await db.execute(score_stmt)
        for ls in score_result.scalars().all():
            score_map[str(ls.lead_id)] = ls.overall_score or 0

    email_summaries_by_lead: dict[str, list[dict]] = {}
    all_emails = []
    if leads:
        lead_ids_list = list(leads.values())
        email_stmt = (
            select(Email)
            .where(
                Email.organization_id == org_id,
                Email.external_entity_type == "lead",
                Email.external_entity_id.in_([l.id for l in lead_ids_list]),
                Email.is_active.is_(True),
            )
            .order_by(Email.sent_at.desc())
        )
        email_result = await db.execute(email_stmt)
        all_emails = list(email_result.scalars().all())

        thread_ids = list({e.thread_id for e in all_emails if e.thread_id})
        if thread_ids:
            summary_stmt = (
                select(EmailSummary)
                .where(
                    EmailSummary.organization_id == org_id,
                    EmailSummary.thread_id.in_(thread_ids),
                )
            )
            summary_result = await db.execute(summary_stmt)
            all_summaries = list(summary_result.scalars().all())

            email_to_lead: dict[str, str] = {}
            for email in all_emails:
                if email.thread_id and email.external_entity_id:
                    email_to_lead[email.thread_id] = str(email.external_entity_id)

            for summary in all_summaries:
                lead_id_str = email_to_lead.get(summary.thread_id)
                if lead_id_str:
                    email_summaries_by_lead.setdefault(lead_id_str, []).append({
                        "sentiment": summary.sentiment,
                        "intent": summary.intent,
                        "key_points": summary.key_points or [],
                        "action_items": summary.action_items or [],
                        "follow_up_suggestion": summary.follow_up_suggestion,
                        "follow_up_timing": summary.follow_up_timing,
                        "summary": summary.summary,
                        "category": summary.category,
                    })

    deal_repo = None
    items = {}
    ai_client = AIClient()
    leads_payload = []

    try:
        for lid_str, lead in leads.items():
            stats = batch_email_stats.get(lead.id, {
                "inbound_count": 0, "initiated_count": 0,
                "outbound_email_count": 0, "last_inbound_at": None,
                "days_since_last_outbound": None,
            })

            deal_amount = None
            if deal_repo is None:
                from app.repositories.deal_repository import DealRepository
                deal_repo = DealRepository(db)
            deal = await deal_repo.get_by_lead_id_in_org(lead.id, org_id)
            if deal and deal.amount is not None:
                deal_amount = float(deal.amount)
            elif lead.estimated_value is not None:
                deal_amount = float(lead.estimated_value)

            lead_emails = [e for e in all_emails if str(e.external_entity_id) == lid_str]
            outbound_emails = [e for e in lead_emails if getattr(e, "direction", None) == "outbound"]
            inbound_emails = [e for e in lead_emails if getattr(e, "direction", None) == "inbound"]

            outbound_subject = outbound_emails[-1].subject if outbound_emails else None
            inbound_subject = inbound_emails[-1].subject if inbound_emails else None
            latest_email = lead_emails[-1] if lead_emails else None
            latest_preview = latest_email.body_preview[:200] if latest_email and latest_email.body_preview else None

            summaries = email_summaries_by_lead.get(lid_str, [])
            latest_summary = summaries[-1] if summaries else {}

            current_stage = "new"
            if lead.status:
                current_stage = lead.status.lower().replace(" ", "_")

            # Auto-advance stage when outbound emails exist
            if outbound_emails and current_stage in ("new", "new_lead"):
                current_stage = "contacted"

            is_outbound = bool(outbound_emails and (not inbound_emails or outbound_emails[-1].sent_at >= inbound_emails[-1].sent_at))

            leads_payload.append({
                "lead_id": lid_str,
                "score": float(score_map.get(lid_str, 0)),
                "engagement_score": float(score_map.get(lid_str, 0)),
                "current_stage": current_stage,
                "deal_value": deal_amount,
                "tags": getattr(lead, "tags", None),
                "days_since_last_outbound": stats.get("days_since_last_outbound"),
                "is_outbound": is_outbound,
                "outbound_thread": [outbound_subject, 0] if outbound_subject else None,
                "inbound_thread": [inbound_subject] if inbound_subject else None,
                "last_contact_time": stats.get("last_inbound_at").isoformat() if stats.get("last_inbound_at") else None,
                "email_sentiment": latest_summary.get("sentiment"),
                "email_intent": latest_summary.get("intent"),
                "email_key_points": latest_summary.get("key_points"),
                "email_action_items": latest_summary.get("action_items"),
                "email_follow_up_suggestion": latest_summary.get("follow_up_suggestion"),
                "email_follow_up_timing": latest_summary.get("follow_up_timing"),
                "latest_email_subject": latest_email.subject if latest_email else None,
                "latest_email_preview": latest_preview,
                "outbound_email_count": stats.get("outbound_email_count", 0),
            })

        if leads_payload:
            stages_sent = [p.get("current_stage") for p in leads_payload]
            logger.info("AI batch request: %d leads, stages=%s", len(leads_payload), stages_sent)
            batch_result = await ai_client.batch_recommend(leads_payload)
            if batch_result:
                recs_map = batch_result.get("recommendations", {})
                has_recs = sum(1 for v in recs_map.values() if v.get("recommendations"))
                logger.info(
                    "AI batch result: %d leads, %d with recommendations, %d without",
                    len(recs_map),
                    has_recs,
                    len(recs_map) - has_recs,
                )
                for lid, rd in list(recs_map.items())[:1]:
                    logger.info(
                        "AI batch sample lead=%s stage=%s recs_count=%d keys=%s",
                        lid, rd.get("stage"), len(rd.get("recommendations", [])), list(rd.keys()),
                    )
            else:
                logger.warning("AI batch_recommend returned None for %d leads", len(leads_payload))
        else:
            batch_result = None

        if batch_result and batch_result.get("recommendations"):
            for lid_str, rec_data in batch_result["recommendations"].items():
                recs = rec_data.get("recommendations", [])
                if recs:
                    top = recs[0]
                    items[lid_str] = AIBatchRecommendationItem(
                        lead_id=UUID(lid_str),
                        recommended_action=top.get("action", ""),
                        reason="; ".join(top.get("reasons", [])),
                        current_score=int(round(rec_data.get("engagement_score", 0) or 0)),
                        current_stage=rec_data.get("stage", ""),
                        all_candidates=recs,
                    )
                else:
                    items[lid_str] = AIBatchRecommendationItem(
                        lead_id=UUID(lid_str),
                        recommended_action="No recommendation available.",
                        reason="Lead in terminal stage or insufficient data.",
                    )
    finally:
        await ai_client.close()

    for lid in payload.lead_ids:
        lid_str = str(lid)
        if lid_str not in items:
            if lid_str in leads:
                items[lid_str] = AIBatchRecommendationItem(
                    lead_id=lid,
                    recommended_action="No recommendation available.",
                    reason="Insufficient data or AI service unavailable.",
                )
            else:
                items[lid_str] = AIBatchRecommendationItem(
                    lead_id=lid,
                    recommended_action="No recommendation available.",
                    reason="Lead not found.",
                )

    return AIBatchRecommendationResponse(
        recommendations=items,
        generated_at=datetime.now(timezone.utc),
    )


@router.post("/deal-insight", response_model=DealInsightResponse, status_code=status.HTTP_200_OK)
async def deal_insight(payload: DealInsightRequest, current_user: CurrentUser, db: DBSession) -> DealInsightResponse:
    service = AIService(db)
    return await service.deal_insight(current_user.organization_id, payload.deal_id)


@router.post("/summary", response_model=SummaryResponse, status_code=status.HTTP_200_OK)
async def summary(payload: SummaryRequest, current_user: CurrentUser, db: DBSession) -> SummaryResponse:
    service = AIService(db)
    return await service.summarize(current_user.organization_id, payload.entity_type, payload.prompt)
