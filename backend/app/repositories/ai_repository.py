"""Repositories for AI-generated CRM artifacts."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
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

    async def upsert_for_lead(
        self,
        lead_id: UUID,
        organization_id: UUID,
        created_by: Optional[UUID],
        recommendation: str,
        reasoning: str,
        priority: str = "medium",
        metadata_json: Optional[dict] = None,
    ) -> AIRecommendation:
        existing = None
        stmt = (
            select(AIRecommendation)
            .where(
                AIRecommendation.lead_id == lead_id,
                AIRecommendation.organization_id == organization_id,
                AIRecommendation.is_active.is_(True),
            )
            .order_by(desc(AIRecommendation.generated_at))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.recommendation = recommendation
            existing.reasoning = reasoning
            existing.priority = priority
            existing.metadata_json = metadata_json or {}
            existing.generated_at = datetime.now(timezone.utc)
            if created_by:
                existing.created_by = created_by
            self.db.add(existing)
            await self.db.flush()
            await self.db.refresh(existing)
            return existing
        else:
            rec = AIRecommendation(
                entity_type="lead",
                entity_id=lead_id,
                lead_id=lead_id,
                recommendation=recommendation,
                reasoning=reasoning,
                priority=priority,
                provider="ai_service",
                metadata_json=metadata_json or {},
                generated_at=datetime.now(timezone.utc),
                organization_id=organization_id,
                created_by=created_by,
            )
            self.db.add(rec)
            await self.db.flush()
            await self.db.refresh(rec)
            return rec


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
