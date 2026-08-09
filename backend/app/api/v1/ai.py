"""
AI integration routes.
Future-facing endpoints return structured placeholders that can be backed by
real models later without changing the public API.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import AsyncIterator
from uuid import UUID

from fastapi import APIRouter, Depends, status
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
    from app.repositories.ai_repository import AIRecommendationRepository
    from uuid import UUID

    repo = AIRecommendationRepository(db)
    items = {}
    for lid in payload.lead_ids:
        uuid_id = UUID(str(lid))
        recs = await repo.latest_for_entity(
            current_user.organization_id, entity_type="lead", entity_id=uuid_id
        )
        rec = recs[0] if recs else None
        if rec and rec.recommendation:
            items[str(lid)] = AIBatchRecommendationItem(
                lead_id=lid,
                recommended_action=rec.recommendation,
                reason=rec.reasoning or "",
                current_score=int(round(rec.metadata_json.get("score", 0))) if rec.metadata_json else 0,
                current_stage=rec.metadata_json.get("stage", "") if rec.metadata_json else "",
                all_candidates=rec.metadata_json.get("recommendations", []) if rec.metadata_json else [],
            )
        else:
            items[str(lid)] = AIBatchRecommendationItem(
                lead_id=lid,
                recommended_action="No recommendation available for this lead.",
                reason="",
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
