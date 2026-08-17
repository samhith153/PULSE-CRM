"""
Conversation Intelligence Repository
Queries activity_timeline_events, emails, leads, deals, companies, contacts.
No N+1 — enriched joins throughout.
Indexed columns: created_by, entity_id, entity_type, created_at, sent_at.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.activity import ActivityTimeline
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.email import Email
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.user import User
from app.utils.enums import DealStatus

# ── conversation type mapping ─────────────────────────────────────────────────
_CALL_ACTIONS    = ["call", "call_logged"]
_MEETING_ACTIONS = ["meeting", "meeting_scheduled", "meeting_completed", "meeting_cancelled"]
_NOTE_ACTIONS    = ["note", "internal_note_added"]


class ConversationIntelligenceRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── RBAC helpers ──────────────────────────────────────────────────────────

    def _rbac(self, stmt, col, user_id, team_ids):
        if user_id is not None and team_ids is None:
            return stmt.where(col == user_id)
        if team_ids is not None:
            return stmt.where(col.in_(team_ids))
        return stmt

    # ── Fetch activity-based conversations ───────────────────────────────────

    async def fetch_activity_conversation_by_id(
        self,
        organization_id: UUID,
        user_id: Optional[UUID],
        team_ids: Optional[list[UUID]],
        conversation_id: UUID,
    ) -> Optional[dict[str, Any]]:
        """Fetch a single activity conversation by ID (no full-table scan)."""
        owner_alias = aliased(User, name="owner_u")

        stmt = (
            select(
                ActivityTimeline.id,
                ActivityTimeline.action,
                ActivityTimeline.title,
                ActivityTimeline.description,
                ActivityTimeline.created_at,
                ActivityTimeline.entity_type,
                ActivityTimeline.entity_id,
                ActivityTimeline.created_by,
                ActivityTimeline.payload,
                owner_alias.full_name.label("owner_name"),
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                LeadScore.overall_score.label("lead_score"),
                Deal.id.label("deal_id"),
                Deal.name.label("deal_name"),
                Deal.amount.label("deal_amount"),
                Deal.probability,
                Company.name.label("company_name"),
                Contact.first_name.label("contact_first"),
                Contact.last_name.label("contact_last"),
            )
            .outerjoin(owner_alias, owner_alias.id == ActivityTimeline.created_by)
            .outerjoin(
                Lead,
                (Lead.id == ActivityTimeline.entity_id)
                & (ActivityTimeline.entity_type == "lead"),
            )
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .outerjoin(
                Deal,
                (Deal.id == ActivityTimeline.entity_id)
                & (ActivityTimeline.entity_type == "deal"),
            )
            .outerjoin(Company, Company.id == Lead.company_id)
            .outerjoin(Contact, Contact.id == Lead.contact_id)
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.id == conversation_id,
                ActivityTimeline.action.in_(
                    _CALL_ACTIONS + _MEETING_ACTIONS + _NOTE_ACTIONS
                ),
            )
        )
        stmt = self._rbac(stmt, ActivityTimeline.created_by, user_id, team_ids)
        stmt = stmt.limit(1)

        result = await self.db.execute(stmt)
        row = result.mappings().first()
        return dict(row) if row else None

    async def fetch_email_conversation_by_id(
        self,
        organization_id: UUID,
        user_id: Optional[UUID],
        team_ids: Optional[list[UUID]],
        conversation_id: UUID,
    ) -> Optional[dict[str, Any]]:
        """Fetch a single email conversation by ID (no full-table scan)."""
        owner_alias = aliased(User, name="owner_e")
        from app.models.email import GmailConnection

        stmt = (
            select(
                Email.id,
                Email.subject,
                Email.direction,
                Email.sender,
                Email.receiver,
                Email.body_preview,
                Email.sent_at,
                Email.is_read,
                Email.external_entity_type,
                Email.external_entity_id,
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                Deal.id.label("deal_id"),
                Deal.name.label("deal_name"),
                Deal.amount.label("deal_amount"),
                Company.name.label("company_name"),
                GmailConnection.user_id.label("owner_id"),
                owner_alias.full_name.label("owner_name"),
            )
            .outerjoin(
                GmailConnection,
                GmailConnection.id == Email.gmail_connection_id,
            )
            .outerjoin(owner_alias, owner_alias.id == GmailConnection.user_id)
            .outerjoin(
                Lead,
                (Lead.id == Email.external_entity_id)
                & (Email.external_entity_type == "lead"),
            )
            .outerjoin(
                Deal,
                (Deal.id == Email.external_entity_id)
                & (Email.external_entity_type == "deal"),
            )
            .outerjoin(Company, Company.id == Lead.company_id)
            .where(
                Email.organization_id == organization_id,
                Email.id == conversation_id,
            )
        )
        if user_id is not None and team_ids is None:
            stmt = stmt.where(GmailConnection.user_id == user_id)
        elif team_ids is not None:
            stmt = stmt.where(GmailConnection.user_id.in_(team_ids))
        stmt = stmt.limit(1)

        result = await self.db.execute(stmt)
        row = result.mappings().first()
        return dict(row) if row else None

    # ── Fetch email conversations ─────────────────────────────────────────────

    async def fetch_activity_conversations(
        self,
        organization_id: UUID,
        user_id: Optional[UUID],
        team_ids: Optional[list[UUID]],
        *,
        conversation_type: Optional[str] = None,
        lead_id: Optional[UUID] = None,
        company_id: Optional[UUID] = None,
        deal_id: Optional[UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        owner_alias = aliased(User, name="owner_u")

        stmt = (
            select(
                ActivityTimeline.id,
                ActivityTimeline.action,
                ActivityTimeline.title,
                ActivityTimeline.description,
                ActivityTimeline.created_at,
                ActivityTimeline.entity_type,
                ActivityTimeline.entity_id,
                ActivityTimeline.created_by,
                ActivityTimeline.payload,
                owner_alias.full_name.label("owner_name"),
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                LeadScore.overall_score.label("lead_score"),
                Deal.id.label("deal_id"),
                Deal.name.label("deal_name"),
                Deal.amount.label("deal_amount"),
                Deal.probability,
                Company.name.label("company_name"),
                Contact.first_name.label("contact_first"),
                Contact.last_name.label("contact_last"),
            )
            .outerjoin(owner_alias, owner_alias.id == ActivityTimeline.created_by)
            .outerjoin(
                Lead,
                (Lead.id == ActivityTimeline.entity_id)
                & (ActivityTimeline.entity_type == "lead"),
            )
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .outerjoin(
                Deal,
                (Deal.id == ActivityTimeline.entity_id)
                & (ActivityTimeline.entity_type == "deal"),
            )
            .outerjoin(Company, Company.id == Lead.company_id)
            .outerjoin(Contact, Contact.id == Lead.contact_id)
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.action.in_(
                    _CALL_ACTIONS + _MEETING_ACTIONS + _NOTE_ACTIONS
                ),
            )
        )

        stmt = self._rbac(stmt, ActivityTimeline.created_by, user_id, team_ids)

        if conversation_type:
            ct = conversation_type.lower()
            if ct == "call":
                stmt = stmt.where(ActivityTimeline.action.in_(_CALL_ACTIONS))
            elif ct == "meeting":
                stmt = stmt.where(ActivityTimeline.action.in_(_MEETING_ACTIONS))
            elif ct in ("note", "internal note", "customer note"):
                stmt = stmt.where(ActivityTimeline.action.in_(_NOTE_ACTIONS))

        if lead_id:
            stmt = stmt.where(
                ActivityTimeline.entity_id == lead_id,
                ActivityTimeline.entity_type == "lead",
            )
        if deal_id:
            stmt = stmt.where(
                ActivityTimeline.entity_id == deal_id,
                ActivityTimeline.entity_type == "deal",
            )
        if company_id:
            stmt = stmt.where(Company.id == company_id)
        if date_from:
            stmt = stmt.where(ActivityTimeline.created_at >= date_from)
        if date_to:
            stmt = stmt.where(ActivityTimeline.created_at <= date_to)

        stmt = stmt.order_by(ActivityTimeline.created_at.desc())
        if limit is not None:
            stmt = stmt.limit(limit)
        if offset is not None:
            stmt = stmt.offset(offset)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()
        return [dict(r) for r in rows]

    # ── Fetch email conversations ─────────────────────────────────────────────

    async def fetch_email_conversations(
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
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        owner_alias = aliased(User, name="owner_e")
        conn_alias  = aliased(User, name="conn_u")

        from app.models.email import GmailConnection

        stmt = (
            select(
                Email.id,
                Email.subject,
                Email.direction,
                Email.sender,
                Email.receiver,
                Email.body_preview,
                Email.sent_at,
                Email.is_read,
                Email.external_entity_type,
                Email.external_entity_id,
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                Deal.id.label("deal_id"),
                Deal.name.label("deal_name"),
                Deal.amount.label("deal_amount"),
                Company.name.label("company_name"),
                GmailConnection.user_id.label("owner_id"),
                owner_alias.full_name.label("owner_name"),
            )
            .outerjoin(
                GmailConnection,
                GmailConnection.id == Email.gmail_connection_id,
            )
            .outerjoin(owner_alias, owner_alias.id == GmailConnection.user_id)
            .outerjoin(
                Lead,
                (Lead.id == Email.external_entity_id)
                & (Email.external_entity_type == "lead"),
            )
            .outerjoin(
                Deal,
                (Deal.id == Email.external_entity_id)
                & (Email.external_entity_type == "deal"),
            )
            .outerjoin(Company, Company.id == Lead.company_id)
            .where(Email.organization_id == organization_id)
        )

        if user_id is not None and team_ids is None:
            stmt = stmt.where(GmailConnection.user_id == user_id)
        elif team_ids is not None:
            stmt = stmt.where(GmailConnection.user_id.in_(team_ids))

        if lead_id:
            stmt = stmt.where(
                Email.external_entity_id == lead_id,
                Email.external_entity_type == "lead",
            )
        if deal_id:
            stmt = stmt.where(
                Email.external_entity_id == deal_id,
                Email.external_entity_type == "deal",
            )
        if date_from:
            stmt = stmt.where(Email.sent_at >= date_from)
        if date_to:
            stmt = stmt.where(Email.sent_at <= date_to)

        stmt = stmt.order_by(Email.sent_at.desc())
        if limit is not None:
            stmt = stmt.limit(limit)
        if offset is not None:
            stmt = stmt.offset(offset)
        result = await self.db.execute(stmt)
        return [dict(r) for r in result.mappings().all()]

    # ── Per-entity signals for scoring ────────────────────────────────────────

    async def get_entity_signals(
        self,
        organization_id: UUID,
        entity_id: UUID,
        entity_type: str,
    ) -> dict[str, Any]:
        """
        Aggregated signals for a single entity (lead or deal).
        Used to compute engagement and quality scores.
        """
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        # Activity counts
        act_base = select(ActivityTimeline).where(
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.entity_id == entity_id,
            ActivityTimeline.entity_type == entity_type,
        )

        calls_stmt = select(func.count()).select_from(
            act_base.where(ActivityTimeline.action.in_(_CALL_ACTIONS)).subquery()
        )
        meetings_stmt = select(func.count()).select_from(
            act_base.where(ActivityTimeline.action.in_(_MEETING_ACTIONS)).subquery()
        )
        meetings_cancelled_stmt = select(func.count()).select_from(
            act_base.where(ActivityTimeline.action == "meeting_cancelled").subquery()
        )
        notes_stmt = select(func.count()).select_from(
            act_base.where(ActivityTimeline.action.in_(_NOTE_ACTIONS)).subquery()
        )
        recent_acts_stmt = select(func.count()).select_from(
            act_base.where(ActivityTimeline.created_at >= week_ago).subquery()
        )
        last_act_stmt = select(func.max(ActivityTimeline.created_at)).where(
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.entity_id == entity_id,
        )

        # Email signals
        email_total_stmt = select(func.count(Email.id)).where(
            Email.organization_id == organization_id,
            Email.external_entity_id == entity_id,
        )
        email_replies_stmt = select(func.count(Email.id)).where(
            Email.organization_id == organization_id,
            Email.external_entity_id == entity_id,
            Email.direction == "inbound",
        )

        async def _sc(stmt) -> int:
            r = await self.db.execute(stmt)
            return int(r.scalar_one() or 0)

        async def _sf(stmt):
            r = await self.db.execute(stmt)
            return r.scalar_one()

        calls             = await _sc(calls_stmt)
        meetings          = await _sc(meetings_stmt)
        meetings_cancelled= await _sc(meetings_cancelled_stmt)
        notes             = await _sc(notes_stmt)
        recent_acts       = await _sc(recent_acts_stmt)
        last_at           = await _sf(last_act_stmt)
        email_total       = await _sc(email_total_stmt)
        email_replies     = await _sc(email_replies_stmt)

        days_since_last = (
            max(0, (now - (last_at.replace(tzinfo=timezone.utc) if last_at.tzinfo is None else last_at)).days)
            if last_at else 999
        )

        return {
            "calls": calls,
            "meetings": meetings,
            "meetings_attended": max(0, meetings - meetings_cancelled),
            "meetings_cancelled": meetings_cancelled,
            "notes": notes,
            "recent_acts": recent_acts,
            "email_total": email_total,
            "email_replies": email_replies,
            "days_since_last": days_since_last,
            "last_activity_at": last_at,
        }

    # ── Summary aggregations ──────────────────────────────────────────────────

    async def get_entity_signals_batch(
        self,
        organization_id: UUID,
        entities: list[tuple[UUID, str]],
    ) -> dict[UUID, dict[str, Any]]:
        """
        Batch-fetch aggregated signals for multiple entities in fewer queries.
        Returns a dict mapping entity_id -> signals dict.
        """
        if not entities:
            return {}

        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        # Collect entity IDs by type
        lead_ids = [eid for eid, etype in entities if etype == "lead"]
        deal_ids = [eid for eid, etype in entities if etype == "deal"]
        all_ids = [eid for eid, _ in entities]

        result: dict[UUID, dict[str, Any]] = {}
        empty_sig = {
            "calls": 0, "meetings": 0, "meetings_attended": 0,
            "meetings_cancelled": 0, "notes": 0, "recent_acts": 0,
            "email_total": 0, "email_replies": 0, "days_since_last": 999,
            "last_activity_at": None,
        }
        for eid in all_ids:
            result[eid] = dict(empty_sig)

        if not all_ids:
            return result

        # Batch activity counts using a single GROUP BY query
        act_stmt = (
            select(
                ActivityTimeline.entity_id,
                func.count().filter(ActivityTimeline.action.in_(_CALL_ACTIONS)).label("calls"),
                func.count().filter(ActivityTimeline.action.in_(_MEETING_ACTIONS)).label("meetings"),
                func.count().filter(ActivityTimeline.action == "meeting_cancelled").label("meetings_cancelled"),
                func.count().filter(ActivityTimeline.action.in_(_NOTE_ACTIONS)).label("notes"),
                func.count().filter(ActivityTimeline.created_at >= week_ago).label("recent_acts"),
                func.max(ActivityTimeline.created_at).label("last_act_at"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.entity_id.in_(all_ids),
            )
            .group_by(ActivityTimeline.entity_id)
        )
        act_result = await self.db.execute(act_stmt)
        for row in act_result:
            eid = row.entity_id
            if eid in result:
                result[eid]["calls"] = int(row.calls or 0)
                result[eid]["meetings"] = int(row.meetings or 0)
                result[eid]["meetings_cancelled"] = int(row.meetings_cancelled or 0)
                result[eid]["meetings_attended"] = max(0, int(row.meetings or 0) - int(row.meetings_cancelled or 0))
                result[eid]["notes"] = int(row.notes or 0)
                result[eid]["recent_acts"] = int(row.recent_acts or 0)
                last_at = row.last_act_at
                if last_at:
                    result[eid]["last_activity_at"] = last_at
                    result[eid]["days_since_last"] = max(0, (now - (last_at.replace(tzinfo=timezone.utc) if last_at.tzinfo is None else last_at)).days)

        # Batch email counts using a single GROUP BY query
        if all_ids:
            email_stmt = (
                select(
                    Email.external_entity_id,
                    func.count(Email.id).label("email_total"),
                    func.count(Email.id).filter(Email.direction == "inbound").label("email_replies"),
                )
                .where(
                    Email.organization_id == organization_id,
                    Email.external_entity_id.in_(all_ids),
                )
                .group_by(Email.external_entity_id)
            )
            email_result = await self.db.execute(email_stmt)
            for row in email_result:
                eid = row.external_entity_id
                if eid in result:
                    result[eid]["email_total"] = int(row.email_total or 0)
                    result[eid]["email_replies"] = int(row.email_replies or 0)

        return result

    # ── Summary aggregations ──────────────────────────────────────────────────

    async def get_summary_counts(
        self,
        organization_id: UUID,
        user_id: Optional[UUID],
        team_ids: Optional[list[UUID]],
    ) -> dict[str, Any]:
        def _base_act(*extra):
            q = select(func.count(ActivityTimeline.id)).where(
                ActivityTimeline.organization_id == organization_id, *extra
            )
            if user_id is not None and team_ids is None:
                q = q.where(ActivityTimeline.created_by == user_id)
            elif team_ids is not None:
                q = q.where(ActivityTimeline.created_by.in_(team_ids))
            return q

        def _base_email(*extra):
            from app.models.email import GmailConnection
            q = (
                select(func.count(Email.id))
                .outerjoin(GmailConnection, GmailConnection.id == Email.gmail_connection_id)
                .where(Email.organization_id == organization_id, *extra)
            )
            if user_id is not None and team_ids is None:
                q = q.where(GmailConnection.user_id == user_id)
            elif team_ids is not None:
                q = q.where(GmailConnection.user_id.in_(team_ids))
            return q

        async def _cnt(stmt) -> int:
            r = await self.db.execute(stmt)
            return int(r.scalar_one() or 0)

        calls    = await _cnt(_base_act(ActivityTimeline.action.in_(_CALL_ACTIONS)))
        meetings = await _cnt(_base_act(ActivityTimeline.action.in_(_MEETING_ACTIONS)))
        notes    = await _cnt(_base_act(ActivityTimeline.action.in_(_NOTE_ACTIONS)))
        emails   = await _cnt(_base_email())
        total    = calls + meetings + notes + emails

        # Count distinct entities with buying-signal keywords in activity titles
        buying_signal_keywords = [
            "%pric%", "%budget%", "%demo%", "%proposal%",
            "%timeline%", "%security%", "%contract%", "%decision%",
        ]
        buying_acts_stmt = select(func.count(ActivityTimeline.id)).where(
            ActivityTimeline.organization_id == organization_id,
            or_(*[ActivityTimeline.description.ilike(k) for k in buying_signal_keywords]),
        )
        buying_signals = await _cnt(buying_acts_stmt)

        # Open actions: activity-based tasks not closed
        open_actions_stmt = _base_act(
            ActivityTimeline.action.in_(["task", "task_created"]),
        )
        open_actions = await _cnt(open_actions_stmt)

        return {
            "total_conversations": total,
            "calls": calls,
            "meetings": meetings,
            "emails": emails,
            "notes": notes,
            "buying_signals": buying_signals,
            "open_actions": open_actions,
        }

    # ── No-response entities (7+ days) ───────────────────────────────────────

    async def get_no_response_entities(
        self,
        organization_id: UUID,
        user_id: Optional[UUID],
        team_ids: Optional[list[UUID]],
        days: int = 7,
    ) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(days=days)
        owner_alias = aliased(User, name="owner_nr")

        stmt = (
            select(
                Lead.id.label("lead_id"),
                Lead.title.label("lead_name"),
                owner_alias.full_name.label("owner_name"),
                func.max(ActivityTimeline.created_at).label("last_at"),
            )
            .outerjoin(owner_alias, owner_alias.id == Lead.owner_id)
            .outerjoin(
                ActivityTimeline,
                (ActivityTimeline.entity_id == Lead.id)
                & (ActivityTimeline.entity_type == "lead"),
            )
            .where(
                Lead.organization_id == organization_id,
                Lead.is_active.is_(True),
                Lead.is_deleted.is_(False),
                Lead.status.notin_(["won", "lost", "converted"]),
            )
            .group_by(Lead.id, Lead.title, owner_alias.full_name)
            .having(
                or_(
                    func.max(ActivityTimeline.created_at).is_(None),
                    func.max(ActivityTimeline.created_at) < threshold,
                )
            )
            .limit(20)
        )

        if user_id is not None and team_ids is None:
            stmt = stmt.where(Lead.owner_id == user_id)
        elif team_ids is not None:
            stmt = stmt.where(Lead.owner_id.in_(team_ids))

        result = await self.db.execute(stmt)
        return [dict(r) for r in result.mappings().all()]
