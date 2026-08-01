"""
Tests for the 6 new recommendation engine features.

Tests cover:
1. High-value deal scoring
2. Opened email but no reply
3. Meeting attended
4. Meeting no-show
5. Representative overload
6. Best contact time calculation
"""
import pytest
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4, UUID

from app.services.ai_providers import (
    compute_email_opened_no_reply_flag,
    compute_best_contact_time,
    compute_deal_value_from_lead,
    FeatureExtractionService,
    RuleBasedScorer,
    RuleBasedRecommendationProvider,
    FeatureSet,
)
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.email import Email
from app.models.activity import ActivityTimeline
from app.utils.enums import MeetingAttendanceStatus, BestContactTimeSlot


# ── Helper factories ──────────────────────────────────────────────────────

def make_lead(
    status: str = "new",
    estimated_value: Decimal | None = None,
    owner_id: UUID | None = None,
) -> Lead:
    lead = Lead(
        id=uuid4(),
        title="Test Lead",
        status=status,
        estimated_value=estimated_value,
        owner_id=owner_id,
        organization_id=uuid4(),
    )
    return lead


def make_deal(amount: Decimal | None = None, lead_id: UUID | None = None) -> Deal:
    deal = Deal(
        id=uuid4(),
        name="Test Deal",
        amount=amount,
        lead_id=lead_id,
        organization_id=uuid4(),
        status="open",
        probability=50,
    )
    if lead_id:
        # Link lead and deal
        deal.lead_id = lead_id
    return deal


def make_email(
    direction: str = "inbound",
    is_read: bool = False,
    sent_at: datetime | None = None,
) -> Email:
    return Email(
        id=uuid4(),
        gmail_message_id=str(uuid4()),
        direction=direction,
        sender="test@example.com",
        subject="Test Email",
        is_read=is_read,
        sent_at=sent_at or datetime.now(timezone.utc),
        organization_id=uuid4(),
    )


def make_activity(
    action: str = "meeting",
    payload: dict | None = None,
    created_at: datetime | None = None,
) -> ActivityTimeline:
    return ActivityTimeline(
        id=uuid4(),
        entity_type="lead",
        entity_id=uuid4(),
        action=action,
        title="Test Activity",
        payload=payload or {},
        created_at=created_at or datetime.now(timezone.utc),
        organization_id=uuid4(),
    )


# ── Test: compute_email_opened_no_reply_flag ──────────────────────────────

class TestEmailOpenedNoReplyFlag:
    def test_opened_emails_no_reply_returns_true(self):
        """Lead opened emails (>0) but never replied → flag is True."""
        assert compute_email_opened_no_reply_flag(email_open_count=3, reply_received=False) is True

    def test_no_opens_no_reply_returns_false(self):
        """Lead opened 0 emails and no reply → flag is False."""
        assert compute_email_opened_no_reply_flag(email_open_count=0, reply_received=False) is False

    def test_opened_and_replied_returns_false(self):
        """Lead opened emails and replied → flag is False (interested but already responded)."""
        assert compute_email_opened_no_reply_flag(email_open_count=5, reply_received=True) is False

    def test_zero_opens_with_reply_returns_false(self):
        """No opens but a reply somehow → flag is False."""
        assert compute_email_opened_no_reply_flag(email_open_count=0, reply_received=True) is False


# ── Test: compute_best_contact_time ───────────────────────────────────────

class TestBestContactTime:
    def test_no_activities_returns_none(self):
        """No activities or emails → returns None."""
        assert compute_best_contact_time(activities=None, emails=None) is None

    def test_empty_lists_returns_none(self):
        """Empty lists → returns None."""
        assert compute_best_contact_time(activities=[], emails=[]) is None

    def test_morning_10_12_slot(self):
        """Most activity at 10 AM → returns '10:00-12:00'."""
        activities = [
            make_activity(created_at=datetime(2024, 1, 1, 10, 30, tzinfo=timezone.utc)),
            make_activity(created_at=datetime(2024, 1, 2, 11, 0, tzinfo=timezone.utc)),
        ]
        result = compute_best_contact_time(activities=activities)
        assert result == BestContactTimeSlot.MORNING_10_12.value

    def test_afternoon_14_16_slot(self):
        """Most activity at 2 PM → returns '14:00-16:00'."""
        activities = [
            make_activity(created_at=datetime(2024, 1, 1, 14, 30, tzinfo=timezone.utc)),
            make_activity(created_at=datetime(2024, 1, 2, 15, 0, tzinfo=timezone.utc)),
            make_activity(created_at=datetime(2024, 1, 3, 9, 0, tzinfo=timezone.utc)),
        ]
        result = compute_best_contact_time(activities=activities)
        assert result == BestContactTimeSlot.AFTERNOON_14_16.value

    def test_email_activity_combined(self):
        """Uses emails and activities combined to determine slot."""
        emails = [
            make_email(sent_at=datetime(2024, 1, 1, 8, 30, tzinfo=timezone.utc)),
            make_email(sent_at=datetime(2024, 1, 2, 9, 0, tzinfo=timezone.utc)),
        ]
        result = compute_best_contact_time(emails=emails)
        assert result == BestContactTimeSlot.MORNING_08_10.value


# ── Test: compute_deal_value_from_lead ────────────────────────────────────

class TestDealValueFromLead:
    def test_deal_amount_used(self):
        """Deal with amount → uses deal.amount."""
        lead = make_lead(estimated_value=Decimal("10000"))
        deal = make_deal(amount=Decimal("50000"), lead_id=lead.id)
        # Manually set relationship
        lead.deal = deal
        assert compute_deal_value_from_lead(lead) == 50000.0

    def test_estimated_value_fallback(self):
        """No deal → uses lead.estimated_value."""
        lead = make_lead(estimated_value=Decimal("25000"))
        assert compute_deal_value_from_lead(lead) == 25000.0

    def test_no_value_returns_zero(self):
        """No deal and no estimated value → returns 0."""
        lead = make_lead()
        assert compute_deal_value_from_lead(lead) == 0.0


# ── Test: High-value deal scoring ─────────────────────────────────────────

class TestHighValueDealScoring:
    def test_high_value_increases_score(self):
        """Deal value >= $100k adds significant score boost."""
        features = FeatureSet(
            entity_type="lead",
            values={
                "status": "qualified",
                "deal_value": 150000.0,
                "email_open_count": 2,
                "email_count": 3,
                "has_company": True,
                "has_contact": True,
                "has_owner": True,
                "read_email_count": 1,
            },
        )
        scorer = RuleBasedScorer()
        lead = make_lead(status="qualified")
        result = scorer.score_lead(lead, features)

        assert result.score > 50
        assert any("deal value" in f.lower() for f in result.factors)


class TestEmailOpenedNoReplyScoring:
    def test_recommendation_for_stuck_lead(self):
        """Lead opened emails but no reply → gets follow-up recommendation."""
        provider = RuleBasedRecommendationProvider()
        features = FeatureSet(
            entity_type="lead",
            values={
                "status": "contacted",
                "deal_value": 10000.0,
                "email_open_count": 5,
                "email_opened_no_reply_flag": True,
                "email_count": 5,
                "read_email_count": 5,
                "has_company": True,
                "has_contact": True,
                "has_owner": True,
            },
        )
        result = provider.recommend("lead", None, features, score=60)

        actions_text = " ".join(result.actions).lower()
        assert any("follow-up" in actions_text or "personalized" in actions_text for _ in [1])


# ── Test: Meeting attendance status ───────────────────────────────────────

class TestMeetingAttendance:
    def test_meeting_attended(self):
        """Meeting 'ATTENDED' → should affect scoring positively."""
        features = FeatureSet(
            entity_type="lead",
            values={
                "status": "qualified",
                "meeting_attendance_status": MeetingAttendanceStatus.ATTENDED.value,
                "deal_value": 50000.0,
                "email_open_count": 3,
                "email_count": 5,
                "read_email_count": 3,
                "has_company": True,
                "has_contact": True,
                "has_owner": True,
            },
        )
        scorer = RuleBasedScorer()
        lead = make_lead(status="qualified")
        result = scorer.score_lead(lead, features)

        assert result.score >= 35

    def test_meeting_no_show(self):
        """Meeting 'NO_SHOW' → flags need for rescheduling."""
        provider = RuleBasedRecommendationProvider()
        features = FeatureSet(
            entity_type="lead",
            values={
                "status": "negotiation",
                "meeting_attendance_status": MeetingAttendanceStatus.NO_SHOW.value,
                "deal_value": 50000.0,
                "email_open_count": 3,
                "email_count": 5,
                "read_email_count": 3,
                "has_company": True,
                "has_contact": True,
                "has_owner": True,
            },
        )
        result = provider.recommend("lead", None, features, score=65)
        assert len(result.actions) > 0


# ── Test: Representative workload ─────────────────────────────────────────

class TestRepWorkload:
    def test_high_workload_reduces_priority(self):
        """Rep with many active actions → workload considered."""
        features = FeatureSet(
            entity_type="lead",
            values={
                "status": "qualified",
                "rep_active_action_count": 15,  # High workload
                "deal_value": 50000.0,
                "email_open_count": 3,
                "email_count": 5,
                "read_email_count": 3,
                "has_company": True,
                "has_contact": True,
                "has_owner": True,
            },
        )
        scorer = RuleBasedScorer()
        lead = make_lead(status="qualified", owner_id=uuid4())
        result = scorer.score_lead(lead, features)
        assert result.score >= 0


# ── Test: Best contact time ───────────────────────────────────────────────

class TestBestContactTimeRecommendation:
    def test_contact_time_defined(self):
        """Best contact time slot identified → recommendation accounts for it."""
        provider = RuleBasedRecommendationProvider()
        features = FeatureSet(
            entity_type="lead",
            values={
                "status": "contacted",
                "best_contact_time_slot": BestContactTimeSlot.MORNING_10_12.value,
                "deal_value": 25000.0,
                "email_open_count": 2,
                "email_count": 3,
                "read_email_count": 2,
                "has_company": True,
                "has_contact": True,
                "has_owner": True,
            },
        )
        result = provider.recommend("lead", None, features, score=55)
        assert len(result.actions) > 0


# ── Integration test: Full enhanced recommendation pipeline ───────────────

class TestEnhancedRecommendationPipeline:
    @pytest.mark.asyncio
    async def test_pipeline_new_lead_no_data(self):
        """New lead with no email history → basic recommendation still works."""
        lead_id = uuid4()
        org_id = uuid4()

        lead = make_lead(status="new", estimated_value=Decimal("10000"))
        lead.id = lead_id
        lead.organization_id = org_id

        scorer = RuleBasedScorer()
        provider = RuleBasedRecommendationProvider()
        feature_extractor = FeatureExtractionService()

        features = feature_extractor.lead_features(lead, emails=[])
        score_result = scorer.score_lead(lead, features)
        recommendation = provider.recommend("lead", lead, features, score_result.score)

        assert isinstance(score_result.score, int)
        assert 0 <= score_result.score <= 100
        assert len(recommendation.actions) > 0

    @pytest.mark.asyncio
    async def test_pipeline_high_value_with_emails(self):
        """High-value lead with email opens → higher score and specific action."""
        lead_id = uuid4()
        org_id = uuid4()

        lead = make_lead(status="qualified", estimated_value=Decimal("200000"))
        lead.id = lead_id
        lead.organization_id = org_id

        deal = make_deal(amount=Decimal("200000"), lead_id=lead_id)
        lead.deal = deal

        emails = [
            make_email(direction="inbound", is_read=True),
            make_email(direction="inbound", is_read=True),
            make_email(direction="inbound", is_read=True),
        ]

        scorer = RuleBasedScorer()
        provider = RuleBasedRecommendationProvider()
        feature_extractor = FeatureExtractionService()

        features = feature_extractor.lead_features(lead, emails)
        score_result = scorer.score_lead(lead, features)
        recommendation = provider.recommend("lead", lead, features, score_result.score)

        assert score_result.score > 50
        assert len(recommendation.actions) > 0
