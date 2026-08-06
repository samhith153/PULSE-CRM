"""
Lead Scoring Service
Delegates to the unified assessment pipeline (ai_pipeline.py).
"""
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead_score import LeadScore
from app.repositories.lead_repository import LeadRepository
from app.repositories.lead_score_repository import LeadScoreRepository
from app.core.logging import get_logger

logger = get_logger(__name__)


class LeadScoringService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.lead_repo = LeadRepository(db)
        self.lead_score_repo = LeadScoreRepository(db)

    async def get_by_lead_id(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[LeadScore]:
        return await self.lead_score_repo.get_by_lead_id(lead_id, organization_id)

    async def compute_and_store_scores(
        self, lead_id: UUID, organization_id: UUID, created_by: Optional[UUID] = None
    ) -> Optional[LeadScore]:
        from app.services.ai_pipeline import run_lead_assessment

        result = await run_lead_assessment(
            self.db, lead_id, organization_id, created_by, trigger="lead_updated"
        )
        if not result:
            return None

        # Return the stored lead_score
        return await self.lead_score_repo.get_by_lead_id(lead_id, organization_id)
