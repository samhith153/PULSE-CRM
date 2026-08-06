"""
Feature Vector Service (audit-only)

Stores assessment features for analytics, training, auditing, and debugging.
All scoring logic lives in the ai-service; this service only persists
the feature values returned by the assessment pipeline.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feature_vector import FeatureVector
from app.repositories.feature_vector_repository import FeatureVectorRepository
from app.core.logging import get_logger

logger = get_logger(__name__)


class FeatureVectorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = FeatureVectorRepository(db)

    async def store_from_assessment(
        self,
        lead_id: UUID,
        organization_id: UUID,
        features: dict,
        created_by: Optional[UUID] = None,
    ) -> Optional[FeatureVector]:
        """Upsert feature vector from assessment pipeline results."""
        return await self.repo.upsert_for_lead(
            lead_id=lead_id,
            organization_id=organization_id,
            created_by=created_by,
            features=features,
        )

    async def get_by_lead_id(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[FeatureVector]:
        return await self.repo.get_by_lead_id(lead_id, organization_id)
