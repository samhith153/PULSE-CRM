"""
Lead Score API Router
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.core.exceptions import NotFoundException
from app.schemas.common import StandardResponse
from app.schemas.lead_score import LeadScoreResponse
from app.services.lead_scoring_service import LeadScoringService

router = APIRouter()


@router.get(
    "/leads/{lead_id}",
    response_model=StandardResponse[LeadScoreResponse],
    summary="Get lead scores for a lead",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def get_lead_scores(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = LeadScoringService(db)
    ls = await svc.get_by_lead_id(lead_id, current_user.organization_id)
    if not ls:
        raise NotFoundException("LeadScore for lead", lead_id)
    return {
        "success": True,
        "message": "OK",
        "data": LeadScoreResponse.from_lead_score(ls),
    }


@router.post(
    "/leads/{lead_id}/recompute",
    response_model=StandardResponse[LeadScoreResponse],
    summary="Recompute lead scores for a lead",
    dependencies=[Depends(require_permission("lead:update"))],
)
async def recompute_lead_scores(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = LeadScoringService(db)
    ls = await svc.compute_and_store_scores(lead_id, current_user.organization_id, current_user.id)
    if not ls:
        raise NotFoundException("Lead", lead_id)
    return {
        "success": True,
        "message": "Lead scores recomputed successfully.",
        "data": LeadScoreResponse.from_lead_score(ls),
    }
