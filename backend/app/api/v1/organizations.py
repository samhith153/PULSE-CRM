"""
Organization Routes
GET  /api/v1/organizations/{id}
POST /api/v1/organizations
PUT  /api/v1/organizations/{id}
DELETE /api/v1/organizations/{id}
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import StandardResponse
from app.schemas.organization import (
    OrganizationCreateRequest,
    OrganizationResponse,
    OrganizationUpdateRequest,
)
from app.services.organization_service import OrganizationService

router = APIRouter()


@router.get(
    "/me",
    response_model=StandardResponse[OrganizationResponse],
    summary="Get own organization",
)
async def get_my_organization(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = OrganizationService(db)
    org = await svc.get(current_user.organization_id)
    return {"success": True, "message": "OK", "data": OrganizationResponse.model_validate(org)}


@router.post(
    "",
    response_model=StandardResponse[OrganizationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create organization",
    dependencies=[Depends(require_permission("org:create"))],
)
async def create_organization(
    payload: OrganizationCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = OrganizationService(db)
    org = await svc.create(payload, current_user.id)
    return {"success": True, "message": "Organization created.", "data": OrganizationResponse.model_validate(org)}


@router.put(
    "/{org_id}",
    response_model=StandardResponse[OrganizationResponse],
    summary="Update organization",
    dependencies=[Depends(require_permission("org:update"))],
)
async def update_organization(
    org_id: UUID,
    payload: OrganizationUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = OrganizationService(db)
    org = await svc.update(org_id, payload, current_user.organization_id)
    return {"success": True, "message": "Organization updated.", "data": OrganizationResponse.model_validate(org)}


@router.delete(
    "/{org_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete organization (soft)",
    dependencies=[Depends(require_permission("org:delete"))],
)
async def delete_organization(
    org_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    svc = OrganizationService(db)
    await svc.delete(org_id, current_user.organization_id)
