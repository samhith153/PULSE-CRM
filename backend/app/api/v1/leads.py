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
    LeadResponse,
    LeadStatusUpdateRequest,
    LeadUpdateRequest,
)
from app.schemas.deal import DealResponse
from app.services.lead_service import LeadService
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
    paginated = PaginatedResponse.create(
        data=[LeadResponse.model_validate(l) for l in leads],
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
    return {"success": True, "message": "Lead created.", "data": LeadResponse.model_validate(lead)}


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
    return {"success": True, "message": "OK", "data": LeadResponse.model_validate(lead)}


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
    return {"success": True, "message": "Lead updated.", "data": LeadResponse.model_validate(lead)}


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
    return {"success": True, "message": "Lead status updated.", "data": LeadResponse.model_validate(lead)}


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
    return {"success": True, "message": "Lead assigned.", "data": LeadResponse.model_validate(lead)}


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
) -> dict:
    svc = LeadService(db)
    deal = await svc.convert_to_deal(lead_id, current_user.organization_id, current_user.id)
    return {"success": True, "message": "Lead converted to deal.", "data": DealResponse.model_validate(deal)}


@router.delete(
    "/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete lead (soft)",
    dependencies=[Depends(require_permission("lead:delete"))],
)
async def delete_lead(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    svc = LeadService(db)
    await svc.delete(lead_id, current_user.organization_id)
