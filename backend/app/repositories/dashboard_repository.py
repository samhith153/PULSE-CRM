"""
Dashboard repository queries.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityTimeline
from app.models.calendar_event import CalendarEvent
from app.models.company import Company
from app.models.crm_call import CrmCall
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.task import Task
from app.models.user import User
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
            select(Task)
            .where(
                Task.organization_id == organization_id,
                Task.owner_id == user_id,
                Task.is_deleted.is_(False),
                Task.status.notin_(["completed", "cancelled"]),
            )
            .order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc())
            .limit(limit)
        )
        return [{"task": task} for task in (await self.db.execute(stmt)).scalars().all()]

    async def dashboard_meetings(self, organization_id: UUID, user_id: UUID, now: datetime, limit: int = 10) -> list[CalendarEvent]:
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = (
            select(CalendarEvent)
            .where(
                CalendarEvent.organization_id == organization_id,
                CalendarEvent.owner_id == user_id,
                CalendarEvent.event_type == "meeting",
                CalendarEvent.is_active.is_(True),
                CalendarEvent.is_deleted.is_(False),
                CalendarEvent.status.in_(["scheduled", "in_progress", "rescheduled"]),
                CalendarEvent.start_datetime >= today_start,
            )
            .order_by(CalendarEvent.start_datetime.asc())
            .limit(limit)
        )
        return list((await self.db.execute(stmt)).scalars().all())

    async def priority_candidates(self, organization_id: UUID, user_id: UUID, limit: int = 50) -> list[dict[str, Any]]:
        stmt = (
            select(Task, Deal.amount, Deal.value, LeadScore.overall_score)
            .outerjoin(Deal, Deal.id == Task.related_deal_id)
            .outerjoin(Lead, Lead.id == Task.related_lead_id)
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .where(
                Task.organization_id == organization_id,
                Task.owner_id == user_id,
                Task.is_deleted.is_(False),
                Task.status.notin_(["completed", "cancelled"]),
            )
            .order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc())
            .limit(limit)
        )
        return [
            {"task": row[0], "deal_value": row[2] if row[2] is not None else row[1], "lead_score": row[3]}
            for row in (await self.db.execute(stmt)).all()
        ]

    async def calls_today(self, organization_id: UUID, user_id: UUID, start: datetime, end: datetime) -> int:
        stmt = select(func.count(ActivityTimeline.id)).where(
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.created_by == user_id,
            ActivityTimeline.is_active.is_(True),
            ActivityTimeline.created_at >= start,
            ActivityTimeline.created_at < end,
            ActivityTimeline.action.in_(["call", "call_logged", "call_completed"]),
        )
        return int((await self.db.execute(stmt)).scalar_one() or 0)

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

   

    async def calls_today_summary(self, organization_id: UUID, user_id: UUID, start: datetime, end: datetime) -> dict[str, int]:
        completed_statuses = ("completed", "connected", "done")
        stmt = select(
            func.count(CrmCall.id).label("total"),
            func.coalesce(func.sum(func.cast(CrmCall.status.in_(completed_statuses), Integer)), 0).label("completed"),
        ).where(
            CrmCall.organization_id == organization_id,
            CrmCall.owner_id == user_id,
            CrmCall.is_active.is_(True),
            CrmCall.is_deleted.is_(False),
            CrmCall.called_at >= start,
            CrmCall.called_at < end,
        )
        row = (await self.db.execute(stmt)).one()
        total = int(row.total or 0)
        completed = int(row.completed or 0)
        return {"total": total, "completed": completed, "pending": max(total - completed, 0)}

    async def task_summary(self, organization_id: UUID, user_id: UUID, start: datetime, end: datetime) -> dict[str, int]:
        inactive_statuses = ["completed", "cancelled"]
        stmt = select(
            func.count(Task.id).label("total"),
            func.coalesce(func.sum(func.cast(Task.status == "completed", Integer)), 0).label("completed"),
            func.coalesce(func.sum(func.cast((Task.due_date >= start) & (Task.due_date < end), Integer)), 0).label("today"),
            func.coalesce(func.sum(func.cast(Task.due_date >= end, Integer)), 0).label("upcoming"),
            func.coalesce(func.sum(func.cast((Task.due_date < start) & Task.status.notin_(inactive_statuses), Integer)), 0).label("overdue"),
        ).where(
            Task.organization_id == organization_id,
            Task.owner_id == user_id,
            Task.is_active.is_(True),
            Task.is_deleted.is_(False),
        )
        row = (await self.db.execute(stmt)).one()
        return {key: int(getattr(row, key) or 0) for key in ("total", "completed", "today", "upcoming", "overdue")}

    async def pipeline_funnel(self, organization_id: UUID, user_id: UUID) -> list[dict[str, Any]]:
        stages = [
            ("New Leads", ["new"]),
            ("Contacted", ["contacted"]),
            ("Qualified", ["qualified"]),
            ("Proposals", ["proposal_sent", "proposal", "negotiation"]),
            ("Won", ["won", "converted"]),
        ]
        stmt = select(Lead.status, func.count(Lead.id)).where(
            Lead.organization_id == organization_id,
            Lead.owner_id == user_id,
            Lead.is_active.is_(True),
            Lead.is_deleted.is_(False),
        ).group_by(Lead.status)
        counts = {str(status or "").lower(): int(count or 0) for status, count in (await self.db.execute(stmt)).all()}
        denominator = max(sum(counts.get(status, 0) for status in stages[0][1]), 1)
        rows = []
        for label, statuses in stages:
            count = sum(counts.get(status, 0) for status in statuses)
            rows.append({"label": label, "count": count, "conversion_percentage": (count * 100) / denominator})
        return rows

    async def quota_stats(self, organization_id: UUID, user_id: UUID, start: datetime, end: datetime) -> dict[str, Any]:
        stmt = select(
            func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0).label("achieved"),
            func.count(Deal.id).label("won_deals"),
        ).where(
            Deal.organization_id == organization_id,
            Deal.owner_id == user_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= start,
            Deal.closed_at < end,
        )
        row = (await self.db.execute(stmt)).one()
        achieved = row.achieved or 0
        won_deals = int(row.won_deals or 0)
        return {"achieved": achieved, "won_deals": won_deals, "average_deal_size": (achieved / won_deals) if won_deals else 0}

    async def user_sales_quota(self, organization_id: UUID, user_id: UUID):
        stmt = select(User.sales_quota).where(
            User.id == user_id,
            User.organization_id == organization_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()


    async def won_revenue_between(
        self,
        organization_id: UUID,
        user_id: UUID,
        start: datetime,
        end: datetime,
    ):
        stmt = select(func.coalesce(func.sum(func.coalesce(Deal.value, Deal.amount, 0)), 0)).where(
            Deal.organization_id == organization_id,
            Deal.owner_id == user_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= start,
            Deal.closed_at < end,
        )
        return (await self.db.execute(stmt)).scalar_one()