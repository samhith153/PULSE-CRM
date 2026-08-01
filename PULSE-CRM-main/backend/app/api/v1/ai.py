"""
AI integration routes.
Future-facing endpoints return structured placeholders that can be backed by
real models later without changing the public API.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import AsyncIterator
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
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
    DealInsightRequest,
    DealInsightResponse,
    EnhancedRecommendationResponse,
    SummaryRequest,
    SummaryResponse,
)
from app.services.ai_service import AIService
from app.services.recommendation_engine_service import EnhancedRecommendationService

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


@router.post("/deal-insight", response_model=DealInsightResponse, status_code=status.HTTP_200_OK)
async def deal_insight(payload: DealInsightRequest, current_user: CurrentUser, db: DBSession) -> DealInsightResponse:
    service = AIService(db)
    return await service.deal_insight(current_user.organization_id, payload.deal_id)


@router.post("/summary", response_model=SummaryResponse, status_code=status.HTTP_200_OK)
async def summary(payload: SummaryRequest, current_user: CurrentUser, db: DBSession) -> SummaryResponse:
    service = AIService(db)
    return await service.summarize(current_user.organization_id, payload.entity_type, payload.prompt)


@router.post(
    "/enhanced-recommendation",
    response_model=EnhancedRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get enhanced recommendation with 6 new features",
)
async def enhanced_recommendation(
    lead_id: UUID = Query(..., description="Lead ID to generate recommendation for"),
    current_user: CurrentUser = None,
    db: DBSession = None,
) -> EnhancedRecommendationResponse:
    """Generate an enhanced recommendation for a lead with all 6 new features:
    deal_value, email_open_count, email_opened_no_reply_flag,
    meeting_attendance_status, rep_active_action_count, best_contact_time_slot."""
    service = EnhancedRecommendationService(db)
    return await service.get_enhanced_recommendation(
        organization_id=current_user.organization_id,
        lead_id=lead_id,
    )
