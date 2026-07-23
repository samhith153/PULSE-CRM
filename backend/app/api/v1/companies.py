"""
Company Routes
GET    /api/v1/companies
POST   /api/v1/companies
GET    /api/v1/companies/{id}
PUT    /api/v1/companies/{id}
DELETE /api/v1/companies/{id}
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import PaginatedResponse, StandardResponse
from app.schemas.company import CompanyCreateRequest, CompanyResponse, CompanyUpdateRequest
from app.services.company_service import CompanyService

router = APIRouter()


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
    companies, total = await svc.list(current_user.organization_id, search, page, page_size)
    paginated = PaginatedResponse.create(
        data=[CompanyResponse.model_validate(c) for c in companies],
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
    return {"success": True, "message": "Company created.", "data": CompanyResponse.model_validate(company)}


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
    return {"success": True, "message": "OK", "data": CompanyResponse.model_validate(company)}


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
    company = await svc.update(company_id, current_user.organization_id, payload)
    return {"success": True, "message": "Company updated.", "data": CompanyResponse.model_validate(company)}


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
    await svc.delete(company_id, current_user.organization_id)
