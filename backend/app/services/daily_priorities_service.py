"""
Daily Priorities Service
AI priority score engine + personalized task generation.

Priority Score Formula (0-100):
  Overdue Follow-up    25%
  Deal Value           20%
  Closing Soon         15%
  Rising Interest      15%
  Going Cold           10%
  Open High-Prio Tasks 10%
  Today's Meetings      5%

RBAC:
  admin      → org-wide
  manager    → full org team
  sales_rep  → own leads only
"""
from __future__ import annotations

import math
import uuid as _uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.daily_priorities_repository import DailyPrioritiesRepository
from app.repositories.going_cold_repository import (
    GoingColdRepository,
    _INACTIVITY_SCORES,
    _DEAL_AGE_SCORES,
)
from app.schemas.ai_insights import (
    DailyPriorityItem,
    DailyPrioritiesListResponse,
    DailyPrioritiesSummaryResponse,
    DailyPriorityNotification,
    PriorityScoreComponents,
)

# ── Constants ─────────────────────────────────────────────────────────────────
_HIGH_VALUE_THRESHOLD   = 500_000   # ₹5L
_RISING_INTEREST_SCORE  = 80        # lead.score considered "rising interest"
_COLD_THRESHOLD         = 80        # cold_score at which going-cold boosts priority
_INACTIVE_DAYS_COLD     = 14

# ── Priority level classifier ─────────────────────────────────────────────────
def _classify(score: int) -> str:
    if score >= 90: return "Critical"
    if score >= 75: return "High"
    if score >= 50: return "Medium"
    if score >= 25: return "Low"
    return "Informational"

# ── Table-lookup helpers (reused from going_cold) ─────────────────────────────
def _table_score(value: int, table: list) -> float:
    for lo, hi, sc in table:
        if lo <= value <= hi:
            return float(sc)
    return 0.0


class DailyPrioritiesService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo     = DailyPrioritiesRepository(db)
        self.cold_repo = GoingColdRepository(db)

    # ── RBAC scope ────────────────────────────────────────────────────────────

    async def _scope(self, user: User) -> tuple[UUID | None, list[UUID] | None]:
        roles = {ur.role.name for ur in user.user_roles if ur.role}
        if "admin" in roles:
            return None, None
        if "sales_rep" in roles and "manager" not in roles:
            return user.id, None
        stmt = select(User.id).where(
            User.organization_id == user.organization_id,
            User.is_active.is_(True),
            User.is_deleted.is_(False),
        )
        result = await self.db.execute(stmt)
        return None, [r[0] for r in result.all()]

    # ── Score calculator ──────────────────────────────────────────────────────

    def _calc_priority_score(
        self, row: dict[str, Any], now: datetime
    ) -> tuple[int, PriorityScoreComponents, str, str, bool, int | None]:
        """
        Returns:
          (priority_score, components, category, recommendation,
           is_overdue, days_until_close)
        """
        # ── Factor 1: Overdue follow-up (25%) ────────────────────────────
        expected = row.get("expected_close_date")
        is_overdue = bool(expected and expected < now.date())
        if is_overdue:
            days_past = (now.date() - expected).days
            followup_raw = min(50.0 + days_past * 5.0, 100.0)
        else:
            followup_raw = 0.0

        # ── Factor 2: Deal value (20%) ────────────────────────────────────
        amount = float(row.get("deal_amount") or 0)
        if amount >= _HIGH_VALUE_THRESHOLD * 2:
            value_raw = 100.0
        elif amount >= _HIGH_VALUE_THRESHOLD:
            value_raw = 75.0
        elif amount >= 100_000:
            value_raw = 40.0
        else:
            value_raw = max(0.0, (amount / _HIGH_VALUE_THRESHOLD) * 40.0)

        # ── Factor 3: Closing soon (15%) ──────────────────────────────────
        days_until_close: int | None = None
        if expected and not is_overdue:
            days_until_close = (expected - now.date()).days
            if days_until_close == 0:
                closing_raw = 100.0
            elif days_until_close <= 3:
                closing_raw = 85.0
            elif days_until_close <= 7:
                closing_raw = 60.0
            else:
                closing_raw = max(0.0, 60.0 - days_until_close * 2.0)
        else:
            closing_raw = 0.0

        # ── Factor 4: Rising interest (15%) ──────────────────────────────
        lead_score = int(row.get("lead_score") or 0)
        if lead_score >= _RISING_INTEREST_SCORE:
            rising_raw = min((lead_score - _RISING_INTEREST_SCORE) / 20.0 * 100.0, 100.0)
        else:
            rising_raw = max(0.0, lead_score * 0.5)

        # ── Factor 5: Going cold (10%) ────────────────────────────────────
        last_at = row.get("last_activity_at")
        if last_at is None:
            days_inactive = 999
        else:
            if last_at.tzinfo is None:
                last_at = last_at.replace(tzinfo=timezone.utc)
            days_inactive = max(0, (now - last_at).days)
        cold_raw = _table_score(days_inactive, _INACTIVITY_SCORES)
        # Only count towards priority when cold is significant
        cold_contribution = cold_raw if days_inactive >= _INACTIVE_DAYS_COLD else cold_raw * 0.3

        # ── Factor 6: Open high-priority tasks (10%) ──────────────────────
        open_tasks = int(row.get("open_tasks") or 0)
        tasks_raw  = min(open_tasks * 20.0, 100.0)

        # ── Factor 7: Today's meetings (5%) ───────────────────────────────
        meetings_today = int(row.get("meetings_today") or 0)
        meeting_raw    = min(meetings_today * 40.0, 100.0)

        # ── Weighted sum ──────────────────────────────────────────────────
        score = (
            followup_raw       * 0.25
            + value_raw        * 0.20
            + closing_raw      * 0.15
            + rising_raw       * 0.15
            + cold_contribution* 0.10
            + tasks_raw        * 0.10
            + meeting_raw      * 0.05
        )
        priority_score = int(round(min(score, 100)))

        components = PriorityScoreComponents(
            overdue_followup_score=round(followup_raw,       1),
            deal_value_score=      round(value_raw,          1),
            closing_soon_score=    round(closing_raw,        1),
            rising_interest_score= round(rising_raw,         1),
            going_cold_score=      round(cold_contribution,  1),
            open_tasks_score=      round(tasks_raw,          1),
            todays_meetings_score= round(meeting_raw,        1),
        )

        # ── Category + recommendation ────────────────────────────────────
        category, recommendation = self._categorize(
            is_overdue=is_overdue,
            days_until_close=days_until_close,
            lead_score=lead_score,
            days_inactive=days_inactive,
            amount=amount,
            meetings_today=meetings_today,
            open_tasks=open_tasks,
            email_count=int(row.get("email_count") or 0),
            email_replies=int(row.get("email_replies") or 0),
            probability=int(row.get("probability") or 50),
            priority_score=priority_score,
        )

        return priority_score, components, category, recommendation, is_overdue, days_until_close

    # ── Categoriser + recommendation engine ──────────────────────────────────

    def _categorize(
        self,
        is_overdue: bool,
        days_until_close: int | None,
        lead_score: int,
        days_inactive: int,
        amount: float,
        meetings_today: int,
        open_tasks: int,
        email_count: int,
        email_replies: int,
        probability: int,
        priority_score: int,
    ) -> tuple[str, str]:
        """
        Returns (category, recommendation) — fully dynamic from signals.
        """
        # Overdue follow-up
        if is_overdue:
            if amount >= _HIGH_VALUE_THRESHOLD:
                return (
                    "Follow-up",
                    f"High-value deal overdue — contact immediately and offer revised timeline.",
                )
            return (
                "Follow-up",
                f"Follow-up is overdue. Reach out within the hour to maintain deal momentum.",
            )

        # Meeting today
        if meetings_today > 0:
            return (
                "Meeting",
                f"{meetings_today} meeting(s) today — prepare agenda and talking points now.",
            )

        # Closing very soon
        if days_until_close is not None and days_until_close <= 3:
            if probability >= 70:
                return (
                    "Contract",
                    f"Deal closes in {days_until_close} day(s) with {probability}% probability — prepare contract and final terms.",
                )
            return (
                "Proposal",
                f"Deal closes in {days_until_close} day(s) — send revised proposal and confirm decision.",
            )

        # Rising interest lead
        if lead_score >= _RISING_INTEREST_SCORE:
            if email_count > 0 and email_replies == 0:
                return (
                    "Customer Engagement",
                    f"High-interest lead ({lead_score} score) hasn't replied to email — schedule a direct call.",
                )
            return (
                "Demo",
                f"Rising interest detected (score {lead_score}) — arrange a product demo or discovery call.",
            )

        # Going cold
        if days_inactive >= _INACTIVE_DAYS_COLD:
            if amount >= _HIGH_VALUE_THRESHOLD:
                return (
                    "Risk Recovery",
                    f"High-value deal inactive {days_inactive} days — escalate to manager and trigger recovery plan.",
                )
            return (
                "Risk Recovery",
                f"No activity for {days_inactive} days — re-engage with a personalized email or call today.",
            )

        # Open tasks
        if open_tasks >= 2:
            return (
                "Task Completion",
                f"{open_tasks} open tasks pending — complete them to maintain deal momentum.",
            )

        # High-value opportunity without much urgency
        if amount >= _HIGH_VALUE_THRESHOLD:
            return (
                "Pipeline Review",
                "High-value opportunity — schedule a pipeline review and confirm next steps with the team.",
            )

        # Proposal pending (emails sent, no replies)
        if email_count >= 2 and email_replies == 0:
            return (
                "Proposal",
                "Proposal sent — no response received. Follow up with a call or value-add message.",
            )

        # Low probability
        if probability < 30:
            return (
                "Lead Assignment",
                f"Win probability is {probability}% — consider reassigning or offering targeted incentives.",
            )

        # Default
        return (
            "Customer Engagement",
            "Review account status and confirm next steps to keep the deal progressing.",
        )

    # ── Row → DailyPriorityItem ───────────────────────────────────────────────

    def _to_item(self, row: dict[str, Any], now: datetime) -> DailyPriorityItem:
        (
            priority_score, components, category,
            recommendation, is_overdue, days_until_close,
        ) = self._calc_priority_score(row, now)

        last_at = row.get("last_activity_at")
        if last_at and last_at.tzinfo is None:
            last_at = last_at.replace(tzinfo=timezone.utc)

        # Build human-readable reason
        reasons: list[str] = []
        if is_overdue:
            expected = row.get("expected_close_date")
            days_past = (now.date() - expected).days if expected else 0
            reasons.append(f"Follow-up overdue by {days_past} day(s)")
        if float(row.get("deal_amount") or 0) >= _HIGH_VALUE_THRESHOLD:
            reasons.append(f"High-value deal ₹{int(float(row.get('deal_amount') or 0)):,}")
        if days_until_close is not None and days_until_close <= 7:
            reasons.append(f"Closing in {days_until_close} day(s)")
        if int(row.get("lead_score") or 0) >= _RISING_INTEREST_SCORE:
            reasons.append(f"Rising interest (score {row['lead_score']})")
        last_at_days = (
            max(0, (now - last_at).days) if last_at else 999
        )
        if last_at_days >= _INACTIVE_DAYS_COLD:
            reasons.append(f"Going cold — {last_at_days} days inactive")
        if int(row.get("open_tasks") or 0) > 0:
            reasons.append(f"{row['open_tasks']} open task(s)")
        if int(row.get("meetings_today") or 0) > 0:
            reasons.append(f"{row['meetings_today']} meeting(s) today")
        if not reasons:
            reasons.append("Routine pipeline maintenance required")

        return DailyPriorityItem(
            priority_id=row.get("deal_id") or row["lead_id"],
            title=self._build_title(category, row),
            category=category,
            priority_score=priority_score,
            priority_level=_classify(priority_score),
            related_lead=row.get("lead_name"),
            related_lead_id=row.get("lead_id"),
            related_deal=row.get("deal_name"),
            related_deal_id=row.get("deal_id"),
            related_company=row.get("company_name"),
            owner=row.get("owner_name"),
            owner_id=row.get("owner_id"),
            deal_value=float(row.get("deal_amount") or 0),
            due_date=row.get("expected_close_date"),
            recommendation=recommendation,
            reason="; ".join(reasons),
            score_components=components,
            is_overdue=is_overdue,
            days_until_close=days_until_close,
            pipeline_stage=row.get("pipeline_stage"),
        )

    def _build_title(self, category: str, row: dict) -> str:
        name = row.get("lead_name") or row.get("company_name") or "Lead"
        mapping = {
            "Follow-up":          f"Follow up with {name}",
            "Meeting":            f"Meeting today — {name}",
            "Call":               f"Call {name}",
            "Proposal":           f"Send proposal to {name}",
            "Demo":               f"Schedule demo with {name}",
            "Contract":           f"Prepare contract for {name}",
            "Risk Recovery":      f"Recover going-cold opportunity — {name}",
            "Customer Engagement":f"Re-engage {name}",
            "Pipeline Review":    f"Review pipeline — {name}",
            "Task Completion":    f"Complete pending tasks for {name}",
            "Lead Assignment":    f"Review lead assignment — {name}",
        }
        return mapping.get(category, f"Action required — {name}")

    # ── Public: paginated list ────────────────────────────────────────────────

    async def get_daily_priorities(
        self,
        user: User,
        *,
        page: int = 1,
        page_size: int = 20,
        date_filter: str | None = None,
        owner_id: UUID | None = None,
        pipeline_stage: str | None = None,
        priority_filter: str | None = None,
        category_filter: str | None = None,
        sort: str = "ai_priority_score",
    ) -> DailyPrioritiesListResponse:
        user_id, team_ids = await self._scope(user)
        now = datetime.now(timezone.utc)

        rows = await self.repo.fetch_priority_candidates(
            user.organization_id, user_id, team_ids,
            owner_id_filter=owner_id,
            pipeline_stage_filter=pipeline_stage,
            date_filter=date_filter,
        )

        items = [self._to_item(r, now) for r in rows]

        # Filter by priority level
        if priority_filter:
            items = [i for i in items if i.priority_level.lower() == priority_filter.lower()]

        # Filter by category
        if category_filter:
            items = [i for i in items if i.category.lower() == category_filter.lower()]

        # Sort
        if sort in ("ai_priority_score", "priority_score"):
            items.sort(key=lambda x: x.priority_score, reverse=True)
        elif sort == "deal_value":
            items.sort(key=lambda x: x.deal_value, reverse=True)
        elif sort == "due_date":
            items.sort(key=lambda x: (x.due_date is None, x.due_date))

        total = len(items)
        start = (page - 1) * page_size
        total_pages = max(1, math.ceil(total / page_size))

        return DailyPrioritiesListResponse(
            total_records=total,
            page=page,
            page_size=page_size,
            has_next=page < total_pages,
            data=items[start: start + page_size],
        )

    # ── Public: summary ───────────────────────────────────────────────────────

    async def get_summary(self, user: User) -> DailyPrioritiesSummaryResponse:
        user_id, team_ids = await self._scope(user)
        now = datetime.now(timezone.utc)

        rows = await self.repo.fetch_priority_candidates(
            user.organization_id, user_id, team_ids,
        )
        items = [self._to_item(r, now) for r in rows]

        level_counts = {
            "critical": 0, "high": 0, "medium": 0,
            "low": 0, "informational": 0,
        }
        for item in items:
            key = item.priority_level.lower()
            if key in level_counts:
                level_counts[key] += 1

        today_counts = await self.repo.get_today_counts(
            user.organization_id, user_id, team_ids
        )
        completed_today = await self.repo.get_completed_today(
            user.organization_id, user_id, team_ids
        )
        pending_today = level_counts["critical"] + level_counts["high"]

        return DailyPrioritiesSummaryResponse(
            critical=level_counts["critical"],
            high=level_counts["high"],
            medium=level_counts["medium"],
            low=level_counts["low"],
            informational=level_counts["informational"],
            completed_today=completed_today,
            pending_today=pending_today,
            meetingsToday=today_counts["meetings_today"],
            followUpsToday=today_counts["follow_ups_today"],
            callsToday=today_counts["calls_today"],
            closingDeals=today_counts["closing_deals"],
        )

    # ── Public: notifications ─────────────────────────────────────────────────

    async def get_notifications(self, user: User) -> list[DailyPriorityNotification]:
        user_id, team_ids = await self._scope(user)
        now = datetime.now(timezone.utc)

        rows = await self.repo.fetch_priority_candidates(
            user.organization_id, user_id, team_ids,
        )
        items = [self._to_item(r, now) for r in rows]

        alerts: list[DailyPriorityNotification] = []
        seen: set[tuple] = set()

        for item in items:
            pid = item.priority_id

            # Critical priority created
            if item.priority_level == "Critical":
                key = (pid, "critical_priority")
                if key not in seen:
                    seen.add(key)
                    alerts.append(DailyPriorityNotification(
                        priority_id=pid,
                        title=item.title,
                        type="critical_priority",
                        severity="critical",
                        message=f"Critical action required: {item.title}",
                    ))

            # High-value closing soon
            if (
                item.deal_value >= _HIGH_VALUE_THRESHOLD
                and item.days_until_close is not None
                and item.days_until_close <= 3
            ):
                key = (pid, "closing_soon")
                if key not in seen:
                    seen.add(key)
                    alerts.append(DailyPriorityNotification(
                        priority_id=pid,
                        title=item.title,
                        type="closing_soon",
                        severity="critical",
                        message=(
                            f"High-value deal ₹{int(item.deal_value):,} closes in "
                            f"{item.days_until_close} day(s) — {item.related_deal or item.related_lead}."
                        ),
                    ))

            # Overdue follow-up
            if item.is_overdue and item.priority_level in ("Critical", "High"):
                key = (pid, "followup_overdue")
                if key not in seen:
                    seen.add(key)
                    alerts.append(DailyPriorityNotification(
                        priority_id=pid,
                        title=item.title,
                        type="followup_overdue",
                        severity="high",
                        message=f"Follow-up overdue — {item.related_lead or item.related_deal}.",
                    ))

            # Meeting starts within 1 hour (score_components meeting > 0)
            if (
                item.score_components
                and item.score_components.todays_meetings_score >= 40
            ):
                key = (pid, "meeting_soon")
                if key not in seen:
                    seen.add(key)
                    alerts.append(DailyPriorityNotification(
                        priority_id=pid,
                        title=item.title,
                        type="meeting_soon",
                        severity="high",
                        message=f"Meeting scheduled today — prepare for {item.related_lead or item.related_deal}.",
                    ))

            # Proposal pending (high priority + Proposal category)
            if item.category == "Proposal" and item.priority_level in ("Critical", "High"):
                key = (pid, "proposal_pending")
                if key not in seen:
                    seen.add(key)
                    alerts.append(DailyPriorityNotification(
                        priority_id=pid,
                        title=item.title,
                        type="proposal_pending",
                        severity="medium",
                        message=f"Proposal awaiting response from {item.related_lead or item.related_company}.",
                    ))

            # Cold lead recovery
            if item.category == "Risk Recovery":
                key = (pid, "cold_lead")
                if key not in seen:
                    seen.add(key)
                    alerts.append(DailyPriorityNotification(
                        priority_id=pid,
                        title=item.title,
                        type="cold_lead",
                        severity="high",
                        message=f"Cold lead requires recovery action: {item.related_lead}.",
                    ))

        # Sort by severity then limit to 50
        _sev_order = {"critical": 3, "high": 2, "medium": 1}
        alerts.sort(key=lambda a: _sev_order.get(a.severity, 0), reverse=True)
        return alerts[:50]
