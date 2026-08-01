"""
Going Cold Repository
All SQL for the Going Cold Detection module.
Uses existing CRM tables only — no new tables.
Indexed columns: owner_id, created_at, updated_at, probability,
                 lead.score, activity.created_at, deal.expected_close_date
No N+1 queries — all aggregations in single CTEs or subqueries.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import case, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.activity import ActivityTimeline
from app.models.company import Company
from app.models.deal import Deal
from app.models.email import Email
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.pipeline import PipelineStage
from app.models.user import User
from app.utils.enums import DealStatus

# ── Inactivity thresholds (days → raw score contribution 0-100) ───────────────
_INACTIVITY_SCORES = [
    (0,  3,  0),   # Normal
    (4,  7,  20),  # Low
    (8,  14, 45),  # Medium
    (15, 30, 70),  # High
    (31, 9999, 100),  # Critical
]

# Deal age → score contribution
_DEAL_AGE_SCORES = [
    (0,  30,  10),
    (31, 60,  35),
    (61, 90,  65),
    (91, 9999, 100),
]


class GoingColdRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── RBAC helpers ──────────────────────────────────────────────────────────

    def _apply_rbac(self, stmt, user_id: UUID | None, team_ids: list[UUID] | None):
        if user_id is not None and team_ids is None:
            return stmt.where(Lead.owner_id == user_id)
        if team_ids is not None:
            return stmt.where(Lead.owner_id.in_(team_ids))
        return stmt

    def _apply_deal_rbac(self, stmt, user_id: UUID | None, team_ids: list[UUID] | None):
        if user_id is not None and team_ids is None:
            return stmt.where(Deal.owner_id == user_id)
        if team_ids is not None:
            return stmt.where(Deal.owner_id.in_(team_ids))
        return stmt

    # ── Core data fetcher: leads + deals + last activity ─────────────────────

    async def fetch_cold_candidates(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
        *,
        owner_id_filter: UUID | None = None,
        industry_filter: str | None = None,
        pipeline_stage_filter: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        minimum_risk: str | None = None,
        page: int = 1,
        page_size: int = 20,
        sort: str = "cold_score",
    ) -> tuple[list[dict[str, Any]], int]:
        """
        Returns enriched rows needed to compute cold scores.
        One query with all necessary JOINs and sub-aggregations.
        """
        now = datetime.now(timezone.utc)
        owner_alias = aliased(User, name="owner_u")

        # ── last activity per lead (subquery) ──────────────────────────────
        last_act_sub = (
            select(
                ActivityTimeline.entity_id,
                func.max(ActivityTimeline.created_at).label("last_at"),
                func.count(ActivityTimeline.id).label("total_acts"),
            )
            .where(ActivityTimeline.organization_id == organization_id)
            .group_by(ActivityTimeline.entity_id)
            .subquery("last_act")
        )

        # ── activity count last 7 days per lead ────────────────────────────
        week_ago = now - timedelta(days=7)
        prev_week_start = now - timedelta(days=14)

        act_7d_sub = (
            select(
                ActivityTimeline.entity_id,
                func.count(ActivityTimeline.id).label("acts_7d"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.created_at >= week_ago,
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery("act_7d")
        )

        act_prev7d_sub = (
            select(
                ActivityTimeline.entity_id,
                func.count(ActivityTimeline.id).label("acts_prev7d"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.created_at >= prev_week_start,
                ActivityTimeline.created_at < week_ago,
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery("act_prev7d")
        )

        # ── overdue followups (deals past expected_close_date) ─────────────
        overdue_sub = (
            select(
                Deal.lead_id,
                func.count(Deal.id).label("overdue_count"),
            )
            .where(
                Deal.organization_id == organization_id,
                Deal.is_deleted.is_(False),
                Deal.expected_close_date < now.date(),
                Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
                Deal.lead_id.isnot(None),
            )
            .group_by(Deal.lead_id)
            .subquery("overdue_sub")
        )

        # ── email reply check per lead ────────────────────────────────────
        email_sub = (
            select(
                Email.external_entity_id,
                func.count(Email.id).label("email_count"),
                func.sum(
                    case((Email.direction == "inbound", 1), else_=0)
                ).label("replies"),
                func.sum(
                    case((Email.is_read.is_(True), 1), else_=0)
                ).label("opens"),
            )
            .where(
                Email.organization_id == organization_id,
                Email.external_entity_type == "lead",
            )
            .group_by(Email.external_entity_id)
            .subquery("email_sub")
        )

        # ── meeting actions ───────────────────────────────────────────────
        meeting_sub = (
            select(
                ActivityTimeline.entity_id,
                func.sum(
                    case(
                        (ActivityTimeline.action.in_(["meeting_scheduled", "meeting"]), 1),
                        else_=0,
                    )
                ).label("scheduled"),
                func.sum(
                    case(
                        (ActivityTimeline.action == "meeting_cancelled", 1),
                        else_=0,
                    )
                ).label("cancelled"),
                func.sum(
                    case(
                        (ActivityTimeline.action == "meeting_completed", 1),
                        else_=0,
                    )
                ).label("completed"),
            )
            .where(ActivityTimeline.organization_id == organization_id)
            .group_by(ActivityTimeline.entity_id)
            .subquery("meeting_sub")
        )

        # ── main query ────────────────────────────────────────────────────
        stmt = (
            select(
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                LeadScore.overall_score.label("lead_score"),
                Lead.owner_id,
                Lead.company_id,
                Lead.industry,
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
                last_act_sub.c.last_at.label("last_activity_at"),
                func.coalesce(act_7d_sub.c.acts_7d, 0).label("acts_last_7d"),
                func.coalesce(act_prev7d_sub.c.acts_prev7d, 0).label("acts_prev_7d"),
                func.coalesce(overdue_sub.c.overdue_count, 0).label("overdue_followups"),
                func.coalesce(email_sub.c.email_count, 0).label("email_count"),
                func.coalesce(email_sub.c.replies, 0).label("email_replies"),
                func.coalesce(email_sub.c.opens, 0).label("email_opens"),
                func.coalesce(meeting_sub.c.cancelled, 0).label("meetings_cancelled"),
                func.coalesce(meeting_sub.c.completed, 0).label("meetings_completed"),
            )
            .outerjoin(owner_alias, owner_alias.id == Lead.owner_id)
            .outerjoin(Company, Company.id == Lead.company_id)
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .outerjoin(Deal, Deal.lead_id == Lead.id)
            .outerjoin(PipelineStage, PipelineStage.id == Deal.pipeline_stage_id)
            .outerjoin(last_act_sub, last_act_sub.c.entity_id == Lead.id)
            .outerjoin(act_7d_sub, act_7d_sub.c.entity_id == Lead.id)
            .outerjoin(act_prev7d_sub, act_prev7d_sub.c.entity_id == Lead.id)
            .outerjoin(overdue_sub, overdue_sub.c.lead_id == Lead.id)
            .outerjoin(email_sub, email_sub.c.external_entity_id == Lead.id)
            .outerjoin(meeting_sub, meeting_sub.c.entity_id == Lead.id)
            .where(
                Lead.organization_id == organization_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
                Lead.status.notin_(["won", "lost", "converted"]),
            )
        )

        # Apply RBAC
        stmt = self._apply_rbac(stmt, user_id, team_ids)

        # Optional filters
        if owner_id_filter:
            stmt = stmt.where(Lead.owner_id == owner_id_filter)
        if industry_filter:
            stmt = stmt.where(Lead.industry.ilike(f"%{industry_filter}%"))
        if pipeline_stage_filter:
            stmt = stmt.where(PipelineStage.name.ilike(f"%{pipeline_stage_filter}%"))
        if date_from:
            stmt = stmt.where(Lead.created_at >= date_from)
        if date_to:
            stmt = stmt.where(Lead.created_at <= date_to)

        result = await self.db.execute(stmt)
        rows = result.mappings().all()
        return [dict(r) for r in rows], len(rows)

    # ── Summary counts ────────────────────────────────────────────────────────

    async def get_summary_counts(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, Any]:
        """
        Returns counts used by the summary endpoint.
        Uses COUNT/SUM/AVG — single pass.
        """
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # leads re-engaged this month = leads with activity after month_start
        # that previously had no activity for 14+ days
        reengaged_sub = (
            select(func.count(ActivityTimeline.entity_id.distinct()))
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.created_at >= month_start,
                ActivityTimeline.entity_type == "lead",
            )
            .scalar_subquery()
        )

        inactive_sub = (
            select(func.count(Lead.id))
            .outerjoin(
                ActivityTimeline,
                (ActivityTimeline.entity_id == Lead.id)
                & (ActivityTimeline.created_at >= now - timedelta(days=14)),
            )
            .where(
                Lead.organization_id == organization_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
                Lead.status.notin_(["won", "lost", "converted"]),
                ActivityTimeline.id.is_(None),
            )
            .scalar_subquery()
        )

        overdue_sub = (
            select(func.count(Deal.id))
            .where(
                Deal.organization_id == organization_id,
                Deal.is_deleted.is_(False),
                Deal.expected_close_date < now.date(),
                Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            )
            .scalar_subquery()
        )

        result = await self.db.execute(
            select(
                reengaged_sub.label("reengaged"),
                inactive_sub.label("inactive"),
                overdue_sub.label("overdue"),
            )
        )
        row = result.one()
        return {
            "reengaged": int(row[0] or 0),
            "inactive_customers": int(row[1] or 0),
            "overdue_followups": int(row[2] or 0),
        }
