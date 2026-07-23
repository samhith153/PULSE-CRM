"""
Contact Routes
GET    /api/v1/contacts
POST   /api/v1/contacts
GET    /api/v1/contacts/{id}
PUT    /api/v1/contacts/{id}
DELETE /api/v1/contacts/{id}
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.contact import ContactCreateRequest, ContactResponse, ContactUpdateRequest
from app.services.contact_service import ContactService

router = APIRouter()


@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[ContactResponse]],
    summary="List contacts",
    dependencies=[Depends(require_permission("contact:read"))],
)
async def list_contacts(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    company_id: Optional[UUID] = Query(default=None),
) -> dict:
    svc = ContactService(db)
    contacts, total = await svc.list(
        current_user.organization_id, search, company_id, page, page_size
    )
    paginated = PaginatedResponse.create(
        data=[ContactResponse.model_validate(c) for c in contacts],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.post(
    "",
    response_model=StandardResponse[ContactResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create contact",
    dependencies=[Depends(require_permission("contact:create"))],
)
async def create_contact(
    payload: ContactCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = ContactService(db)
    contact = await svc.create(payload, current_user.organization_id, current_user.id)
    return {"success": True, "message": "Contact created.", "data": ContactResponse.model_validate(contact)}


@router.get(
    "/{contact_id}",
    response_model=StandardResponse[ContactResponse],
    summary="Get contact by ID",
    dependencies=[Depends(require_permission("contact:read"))],
)
async def get_contact(
    contact_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = ContactService(db)
    contact = await svc.get(contact_id, current_user.organization_id)
    return {"success": True, "message": "OK", "data": ContactResponse.model_validate(contact)}


@router.put(
    "/{contact_id}",
    response_model=StandardResponse[ContactResponse],
    summary="Update contact",
    dependencies=[Depends(require_permission("contact:update"))],
)
async def update_contact(
    contact_id: UUID,
    payload: ContactUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = ContactService(db)
    contact = await svc.update(contact_id, current_user.organization_id, payload)
    return {"success": True, "message": "Contact updated.", "data": ContactResponse.model_validate(contact)}


@router.delete(
    "/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete contact (soft)",
    dependencies=[Depends(require_permission("contact:delete"))],
)
async def delete_contact(
    contact_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    svc = ContactService(db)
    await svc.delete(contact_id, current_user.organization_id)
