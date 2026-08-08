"""
Lead Scoring Service
Delegates to the unified assessment pipeline (ai_pipeline.py), which calls the
separate PULSE AI Service over HTTP and persists the result.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead_score import LeadScore
from app.repositories.lead_score_repository import LeadScoreRepository
from app.core.logging import get_logger
from app.services.ai_pipeline import run_lead_assessment

logger = get_logger(__name__)


class LeadScoringService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.lead_score_repo = LeadScoreRepository(db)

    async def get_by_lead_id(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[LeadScore]:
        return await self.lead_score_repo.get_by_lead_id(lead_id, organization_id)

    async def compute_and_store_scores(
        self, lead_id: UUID, organization_id: UUID, created_by: Optional[UUID] = None
    ) -> Optional[LeadScore]:
        # run_lead_assessment gathers data, calls the AI Service over HTTP, and
        # persists the fit/engagement/overall scores + recommendation. It returns
        # None when the AI Service is unavailable; we surface that as "no score".
        result = await run_lead_assessment(
            self.db, lead_id, organization_id, created_by, trigger="lead_updated"
        )
        if not result:
            return None

        # Return the persisted lead_score row (run_lead_assessment returns the
        # assessment payload, not the ORM entity).
        return await self.lead_score_repo.get_by_lead_id(lead_id, organization_id)
