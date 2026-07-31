"""
Lead Routes
GET    /api/v1/leads
POST   /api/v1/leads
GET    /api/v1/leads/{id}
PUT    /api/v1/leads/{id}
DELETE /api/v1/leads/{id}
PATCH  /api/v1/leads/{id}/status
POST   /api/v1/leads/{id}/assign
POST   /api/v1/leads/{id}/convert
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.lead import (
    LeadAssignRequest,
    LeadCreateRequest,
    LeadConvertRequest,
    LeadResponse,
    LeadStatusUpdateRequest,
    LeadUpdateRequest,
)
from app.schemas.deal import DealResponse
from app.services.lead_service import LeadService
from app.repositories.ai_repository import AIRecommendationRepository
from app.utils.enums import LeadStatus

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[LeadResponse]],
    summary="List leads",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def list_leads(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[LeadStatus] = Query(default=None),
    owner_id: Optional[UUID] = Query(default=None),
    company_id: Optional[UUID] = Query(default=None),
    contact_id: Optional[UUID] = Query(default=None),
) -> dict:
    svc = LeadService(db)
    leads, total = await svc.list(
        current_user.organization_id,
        search, status, owner_id, company_id, contact_id,
        page, page_size,
    )
    # Batch-load latest recommendations for all leads in this page
    rec_repo = AIRecommendationRepository(db)
    rec_map = {}
    missing_lead_ids = []
    for lead in leads:
        rec = await rec_repo.latest_for_lead(current_user.organization_id, lead.id)
        if rec:
            rec_map[lead.id] = {
                "recommended_action": rec.recommendation,
                "reason": rec.reasoning,
            }
        else:
            missing_lead_ids.append(lead.id)
    # Auto-generate recommendations for leads that don't have one yet
    if missing_lead_ids:
        try:
            from app.services.recommendation_service import RecommendationService
            rec_svc = RecommendationService(db)
            generated = await rec_svc.batch_generate_for_leads(missing_lead_ids, current_user.organization_id)
            for lead_id, rec_data in generated.items():
                rec_map[lead_id] = {
                    "recommended_action": rec_data.get("recommended_action", ""),
                    "reason": rec_data.get("reason", ""),
                }
        except Exception as e:
            pass
    paginated = PaginatedResponse.create(
        data=[LeadResponse.from_lead(l, rec_map.get(l.id)) for l in leads],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.post(
    "",
    response_model=StandardResponse[LeadResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create lead",
    dependencies=[Depends(require_permission("lead:create"))],
)
async def create_lead(
    payload: LeadCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = LeadService(db)
    lead = await svc.create(payload, current_user.organization_id, current_user.id)
    return {"success": True, "message": "Lead created.", "data": LeadResponse.from_lead(lead)}


@router.get(
    "/{lead_id}",
    response_model=StandardResponse[LeadResponse],
    summary="Get lead by ID",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def get_lead(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = LeadService(db)
    lead = await svc.get(lead_id, current_user.organization_id)
    rec_repo = AIRecommendationRepository(db)
    rec = await rec_repo.latest_for_lead(current_user.organization_id, lead_id)
    rec_dict = None
    if rec:
        rec_dict = {"recommended_action": rec.recommendation, "reason": rec.reasoning}
    else:
        try:
            from app.services.recommendation_service import RecommendationService
            rec_svc = RecommendationService(db)
            generated = await rec_svc.generate_for_lead(lead_id, current_user.organization_id)
            if generated:
                rec_dict = {"recommended_action": generated.get("recommended_action", ""), "reason": generated.get("reason", "")}
        except Exception:
            pass
    return {"success": True, "message": "OK", "data": LeadResponse.from_lead(lead, rec_dict)}


@router.put(
    "/{lead_id}",
    response_model=StandardResponse[LeadResponse],
    summary="Update lead",
    dependencies=[Depends(require_permission("lead:update"))],
)
async def update_lead(
    lead_id: UUID,
    payload: LeadUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = LeadService(db)
    lead = await svc.update(lead_id, current_user.organization_id, payload)
    return {"success": True, "message": "Lead updated.", "data": LeadResponse.from_lead(lead)}


@router.patch(
    "/{lead_id}/status",
    response_model=StandardResponse[LeadResponse],
    summary="Update lead status (FSM-enforced)",
    description=(
        "Transitions a lead through its status pipeline. "
        "Invalid transitions (e.g. New → Won) are rejected. "
        "Won/Lost transitions require a close_reason."
    ),
    dependencies=[Depends(require_permission("lead:update"))],
)
async def update_lead_status(
    lead_id: UUID,
    payload: LeadStatusUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = LeadService(db)
    lead = await svc.update_status(lead_id, current_user.organization_id, payload)
    return {"success": True, "message": "Lead status updated.", "data": LeadResponse.from_lead(lead)}


@router.post(
    "/{lead_id}/assign",
    response_model=StandardResponse[LeadResponse],
    summary="Assign lead to user",
    dependencies=[Depends(require_permission("lead:assign"))],
)
async def assign_lead(
    lead_id: UUID,
    payload: LeadAssignRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = LeadService(db)
    lead = await svc.assign(lead_id, current_user.organization_id, payload)
    return {"success": True, "message": "Lead assigned.", "data": LeadResponse.from_lead(lead)}


@router.post(
    "/{lead_id}/convert",
    response_model=StandardResponse[DealResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Convert lead to deal",
    description=(
        "Converts an existing lead into a deal inside a single transaction. "
        "The workflow copies lead data, maps company/contact/owner, marks the lead as converted, and records a timeline event."
    ),
    dependencies=[Depends(require_permission("lead:convert"))],
)
async def convert_lead(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    payload: Optional[LeadConvertRequest] = None,
) -> dict:
    svc = LeadService(db)
    industry = payload.industry if payload else None
    revenue = payload.revenue if payload else None
    employee_count = payload.employee_count if payload else None
    pipeline_stage_id = payload.pipeline_stage_id if payload else None
    deal = await svc.convert_to_deal(
        lead_id,
        current_user.organization_id,
        current_user.id,
        industry=industry,
        revenue=revenue,
        employee_count=employee_count,
        pipeline_stage_id=pipeline_stage_id,
    )
    return {"success": True, "message": "Lead converted to deal.", "data": DealResponse.from_deal(deal)}


@router.delete(
    "/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete lead (hard)",
    dependencies=[Depends(require_permission("lead:delete"))],
)
async def delete_lead(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    svc = LeadService(db)
    await svc.delete(lead_id, current_user.organization_id)
