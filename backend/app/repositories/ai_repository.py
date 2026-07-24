"""Repositories for AI-generated CRM artifacts."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai import AIConversationSummary, AIRecommendation, AIScore
from app.repositories.base import BaseRepository


class AIScoreRepository(BaseRepository[AIScore]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AIScore, db)

    async def latest_for_lead(self, organization_id: UUID, lead_id: UUID) -> AIScore | None:
        result = await self.db.execute(
            select(AIScore)
            .where(AIScore.organization_id == organization_id, AIScore.lead_id == lead_id, AIScore.is_active.is_(True))
            .order_by(desc(AIScore.generated_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def latest_for_deal(self, organization_id: UUID, deal_id: UUID) -> AIScore | None:
        result = await self.db.execute(
            select(AIScore)
            .where(AIScore.organization_id == organization_id, AIScore.deal_id == deal_id, AIScore.is_active.is_(True))
            .order_by(desc(AIScore.generated_at))
            .limit(1)
        )
        return result.scalar_one_or_none()


class AIRecommendationRepository(BaseRepository[AIRecommendation]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AIRecommendation, db)

    async def latest_for_entity(self, organization_id: UUID, entity_type: str, entity_id: UUID | None) -> list[AIRecommendation]:
        stmt = select(AIRecommendation).where(
            AIRecommendation.organization_id == organization_id,
            AIRecommendation.entity_type == entity_type,
            AIRecommendation.is_active.is_(True),
        )
        if entity_id is not None:
            stmt = stmt.where(AIRecommendation.entity_id == entity_id)
        result = await self.db.execute(stmt.order_by(desc(AIRecommendation.generated_at)).limit(5))
        return list(result.scalars().all())


class AIConversationSummaryRepository(BaseRepository[AIConversationSummary]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AIConversationSummary, db)

    async def latest_for_thread(self, organization_id: UUID, thread_id: str) -> AIConversationSummary | None:
        result = await self.db.execute(
            select(AIConversationSummary)
            .where(
                AIConversationSummary.organization_id == organization_id,
                AIConversationSummary.thread_id == thread_id,
                AIConversationSummary.is_active.is_(True),
            )
            .order_by(desc(AIConversationSummary.generated_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def latest_for_email(self, organization_id: UUID, email_id: UUID) -> AIConversationSummary | None:
        result = await self.db.execute(
            select(AIConversationSummary)
            .where(
                AIConversationSummary.organization_id == organization_id,
                AIConversationSummary.email_id == email_id,
                AIConversationSummary.is_active.is_(True),
            )
            .order_by(desc(AIConversationSummary.generated_at))
            .limit(1)
        )
        return result.scalar_one_or_none()
