"""
Recommendation Service (thin orchestrator)

Loads raw data from DB, delegates to ai/recommendation/ module, stores result.
All feature computation and scoring logic lives in ai/recommendation/.
"""
from __future__ import annotations

import sys
import os
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.ai import AIRecommendation
from app.repositories.ai_repository import AIRecommendationRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.email_repository import EmailRepository
from app.repositories.activity_repository import ActivityTimelineRepository
from app.repositories.lead_repository import LeadRepository

logger = get_logger(__name__)

# Import from ai/recommendation/ module
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from ai.recommendation import build_lead_features, generate_recommendation, is_terminal
except ImportError:
    build_lead_features = None
    generate_recommendation = None
    is_terminal = None


class RecommendationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.lead_repo = LeadRepository(db)
        self.deal_repo = DealRepository(db)
        self.email_repo = EmailRepository(db)
        self.activity_repo = ActivityTimelineRepository(db)
        self.recommendation_repo = AIRecommendationRepository(db)

    async def generate_for_lead(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[dict]:
        """Generate a recommendation for a lead and store it."""
        if not generate_recommendation or not build_lead_features or not is_terminal:
            logger.warning("ai.recommendation module not available")
            return None

        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            return None

        # Load raw data from DB
        deal = await self.deal_repo.get_by_lead_id_in_org(lead_id, organization_id)
        emails = await self._get_lead_emails(organization_id, lead_id)
        activities = await self._get_lead_activities(organization_id, lead_id)
        rep_active_count = await self._count_active_actions(organization_id, lead.owner_id)

        # Build features (logic lives in ai/recommendation/)
        features = build_lead_features(lead, deal, emails, activities, rep_active_count)

        # Convert features to dict for the engine
        from dataclasses import asdict
        lead_dict = asdict(features)

        # Call engine
        result = generate_recommendation(lead_dict)

        if result.get("error"):
            logger.warning("Recommendation engine error", extra={"lead_id": str(lead_id), "error": result["error"]})
            return None

        recommended_action = result.get("recommended_action", "")
        reason = result.get("reason", "")
        all_candidates = result.get("all_candidates", [])

        if not recommended_action:
            return None

        # Determine priority
        priority = "medium"
        if all_candidates and all_candidates[0].get("weight", 0) > 0.6:
            priority = "high"
        elif all_candidates and all_candidates[0].get("weight", 0) < 0.3:
            priority = "low"

        # Store result
        rec = AIRecommendation(
            entity_type="lead",
            entity_id=lead_id,
            lead_id=lead_id,
            deal_id=deal.id if deal else None,
            recommendation=recommended_action,
            reasoning=reason,
            priority=priority,
            provider="rule_based_engine",
            metadata_json={
                "current_score": features.current_score,
                "current_stage": features.current_stage,
                "all_candidates": all_candidates,
                "deal_value": features.deal_value,
                "days_since_last_activity": features.days_since_last_activity,
            },
            generated_at=datetime.now(timezone.utc),
            organization_id=organization_id,
        )
        self.db.add(rec)
        await self.db.flush()

        return {
            "recommended_action": recommended_action,
            "reason": reason,
            "current_score": features.current_score,
            "current_stage": features.current_stage,
            "all_candidates": all_candidates,
        }

    async def get_for_lead(
        self, lead_id: UUID, organization_id: UUID
    ) -> Optional[dict]:
        """Get the latest stored recommendation for a lead."""
        rec = await self.recommendation_repo.latest_for_lead(organization_id, lead_id)
        if not rec:
            return None
        return {
            "recommended_action": rec.recommendation,
            "reason": rec.reasoning,
            "current_score": rec.metadata_json.get("current_score", 0),
            "current_stage": rec.metadata_json.get("current_stage", ""),
            "all_candidates": rec.metadata_json.get("all_candidates", []),
        }

    async def batch_generate_for_leads(
        self, lead_ids: list, organization_id: UUID
    ) -> dict:
        """Generate recommendations for multiple leads at once."""
        results = {}
        for lead_id in lead_ids:
            try:
                rec = await self.generate_for_lead(lead_id, organization_id)
                if rec:
                    results[lead_id] = rec
            except Exception as e:
                logger.warning("Failed to generate recommendation", extra={"lead_id": str(lead_id), "error": str(e)})
        return results

    # ── DB helpers (only these need SQLAlchemy) ───────────────────────────────

    async def _get_lead_emails(self, organization_id: UUID, lead_id: UUID):
        emails, _ = await self.email_repo.list_entity_history(
            organization_id=organization_id,
            entity_type="lead",
            entity_id=lead_id,
            search=None,
            page=1,
            page_size=100,
        )
        return emails

    async def _get_lead_activities(self, organization_id: UUID, lead_id: UUID):
        activities, _ = await self.activity_repo.list_by_entity(
            organization_id=organization_id,
            entity_type="lead",
            entity_id=lead_id,
            page=1,
            page_size=100,
        )
        return activities

    async def _count_active_actions(self, organization_id: UUID, rep_id: Optional[UUID]) -> int:
        from sqlalchemy import select, func
        from app.models.ai import AIRecommendation as AIRec
        from app.models.lead import Lead

        if not rep_id:
            return 0

        lead_ids_result = await self.db.execute(
            select(Lead.id).where(
                Lead.organization_id == organization_id,
                Lead.owner_id == rep_id,
                Lead.is_active.is_(True),
            )
        )
        lead_ids = [row[0] for row in lead_ids_result.all()]
        if not lead_ids:
            return 0

        result = await self.db.execute(
            select(func.count(AIRec.id)).where(
                AIRec.organization_id == organization_id,
                AIRec.entity_type == "lead",
                AIRec.lead_id.in_(lead_ids),
                AIRec.is_active.is_(True),
            )
        )
        return result.scalar() or 0
