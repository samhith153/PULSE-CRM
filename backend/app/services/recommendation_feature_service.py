"""
Recommendation feature service.
"""
from typing import List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleException, NotFoundException
from app.models.recommendation_feature import RecommendationFeature
from app.repositories.lead_repository import LeadRepository
from app.repositories.recommendation_feature_repository import RecommendationFeatureRepository
from app.schemas.recommendation_feature import (
    RecommendationFeatureCreateRequest,
    RecommendationFeatureUpdateRequest,
)


class RecommendationFeatureService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = RecommendationFeatureRepository(db)
        self.lead_repo = LeadRepository(db)

    async def create(
        self,
        payload: RecommendationFeatureCreateRequest,
        organization_id: UUID,
        created_by: UUID,
    ) -> RecommendationFeature:
        lead = await self.lead_repo.get_active_by_id(payload.lead_id, organization_id)
        if not lead:
            raise BusinessRuleException(f"Lead '{payload.lead_id}' not found.")

        return await self.repo.create(
            **payload.model_dump(),
            organization_id=organization_id,
            created_by=created_by,
        )

    async def list_by_lead(
        self,
        lead_id: UUID,
        organization_id: UUID,
    ) -> List[RecommendationFeature]:
        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            raise NotFoundException("Lead", lead_id)
        return await self.repo.list_by_lead(lead_id, organization_id)

    async def get(
        self,
        feature_id: UUID,
        organization_id: UUID,
    ) -> RecommendationFeature:
        feature = await self.repo.get_active_by_id(feature_id, organization_id)
        if not feature:
            raise NotFoundException("RecommendationFeature", feature_id)
        return feature

    async def update(
        self,
        feature_id: UUID,
        organization_id: UUID,
        payload: RecommendationFeatureUpdateRequest,
    ) -> RecommendationFeature:
        feature = await self.get(feature_id, organization_id)
        return await self.repo.update(feature, **payload.model_dump(exclude_unset=True))
