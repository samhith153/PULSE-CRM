"""
Enhanced Recommendation Engine Service
Extends the existing rule-based recommendation engine with 6 new features.

This service wraps the existing scoring + recommendation logic and adds:
- deal_value
- email_open_count
- email_opened_no_reply_flag
- meeting_attendance_status
- rep_active_action_count
- best_contact_time_slot

DO NOT replace existing functionality. Only extend.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.activity import ActivityTimeline
from app.models.ai import AIRecommendation
from app.models.deal import Deal
from app.models.email import Email
from app.models.lead import Lead
from app.repositories.activity_repository import ActivityTimelineRepository
from app.repositories.ai_repository import AIRecommendationRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.email_repository import EmailRepository
from app.repositories.lead_repository import LeadRepository
from app.services.ai_providers import (
    FeatureExtractionService,
    RuleBasedScorer,
    RuleBasedRecommendationProvider,
    compute_best_contact_time,
    compute_email_opened_no_reply_flag,
    compute_deal_value_from_lead,
)
from app.schemas.ai import EnhancedRecommendationResponse
from app.utils.enums import MeetingAttendanceStatus, BestContactTimeSlot


class EnhancedRecommendationService:
    """
    Enhanced recommendation service that computes all 6 new features
    and passes them through the existing rule-based engine.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.lead_repo = LeadRepository(db)
        self.deal_repo = DealRepository(db)
        self.email_repo = EmailRepository(db)
        self.activity_repo = ActivityTimelineRepository(db)
        self.recommendation_repo = AIRecommendationRepository(db)
        self.feature_service = FeatureExtractionService()
        self.scorer = RuleBasedScorer()
        self.recommender = RuleBasedRecommendationProvider()

    async def get_enhanced_recommendation(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> EnhancedRecommendationResponse:
        """
        Generate an enhanced recommendation for a lead with all 6 new features.
        """
        # 1. Load lead
        lead = await self.lead_repo.get_active_by_id(lead_id, organization_id)
        if not lead:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("Lead", lead_id)

        # 2. Load related data
        deal = await self.deal_repo.get_by_lead_id_in_org(lead_id, organization_id)
        emails = await self._get_lead_emails(organization_id, lead_id)
        activities = await self._get_lead_activities(organization_id, lead_id)

        # 3. Compute feature 1: deal_value
        deal_value = 0.0
        if deal and deal.amount is not None:
            deal_value = float(deal.amount)
        elif lead.estimated_value is not None:
            deal_value = float(lead.estimated_value)

        # 4. Compute feature 2: email_open_count
        email_open_count = sum(
            1 for email in emails
            if getattr(email, "is_read", False) or email.direction == "inbound"
        )

        # 5. Compute feature 3: reply_received_flag (existing) + email_opened_no_reply_flag
        reply_received = any(
            email.direction == "inbound" and email.is_read
            for email in emails
        )
        email_opened_no_reply = compute_email_opened_no_reply_flag(email_open_count, reply_received)

        # 6. Compute feature 4: meeting_attendance_status
        meeting_attendance = await self._get_meeting_attendance(organization_id, lead_id)

        # 7. Compute feature 5: rep_active_action_count
        rep_id = lead.owner_id or organization_id  # fallback
        rep_active_count = await self._count_active_actions(organization_id, rep_id)

        # 8. Compute feature 6: best_contact_time_slot
        best_time = compute_best_contact_time(activities=activities, emails=emails)

        # 9. Compute current score
        features = self.feature_service.lead_features(lead, emails)
        score_result = self.scorer.score_lead(lead, features)

        # 10. Generate recommendation
        recommendation = self.recommender.recommend(
            "lead", lead, features, score_result.score
        )

        return EnhancedRecommendationResponse(
            lead_id=lead_id,
            current_score=score_result.score,
            deal_value=deal_value,
            email_open_count=email_open_count,
            email_opened_no_reply_flag=email_opened_no_reply,
            meeting_attendance_status=meeting_attendance,
            rep_active_action_count=rep_active_count,
            best_contact_time_slot=best_time,
            recommended_action=recommendation.actions[0] if recommendation.actions else "No action needed",
            reasoning=recommendation.rationale,
            factors=score_result.factors,
            metadata=score_result.metadata,
            generated_at=datetime.now(timezone.utc),
        )

    async def _get_lead_emails(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> list[Email]:
        """Get all emails associated with a lead."""
        emails, _ = await self.email_repo.list_entity_history(
            organization_id=organization_id,
            entity_type="lead",
            entity_id=lead_id,
            search=None,
            page=1,
            page_size=100,
        )
        return emails

    async def _get_lead_activities(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> list[ActivityTimeline]:
        """Get activity timeline entries for a lead."""
        activities, _ = await self.activity_repo.list_by_entity(
            organization_id=organization_id,
            entity_type="lead",
            entity_id=lead_id,
            page=1,
            page_size=100,
        )
        return activities

    async def _get_meeting_attendance(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> Optional[str]:
        """Get the most recent meeting attendance status for a lead."""
        meetings, _ = await self.activity_repo.list_by_entity(
            organization_id=organization_id,
            entity_type="lead",
            entity_id=lead_id,
            page=1,
            page_size=5,
        )
        # Look for meeting-related activities with attendance status
        for activity in meetings:
            if activity.payload and "meeting_attendance_status" in activity.payload:
                status = activity.payload["meeting_attendance_status"]
                if status in {
                    MeetingAttendanceStatus.ATTENDED.value,
                    MeetingAttendanceStatus.NO_SHOW.value,
                    MeetingAttendanceStatus.RESCHEDULED.value,
                }:
                    return status
        return None

    async def _count_active_actions(
        self,
        organization_id: UUID,
        rep_id: UUID,
    ) -> int:
        """Count active recommendations assigned to a rep."""
        return await self.recommendation_repo.count_active_actions(
            rep_id, organization_id
        )
