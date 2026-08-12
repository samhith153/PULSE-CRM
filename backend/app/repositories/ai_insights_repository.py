"""
AI Insights Repository
All SQL aggregations for the AI Action Center.
Uses indexed columns: lead.score, deal.probability, deal.amount,
activity.created_at, deal.expected_close_date, deal.owner_id.
No N+1 queries.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import case, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.activity import ActivityTimeline
from app.models.company import Company
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.lead_score import LeadScore
from app.models.user import User
from app.utils.enums import DealStatus


# ── thresholds (no hardcoded business values — all configurable here) ─────────
HIGH_VALUE_LEAD_SCORE     = 90
HIGH_VALUE_DEAL_AMOUNT    = Decimal("100_000")
HIGH_PROB_THRESHOLD       = 80
NO_ACTIVITY_DAYS          = 3
OVERDUE_FOLLOWUP_FLAG     = True   # uses expected_close_date as proxy
RISK_INACTIVE_DAYS        = 14
RISK_LOW_PROB             = 20
SUPER_HIGH_VALUE_DEAL     = Decimal("500_000")
NOTIFICATION_LEAD_SCORE   = 90
NOTIFICATION_DEAL_AMOUNT  = Decimal("1_000_000")
NOTIFICATION_HEALTH_DROP  = 70


class AIInsightsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── helpers ───────────────────────────────────────────────────────────────

    def _open_deals(self, organization_id: UUID, *extra):
        return [
            Deal.organization_id == organization_id,
            Deal.is_active.is_(True),
            Deal.is_deleted.is_(False),
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            *extra,
        ]

    def _active_leads(self, organization_id: UUID, *extra):
        return [
            Lead.organization_id == organization_id,
            Lead.is_active.is_(True),
            Lead.is_deleted.is_(False),
            *extra,
        ]

    def _team_filter(self, stmt, col, user_id, team_ids):
        if user_id is not None and team_ids is None:
            return stmt.where(col == user_id)
        if team_ids is not None:
            return stmt.where(col.in_(team_ids))
        return stmt

    # ── 1. Immediate Actions ──────────────────────────────────────────────────

    async def get_immediate_actions(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> list[dict[str, Any]]:
        """
        High-value leads/deals needing urgent attention:
        Lead.score >= 90, OR Deal.amount >= 1L, OR probability > 80%
        AND last activity > 3 days ago OR expected_close_date overdue.
        """
        now = datetime.now(timezone.utc)
        stale_threshold = now - timedelta(days=NO_ACTIVITY_DAYS)
        owner = aliased(User, name="owner_user")

        # Latest activity per deal (subquery)
        last_act = (
            select(
                ActivityTimeline.entity_id,
                func.max(ActivityTimeline.created_at).label("last_activity_at"),
            )
            .where(ActivityTimeline.organization_id == organization_id)
            .group_by(ActivityTimeline.entity_id)
            .subquery()
        )

        stmt = (
            select(
                Deal.id,
                Deal.name,
                Deal.amount,
                Deal.probability,
                Deal.status,
                Deal.expected_close_date,
                Lead.title.label("lead_title"),
                LeadScore.overall_score.label("lead_score"),
                owner.full_name.label("owner_name"),
                last_act.c.last_activity_at,
            )
            .outerjoin(owner, owner.id == Deal.owner_id)
            .outerjoin(Lead, Lead.id == Deal.lead_id)
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .outerjoin(last_act, last_act.c.entity_id == Deal.id)
            .where(
                *self._open_deals(organization_id),
                or_(
                    LeadScore.overall_score >= HIGH_VALUE_LEAD_SCORE,
                    Deal.amount >= HIGH_VALUE_DEAL_AMOUNT,
                    Deal.probability >= HIGH_PROB_THRESHOLD,
                ),
            )
            .order_by(LeadScore.overall_score.desc().nullslast(), Deal.amount.desc().nullslast())
            .limit(20)
        )
        stmt = self._team_filter(stmt, Deal.owner_id, user_id, team_ids)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()

        actions = []
        for r in rows:
            last_act_at = r["last_activity_at"]
            is_stale = (last_act_at is None) or (
                last_act_at.replace(tzinfo=timezone.utc) < stale_threshold
                if last_act_at.tzinfo is None
                else last_act_at < stale_threshold
            )
            is_overdue = (
                r["expected_close_date"] is not None
                and r["expected_close_date"] < now.date()
            )
            if not (is_stale or is_overdue):
                continue

            score = r["lead_score"] or 0
            amount = Decimal(str(r["amount"] or 0))
            prob   = r["probability"] or 0

            if score >= 90 or amount >= HIGH_VALUE_DEAL_AMOUNT * 10:
                priority = "P1"
            elif amount >= HIGH_VALUE_DEAL_AMOUNT or prob >= HIGH_PROB_THRESHOLD:
                priority = "Critical"
            elif prob >= 60:
                priority = "High"
            else:
                priority = "Medium"

            reasons = []
            if score >= HIGH_VALUE_LEAD_SCORE:
                reasons.append(f"Lead score {score} — high quality prospect")
            if amount >= HIGH_VALUE_DEAL_AMOUNT:
                reasons.append(f"High-value deal ₹{int(amount):,}")
            if prob >= HIGH_PROB_THRESHOLD:
                reasons.append(f"Win probability {prob}%")
            if is_stale:
                days_stale = (now - (last_act_at.replace(tzinfo=timezone.utc) if last_act_at and last_act_at.tzinfo is None else last_act_at or now - timedelta(days=999))).days
                reasons.append(f"No activity for {days_stale} day(s)")
            if is_overdue:
                reasons.append("Expected close date passed")

            actions.append({
                "id": r["id"],
                "lead_name": r["lead_title"] or r["name"],
                "deal_name": r["name"],
                "score": score,
                "priority": priority,
                "reason": ". ".join(reasons),
                "deal_value": float(amount),
                "probability": prob,
                "owner_name": r["owner_name"],
                "last_activity_at": last_act_at,
            })
        return actions

    # ── 2. Follow-ups due ─────────────────────────────────────────────────────

    async def get_overdue_followups(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> list[dict[str, Any]]:
        """Deals past expected_close_date and still open."""
        now = datetime.now(timezone.utc)
        owner = aliased(User, name="owner_user")
        comp  = aliased(Company, name="comp")

        stmt = (
            select(
                Deal.id,
                Deal.name,
                Deal.amount,
                Deal.probability,
                Deal.expected_close_date,
                comp.name.label("company_name"),
                owner.full_name.label("owner_name"),
            )
            .outerjoin(owner, owner.id == Deal.owner_id)
            .outerjoin(comp,  comp.id  == Deal.company_id)
            .where(
                *self._open_deals(organization_id),
                Deal.expected_close_date.isnot(None),
                Deal.expected_close_date < now.date(),
            )
            .order_by(Deal.expected_close_date.asc())
            .limit(50)
        )
        stmt = self._team_filter(stmt, Deal.owner_id, user_id, team_ids)
        result = await self.db.execute(stmt)

        followups = []
        for r in result.mappings().all():
            days_overdue = (now.date() - r["expected_close_date"]).days
            followups.append({
                "id": r["id"],
                "company": r["company_name"] or r["name"],
                "deal_name": r["name"],
                "days_overdue": days_overdue,
                "deal_value": float(Decimal(str(r["amount"] or 0))),
                "probability": r["probability"],
                "owner_name": r["owner_name"],
            })
        return followups

    # ── 3. Pipeline health components ─────────────────────────────────────────

    async def get_pipeline_health_components(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, float]:
        """Returns raw component values for health score calculation."""
        now = datetime.now(timezone.utc)
        month_ago = now - timedelta(days=30)

        def _deal_base(*extra):
            return [
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                *extra,
            ]

        # Build all statements (independent of each other)
        lq_stmt = (
            select(func.coalesce(func.avg(LeadScore.overall_score), 0))
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .where(*self._active_leads(organization_id))
        )
        ap_stmt = select(func.coalesce(func.avg(Deal.probability), 0)).where(
            *self._open_deals(organization_id)
        )
        act_stmt = select(func.count(ActivityTimeline.id)).where(
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.created_at >= month_ago,
        )
        open_pipe_stmt = select(func.coalesce(func.sum(Deal.amount), 0)).where(
            *self._open_deals(organization_id)
        )
        won_rev_stmt = select(func.coalesce(func.sum(Deal.amount), 1)).where(
            *_deal_base(Deal.status == DealStatus.WON.value)
        )
        won_stmt = select(func.count(Deal.id)).where(*_deal_base(Deal.status == DealStatus.WON.value))
        lost_stmt = select(func.count(Deal.id)).where(*_deal_base(Deal.status == DealStatus.LOST.value))

        # Run all 7 queries concurrently
        _lq, _ap, _ra, _op, _wr, _w, _l = await asyncio.gather(
            self.db.execute(lq_stmt),
            self.db.execute(ap_stmt),
            self.db.execute(act_stmt),
            self.db.execute(open_pipe_stmt),
            self.db.execute(won_rev_stmt),
            self.db.execute(won_stmt),
            self.db.execute(lost_stmt),
        )

        # Post-process
        lead_quality = float(_lq.scalar_one() or 0)
        avg_prob = float(_ap.scalar_one() or 0)
        raw_act = float(_ra.scalar_one() or 0)
        recent_activities = min(raw_act / max(raw_act, 1) * 100, 100) if raw_act > 0 else 0
        open_pipe = float(_op.scalar_one() or 0)
        won_rev = float(_wr.scalar_one() or 1)
        coverage_ratio = min((open_pipe / (won_rev * 1.2)) * 100, 100)
        won = float(_w.scalar_one() or 0)
        lost = float(_l.scalar_one() or 0)
        win_rate = (won / max(won + lost, 1)) * 100

        return {
            "lead_quality": lead_quality,
            "avg_probability": avg_prob,
            "recent_activities": recent_activities,
            "pipeline_coverage": coverage_ratio,
            "win_rate": win_rate,
        }

    # ── 4. Daily summary counts ───────────────────────────────────────────────

    async def get_daily_summary(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> dict[str, int]:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = today_start + timedelta(days=7)

        def _base(*extra):
            q = select(func.count(Deal.id)).where(
                Deal.organization_id == organization_id,
                Deal.is_active.is_(True),
                Deal.is_deleted.is_(False),
                *extra,
            )
            if user_id is not None and team_ids is None:
                q = q.where(Deal.owner_id == user_id)
            elif team_ids is not None:
                q = q.where(Deal.owner_id.in_(team_ids))
            return q

        # Build all 6 statements (independent)
        urgent_stmt = _base(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.probability >= HIGH_PROB_THRESHOLD,
        )
        overdue_stmt = _base(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.expected_close_date < now.date(),
        )
        closing_stmt = _base(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.expected_close_date >= today_start.date(),
            Deal.expected_close_date < week_end.date(),
        )
        high_val_stmt = _base(
            Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.amount >= SUPER_HIGH_VALUE_DEAL,
        )
        act_base = select(func.count(ActivityTimeline.id)).where(
            ActivityTimeline.organization_id == organization_id,
            ActivityTimeline.created_at >= today_start,
        )
        meetings_stmt = act_base.where(ActivityTimeline.action.in_(["meeting", "meeting_scheduled"]))
        calls_stmt = act_base.where(ActivityTimeline.action.in_(["call", "call_logged"]))

        # Run all 6 queries concurrently
        _urg, _ovd, _clo, _hv, _mtg, _cal = await asyncio.gather(
            self.db.execute(urgent_stmt),
            self.db.execute(overdue_stmt),
            self.db.execute(closing_stmt),
            self.db.execute(high_val_stmt),
            self.db.execute(meetings_stmt),
            self.db.execute(calls_stmt),
        )

        return {
            "urgent_deals": int(_urg.scalar_one() or 0),
            "follow_ups": int(_ovd.scalar_one() or 0),
            "meetings": int(_mtg.scalar_one() or 0),
            "calls": int(_cal.scalar_one() or 0),
            "closing_this_week": int(_clo.scalar_one() or 0),
            "high_value_opportunities": int(_hv.scalar_one() or 0),
        }

    # ── 5. High-value deals ───────────────────────────────────────────────────

    async def get_high_value_deals(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
        min_amount: Decimal = SUPER_HIGH_VALUE_DEAL,
    ) -> list[dict[str, Any]]:
        owner = aliased(User, name="owner_user")
        stmt = (
            select(
                Deal.id,
                Deal.name,
                Deal.amount,
                Deal.probability,
                Deal.status,
                Deal.expected_close_date,
                owner.full_name.label("owner_name"),
            )
            .outerjoin(owner, owner.id == Deal.owner_id)
            .where(
                *self._open_deals(organization_id),
                Deal.amount >= min_amount,
            )
            .order_by(Deal.amount.desc())
            .limit(20)
        )
        stmt = self._team_filter(stmt, Deal.owner_id, user_id, team_ids)
        result = await self.db.execute(stmt)
        return [
            {
                "id": r["id"],
                "deal": r["name"],
                "value": float(Decimal(str(r["amount"] or 0))),
                "probability": r["probability"],
                "status": r["status"],
                "expected_close_date": r["expected_close_date"],
                "owner_name": r["owner_name"],
            }
            for r in result.mappings().all()
        ]

    # ── 6. Risk detection ─────────────────────────────────────────────────────

    async def get_risky_deals(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
    ) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        stale_threshold = now - timedelta(days=RISK_INACTIVE_DAYS)

        last_act = (
            select(
                ActivityTimeline.entity_id,
                func.max(ActivityTimeline.created_at).label("last_at"),
            )
            .where(ActivityTimeline.organization_id == organization_id)
            .group_by(ActivityTimeline.entity_id)
            .subquery()
        )
        owner = aliased(User, name="owner_user")
        stmt = (
            select(
                Deal.id,
                Deal.name,
                Deal.amount,
                Deal.probability,
                Deal.expected_close_date,
                owner.full_name.label("owner_name"),
                last_act.c.last_at,
            )
            .outerjoin(owner,    owner.id   == Deal.owner_id)
            .outerjoin(last_act, last_act.c.entity_id == Deal.id)
            .where(
                *self._open_deals(organization_id),
                or_(
                    last_act.c.last_at.is_(None),
                    last_act.c.last_at < stale_threshold,
                    Deal.probability < RISK_LOW_PROB,
                    Deal.expected_close_date < now.date(),
                ),
            )
            .order_by(Deal.probability.asc())
            .limit(30)
        )
        stmt = self._team_filter(stmt, Deal.owner_id, user_id, team_ids)
        result = await self.db.execute(stmt)

        risks = []
        for r in result.mappings().all():
            risk_factors = []
            risk_level = "Low"
            last_at = r["last_at"]
            if last_at is None:
                risk_factors.append("No activity recorded")
                risk_level = "Critical"
            else:
                la = last_at.replace(tzinfo=timezone.utc) if last_at.tzinfo is None else last_at
                if la < stale_threshold:
                    days = (now - la).days
                    risk_factors.append(f"No activity for {days} days")
                    risk_level = "High" if risk_level == "Low" else risk_level
            if r["probability"] is not None and r["probability"] < RISK_LOW_PROB:
                risk_factors.append(f"Low probability ({r['probability']}%)")
                risk_level = "Critical"
            if r["expected_close_date"] and r["expected_close_date"] < now.date():
                days_past = (now.date() - r["expected_close_date"]).days
                risk_factors.append(f"Close date missed by {days_past} days")
                risk_level = "High" if risk_level == "Low" else risk_level

            risks.append({
                "id": r["id"],
                "deal_name": r["name"],
                "deal_value": float(Decimal(str(r["amount"] or 0))),
                "probability": r["probability"],
                "risk_level": risk_level,
                "risk_factors": risk_factors,
                "owner_name": r["owner_name"],
                "last_activity_at": last_at,
            })
        return risks

    # ── 7. Opportunity scores ─────────────────────────────────────────────────

    async def get_opportunity_scores(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
        limit: int = 15,
    ) -> list[dict[str, Any]]:
        """
        Formula: Lead Score 40% + Probability 30% + Recent Activity 20% + Deal Size 10%
        All normalized 0-100.
        """
        now = datetime.now(timezone.utc)
        recent_threshold = now - timedelta(days=7)

        last_act = (
            select(
                ActivityTimeline.entity_id,
                func.count(ActivityTimeline.id).label("act_count"),
            )
            .where(
                ActivityTimeline.organization_id == organization_id,
                ActivityTimeline.created_at >= recent_threshold,
            )
            .group_by(ActivityTimeline.entity_id)
            .subquery()
        )

        max_amount_sub = (
            select(func.coalesce(func.max(Deal.amount), 1))
            .where(*self._open_deals(organization_id))
            .scalar_subquery()
        )

        owner = aliased(User, name="owner_user")
        stmt = (
            select(
                Deal.id,
                Deal.name,
                Deal.amount,
                Deal.probability,
                LeadScore.overall_score.label("lead_score"),
                owner.full_name.label("owner_name"),
                func.coalesce(last_act.c.act_count, 0).label("act_count"),
                max_amount_sub.label("max_amount"),
            )
            .outerjoin(owner,    owner.id   == Deal.owner_id)
            .outerjoin(Lead,     Lead.id    == Deal.lead_id)
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .outerjoin(last_act, last_act.c.entity_id == Deal.id)
            .where(*self._open_deals(organization_id))
            .limit(100)
        )
        stmt = self._team_filter(stmt, Deal.owner_id, user_id, team_ids)
        result = await self.db.execute(stmt)
        rows = result.mappings().all()

        scored = []
        for r in rows:
            lead_sc  = float(r["lead_score"] or 50)
            prob_sc  = float(r["probability"] or 0)
            act_raw  = float(r["act_count"] or 0)
            act_sc   = min(act_raw / 5 * 100, 100)   # 5 activities = 100
            max_amt  = float(r["max_amount"] or 1)
            amt_sc   = (float(r["amount"] or 0) / max_amt) * 100

            opp_score = (
                lead_sc * 0.40
                + prob_sc * 0.30
                + act_sc  * 0.20
                + amt_sc  * 0.10
            )
            scored.append({
                "id": r["id"],
                "deal_name": r["name"],
                "opportunity_score": round(opp_score),
                "lead_score": int(lead_sc),
                "probability": int(prob_sc),
                "deal_value": float(r["amount"] or 0),
                "owner_name": r["owner_name"],
            })

        scored.sort(key=lambda x: x["opportunity_score"], reverse=True)
        return scored[:limit]

    # ── 8. Notifications ──────────────────────────────────────────────────────

    async def get_notification_triggers(
        self,
        organization_id: UUID,
        user_id: UUID | None,
        team_ids: list[UUID] | None,
        current_health_score: float,
    ) -> list[dict[str, Any]]:
        now = datetime.now(timezone.utc)
        notifications = []

        # Overdue follow-ups
        overdue_count_stmt = select(func.count(Deal.id)).where(
            *self._open_deals(organization_id),
            Deal.expected_close_date < now.date(),
        )
        overdue_count = int((await self.db.execute(overdue_count_stmt)).scalar_one() or 0)
        if overdue_count:
            notifications.append({
                "type": "overdue_followup",
                "severity": "high",
                "message": f"{overdue_count} follow-up(s) are overdue.",
            })

        # High-score leads
        hs_stmt = (
            select(func.count(Lead.id))
            .outerjoin(LeadScore, LeadScore.lead_id == Lead.id)
            .where(
                *self._active_leads(organization_id),
                LeadScore.overall_score >= NOTIFICATION_LEAD_SCORE,
            )
        )
        hs_count = int((await self.db.execute(hs_stmt)).scalar_one() or 0)
        if hs_count:
            notifications.append({
                "type": "high_score_lead",
                "severity": "medium",
                "message": f"{hs_count} lead(s) scored ≥{NOTIFICATION_LEAD_SCORE} — immediate attention needed.",
            })

        # Very high-value open deals
        hvd_stmt = select(func.count(Deal.id)).where(
            *self._open_deals(organization_id),
            Deal.amount >= NOTIFICATION_DEAL_AMOUNT,
        )
        hvd_count = int((await self.db.execute(hvd_stmt)).scalar_one() or 0)
        if hvd_count:
            notifications.append({
                "type": "high_value_deal",
                "severity": "critical",
                "message": f"{hvd_count} deal(s) valued ≥₹{int(NOTIFICATION_DEAL_AMOUNT):,} require attention.",
            })

        # Pipeline health drop
        if current_health_score < NOTIFICATION_HEALTH_DROP:
            notifications.append({
                "type": "pipeline_health_drop",
                "severity": "critical",
                "message": f"Pipeline Health dropped to {current_health_score:.0f} — below threshold of {NOTIFICATION_HEALTH_DROP}.",
            })

        # Close dates missed today
        missed_stmt = select(func.count(Deal.id)).where(
            *self._open_deals(organization_id),
            Deal.expected_close_date == now.date(),
        )
        missed_count = int((await self.db.execute(missed_stmt)).scalar_one() or 0)
        if missed_count:
            notifications.append({
                "type": "close_date_today",
                "severity": "high",
                "message": f"{missed_count} deal(s) expected to close today.",
            })

        return notifications
