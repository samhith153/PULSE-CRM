"""
Going Cold Service
Full cold-score calculation, risk classification, trend analysis,
recommendation engine, and dashboard KPIs.

Formula weights:
  No Activity Days   30%
  Missed Follow-ups  20%
  No Email Replies   15%
  Missed Meetings    15%
  Probability Drop   10%
  Deal Aging         10%
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.going_cold_repository import (
    GoingColdRepository,
    _DEAL_AGE_SCORES,
    _INACTIVITY_SCORES,
)
from app.schemas.ai_insights import (
    ColdLeadItem,
    ColdScoreComponents,
    GoingColdListResponse,
    GoingColdNotification,
    GoingColdSummaryResponse,
    TrendAnalysis,
)

# ── Risk classification ───────────────────────────────────────────────────────
def _classify_risk(score: int) -> str:
    if score >= 90:
        return "Critical"
    if score >= 75:
        return "High Risk"
    if score >= 50:
        return "Medium Risk"
    if score >= 25:
        return "Low Risk"
    return "Healthy"

# ── Score lookup ──────────────────────────────────────────────────────────────
def _table_score(value: int, table: list[tuple]) -> float:
    for lo, hi, sc in table:
        if lo <= value <= hi:
            return float(sc)
    return 0.0

# ── Trend analysis ────────────────────────────────────────────────────────────
def _compute_trend(acts_7d: int, acts_prev7d: int) -> TrendAnalysis:
    if acts_prev7d == 0:
        pct = 0.0
        trend = "Stable"
    else:
        pct = ((acts_7d - acts_prev7d) / acts_prev7d) * 100
        if pct <= -10:
            trend = "Declining"
        elif pct >= 10:
            trend = "Improving"
        else:
            trend = "Stable"
    sign = "+" if pct >= 0 else ""
    return TrendAnalysis(
        trend=trend,
        change=f"{sign}{pct:.0f}%",
        current_period_activities=acts_7d,
        previous_period_activities=acts_prev7d,
    )


class GoingColdService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = GoingColdRepository(db)

    # ── RBAC scope ────────────────────────────────────────────────────────────

    async def _scope(self, user: User) -> tuple[UUID | None, list[UUID] | None]:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles:
            return None, None
        # sales_rep: own leads only
        if "sales_rep" in roles and "manager" not in roles:
            return user.id, None
        # manager: full org team
        stmt = select(User.id).where(
            User.organization_id == user.organization_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        team_ids = [r[0] for r in result.all()]
        return None, team_ids

    # ── Score calculator ──────────────────────────────────────────────────────

    def _calculate_cold_score(
        self, row: dict[str, Any], now: datetime
    ) -> tuple[int, ColdScoreComponents]:
        """
        Returns (cold_score 0-100, ColdScoreComponents)
        """
        # ── Factor 1: No-activity days (30%) ─────────────────────────────
        last_at = row.get("last_activity_at")
        if last_at is None:
            days_inactive = 999
        else:
            if last_at.tzinfo is None:
                last_at = last_at.replace(tzinfo=timezone.utc)
            days_inactive = max(0, (now - last_at).days)
        act_raw = _table_score(days_inactive, _INACTIVITY_SCORES)

        # ── Factor 2: Missed follow-ups (20%) ─────────────────────────────
        overdue = int(row.get("overdue_followups") or 0)
        followup_raw = min(overdue * 25.0, 100.0)   # 4+ overdue = 100

        # ── Factor 3: No email replies (15%) ──────────────────────────────
        email_count = int(row.get("email_count") or 0)
        email_replies = int(row.get("email_replies") or 0)
        email_opens = int(row.get("email_opens") or 0)
        if email_count == 0:
            email_raw = 50.0   # no emails = neutral / slightly cold
        elif email_replies > 0:
            email_raw = max(0.0, 50.0 - (email_replies * 20.0))   # replies reduce cold
        elif email_opens > 0:
            email_raw = 60.0   # opened but no reply
        else:
            email_raw = 100.0  # ignored emails

        # ── Factor 4: Missed meetings (15%) ───────────────────────────────
        meetings_cancelled = int(row.get("meetings_cancelled") or 0)
        meetings_completed = int(row.get("meetings_completed") or 0)
        if meetings_cancelled > 0 and meetings_completed == 0:
            meeting_raw = min(meetings_cancelled * 35.0, 100.0)
        elif meetings_completed > 0:
            meeting_raw = max(0.0, 30.0 - (meetings_completed * 15.0))
        else:
            meeting_raw = 40.0  # no meeting data = mildly cold

        # ── Factor 5: Probability drop (10%) ──────────────────────────────
        prob = int(row.get("probability") or 50)
        if prob >= 70:
            prob_raw = 0.0
        elif prob >= 50:
            prob_raw = 20.0
        elif prob >= 30:
            prob_raw = 50.0    # ~25% below typical
        elif prob >= 10:
            prob_raw = 80.0    # ~40% drop
        else:
            prob_raw = 100.0   # critical

        # ── Factor 6: Deal aging (10%) ────────────────────────────────────
        deal_created = row.get("deal_created_at") or row.get("lead_created_at")
        if deal_created is None:
            age_days = 0
        else:
            if deal_created.tzinfo is None:
                deal_created = deal_created.replace(tzinfo=timezone.utc)
            age_days = max(0, (now - deal_created).days)
        aging_raw = _table_score(age_days, _DEAL_AGE_SCORES)

        # ── Weighted sum ──────────────────────────────────────────────────
        cold_score = (
            act_raw      * 0.30
            + followup_raw * 0.20
            + email_raw    * 0.15
            + meeting_raw  * 0.15
            + prob_raw     * 0.10
            + aging_raw    * 0.10
        )
        cold_score = int(round(min(cold_score, 100)))

        components = ColdScoreComponents(
            no_activity_days_score=round(act_raw, 1),
            missed_followups_score=round(followup_raw, 1),
            no_email_replies_score=round(email_raw, 1),
            missed_meetings_score=round(meeting_raw, 1),
            probability_drop_score=round(prob_raw, 1),
            deal_aging_score=round(aging_raw, 1),
        )
        return cold_score, components

    # ── Warning indicators ────────────────────────────────────────────────────

    def _warning_indicators(
        self, row: dict, days_inactive: int, cold_score: int, now: datetime
    ) -> list[str]:
        warnings: list[str] = []
        if days_inactive >= 14:
            warnings.append(f"No interaction for {days_inactive} days")
        if int(row.get("email_count") or 0) > 0 and int(row.get("email_replies") or 0) == 0:
            warnings.append("Proposal/email sent — no response received")
        if int(row.get("overdue_followups") or 0) > 0:
            warnings.append(f"{row['overdue_followups']} overdue follow-up(s)")
        if int(row.get("meetings_cancelled") or 0) >= 2:
            warnings.append(f"Meeting cancelled {row['meetings_cancelled']} time(s)")
        if int(row.get("email_replies") or 0) == 0 and int(row.get("email_count") or 0) >= 2:
            warnings.append("Customer stopped replying to emails")
        prob = int(row.get("probability") or 50)
        if prob < 30:
            warnings.append(f"Deal probability dropped to {prob}%")
        return warnings

    # ── Recovery recommendation engine ───────────────────────────────────────

    def _recommend(
        self,
        cold_score: int,
        days_inactive: int,
        overdue: int,
        email_replies: int,
        meetings_cancelled: int,
        meetings_completed: int,
        probability: int,
        lead_score: int,
        deal_value: float,
    ) -> str:
        """
        Fully dynamic — recommendation depends on detected risk factors.
        No hardcoded generic strings — context drives every suggestion.
        """
        if cold_score >= 90:
            if days_inactive >= 21:
                return "Schedule an executive call immediately — no contact in 3+ weeks."
            if overdue >= 3:
                return f"Escalate to Sales Manager — {overdue} follow-ups overdue."
            if meetings_cancelled >= 2:
                return "Re-engage through LinkedIn or email campaign; repeated cancellations detected."
            return "Trigger urgent outreach — critical risk of deal loss."

        if cold_score >= 75:
            if email_replies == 0:
                return "Send a personalised re-engagement email with a case study or ROI report."
            if probability <= 25:
                return "Offer a limited-time discount or updated proposal to revive interest."
            if days_inactive >= 14:
                return "Arrange a technical demo or product walkthrough to rebuild engagement."
            return "Schedule a follow-up meeting to reassess customer needs and objections."

        if cold_score >= 50:
            if overdue >= 1:
                return f"Clear overdue follow-up — {overdue} action(s) pending. Contact within 24 hours."
            if meetings_completed == 0:
                return "Arrange an introductory demo or discovery call to progress the deal."
            return "Share customer success stories relevant to the prospect's industry."

        if cold_score >= 25:
            if lead_score >= 70:
                return "High-quality lead — send a targeted value proposition email."
            return "Verify decision-maker availability and confirm next steps."

        return "Engagement is healthy — continue current follow-up cadence."

    # ── Row → ColdLeadItem ────────────────────────────────────────────────────

    def _to_item(self, row: dict, now: datetime) -> ColdLeadItem:
        cold_score, components = self._calculate_cold_score(row, now)
        risk = _classify_risk(cold_score)

        last_at = row.get("last_activity_at")
        if last_at and last_at.tzinfo is None:
            last_at = last_at.replace(tzinfo=timezone.utc)
        days_inactive = max(0, (now - last_at).days) if last_at else 999

        trend_obj = _compute_trend(
            int(row.get("acts_last_7d") or 0),
            int(row.get("acts_prev_7d") or 0),
        )
        warnings = self._warning_indicators(row, days_inactive, cold_score, now)

        recommendation = self._recommend(
            cold_score=cold_score,
            days_inactive=days_inactive,
            overdue=int(row.get("overdue_followups") or 0),
            email_replies=int(row.get("email_replies") or 0),
            meetings_cancelled=int(row.get("meetings_cancelled") or 0),
            meetings_completed=int(row.get("meetings_completed") or 0),
            probability=int(row.get("probability") or 50),
            lead_score=int(row.get("lead_score") or 0),
            deal_value=float(row.get("deal_amount") or 0),
        )

        return ColdLeadItem(
            lead_id=row["lead_id"],
            lead_name=row["lead_name"],
            deal_id=row.get("deal_id"),
            deal_name=row.get("deal_name"),
            owner=row.get("owner_name"),
            owner_id=row.get("owner_id"),
            company=row.get("company_name"),
            industry=row.get("industry"),
            pipeline_stage=row.get("pipeline_stage"),
            cold_score=cold_score,
            risk=risk,
            days_inactive=days_inactive,
            overdue_followups=int(row.get("overdue_followups") or 0),
            deal_value=float(row.get("deal_amount") or 0),
            probability=int(row.get("probability") or 50),
            trend=trend_obj.trend,
            change=trend_obj.change,
            recommendation=recommendation,
            warning_indicators=warnings,
            score_components=components,
            last_activity_at=last_at,
            deal_created_at=(
                row["deal_created_at"].replace(tzinfo=timezone.utc)
                if row.get("deal_created_at") and row["deal_created_at"].tzinfo is None
                else row.get("deal_created_at")
            ),
        )

    # ── Public: paginated list ────────────────────────────────────────────────

    async def get_going_cold(
        self,
        user: User,
        *,
        page: int = 1,
        page_size: int = 20,
        owner_id: UUID | None = None,
        industry: str | None = None,
        pipeline_stage: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        minimum_risk: str | None = None,
        sort: str = "cold_score",
    ) -> GoingColdListResponse:
        user_id, team_ids = await self._scope(user)
        now = datetime.now(timezone.utc)

        rows, _ = await self.repo.fetch_cold_candidates(
            user.organization_id, user_id, team_ids,
            owner_id_filter=owner_id,
            industry_filter=industry,
            pipeline_stage_filter=pipeline_stage,
            date_from=date_from,
            date_to=date_to,
            minimum_risk=minimum_risk,
            page=1,
            page_size=10_000,  # score all, then filter/paginate in-memory
        )

        items = [self._to_item(r, now) for r in rows]

        # Apply minimum_risk filter after scoring
        _risk_order = {"critical": 5, "high risk": 4, "medium risk": 3, "low risk": 2, "healthy": 1}
        if minimum_risk:
            min_level = _risk_order.get(minimum_risk.lower(), 0)
            items = [i for i in items if _risk_order.get(i.risk.lower(), 0) >= min_level]

        # Sort
        if sort == "cold_score":
            items.sort(key=lambda x: x.cold_score, reverse=True)
        elif sort == "days_inactive":
            items.sort(key=lambda x: x.days_inactive, reverse=True)
        elif sort == "deal_value":
            items.sort(key=lambda x: x.deal_value, reverse=True)

        total = len(items)
        start = (page - 1) * page_size
        page_items = items[start: start + page_size]
        total_pages = max(1, math.ceil(total / page_size))

        return GoingColdListResponse(
            total_records=total,
            page=page,
            page_size=page_size,
            has_next=page < total_pages,
            data=page_items,
        )

    # ── Public: summary ───────────────────────────────────────────────────────

    async def get_summary(self, user: User) -> GoingColdSummaryResponse:
        user_id, team_ids = await self._scope(user)
        now = datetime.now(timezone.utc)

        rows, _ = await self.repo.fetch_cold_candidates(
            user.organization_id, user_id, team_ids,
            page=1, page_size=10_000,
        )
        items = [self._to_item(r, now) for r in rows]

        counts = {"critical": 0, "high_risk": 0, "medium_risk": 0, "low_risk": 0, "healthy": 0}
        for item in items:
            key = item.risk.lower().replace(" ", "_")
            if key in counts:
                counts[key] += 1

        avg_score = (
            sum(i.cold_score for i in items) / len(items) if items else 0.0
        )

        db_counts = await self.repo.get_summary_counts(
            user.organization_id, user_id, team_ids
        )

        total_cold = len([i for i in items if i.cold_score >= 50])
        critical_deals = len([i for i in items if i.risk == "Critical" and i.deal_id])
        reengaged = db_counts["reengaged"]
        recovery_rate = round((reengaged / max(len(items), 1)) * 100, 1)

        return GoingColdSummaryResponse(
            critical=counts["critical"],
            highRisk=counts["high_risk"],
            mediumRisk=counts["medium_risk"],
            lowRisk=counts["low_risk"],
            healthy=counts["healthy"],
            averageColdScore=round(avg_score, 1),
            total_cold_leads=total_cold,
            critical_deals=critical_deals,
            inactive_customers=db_counts["inactive_customers"],
            overdue_followups=db_counts["overdue_followups"],
            recovery_rate=recovery_rate,
            deals_reengaged_this_month=reengaged,
        )

    # ── Public: notifications ─────────────────────────────────────────────────

    async def get_notifications(self, user: User) -> list[GoingColdNotification]:
        user_id, team_ids = await self._scope(user)
        now = datetime.now(timezone.utc)

        rows, _ = await self.repo.fetch_cold_candidates(
            user.organization_id, user_id, team_ids,
            page=1, page_size=10_000,
        )
        items = [self._to_item(r, now) for r in rows]

        alerts: list[GoingColdNotification] = []
        for item in items:
            if item.cold_score >= 85:
                alerts.append(GoingColdNotification(
                    lead_id=item.lead_id,
                    lead_name=item.lead_name,
                    type="cold_score_high",
                    severity="critical",
                    message=f"Cold score {item.cold_score} — immediate recovery action required.",
                ))
            elif item.days_inactive >= 14:
                alerts.append(GoingColdNotification(
                    lead_id=item.lead_id,
                    lead_name=item.lead_name,
                    type="inactive_14d",
                    severity="high",
                    message=f"No interaction for {item.days_inactive} days.",
                ))
            if item.risk == "Critical" and item.deal_id:
                alerts.append(GoingColdNotification(
                    lead_id=item.lead_id,
                    lead_name=item.lead_name,
                    type="critical_risk",
                    severity="critical",
                    message=f"Deal '{item.deal_name}' entered Critical risk.",
                ))
            if item.overdue_followups >= 1:
                overdue_days = item.days_inactive
                if overdue_days >= 7:
                    alerts.append(GoingColdNotification(
                        lead_id=item.lead_id,
                        lead_name=item.lead_name,
                        type="followup_overdue",
                        severity="high",
                        message=f"{item.overdue_followups} follow-up(s) overdue by {overdue_days}+ days.",
                    ))
            if item.probability < 25:
                alerts.append(GoingColdNotification(
                    lead_id=item.lead_id,
                    lead_name=item.lead_name,
                    type="prob_drop",
                    severity="high",
                    message=f"Deal probability dropped to {item.probability}% — review required.",
                ))

        # Deduplicate by lead_id+type and limit to 50
        seen: set[tuple] = set()
        unique: list[GoingColdNotification] = []
        for a in alerts:
            key = (a.lead_id, a.type)
            if key not in seen:
                seen.add(key)
                unique.append(a)
        return unique[:50]
