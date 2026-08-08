"""
Dashboard repository queries.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityTimeline
from app.models.calendar_event import CalendarEvent
from app.models.company import Company
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.meeting import Meeting
from app.utils.enums import DealStatus


class DashboardRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def count_open_deals(self, organization_id: UUID, user_id: UUID) -> int:
        stmt = select(func.count(Deal.id)).where(
            Deal.organization_id == organization_id,
            Deal.owner_id == user_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
        )
        return int((await self.db.execute(stmt)).scalar_one() or 0)

    async def recent_open_deals(self, organization_id: UUID, user_id: UUID, limit: int = 5) -> list[Deal]:
        stmt = (
            select(Deal)
            .where(
                Deal.organization_id == organization_id,
                Deal.owner_id == user_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            )
            .order_by(Deal.updated_at.desc())
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def latest_deal_activity(self, organization_id: UUID, user_id: UUID) -> list[tuple[Deal, datetime | None]]:
        latest_activity = (
            select(
                ActivityTimeline.entity_id.label("deal_id"),
                func.max(ActivityTimeline.created_at).label("last_activity_at"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.entity_type == "deal",
                ActivityTimeline.is_active.is_(True),
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery()
        )
        stmt = (
            select(Deal, latest_activity.c.last_activity_at)
            .outerjoin(latest_activity, latest_activity.c.deal_id == Deal.id)
            .where(
                Deal.organization_id == organization_id,
                Deal.owner_id == user_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            )
        )
        return [(row[0], row[1]) for row in (await self.db.execute(stmt)).all()]

    async def count_active_leads(self, organization_id: UUID, user_id: UUID) -> int:
        stmt = select(func.count(Lead.id)).where(
            Lead.organization_id == organization_id,
            Lead.owner_id == user_id,
            Lead.is_active.is_(True),
            Lead.is_deleted.is_(False),
            Lead.status != "converted",
        )
        return int((await self.db.execute(stmt)).scalar_one() or 0)

    async def open_tasks(self, organization_id: UUID, user_id: UUID, limit: int = 20) -> list[dict[str, Any]]:
        stmt = (
            select(CalendarEvent)
            .where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.owner_id == user_id,
                CalendarEvent.is_deleted.is_(False),
                CalendarEvent.event_type == "task",
                CalendarEvent.status.notin_(["completed", "cancelled"]),
            )
            .order_by(CalendarEvent.end_datetime.asc(), CalendarEvent.start_datetime.asc())
            .limit(limit)
        )
        return [{"task": task} for task in (await self.db.execute(stmt)).scalars().all()]

    async def dashboard_meetings(self, organization_id: UUID, user_id: UUID, now: datetime, limit: int = 10) -> list[Meeting]:
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = (
            select(Meeting)
            .where(
                Meeting.organization_id == organization_id,
                Meeting.owner_id == user_id,
                Meeting.is_active.is_(True),
                Meeting.is_deleted.is_(False),
                Meeting.status.in_(["scheduled", "in_progress", "rescheduled"]),
                Meeting.start_datetime >= today_start,
            )
            .order_by(Meeting.start_datetime.asc())
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def priority_candidates(self, organization_id: UUID, user_id: UUID, limit: int = 50) -> list[dict[str, Any]]:
        stmt = (
            select(CalendarEvent, Deal.amount, LeadScore.overall_score)
            .outerjoin(Deal, Deal.id == CalendarEvent.related_deal_id)
            .outerjoin(Lead, Lead.id == CalendarEvent.related_lead_id)
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.owner_id == user_id,
                CalendarEvent.is_deleted.is_(False),
                CalendarEvent.event_type == "task",
                CalendarEvent.status.notin_(["completed", "cancelled"]),
            )
            .order_by(CalendarEvent.end_datetime.asc())
            .limit(limit)
        )
        return [
            {"task": row[0], "deal_value": row[1], "lead_score": row[2]}
            for row in (await self.db.execute(stmt)).all()
        ]

    async def at_risk_deals(self, organization_id: UUID, user_id: UUID) -> list[dict[str, Any]]:
        latest_activity = (
            select(
                ActivityTimeline.entity_id.label("deal_id"),
                func.max(ActivityTimeline.created_at).label("last_activity_at"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.entity_type == "deal",
                ActivityTimeline.is_active.is_(True),
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery()
        )
        stmt = (
            select(Deal, Company.name, LeadScore.engagement_score, LeadScore.overall_score, latest_activity.c.last_activity_at)
            .outerjoin(Company, Company.id == Deal.company_id)
            .outerjoin(Lead, Lead.id == Deal.lead_id)
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .outerjoin(latest_activity, latest_activity.c.deal_id == Deal.id)
            .where(
                Deal.organization_id == organization_id,
                Deal.owner_id == user_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            )
        )
        return [
            {
                "deal": row[0],
                "company_name": row[1],
                "engagement_score": row[2],
                "lead_score": row[3],
                "last_activity_at": row[4],
            }
            for row in (await self.db.execute(stmt)).all()
        ]

    async def won_revenue_between(
        self,
        organization_id: UUID,
        user_id: UUID,
        start: datetime,
        end: datetime,
    ):
        stmt = select(func.coalesce(func.sum(Deal.amount), 0)).where(
            Deal.organization_id == organization_id,
            Deal.owner_id == user_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= start,
            Deal.closed_at < end,
        )
        return (await self.db.execute(stmt)).scalar_one()
