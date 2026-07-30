"""
Recommendation feature repository.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recommendation_feature import RecommendationFeature
from app.repositories.base import BaseRepository


class RecommendationFeatureRepository(BaseRepository[RecommendationFeature]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(RecommendationFeature, db)

    def _base_query(self, organization_id: UUID):
        return select(RecommendationFeature).where(
            RecommendationFeature.organization_id == organization_id,
            RecommendationFeature.is_active == True,
        )

    async def get_active_by_id(
        self,
        feature_id: UUID,
        organization_id: UUID,
    ) -> Optional[RecommendationFeature]:
        stmt = self._base_query(organization_id).where(RecommendationFeature.id == feature_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_lead(
        self,
        lead_id: UUID,
        organization_id: UUID,
    ) -> List[RecommendationFeature]:
        stmt = (
            self._base_query(organization_id)
            .where(RecommendationFeature.lead_id == lead_id)
            .order_by(RecommendationFeature.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
