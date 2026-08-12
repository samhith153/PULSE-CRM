"""
Daily Priorities Repository
All SQL for the Daily Priorities module.
Uses existing CRM tables only. Indexed columns used throughout.
Single enriched query per section — no N+1.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import case, func, or_, select, Numeric
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.activity import ActivityTimeline
from app.models.company import Company
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.pipeline import PipelineStage
from app.models.user import User
from app.utils.enums import DealStatus


class DailyPrioritiesRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── RBAC filter helpers ───────────────────────────────────────────────────

    def _rbac_lead(self, stmt, user_id, team_ids):
        if user_id is not None and team_ids is None:
            return stmt.where(Lead.owner_id == user_id)
        if team_ids is not None:
            return stmt.where(Lead.owner_id.in_(team_ids))
        return stmt

    def _rbac_deal(self, stmt, user_id, team_ids):
        if user_id is not None and team_ids is None:
            return stmt.where(Deal.owner_id == user_id)
        if team_ids is not None:
            return stmt.where(Deal.owner_id.in_(team_ids))
        return stmt

    # ── Shared subqueries ─────────────────────────────────────────────────────

    def _last_activity_sub(self, organization_id: UUID):
        return (
            select(
                ActivityTimeline.entity_id,
                func.max(ActivityTimeline.created_at).label("last_at"),
            )
            .where(ActivityTimeline.organization_id == organization_id)
            .group_by(ActivityTimeline.entity_id)
            .subquery("last_act")
        )

    def _open_task_sub(self, organization_id: UUID):
        """Count open high-priority activities per lead/deal."""
        return (
            select(
                ActivityTimeline.entity_id,
                func.count(ActivityTimeline.id).label("open_tasks"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.action.in_(["task", "task_created"]),
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery("open_tasks")
        )

    def _today_meeting_sub(self, organization_id: UUID, today_start: datetime, today_end: datetime):
        """Count meetings scheduled today per entity."""
        return (
            select(
                ActivityTimeline.entity_id,
                func.count(ActivityTimeline.id).label("meetings_today"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.action.in_(["meeting", "meeting_scheduled"]),
                ActivityTimeline.created_at >= today_start,
                ActivityTimeline.created_at <= today_end,
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery("meetings_today")
        )

    def _email_sub(self, organization_id: UUID):
        """Outbound email count and reply count per lead."""
        from app.models.email import Email
        return (
            select(
                Email.external_entity_id,
                func.count(Email.id).label("email_count"),
                func.sum(
                    case((Email.direction == "inbound", 1), else_=0)
                ).label("email_replies"),
            )
            .where(
                Email.organization_id == organization_id,
                Email.external_entity_type == "lead",
            )
            .group_by(Email.external_entity_id)
            .subquery("email_cnt")
        )

    def _rising_interest_sub(self, organization_id: UUID, now: datetime):
        """
        Compute a dynamic rising-interest velocity score per entity.
        Compares activity count in recent 7-day window vs prior 7-day window.
        A ratio > 1.0 means engagement is accelerating (rising).
        """
        recent_start = now - timedelta(days=7)
        prior_start = now - timedelta(days=14)

        recent_act = (
            select(
                ActivityTimeline.entity_id,
                func.count(ActivityTimeline.id).label("recent_cnt"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.created_at >= recent_start,
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery("recent_act")
        )

        prior_act = (
            select(
                ActivityTimeline.entity_id,
                func.count(ActivityTimeline.id).label("prior_cnt"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.created_at >= prior_start,
                ActivityTimeline.created_at < recent_start,
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery("prior_act")
        )

        ratio_expr = case(
            (func.coalesce(prior_act.c.prior_cnt, 0) == 0,
             case((func.coalesce(recent_act.c.recent_cnt, 0) > 0, 2.0), else_=0.0)),
            else_=func.cast(recent_act.c.recent_cnt, Numeric) / func.cast(prior_act.c.prior_cnt, Numeric),
        )

        rising_score = func.least(func.greatest(ratio_expr * 40, 0), 100)

        return (
            select(
                recent_act.c.entity_id,
                recent_act.c.recent_cnt,
                prior_act.c.prior_cnt,
                rising_score.label("rising_interest_score"),
            )
            .select_from(
                recent_act.outerjoin(
                    prior_act, prior_act.c.entity_id == recent_act.c.entity_id
                )
            )
            .subquery("rising_interest")
        )

    # ── Main enriched query for all leads/deals ───────────────────────────────

    async def fetch_priority_candidates(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
        *,
        owner_id_filter: UUID | None = None,
        pipeline_stage_filter: str | None = None,
        date_filter: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Returns one row per lead+deal combination enriched with all
        signal columns needed for priority scoring.
        """
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end   = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        last_act = self._last_activity_sub(organization_id)
        open_tasks = self._open_task_sub(organization_id)
        mtg_today  = self._today_meeting_sub(organization_id, today_start, today_end)
        email_cnt  = self._email_sub(organization_id)
        rising_int = self._rising_interest_sub(organization_id, now)

        owner_alias = aliased(User, name="owner_u")

        stmt = (
            select(
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                LeadScore.overall_score.label("lead_score"),
                Lead.owner_id,
                Lead.created_at.label("lead_created_at"),
                Lead.status.label("lead_status"),
                owner_alias.full_name.label("owner_name"),
                Company.name.label("company_name"),
                Deal.id.label("deal_id"),
                Deal.name.label("deal_name"),
                Deal.amount.label("deal_amount"),
                Deal.probability,
                Deal.expected_close_date,
                Deal.created_at.label("deal_created_at"),
                Deal.status.label("deal_status"),
                PipelineStage.name.label("pipeline_stage"),
                last_act.c.last_at.label("last_activity_at"),
                func.coalesce(open_tasks.c.open_tasks, 0).label("open_tasks"),
                func.coalesce(mtg_today.c.meetings_today, 0).label("meetings_today"),
                func.coalesce(email_cnt.c.email_count, 0).label("email_count"),
                func.coalesce(email_cnt.c.email_replies, 0).label("email_replies"),
                func.coalesce(rising_int.c.rising_interest_score, 0).label("rising_interest_score"),
            )
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .outerjoin(owner_alias,  owner_alias.id   == Lead.owner_id)
            .outerjoin(Company,      Company.id        == Lead.company_id)
            .outerjoin(Deal,         Deal.lead_id      == Lead.id)
            .outerjoin(PipelineStage, PipelineStage.id == Deal.pipeline_stage_id)
            .outerjoin(last_act,     last_act.c.entity_id  == Lead.id)
            .outerjoin(open_tasks,   open_tasks.c.entity_id == Lead.id)
            .outerjoin(mtg_today,    mtg_today.c.entity_id  == Lead.id)
            .outerjoin(email_cnt,    email_cnt.c.external_entity_id == Lead.id)
            .outerjoin(rising_int,    rising_int.c.entity_id == Lead.id)
            .where(
                Lead.organization_id == organization_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
                Lead.status.notin_(["won", "lost", "converted"]),
            )
        )

        stmt = self._rbac_lead(stmt, user_id, team_ids)

        if owner_id_filter:
            stmt = stmt.where(Lead.owner_id == owner_id_filter)
        if pipeline_stage_filter:
            stmt = stmt.where(PipelineStage.name.ilike(f"%{pipeline_stage_filter}%"))

        # Date window filters on deal close date
        if date_filter == "today":
            stmt = stmt.where(Deal.expected_close_date == now.date())
        elif date_filter == "tomorrow":
            stmt = stmt.where(Deal.expected_close_date == (now + timedelta(days=1)).date())
        elif date_filter == "week":
            stmt = stmt.where(
                Deal.expected_close_date >= now.date(),
                Deal.expected_close_date <= (now + timedelta(days=7)).date(),
            )

        result = await self.db.execute(stmt)
        return [dict(r) for r in result.mappings().all()]

    # ── Today's activity counts ───────────────────────────────────────────────

    async def get_today_counts(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, int]:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end   = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        week_end    = now + timedelta(days=7)

        def _base_act(*extra):
            q = select(func.count(ActivityTimeline.id)).where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.created_at >= today_start,
                ActivityTimeline.created_at <= today_end,
                *extra,
            )
            return q

        def _base_deal(*extra):
            q = select(func.count(Deal.id)).where(
                Deal.organization_id == organization_id,
                Deal.is_deleted.is_(False),
                Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
                *extra,
            )
            if user_id is not None and team_ids is None:
                q = q.where(Deal.owner_id == user_id)
            elif team_ids is not None:
                q = q.where(Deal.owner_id.in_(team_ids))
            return q

        async def _cnt(stmt) -> int:
            r = await self.db.execute(stmt)
            return int(r.scalar_one() or 0)

        meetings  = await _cnt(_base_act(ActivityTimeline.action.in_(["meeting", "meeting_scheduled"])))
        calls     = await _cnt(_base_act(ActivityTimeline.action.in_(["call", "call_logged"])))
        followups = await _cnt(_base_deal(
            Deal.expected_close_date < now.date(),
        ))
        closing   = await _cnt(_base_deal(
            Deal.expected_close_date >= now.date(),
            Deal.expected_close_date <= week_end.date(),
        ))

        return {
            "meetings_today": meetings,
            "calls_today": calls,
            "follow_ups_today": followups,
            "closing_deals": closing,
        }

    # ── Completed-today count ─────────────────────────────────────────────────

    async def get_completed_today(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> int:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        q = select(func.count(Deal.id)).where(
            Deal.organization_id == organization_id,
            Deal.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value,
            Deal.closed_at >= today_start,
        )
        if user_id is not None and team_ids is None:
            q = q.where(Deal.owner_id == user_id)
        elif team_ids is not None:
            q = q.where(Deal.owner_id.in_(team_ids))
        r = await self.db.execute(q)
        return int(r.scalar_one() or 0)
