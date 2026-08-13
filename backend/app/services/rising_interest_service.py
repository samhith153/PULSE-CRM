"""
Rising Interest Service (backend side)

Gathers trend data from the database (via RisingInterestRepository),
sends it to the ai-service over HTTP (via AIClient), and returns
the rising interest score + reasons to the backend API layer.

Flow:
  CRM Data (DB)
    → RisingInterestRepository.gather_trend_data()
    → AIClient POST /api/v1/rising-interest/assess
    → Rising interest score + trend + reasons
    → Backend API response
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.rising_interest_repository import RisingInterestRepository
from app.services.ai_client import AIClient

logger = logging.getLogger(__name__)


class RisingInterestService:
    """
    Computes dynamic rising-interest scores by calling the ai-service
    over HTTP via AIClient.

    The AI service is stateless — it never touches the database.
    This backend service gathers the CRM data and sends it as a payload.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = RisingInterestRepository(db)
        self.client = AIClient()

    async def get_rising_interest(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> dict[str, Any]:
        """
        Compute the rising interest score for a single lead or deal.

        Gathers trend data from DB, sends to ai-service, returns result.
        """
        # ── 1. Gather trend data from CRM tables ────────────────────────
        trend_data = await self.repo.gather_trend_data(
            organization_id, entity_type, entity_id
        )

        # ── 2. Call ai-service over HTTP ──────────────────────────────────
        result = await self.client._post(
            "/api/v1/rising-interest/assess", trend_data
        )

        if result is None:
            logger.warning(
                "[RISING_INTEREST] AI service returned None for %s %s — using fallback",
                entity_type, entity_id,
            )
            return self._fallback_result(str(entity_id))

        return result

    async def get_rising_interest_for_leads(
        self,
        organization_id: UUID,
        user_id: UUID | None = None,
        team_ids: list[UUID] | None = None,
        limit: int = 15,
    ) -> list[dict[str, Any]]:
        """
        Compute rising interest for all active leads in scope.
        Returns a list sorted by score (descending), ready for API response.

        This powers the "Rising Interest" panel in the AI Insights dashboard.
        """
        from app.models.lead import Lead
        from app.models.deal import Deal
        from app.models.lead_score import LeadScore
        from app.models.user import User as UserModel
        from sqlalchemy.orm import aliased
        from sqlalchemy import select

        # Fetch active leads with their deals and scores
        owner = aliased(UserModel, name="rising_owner")
        stmt = (
            select(
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                Deal.id.label("deal_id"),
                Deal.name.label("deal_name"),
                Deal.amount.label("deal_amount"),
                LeadScore.overall_score.label("lead_score"),
                owner.full_name.label("owner_name"),
            )
            .outerjoin(Deal, Deal.lead_id == Lead.id)
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .outerjoin(owner, owner.id == Lead.owner_id)
            .where(
                Lead.organization_id == organization_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
            )
        )

        if user_id is not None and team_ids is None:
            stmt = stmt.where(Lead.owner_id == user_id)
        elif team_ids is not None:
            stmt = stmt.where(Lead.owner_id.in_(team_ids))

        stmt = stmt.limit(200)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()

        scored: list[dict[str, Any]] = []
        for row in rows:
            lead_id = row["lead_id"]
            try:
                ri_result = await self.get_rising_interest(
                    organization_id, "lead", lead_id
                )
            except Exception:
                logger.exception(
                    "[RISING_INTEREST] Failed for lead %s — skipping", lead_id
                )
                continue

            score = ri_result.get("score", 0)
            if score <= 0:
                continue

            scored.append({
                "id": row["deal_id"] or lead_id,
                "lead_id": str(lead_id),
                "lead_name": row["lead_name"],
                "deal_name": row["deal_name"],
                "rising_interest_score": score,
                "trend": ri_result.get("trend", "Stable"),
                "factors": ri_result.get("factors", {}),
                "reason": "; ".join(ri_result.get("reasons", [])[:2]),
                "reasons": ri_result.get("reasons", []),
                "lead_score": int(row["lead_score"] or 0),
                "deal_value": float(row["deal_amount"] or 0),
                "owner_name": row["owner_name"],
            })

        scored.sort(key=lambda x: x["rising_interest_score"], reverse=True)
        return scored[:limit]

    async def is_rising_interest(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> bool:
        """
        Quick boolean — is this entity showing rising interest?
        Used by daily_priorities_service to replace the old score >= 80 check.
        """
        result = await self.get_rising_interest(
            organization_id, entity_type, entity_id
        )
        return result.get("score", 0) >= 50.0

    def _fallback_result(self, lead_id: str) -> dict[str, Any]:
        """Fallback when the AI service is unavailable."""
        return {
            "lead_id": lead_id,
            "score": 0.0,
            "trend": "Stable",
            "factors": {},
            "reasons": ["AI service unavailable — insufficient data for trend analysis."],
        }
