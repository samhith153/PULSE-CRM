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
        raise NotFoundException("FeatureVector for lead", lead_id)
    return {
        "success": True,
        "message": "OK",
        "data": FeatureVectorResponse.from_feature_vector(fv),
    }


@router.post(
    "/leads/{lead_id}/compute",
    response_model=StandardResponse[FeatureVectorResponse],
    summary="Trigger assessment pipeline and return feature vector",
    dependencies=[Depends(require_permission("lead:update"))],
)
async def compute_lead_feature_vector(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    from app.services.ai_pipeline import run_lead_assessment
    await run_lead_assessment(
        db, lead_id, current_user.organization_id, current_user.id,
        trigger="lead_updated",
    )
    await db.commit()

    svc = FeatureVectorService(db)
    fv = await svc.get_by_lead_id(lead_id, current_user.organization_id)
    if not fv:
        raise NotFoundException("Lead", lead_id)
    return {
        "success": True,
        "message": "Assessment pipeline triggered; feature vector updated.",
        "data": FeatureVectorResponse.from_feature_vector(fv),
    }
