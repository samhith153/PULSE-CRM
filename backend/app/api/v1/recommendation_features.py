"""
Recommendation feature routes.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import StandardResponse
from app.schemas.recommendation_feature import (
    RecommendationFeatureCreateRequest,
    RecommendationFeatureResponse,
    RecommendationFeatureUpdateRequest,
)
from app.services.recommendation_feature_service import RecommendationFeatureService

router = APIRouter()


@router.post(
    "",
    response_model=StandardResponse[RecommendationFeatureResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create recommendation feature snapshot",
    dependencies=[Depends(require_permission("lead:update"))],
)
async def create_recommendation_feature(
    payload: RecommendationFeatureCreateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = RecommendationFeatureService(db)
    feature = await svc.create(payload, current_user.organization_id, current_user.id)
    return {
        "success": True,
        "message": "Recommendation feature snapshot created.",
        "data": RecommendationFeatureResponse.model_validate(feature),
    }


@router.get(
    "/leads/{lead_id}",
    response_model=StandardResponse[list[RecommendationFeatureResponse]],
    summary="List recommendation features for a lead",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def list_recommendation_features_by_lead(
    lead_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = RecommendationFeatureService(db)
    features = await svc.list_by_lead(lead_id, current_user.organization_id)
    return {
        "success": True,
        "message": "OK",
        "data": [RecommendationFeatureResponse.model_validate(feature) for feature in features],
    }


@router.get(
    "/{feature_id}",
    response_model=StandardResponse[RecommendationFeatureResponse],
    summary="Get recommendation feature snapshot",
    dependencies=[Depends(require_permission("lead:read"))],
)
async def get_recommendation_feature(
    feature_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = RecommendationFeatureService(db)
    feature = await svc.get(feature_id, current_user.organization_id)
    return {
        "success": True,
        "message": "OK",
        "data": RecommendationFeatureResponse.model_validate(feature),
    }


@router.put(
    "/{feature_id}",
    response_model=StandardResponse[RecommendationFeatureResponse],
    summary="Update recommendation feature snapshot",
    dependencies=[Depends(require_permission("lead:update"))],
)
async def update_recommendation_feature(
    feature_id: UUID,
    payload: RecommendationFeatureUpdateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    svc = RecommendationFeatureService(db)
    feature = await svc.update(feature_id, current_user.organization_id, payload)
    return {
        "success": True,
        "message": "Recommendation feature snapshot updated.",
        "data": RecommendationFeatureResponse.model_validate(feature),
    }
