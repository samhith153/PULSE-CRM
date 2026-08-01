"""
Feature Vector Repository
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feature_vector import FeatureVector
from app.repositories.base import BaseRepository


class FeatureVectorRepository(BaseRepository[FeatureVector]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(FeatureVector, db)

    async def get_by_lead_id(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[FeatureVector]:
        stmt = select(FeatureVector).where(
            FeatureVector.lead_id == lead_id,
            FeatureVector.organization_id == organization_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_for_lead(
        self,
        lead_id: UUID,
        organization_id: UUID,
        created_by: Optional[UUID],
        features: dict,
    ) -> FeatureVector:
        existing = await self.get_by_lead_id(lead_id, organization_id)
        if existing:
            for key, value in features.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            if created_by:
                existing.created_by = created_by
            self.db.add(existing)
            await self.db.flush()
            await self.db.refresh(existing)
            return existing
        else:
            fv = FeatureVector(
                lead_id=lead_id,
                organization_id=organization_id,
                created_by=created_by,
                **features,
            )
            self.db.add(fv)
            await self.db.flush()
            await self.db.refresh(fv)
            return fv
