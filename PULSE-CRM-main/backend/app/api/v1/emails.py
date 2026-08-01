"""
Email detail routes.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.email import EmailDetailResponse, EmailResponse
from app.services.email_service import EmailService
from app.utils.enums import EmailDirection, SortOrder

router = APIRouter()


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
    "/{email_id}",
    response_model=StandardResponse[EmailDetailResponse],
    summary="Get an email by id",
    dependencies=[Depends(require_permission("email:read"))],
)
async def get_email(email_id: UUID, current_user: CurrentUser, db: DBSession) -> dict:
    service = EmailService(db)
    email = await service.get_by_id_response(current_user.organization_id, email_id)
    return {"success": True, "message": "OK", "data": email}
