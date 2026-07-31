"""
Recommendation Service
Wraps the ai/recommendation/ engine and stores results in ai_recommendations table.
Auto-generates recommendations on lead lifecycle events.
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

# Add root directory to sys.path so we can import from ai.recommendation
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from ai.recommendation.ai_recommendation_engine_enhanced import generate_recommendation
except ImportError:
    generate_recommendation = None

# LeadStatus enum value → engine stage name
# Matches backend/app/utils/enums.py LeadStatus exactly
STAGE_MAP = {
    "new": "New Lead",
    "contacted": "Contacted",
    "qualified": "Qualified",
    "proposal_sent": "Proposal Sent",
    "negotiation": "Negotiation",
    "won": "Won",
    "lost": "Lost",
    "converted": "Converted",
}

# Terminal stages where no recommendation is needed
TERMINAL_STAGES = {"won", "lost", "converted"}


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
        if not generate_recommendation:
            logger.warning("ai.recommendation engine not available")
            return None

        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            return None

        # Skip terminal stages — no recommendation needed
        lead_status = str(lead.status).lower()
        if lead_status in TERMINAL_STAGES:
            return None

        # Load related data
        deal = await self.deal_repo.get_by_lead_id_in_org(lead_id, organization_id)
        emails = await self._get_lead_emails(organization_id, lead_id)
        activities = await self._get_lead_activities(organization_id, lead_id)

        # Compute features
        deal_value = 0.0
        if deal and deal.amount is not None:
            deal_value = float(deal.amount)
        elif lead.estimated_value is not None:
            deal_value = float(lead.estimated_value)

        # BUG FIX: Only count outbound emails that were read as "opens"
        # (inbound emails are replies, not opens)
        email_open_count = sum(
            1 for email in emails
            if email.direction == "outbound" and getattr(email, "is_read", False)
        )

        # BUG FIX: Any inbound email is a reply — don't require is_read
        reply_received = any(
            email.direction == "inbound"
            for email in emails
        )

        email_opened_no_reply = email_open_count > 0 and not reply_received

        meeting_attendance = await self._get_meeting_attendance(organization_id, lead_id)
        rep_active_count = await self._count_active_actions(organization_id, lead.owner_id)
        best_time = self._compute_best_contact_time(activities, emails)
        days_since = self._compute_days_since_last_activity(activities, emails, lead)

        # Get current score from lead_score relationship
        current_score = 0.0
        if lead.lead_score and lead.lead_score.overall_score is not None:
            current_score = float(lead.lead_score.overall_score)

        # Map lead status to engine stage name
        current_stage = STAGE_MAP.get(lead_status, "New Lead")

        # Build lead dict for engine
        lead_dict = {
            "lead_id": str(lead_id),
            "current_score": current_score,
            "current_stage": current_stage,
            "days_since_last_activity": days_since,
            "reply_received": reply_received,
            "deal_value": deal_value if deal_value > 0 else None,
            "email_open_count": email_open_count if email_open_count > 0 else None,
            "email_opened_no_reply_flag": email_opened_no_reply if email_opened_no_reply else None,
            "meeting_attendance_status": meeting_attendance,
            "rep_active_action_count": rep_active_count if rep_active_count > 0 else None,
            "best_contact_time_slot": best_time,
            "outbound_email_count": sum(1 for e in emails if e.direction == "outbound"),
            "inbound_email_count": sum(1 for e in emails if e.direction == "inbound"),
        }

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

        # Determine priority from weight
        priority = "medium"
        if all_candidates and all_candidates[0].get("weight", 0) > 0.6:
            priority = "high"
        elif all_candidates and all_candidates[0].get("weight", 0) < 0.3:
            priority = "low"

        # Store in ai_recommendations table
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
                "current_score": current_score,
                "current_stage": current_stage,
                "all_candidates": all_candidates,
                "deal_value": deal_value,
                "email_open_count": email_open_count,
                "days_since_last_activity": days_since,
            },
            generated_at=datetime.now(timezone.utc),
            organization_id=organization_id,
        )
        self.db.add(rec)
        await self.db.flush()

        return {
            "recommended_action": recommended_action,
            "reason": reason,
            "current_score": current_score,
            "current_stage": current_stage,
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
        """Generate recommendations for multiple leads at once. Returns {lead_id: recommendation_dict}."""
        results = {}
        for lead_id in lead_ids:
            try:
                rec = await self.generate_for_lead(lead_id, organization_id)
                if rec:
                    results[lead_id] = rec
            except Exception as e:
                logger.warning("Failed to generate recommendation", extra={"lead_id": str(lead_id), "error": str(e)})
        return results

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

    async def _get_meeting_attendance(self, organization_id: UUID, lead_id: UUID) -> Optional[str]:
        # BUG FIX: Increased page_size to 50 to not miss meeting activities
        activities, _ = await self.activity_repo.list_by_entity(
            organization_id=organization_id,
            entity_type="lead",
            entity_id=lead_id,
            page=1,
            page_size=50,
        )
        for activity in activities:
            if activity.payload and "meeting_attendance_status" in activity.payload:
                status = activity.payload["meeting_attendance_status"]
                if status in {"ATTENDED", "NO_SHOW", "RESCHEDULED"}:
                    return status
        return None

    async def _count_active_actions(self, organization_id: UUID, rep_id: Optional[UUID]) -> int:
        # BUG FIX: Count only recommendations for leads owned by this rep
        from sqlalchemy import select, func
        from app.models.ai import AIRecommendation as AIRec
        from app.models.lead import Lead

        if not rep_id:
            return 0

        # Get lead IDs owned by this rep
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

    def _compute_days_since_last_activity(self, activities, emails, lead) -> int:
        from datetime import datetime as dt
        now = dt.now(timezone.utc)
        latest = None

        for activity in activities:
            if activity.created_at:
                t = activity.created_at
                if t.tzinfo is None:
                    t = t.replace(tzinfo=timezone.utc)
                if latest is None or t > latest:
                    latest = t

        for email in emails:
            if email.sent_at:
                t = email.sent_at
                if t.tzinfo is None:
                    t = t.replace(tzinfo=timezone.utc)
                if latest is None or t > latest:
                    latest = t

        if latest is None:
            # BUG FIX: For new leads with no activities, compute from creation date
            # instead of returning arbitrary 30
            if lead.created_at:
                t = lead.created_at
                if t.tzinfo is None:
                    t = t.replace(tzinfo=timezone.utc)
                return max(0, (now - t).days)
            return 0  # Brand new lead, just created
        return max(0, (now - latest).days)

    def _compute_best_contact_time(self, activities, emails) -> Optional[str]:
        hour_counts: dict[int, int] = {}
        for activity in (activities or []):
            if activity.created_at:
                h = activity.created_at.hour
                hour_counts[h] = hour_counts.get(h, 0) + 1
        for email in (emails or []):
            if email.sent_at:
                h = email.sent_at.hour
                hour_counts[h] = hour_counts.get(h, 0) + 1
        if not hour_counts:
            return None
        best_hour = max(hour_counts, key=hour_counts.get)
        if 8 <= best_hour < 10:
            return "08:00-10:00"
        elif 10 <= best_hour < 12:
            return "10:00-12:00"
        elif 14 <= best_hour < 16:
            return "14:00-16:00"
        elif 16 <= best_hour < 18:
            return "16:00-18:00"
        return "10:00-12:00"
