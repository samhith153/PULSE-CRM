"""
Rising Interest Repository

Fetches the raw CRM trend data needed for rising interest scoring.
All queries compare a recent window (last 7 days) vs a prior window
(days 8-14) to compute velocity, not just absolute values.

The backend gathers this data and sends it to the ai-service over HTTP
via AIClient. The AI service never touches the database directly.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityTimeline
from app.models.email import Email
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.lead_score import LeadScore


class RisingInterestRepository:
    """Fetches trend data for the rising-interest engine."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Activity counts (recent vs prior window) ──────────────────────────────

    async def get_activity_counts(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        now: datetime | None = None,
    ) -> tuple[int, int]:
        """Returns (recent_count, prior_count). recent = last 7 days, prior = days 8-14."""
        now = now or datetime.now(timezone.utc)
        recent_start = now - timedelta(days=7)
        prior_start = now - timedelta(days=14)

        base = [
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.entity_type == entity_type,
            ActivityTimeline.entity_id == entity_id,
        ]

        recent_stmt = select(func.count(ActivityTimeline.id)).where(
            *base, ActivityTimeline.created_at >= recent_start,
        )
        prior_stmt = select(func.count(ActivityTimeline.id)).where(
            *base,
            ActivityTimeline.created_at >= prior_start,
            ActivityTimeline.created_at < recent_start,
        )

        recent = (await self.db.execute(recent_stmt)).scalar_one() or 0
        prior = (await self.db.execute(prior_stmt)).scalar_one() or 0
        return int(recent), int(prior)

    # ── Email engagement (opens + replies, recent vs prior) ───────────────────

    async def get_email_engagement(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        now: datetime | None = None,
    ) -> dict[str, int]:
        """Returns email open/reply counts for recent and prior windows."""
        now = now or datetime.now(timezone.utc)
        recent_start = now - timedelta(days=7)
        prior_start = now - timedelta(days=14)

        base = [
            Email.organization_id == organization_id,
            Email.external_entity_type == entity_type,
            Email.external_entity_id == entity_id,
        ]

        recent_replies = (await self.db.execute(
            select(func.count(Email.id)).where(
                *base, Email.direction == "inbound", Email.sent_at >= recent_start,
            )
        )).scalar_one() or 0

        prior_replies = (await self.db.execute(
            select(func.count(Email.id)).where(
                *base, Email.direction == "inbound",
                Email.sent_at >= prior_start, Email.sent_at < recent_start,
            )
        )).scalar_one() or 0

        recent_opens = (await self.db.execute(
            select(func.count(Email.id)).where(
                *base, Email.direction == "outbound", Email.is_read.is_(True),
                Email.sent_at >= recent_start,
            )
        )).scalar_one() or 0

        prior_opens = (await self.db.execute(
            select(func.count(Email.id)).where(
                *base, Email.direction == "outbound", Email.is_read.is_(True),
                Email.sent_at >= prior_start, Email.sent_at < recent_start,
            )
        )).scalar_one() or 0

        return {
            "email_opens_recent": int(recent_opens),
            "email_opens_prior": int(prior_opens),
            "email_replies_recent": int(recent_replies),
            "email_replies_prior": int(prior_replies),
        }

    # ── Response time (avg hours, recent vs prior) ────────────────────────────

    async def get_response_times(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        now: datetime | None = None,
    ) -> tuple[float | None, float | None]:
        """Returns (recent_avg_hours, prior_avg_hours) for inbound email responses."""
        now = now or datetime.now(timezone.utc)
        recent_start = now - timedelta(days=7)
        prior_start = now - timedelta(days=14)

        base = [
            Email.organization_id == organization_id,
            Email.external_entity_type == entity_type,
            Email.external_entity_id == entity_id,
            Email.direction == "inbound",
        ]

        async def _avg(start, end):
            stmt = select(
                func.extract("epoch", func.avg(Email.sent_at))
            ).where(*base, Email.sent_at >= start, Email.sent_at < end)
            result = await self.db.execute(stmt)
            val = result.scalar_one_or_none()
            return float(val) / 3600.0 if val else None

        recent_avg = await _avg(recent_start, now)
        prior_avg = await _avg(prior_start, recent_start)
        return recent_avg, prior_avg

    # ── Meeting momentum (from activity timeline) ─────────────────────────────

    async def get_meeting_momentum(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        now: datetime | None = None,
    ) -> dict[str, int]:
        """Returns meeting attendance / scheduling counts for the recent window."""
        now = now or datetime.now(timezone.utc)
        recent_start = now - timedelta(days=7)

        base = [
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.entity_type == entity_type,
            ActivityTimeline.entity_id == entity_id,
            ActivityTimeline.created_at >= recent_start,
        ]

        attended = (await self.db.execute(
            select(func.count(ActivityTimeline.id)).where(
                *base, ActivityTimeline.action.in_(["meeting", "meeting_attended"]),
            )
        )).scalar_one() or 0

        scheduled = (await self.db.execute(
            select(func.count(ActivityTimeline.id)).where(
                *base, ActivityTimeline.action == "meeting_scheduled",
            )
        )).scalar_one() or 0

        no_show = (await self.db.execute(
            select(func.count(ActivityTimeline.id)).where(
                *base, ActivityTimeline.action.in_(["meeting_no_show", "no_show"]),
            )
        )).scalar_one() or 0

        return {
            "meetings_attended_recent": int(attended),
            "meetings_scheduled_recent": int(scheduled),
            "meeting_no_show_recent": int(no_show),
        }

    # ── Stage progression (from Deal) ─────────────────────────────────────────

    async def get_stage_progression(
        self,
        organization_id: UUID,
        lead_id: UUID,
        now: datetime | None = None,
    ) -> dict[str, Any]:
        """Returns stage progression signals for the lead's deal."""
        now = now or datetime.now(timezone.utc)
        recent_start = now - timedelta(days=7)

        stmt = select(
            Deal.status,
            Deal.probability,
            Deal.updated_at,
            Deal.created_at,
        ).where(
            Deal.organization_id == organization_id,
            Deal.lead_id == lead_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
        ).order_by(Deal.updated_at.desc()).limit(1)

        result = await self.db.execute(stmt)
        row = result.first()

        if row is None:
            return {
                "stage_changed_recently": False,
                "days_in_current_stage": 999,
                "stage_forward_progress": False,
            }

        updated_at = row.updated_at or row.created_at or now
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)

        days_in_stage = max(0, (now - updated_at).days)
        stage_changed_recently = updated_at >= recent_start
        stage_forward_progress = stage_changed_recently and (row.probability or 0) >= 50

        return {
            "stage_changed_recently": stage_changed_recently,
            "days_in_current_stage": days_in_stage,
            "stage_forward_progress": stage_forward_progress,
        }

    # ── Last activity (for recency) ───────────────────────────────────────────

    async def get_days_since_last_activity(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
        now: datetime | None = None,
    ) -> int:
        """Returns days since the last activity for this entity."""
        now = now or datetime.now(timezone.utc)

        stmt = select(func.max(ActivityTimeline.created_at)).where(
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.entity_type == entity_type,
            ActivityTimeline.entity_id == entity_id,
        )
        result = await self.db.execute(stmt)
        last_at = result.scalar_one_or_none()

        if last_at is None:
            return 999

        if last_at.tzinfo is None:
            last_at = last_at.replace(tzinfo=timezone.utc)
        return max(0, (now - last_at).days)

    # ── Gather all trend data for a single lead ───────────────────────────────

    async def gather_trend_data(
        self,
        organization_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> dict[str, Any]:
        """
        Gather all trend data needed by the ai-service rising interest endpoint.
        Returns a dict ready to be sent as the HTTP payload to the AI service.
        """
        now = datetime.now(timezone.utc)

        activity_recent, activity_prior = await self.get_activity_counts(
            organization_id, entity_type, entity_id, now
        )

        email_data = await self.get_email_engagement(
            organization_id, entity_type, entity_id, now
        )

        rt_recent, rt_prior = await self.get_response_times(
            organization_id, entity_type, entity_id, now
        )

        meeting_data = await self.get_meeting_momentum(
            organization_id, entity_type, entity_id, now
        )

        stage_data = await self.get_stage_progression(
            organization_id, entity_id, now
        )

        days_since_last = await self.get_days_since_last_activity(
            organization_id, entity_type, entity_id, now
        )

        return {
            "lead_id": str(entity_id),
            "activity_count_recent": activity_recent,
            "activity_count_prior": activity_prior,
            "email_opens_recent": email_data["email_opens_recent"],
            "email_opens_prior": email_data["email_opens_prior"],
            "email_replies_recent": email_data["email_replies_recent"],
            "email_replies_prior": email_data["email_replies_prior"],
            "avg_response_time_recent_hours": rt_recent,
            "avg_response_time_prior_hours": rt_prior,
            "meetings_attended_recent": meeting_data["meetings_attended_recent"],
            "meetings_scheduled_recent": meeting_data["meetings_scheduled_recent"],
            "meeting_no_show_recent": meeting_data["meeting_no_show_recent"],
            "stage_changed_recently": stage_data["stage_changed_recently"],
            "days_in_current_stage": stage_data["days_in_current_stage"],
            "stage_forward_progress": stage_data["stage_forward_progress"],
            "days_since_last_activity": days_since_last,
        }
