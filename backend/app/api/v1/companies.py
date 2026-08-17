"""
Company Routes
GET    /api/v1/companies
POST   /api/v1/companies
GET    /api/v1/companies/{id}
PUT    /api/v1/companies/{id}
DELETE /api/v1/companies/{id}
GET    /api/v1/companies/{id}/timeline
GET    /api/v1/companies/{id}/summary
GET    /api/v1/companies/{id}/contacts
GET    /api/v1/companies/{id}/deals
GET    /api/v1/companies/{id}/notes
POST   /api/v1/companies/{id}/notes
PATCH  /api/v1/companies/{id}/notes/{note_id}
DELETE /api/v1/companies/{id}/notes/{note_id}
GET    /api/v1/companies/{id}/attachments
GET    /api/v1/companies/{id}/details
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.activity_timeline import ActivitySummaryResponse, TimelineListResponse
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.company import CompanyCreateRequest, CompanyResponse, CompanyUpdateRequest
from app.services.company_service import CompanyService

router = APIRouter()


# ── request bodies for notes ─────────────────────────────────────────────────

class CompanyNoteCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: Optional[str] = None


class CompanyNoteUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    body: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# EXISTING ENDPOINTS (unchanged)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=StandardResponse[PaginatedResponse[CompanyResponse]],
    summary="List companies",
    dependencies=[Depends(require_permission("company:read"))],
)
async def list_companies(
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
) -> dict:
    svc = CompanyService(db)
    companies, total = await svc.list(current_user.organization_id, search, page, page_size, user=current_user)
    paginated = PaginatedResponse.create(
        data=[CompanyResponse.from_company(c) for c in companies],
        total=total,
        page=page,
        page_size=page_size,
    )
    return {"success": True, "message": "OK", "data": paginated}


@router.post(
    "",
    response_model=StandardResponse[CompanyResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create company",
    dependencies=[Depends(require_permission("company:create"))],
)
async def create_company(
    payload: CompanyCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CompanyService(db)
    company = await svc.create(payload, current_user.organization_id, current_user.id)
    return {"success": True, "message": "Company created.", "data": CompanyResponse.from_company(company)}


@router.get(
    "/{company_id}",
    response_model=StandardResponse[CompanyResponse],
    summary="Get company by ID",
    dependencies=[Depends(require_permission("company:read"))],
)
async def get_company(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CompanyService(db)
    company = await svc.get(company_id, current_user.organization_id)
    return {"success": True, "message": "OK", "data": CompanyResponse.from_company(company)}


@router.put(
    "/{company_id}",
    response_model=StandardResponse[CompanyResponse],
    summary="Update company",
    dependencies=[Depends(require_permission("company:update"))],
)
async def update_company(
    company_id: UUID,
    payload: CompanyUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CompanyService(db)
    company = await svc.update(
        company_id, current_user.organization_id, payload,
        updated_by=current_user.id,
    )
    return {"success": True, "message": "Company updated.", "data": CompanyResponse.from_company(company)}


@router.delete(
    "/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete company (soft)",
    dependencies=[Depends(require_permission("company:delete"))],
)
async def delete_company(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    svc = CompanyService(db)
    await svc.delete(company_id, current_user.organization_id, deleted_by=current_user.id)


# ─────────────────────────────────────────────────────────────────────────────
# TIMELINE  GET /companies/{id}/timeline
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{company_id}/timeline",
    response_model=StandardResponse[TimelineListResponse],
    summary="Company timeline — real database history",
    description=(
        "Returns the complete, paginated activity history for a company: "
        "create/update/delete events, contact links, deal events, emails, "
        "calls, meetings, notes — newest first. Soft-deleted events excluded."
    ),
    dependencies=[Depends(require_permission("company:read"))],
)
async def get_company_timeline(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    activity_type: Optional[str] = Query(
        default=None,
        description="Filter by action, e.g. company_created, company_deal_won",
    ),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
) -> dict:
    svc = CompanyService(db)
    result = await svc.get_timeline(
        company_id,
        current_user.organization_id,
        page=page,
        page_size=page_size,
        activity_type=activity_type,
        date_from=date_from,
        date_to=date_to,
        sort_order=sort_order,
    )
    return {"success": True, "message": "Timeline retrieved.", "data": result}


# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY  GET /companies/{id}/summary
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{company_id}/summary",
    response_model=StandardResponse[ActivitySummaryResponse],
    summary="Company activity summary counts",
    dependencies=[Depends(require_permission("company:read"))],
)
async def get_company_summary(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CompanyService(db)
    result = await svc.get_activity_summary(company_id, current_user.organization_id)
    return {"success": True, "message": "Summary retrieved.", "data": result}


# ─────────────────────────────────────────────────────────────────────────────
# CONTACTS  GET /companies/{id}/contacts
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{company_id}/contacts",
    response_model=StandardResponse[dict],
    summary="List contacts linked to a company",
    dependencies=[Depends(require_permission("company:read"))],
)
async def get_company_contacts(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> dict:
    svc = CompanyService(db)
    contacts, total = await svc.get_contacts(
        company_id, current_user.organization_id, page=page, page_size=page_size
    )
    return {
        "success": True,
        "message": "OK",
        "data": {
            "contacts": contacts,
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# DEALS  GET /companies/{id}/deals
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{company_id}/deals",
    response_model=StandardResponse[dict],
    summary="List deals linked to a company",
    dependencies=[Depends(require_permission("company:read"))],
)
async def get_company_deals(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> dict:
    svc = CompanyService(db)
    deals, total = await svc.get_deals(
        company_id, current_user.organization_id, page=page, page_size=page_size
    )
    return {
        "success": True,
        "message": "OK",
        "data": {
            "deals": deals,
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# DETAILS  GET /companies/{id}/details  (all-in-one for the side panel)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{company_id}/details",
    response_model=StandardResponse[dict],
    summary="Company details panel — company info + contacts + timeline in one call",
    description=(
        "All-in-one endpoint for the Company Details side panel. "
        "Returns company info, linked contacts, linked deals, "
        "recent timeline events, and activity summary counts."
    ),
    dependencies=[Depends(require_permission("company:read"))],
)
async def get_company_details(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    timeline_page: int = Query(default=1, ge=1),
    timeline_page_size: int = Query(default=10, ge=1, le=50),
) -> dict:
    svc = CompanyService(db)
    details = await svc.get_details(
        company_id,
        current_user.organization_id,
        timeline_page=timeline_page,
        timeline_page_size=timeline_page_size,
    )
    return {"success": True, "message": "OK", "data": details}


# ─────────────────────────────────────────────────────────────────────────────
# NOTES  /companies/{id}/notes
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{company_id}/notes",
    response_model=StandardResponse[dict],
    summary="List internal notes for a company",
    dependencies=[Depends(require_permission("company:read"))],
)
async def list_company_notes(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
) -> dict:
    svc = CompanyService(db)
    notes, total = await svc.list_notes(
        company_id, current_user.organization_id,
        page=page, page_size=page_size, search=search,
    )
    return {
        "success": True,
        "message": "OK",
        "data": {"notes": notes, "total": total, "page": page, "page_size": page_size},
    }


@router.post(
    "/{company_id}/notes",
    response_model=StandardResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Add an internal note to a company",
    dependencies=[Depends(require_permission("company:update"))],
)
async def create_company_note(
    company_id: UUID,
    payload: CompanyNoteCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CompanyService(db)
    note = await svc.create_note(
        company_id, current_user.organization_id, current_user.id,
        title=payload.title, body=payload.body,
    )
    return {"success": True, "message": "Note created.", "data": note}


@router.patch(
    "/{company_id}/notes/{note_id}",
    response_model=StandardResponse[dict],
    summary="Edit a company note",
    dependencies=[Depends(require_permission("company:update"))],
)
async def update_company_note(
    company_id: UUID,
    note_id: UUID,
    payload: CompanyNoteUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = CompanyService(db)
    note = await svc.update_note(
        company_id, note_id, current_user.organization_id, current_user.id,
        title=payload.title, body=payload.body,
    )
    return {"success": True, "message": "Note updated.", "data": note}


@router.delete(
    "/{company_id}/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
    summary="Soft-delete a company note",
    dependencies=[Depends(require_permission("company:update"))],
)
async def delete_company_note(
    company_id: UUID,
    note_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    svc = CompanyService(db)
    await svc.delete_note(
        company_id, note_id, current_user.organization_id, current_user.id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# ATTACHMENTS  GET /companies/{id}/attachments
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{company_id}/attachments",
    response_model=StandardResponse[dict],
    summary="List uploaded attachments for a company",
    description=(
        "Returns file metadata (name, type, size, uploader, date) for all documents "
        "linked to this company. Download via GET /api/v1/documents/{id}/download."
    ),
    dependencies=[Depends(require_permission("company:read"))],
)
async def list_company_attachments(
    company_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> dict:
    svc = CompanyService(db)
    attachments, total = await svc.list_attachments(
        company_id, current_user.organization_id,
        page=page, page_size=page_size,
    )
    return {
        "success": True,
        "message": "OK",
        "data": {"attachments": attachments, "total": total, "page": page, "page_size": page_size},
    }
