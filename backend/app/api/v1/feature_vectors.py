"""
Feature Vector API Router
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.core.exceptions import NotFoundException
from app.schemas.common import StandardResponse
from app.schemas.feature_vector import FeatureVectorResponse
from app.services.feature_vector_service import FeatureVectorService

router = APIRouter()


@router.get(
    "/leads/{lead_id}",
    response_model=StandardResponse[FeatureVectorResponse],
    summary="Get feature vector for a lead",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def get_lead_feature_vector(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = FeatureVectorService(db)
    fv = await svc.get_by_lead_id(lead_id, current_user.organization_id)
    if not fv:
        # Compute if not exists
        fv = await svc.compute_and_store_for_lead(lead_id, current_user.organization_id, current_user.id)
    if not fv:
        raise NotFoundException("FeatureVector for lead", lead_id)
    return {
        "success": True,
        "message": "OK",
        "data": FeatureVectorResponse.from_feature_vector(fv),
    }


@router.post(
    "/leads/{lead_id}/compute",
    response_model=StandardResponse[FeatureVectorResponse],
    summary="Compute or recompute feature vector for a lead",
    dependencies=[Depends(require_permission("lead:update"))],
)
async def compute_lead_feature_vector(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = FeatureVectorService(db)
    fv = await svc.compute_and_store_for_lead(lead_id, current_user.organization_id, current_user.id)
    if not fv:
        raise NotFoundException("Lead", lead_id)
    return {
        "success": True,
        "message": "Feature vector computed successfully.",
        "data": FeatureVectorResponse.from_feature_vector(fv),
    }
