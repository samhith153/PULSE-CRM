"""
Sentiment Repository
Fetches raw interaction text from activity_timeline_events and emails.
Uses indexed columns: entity_id, created_at, sent_at, owner_id.
No N+1 — one enriched query per data source.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.activity import ActivityTimeline
from app.models.company import Company
from app.models.deal import Deal
from app.models.email import Email
from app.models.lead import Lead
from app.models.user import User
from app.utils.enums import DealStatus


class SentimentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _rbac_lead(self, stmt, user_id, team_ids):
        if user_id is not None and team_ids is None:
            return stmt.where(Lead.owner_id == user_id)
        if team_ids is not None:
            return stmt.where(Lead.owner_id.in_(team_ids))
        return stmt

    # ── All interactions per lead ─────────────────────────────────────────────

    async def fetch_interactions(
        self,
        organization_id: UUID,
        user_id: Optional[UUID],
        team_ids: Optional[list[UUID]],
        *,
        lead_id: Optional[UUID] = None,
        company_id: Optional[UUID] = None,
        deal_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sentiment_filter: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """
        Returns activity rows with text content per lead.
        Each row = one lead with aggregated text and metadata.
        """
        owner_alias = aliased(User, name="owner_u")

        stmt = (
            select(
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                Lead.owner_id,
                owner_alias.full_name.label("owner_name"),
                Company.name.label("company_name"),
                Deal.id.label("deal_id"),
                Deal.name.label("deal_name"),
                Deal.amount.label("deal_amount"),
                # Aggregate all activity text into one string per lead
                func.string_agg(
                    ActivityTimeline.title + " " +
                    func.coalesce(ActivityTimeline.description, ""),
                    " "
                ).label("activity_text"),
                func.count(ActivityTimeline.id).label("activity_count"),
                func.max(ActivityTimeline.created_at).label("last_activity_at"),
            )
            .outerjoin(owner_alias, owner_alias.id == Lead.owner_id)
            .outerjoin(Company, Company.id == Lead.company_id)
            .outerjoin(Deal, Deal.lead_id == Lead.id)
            .outerjoin(
                ActivityTimeline,
                (ActivityTimeline.entity_id == Lead.id)
                & (ActivityTimeline.entity_type == "lead"),
            )
            .where(
                Lead.organization_id == organization_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
                Lead.status.notin_(["won", "lost"]),
            )
            .group_by(
                Lead.id, Lead.title, Lead.owner_id,
                owner_alias.full_name,
                Company.name,
                Deal.id, Deal.name, Deal.amount,
            )
        )

        stmt = self._rbac_lead(stmt, user_id, team_ids)

        if lead_id:
            stmt = stmt.where(Lead.id == lead_id)
        if company_id:
            stmt = stmt.where(Company.id == company_id)
        if deal_id:
            stmt = stmt.where(Deal.id == deal_id)
        if date_from:
            stmt = stmt.where(ActivityTimeline.created_at >= date_from)
        if date_to:
            stmt = stmt.where(ActivityTimeline.created_at <= date_to)

        result = await self.db.execute(stmt)
        return [dict(r) for r in result.mappings().all()]

    # ── Per-lead chronological activity rows (for timeline) ───────────────────

    async def fetch_lead_activity_rows(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> list[dict[str, Any]]:
        stmt = (
            select(
                ActivityTimeline.id,
                ActivityTimeline.action,
                ActivityTimeline.title,
                ActivityTimeline.description,
                ActivityTimeline.created_at,
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.entity_id == lead_id,
                ActivityTimeline.entity_type == "lead",
            )
            .order_by(ActivityTimeline.created_at.desc())
            .limit(30)
        )
        result = await self.db.execute(stmt)
        return [dict(r) for r in result.mappings().all()]

    # ── Per-lead email rows (for timeline + scoring) ──────────────────────────

    async def fetch_lead_email_rows(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> list[dict[str, Any]]:
        stmt = (
            select(
                Email.id,
                Email.subject,
                Email.body_preview,
                Email.direction,
                Email.sent_at,
                Email.is_read,
            )
            .where(
                Email.organization_id == organization_id,
                Email.external_entity_id == lead_id,
                Email.external_entity_type == "lead",
            )
            .order_by(Email.sent_at.desc())
            .limit(30)
        )
        result = await self.db.execute(stmt)
        return [dict(r) for r in result.mappings().all()]

    # ── 7-day vs previous-7-day activity text per lead ────────────────────────

    async def fetch_trend_texts(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> dict[str, list[str]]:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)

        async def _texts(start, end) -> list[str]:
            q = (
                select(
                    ActivityTimeline.title,
                    ActivityTimeline.description,
                )
                .where(
                    ActivityTimeline.organization_id == organization_id,
                    ActivityTimeline.entity_id == lead_id,
                    ActivityTimeline.created_at >= start,
                    ActivityTimeline.created_at < end,
                )
            )
            r = await self.db.execute(q)
            rows = r.all()
            return [
                (row[0] or "") + " " + (row[1] or "")
                for row in rows
            ]

        current  = await _texts(week_ago, now)
        previous = await _texts(two_weeks_ago, week_ago)
        return {"current": current, "previous": previous}

    # ── High-value lead check ─────────────────────────────────────────────────

    async def get_deal_value_for_lead(
        self,
        organization_id: UUID,
        lead_id: UUID,
    ) -> float:
        stmt = select(
            func.coalesce(func.sum(Deal.amount), 0)
        ).where(
            Deal.organization_id == organization_id,
            Deal.lead_id == lead_id,
            Deal.is_deleted.is_(False),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
        )
        result = await self.db.execute(stmt)
        return float(result.scalar_one() or 0)
