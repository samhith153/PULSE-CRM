"""
Deal Routes
GET    /api/v1/deals
POST   /api/v1/deals
GET    /api/v1/deals/{id}
PUT    /api/v1/deals/{id}
DELETE /api/v1/deals/{id}
"""
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.deal import DealCreateRequest, DealResponse, DealUpdateRequest
from app.services.deal_service import DealService
from app.utils.enums import DealSortField, DealStatus, SortOrder

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[DealResponse]],
    summary="List deals",
    dependencies=[Depends(require_permission("deal:read"))],
)
async def list_deals(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    status: Optional[DealStatus] = Query(default=None),
    owner_id: Optional[UUID] = Query(default=None),
    company_id: Optional[UUID] = Query(default=None),
    contact_id: Optional[UUID] = Query(default=None),
    lead_id: Optional[UUID] = Query(default=None),
    pipeline_stage_id: Optional[UUID] = Query(default=None),
    min_amount: Optional[Decimal] = Query(default=None, ge=0),
    max_amount: Optional[Decimal] = Query(default=None, ge=0),
    sort_by: Optional[DealSortField] = Query(default=DealSortField.CREATED_AT),
    sort_order: SortOrder = Query(default=SortOrder.DESC),
) -> dict:
    svc = DealService(db)
    deals, total = await svc.list(
        current_user.organization_id,
        search,
        status,
        owner_id,
        company_id,
        contact_id,
        lead_id,
        pipeline_stage_id,
        min_amount,
        max_amount,
        sort_by,
        sort_order,
        page,
        page_size,
    )
    paginated = PaginatedResponse.create(
        data=[DealResponse.model_validate(d) for d in deals],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.post(
    "",
    response_model=StandardResponse[DealResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create deal",
    dependencies=[Depends(require_permission("deal:create"))],
)
async def create_deal(payload: DealCreateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = DealService(db)
    deal = await svc.create(payload, current_user.organization_id, current_user.id)
    return {"success": True, "message": "Deal created.", "data": DealResponse.model_validate(deal)}


@router.get(
    "/{deal_id}",
    response_model=StandardResponse[DealResponse],
    summary="Get deal by ID",
    dependencies=[Depends(require_permission("deal:read"))],
)
async def get_deal(deal_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    svc = DealService(db)
    deal = await svc.get(deal_id, current_user.organization_id)
    return {"success": True, "message": "OK", "data": DealResponse.model_validate(deal)}


@router.put(
    "/{deal_id}",
    response_model=StandardResponse[DealResponse],
    summary="Update deal",
    dependencies=[Depends(require_permission("deal:update"))],
)
async def update_deal(deal_id: UUID, payload: DealUpdateRequest, current_user: CurrentUser, db: DBSession) -> dict:
    svc = DealService(db)
    deal = await svc.update(deal_id, current_user.organization_id, payload)
    return {"success": True, "message": "Deal updated.", "data": DealResponse.model_validate(deal)}


@router.delete(
    "/{deal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete deal (soft)",
    dependencies=[Depends(require_permission("deal:delete"))],
)
async def delete_deal(deal_id: UUID, current_user: CurrentUser, db: DBSession) -> None:
    svc = DealService(db)
    await svc.delete(deal_id, current_user.organization_id)
