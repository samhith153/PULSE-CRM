"""
Audit Log Repository
Queries against activity_timeline_events with RBAC-scoped visibility,
search, date filtering, and pagination.
All queries use indexed columns (created_at, user_id, action) — no N+1.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.activity import ActivityTimeline
from app.models.user import User


class AuditLogRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── RBAC-scoped list with search + date filter ────────────────────────────

    async def list_audit_logs(
        self,
        organization_id: UUID,
        *,
        # RBAC scope
        user_id: Optional[UUID] = None,          # sales_rep → own only
        team_user_ids: Optional[list[UUID]] = None,  # manager → team
        # filters
        date_filter: Optional[str] = None,        # today | week | month
        activity_type: Optional[str] = None,
        search: Optional[str] = None,
        # pagination
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        """
        Returns (rows, total_count).
        Each row is a dict with activity + performer name joined in one query.
        """
        performer = aliased(User, name="performer")

        stmt = (
            select(
                ActivityTimeline.id,
                ActivityTimeline.action,
                ActivityTimeline.title,
                ActivityTimeline.description,
                ActivityTimeline.entity_type,
                ActivityTimeline.entity_id,
                ActivityTimeline.created_by,
                ActivityTimeline.created_at,
                ActivityTimeline.payload,
                performer.full_name.label("performer_name"),
                performer.avatar_url.label("performer_avatar"),
            )
            .outerjoin(performer, performer.id == ActivityTimeline.created_by)
            .where(ActivityTimeline.organization_id == organization_id)
        )

        # ── RBAC scope ────────────────────────────────────────────────────────
        if user_id is not None and team_user_ids is None:
            # sales_rep: own activities only
            stmt = stmt.where(ActivityTimeline.created_by == user_id)
        elif team_user_ids is not None:
            # manager: own + team
            stmt = stmt.where(ActivityTimeline.created_by.in_(team_user_ids))
        # admin: no extra filter — sees everything

        # ── Date filter ───────────────────────────────────────────────────────
        now = datetime.now(timezone.utc)
        if date_filter == "today":
            day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            stmt = stmt.where(ActivityTimeline.created_at >= day_start)
        elif date_filter == "week":
            stmt = stmt.where(ActivityTimeline.created_at >= now - timedelta(days=7))
        elif date_filter == "month":
            stmt = stmt.where(ActivityTimeline.created_at >= now - timedelta(days=30))

        # ── Activity type filter ──────────────────────────────────────────────
        if activity_type:
            stmt = stmt.where(ActivityTimeline.action == activity_type)

        # ── Global search (ILIKE on key text columns) ─────────────────────────
        if search:
            term = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    performer.full_name.ilike(term),
                    ActivityTimeline.title.ilike(term),
                    ActivityTimeline.description.ilike(term),
                    ActivityTimeline.action.ilike(term),
                    ActivityTimeline.entity_type.ilike(term),
                )
            )

        # ── Count (same filters, no pagination) ──────────────────────────────
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await self.db.execute(count_stmt)
        total = int(count_result.scalar_one() or 0)

        # ── Pagination + ordering ──────────────────────────────────────────────
        offset = (page - 1) * page_size
        stmt = (
            stmt.order_by(ActivityTimeline.created_at.desc(), ActivityTimeline.id.desc())
            .offset(offset)
            .limit(page_size)
        )

        result = await self.db.execute(stmt)
        rows = result.mappings().all()
        return [dict(r) for r in rows], total

    # ── Statistics ────────────────────────────────────────────────────────────

    async def get_statistics(
        self,
        organization_id: UUID,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
    ) -> dict[str, int]:
        """
        Returns counts for today / week / month + per activity-type buckets.
        Single query per time bucket — no N+1.
        """
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        def _base():
            q = select(func.count(ActivityTimeline.id)).where(
                ActivityTimeline.organization_id == organization_id
            )
            if user_id is not None and team_user_ids is None:
                q = q.where(ActivityTimeline.created_by == user_id)
            elif team_user_ids is not None:
                q = q.where(ActivityTimeline.created_by.in_(team_user_ids))
            return q

        async def _count(*extra_filters) -> int:
            q = _base()
            for f in extra_filters:
                q = q.where(f)
            r = await self.db.execute(q)
            return int(r.scalar_one() or 0)

        today = await _count(ActivityTimeline.created_at >= today_start)
        week = await _count(ActivityTimeline.created_at >= week_ago)
        month = await _count(ActivityTimeline.created_at >= month_ago)

        # Per-type buckets (using ILIKE so variant spellings still match)
        email_actions = ["email_sent", "email", "email_received"]
        call_actions = ["call", "call_logged"]
        meeting_actions = ["meeting", "meeting_scheduled", "meeting_completed"]
        note_actions = ["note", "internal_note_added"]

        emails = await _count(
            ActivityTimeline.created_at >= month_ago,
            ActivityTimeline.action.in_(email_actions),
        )
        calls = await _count(
            ActivityTimeline.created_at >= month_ago,
            ActivityTimeline.action.in_(call_actions),
        )
        meetings = await _count(
            ActivityTimeline.created_at >= month_ago,
            ActivityTimeline.action.in_(meeting_actions),
        )
        notes = await _count(
            ActivityTimeline.created_at >= month_ago,
            ActivityTimeline.action.in_(note_actions),
        )

        return {
            "todayActivities": today,
            "weekActivities": week,
            "monthActivities": month,
            "emails": emails,
            "calls": calls,
            "meetings": meetings,
            "notes": notes,
        }

    # ── Recent (latest N) ─────────────────────────────────────────────────────

    async def get_recent(
        self,
        organization_id: UUID,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        performer = aliased(User, name="performer")

        stmt = (
            select(
                ActivityTimeline.id,
                ActivityTimeline.action,
                ActivityTimeline.title,
                ActivityTimeline.description,
                ActivityTimeline.entity_type,
                ActivityTimeline.entity_id,
                ActivityTimeline.created_by,
                ActivityTimeline.created_at,
                ActivityTimeline.payload,
                performer.full_name.label("performer_name"),
                performer.avatar_url.label("performer_avatar"),
            )
            .outerjoin(performer, performer.id == ActivityTimeline.created_by)
            .where(ActivityTimeline.organization_id == organization_id)
        )

        if user_id is not None and team_user_ids is None:
            stmt = stmt.where(ActivityTimeline.created_by == user_id)
        elif team_user_ids is not None:
            stmt = stmt.where(ActivityTimeline.created_by.in_(team_user_ids))

        stmt = stmt.order_by(
            ActivityTimeline.created_at.desc(),
            ActivityTimeline.id.desc(),
        ).limit(limit)

        result = await self.db.execute(stmt)
        return [dict(r) for r in result.mappings().all()]

    # ── Search (alias to list with search kwarg) ──────────────────────────────

    async def search_audit_logs(
        self,
        organization_id: UUID,
        q: str,
        *,
        user_id: Optional[UUID] = None,
        team_user_ids: Optional[list[UUID]] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        return await self.list_audit_logs(
            organization_id,
            user_id=user_id,
            team_user_ids=team_user_ids,
            search=q,
            page=page,
            page_size=page_size,
        )
