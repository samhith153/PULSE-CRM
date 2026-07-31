"""
Lead Score Repository
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead_score import LeadScore
from app.repositories.base import BaseRepository


class LeadScoreRepository(BaseRepository[LeadScore]):

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(LeadScore, db)

    async def get_by_lead_id(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[LeadScore]:
        stmt = select(LeadScore).where(
            LeadScore.lead_id == lead_id,
            LeadScore.organization_id == organization_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_for_lead(
        self,
        lead_id: UUID,
        organization_id: UUID,
        created_by: Optional[UUID],
        scores: dict,
    ) -> LeadScore:
        existing = await self.get_by_lead_id(lead_id, organization_id)
        if existing:
            for key, value in scores.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            existing.scored_at = datetime.now(timezone.utc)
            if created_by:
                existing.created_by = created_by
            self.db.add(existing)
            await self.db.flush()
            await self.db.refresh(existing)
            return existing
        else:
            ls = LeadScore(
                lead_id=lead_id,
                organization_id=organization_id,
                created_by=created_by,
                scored_at=datetime.now(timezone.utc),
                **scores,
            )
            self.db.add(ls)
            await self.db.flush()
            await self.db.refresh(ls)
            return ls
