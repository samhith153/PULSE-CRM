"""
Reports & Analytics routes.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import case, func, select, and_, desc, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DBSession, require_role
from app.models.activity import ActivityTimeline
from app.models.crm_call import CrmCall
from app.models.crm_email import CrmEmail
from app.models.crm_task import CrmTask
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.meeting import Meeting
from app.models.pipeline import PipelineStage
from app.models.user import User
from app.schemas.common import StandardResponse
from app.utils.enums import DealStatus

router = APIRouter()


class RevenueByRep(BaseModel):
    rep_id: str
    rep_name: str
    revenue: Decimal = Decimal("0")
    deal_count: int = 0
    avg_deal_value: Decimal = Decimal("0")


class WinRateByRep(BaseModel):
    rep_id: str
    rep_name: str
    won: int = 0
    lost: int = 0
    total_closed: int = 0
    win_rate: Decimal = Decimal("0")


class QuotaAttainment(BaseModel):
    rep_id: str
    rep_name: str
    target: Decimal = Decimal("50000")
    actual: Decimal = Decimal("0")
    achievement_pct: Decimal = Decimal("0")
    remaining: Decimal = Decimal("0")


class TopPerformer(BaseModel):
    rank: int = 0
    rep_id: str
    rep_name: str
    revenue: Decimal = Decimal("0")
    win_rate: Decimal = Decimal("0")
    quota_pct: Decimal = Decimal("0")


class BottomPerformer(BaseModel):
    rep_id: str
    rep_name: str
    revenue: Decimal = Decimal("0")
    quota_pct: Decimal = Decimal("0")
    gap: Decimal = Decimal("0")


class SalesPerformanceReport(BaseModel):
    revenue_by_rep: list[RevenueByRep] = []
    win_rate_by_rep: list[WinRateByRep] = []
    quota_attainment: list[QuotaAttainment] = []
    top_performers: list[TopPerformer] = []
    bottom_performers: list[BottomPerformer] = []
    total_revenue: Decimal = Decimal("0")
    team_win_rate: Decimal = Decimal("0")


class PipelineByStage(BaseModel):
    stage: str
    stage_slug: str
    deal_count: int = 0
    total_value: Decimal = Decimal("0")
    percentage: Decimal = Decimal("0")


class StageConversion(BaseModel):
    from_stage: str
    to_stage: str
    count: int = 0
    conversion_pct: Decimal = Decimal("0")


class PipelineAging(BaseModel):
    bucket: str
    count: int = 0
    value: Decimal = Decimal("0")


class StalledDeal(BaseModel):
    deal_id: str
    deal_name: str
    owner_name: str
    stage: str
    value: Decimal = Decimal("0")
    days_inactive: int = 0


class AvgTimeInStage(BaseModel):
    stage: str
    avg_days: Decimal = Decimal("0")


class PipelineAnalyticsReport(BaseModel):
    pipeline_by_stage: list[PipelineByStage] = []
    stage_conversion: list[StageConversion] = []
    pipeline_aging: list[PipelineAging] = []
    stalled_deals: list[StalledDeal] = []
    avg_time_in_stage: list[AvgTimeInStage] = []


class LeaderboardEntry(BaseModel):
    rank: int = 0
    rep_id: str
    rep_name: str
    revenue: Decimal = Decimal("0")
    deals_won: int = 0
    win_rate: Decimal = Decimal("0")
    quota_pct: Decimal = Decimal("0")
    avg_deal_size: Decimal = Decimal("0")
    sales_cycle_days: Decimal = Decimal("0")


class RepComparison(BaseModel):
    rep_id: str
    rep_name: str
    revenue: Decimal = Decimal("0")
    win_rate: Decimal = Decimal("0")
    deals_won: int = 0
    quota_pct: Decimal = Decimal("0")
    sales_cycle_days: Decimal = Decimal("0")
    avg_deal_size: Decimal = Decimal("0")


class SalesCycleByRep(BaseModel):
    rep_id: str
    rep_name: str
    avg_cycle_days: Decimal = Decimal("0")
    deal_count: int = 0


class PerformanceVsPrior(BaseModel):
    metric: str
    current: Decimal = Decimal("0")
    previous: Decimal = Decimal("0")
    change_pct: Decimal = Decimal("0")


class TeamPerformanceReport(BaseModel):
    leaderboard: list[LeaderboardEntry] = []
    rep_comparison: list[RepComparison] = []
    sales_cycle_by_rep: list[SalesCycleByRep] = []
    performance_vs_prior: list[PerformanceVsPrior] = []


class ActivitySummary(BaseModel):
    calls: int = 0
    emails: int = 0
    meetings: int = 0
    tasks: int = 0
    notes: int = 0
    total: int = 0


class ActivityByRep(BaseModel):
    rep_id: str
    rep_name: str
    calls: int = 0
    emails: int = 0
    meetings: int = 0
    tasks: int = 0
    total: int = 0


class ActivityTrendPoint(BaseModel):
    period: str
    calls: int = 0
    emails: int = 0
    meetings: int = 0
    tasks: int = 0
    total: int = 0


class CompletedVsOverdue(BaseModel):
    completed: int = 0
    overdue: int = 0
    pending: int = 0
    completion_rate: Decimal = Decimal("0")


class ActivityToDeal(BaseModel):
    total_deals: int = 0
    deals_with_high_activity: int = 0
    deals_with_low_activity: int = 0
    high_activity_win_rate: Decimal = Decimal("0")
    low_activity_win_rate: Decimal = Decimal("0")
    insight: str = ""


class ActivityAnalyticsReport(BaseModel):
    activity_summary: ActivitySummary = ActivitySummary()
    activity_by_rep: list[ActivityByRep] = []
    activity_trend: list[ActivityTrendPoint] = []
    completed_vs_overdue: CompletedVsOverdue = CompletedVsOverdue()
    activity_to_deal: ActivityToDeal = ActivityToDeal()


class SourcePerformance(BaseModel):
    source: str
    total: int = 0
    qualified: int = 0
    converted: int = 0
    conversion_pct: Decimal = Decimal("0")


class ConversionFunnelStage(BaseModel):
    stage: str
    count: int = 0
    percentage: Decimal = Decimal("0")


class ConversionByRep(BaseModel):
    rep_id: str
    rep_name: str
    total_leads: int = 0
    converted: int = 0
    conversion_pct: Decimal = Decimal("0")


class LeadAging(BaseModel):
    bucket: str
    count: int = 0


class LeadAnalyticsReport(BaseModel):
    source_performance: list[SourcePerformance] = []
    conversion_funnel: list[ConversionFunnelStage] = []
    conversion_by_rep: list[ConversionByRep] = []
    lead_aging: list[LeadAging] = []
    total_leads: int = 0
    overall_conversion_rate: Decimal = Decimal("0")


class WonDealItem(BaseModel):
    deal_id: str
    deal_name: str
    owner_name: str
    amount: Decimal = Decimal("0")
    close_date: str = ""
    sales_cycle_days: int = 0


class LostDealItem(BaseModel):
    deal_id: str
    deal_name: str
    owner_name: str
    amount: Decimal = Decimal("0")
    close_date: str = ""
    lost_reason: str = ""


class LostReasonAnalysis(BaseModel):
    reason: str
    count: int = 0
    percentage: Decimal = Decimal("0")


class DealSizeStats(BaseModel):
    current: Decimal = Decimal("0")
    previous: Decimal = Decimal("0")
    change_pct: Decimal = Decimal("0")


class DealClosingSoon(BaseModel):
    deal_id: str
    deal_name: str
    owner_name: str
    amount: Decimal = Decimal("0")
    expected_close_date: str = ""
    days_until: int = 0
    stage: str = ""


class AtRiskDeal(BaseModel):
    deal_id: str
    deal_name: str
    owner_name: str
    stage: str = ""
    value: Decimal = Decimal("0")
    risk_reason: str = ""
    days_inactive: int = 0


class DealAnalyticsReport(BaseModel):
    won_deals: list[WonDealItem] = []
    lost_deals: list[LostDealItem] = []
    lost_reason_analysis: list[LostReasonAnalysis] = []
    avg_deal_size: DealSizeStats = DealSizeStats()
    deals_closing_soon: list[DealClosingSoon] = []
    at_risk_deals: list[AtRiskDeal] = []
    total_won: int = 0
    total_lost: int = 0
    total_won_value: Decimal = Decimal("0")
    total_lost_value: Decimal = Decimal("0")


def _period_bounds(period: str) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "quarter":
        start = now - timedelta(days=90)
    elif period == "year":
        start = now - timedelta(days=365)
    else:
        start = now - timedelta(days=30)
    return start, now


def _prev_period_bounds(period: str) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if period == "week":
        end = now - timedelta(days=7)
        start = end - timedelta(days=7)
    elif period == "month":
        end = now - timedelta(days=30)
        start = end - timedelta(days=30)
    elif period == "quarter":
        end = now - timedelta(days=90)
        start = end - timedelta(days=90)
    elif period == "year":
        end = now - timedelta(days=365)
        start = end - timedelta(days=365)
    else:
        end = now - timedelta(days=30)
        start = end - timedelta(days=30)
    return start, end


def _pct(numerator, denominator):
    d = Decimal(str(denominator))
    if d <= 0:
        return Decimal("0")
    return (Decimal(str(numerator)) * Decimal("100")) / d


@router.get(
    "/sales-performance",
    response_model=StandardResponse[SalesPerformanceReport],
    summary="Sales Performance Report",
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def get_sales_performance(
    current_user: CurrentUser,
    db: DBSession,
    period: str = Query(default="quarter", pattern="^(week|month|quarter|year)$"),
    rep_id: Optional[str] = Query(default=None),
) -> dict:
    org_id = current_user.organization_id
    start, end = _period_bounds(period)

    stmt = (
        select(
            User.id, User.full_name,
            func.coalesce(func.sum(Deal.amount), 0),
            func.count(Deal.id),
        )
        .select_from(User)
        .join(Deal, Deal.owner_id == User.id, isouter=True)
        .where(
            User.organization_id == org_id, User.is_active.is_(True), User.is_deleted.is_(False),
            Deal.status == DealStatus.WON.value, Deal.is_active.is_(True), Deal.is_deleted.is_(False),
            Deal.closed_at >= start, Deal.closed_at < end,
        )
        .group_by(User.id, User.full_name)
        .order_by(func.coalesce(func.sum(Deal.amount), 0).desc())
    )
    if rep_id:
        stmt = stmt.where(User.id == UUID(rep_id))
    result = await db.execute(stmt)
    rows = result.all()

    revenue_by_rep = []
    for row in rows:
        rev = Decimal(str(row[2] or 0))
        cnt = int(row[3] or 0)
        revenue_by_rep.append(RevenueByRep(
            rep_id=str(row[0]), rep_name=row[1] or "Unknown",
            revenue=rev, deal_count=cnt,
            avg_deal_value=rev / cnt if cnt > 0 else Decimal("0"),
        ))
    total_revenue = sum((r.revenue for r in revenue_by_rep), Decimal("0"))

    won_count = func.sum(case((Deal.status == DealStatus.WON.value, 1), else_=0))
    lost_count = func.sum(case((Deal.status == DealStatus.LOST.value, 1), else_=0))
    stmt = (
        select(User.id, User.full_name, func.coalesce(won_count, 0), func.coalesce(lost_count, 0))
        .select_from(User)
        .join(Deal, Deal.owner_id == User.id, isouter=True)
        .where(
            User.organization_id == org_id, User.is_active.is_(True), User.is_deleted.is_(False),
            Deal.status.in_([DealStatus.WON.value, DealStatus.LOST.value]),
            Deal.is_active.is_(True), Deal.is_deleted.is_(False),
            Deal.closed_at >= start, Deal.closed_at < end,
        )
        .group_by(User.id, User.full_name)
    )
    if rep_id:
        stmt = stmt.where(User.id == UUID(rep_id))
    result = await db.execute(stmt)
    rows = result.all()

    win_rate_by_rep = []
    total_won = 0
    total_lost = 0
    for row in rows:
        w = int(row[2] or 0)
        l = int(row[3] or 0)
        total_won += w
        total_lost += l
        win_rate_by_rep.append(WinRateByRep(
            rep_id=str(row[0]), rep_name=row[1] or "Unknown",
            won=w, lost=l, total_closed=w + l, win_rate=_pct(w, w + l),
        ))
    team_win_rate = _pct(total_won, total_won + total_lost)

    stmt = (
        select(User.id, User.full_name, User.sales_quota)
        .where(User.organization_id == org_id, User.is_active.is_(True), User.is_deleted.is_(False))
    )
    if rep_id:
        stmt = stmt.where(User.id == UUID(rep_id))
    result = await db.execute(stmt)
    users = result.all()

    stmt = (
        select(Deal.owner_id, func.coalesce(func.sum(Deal.amount), 0))
        .where(
            Deal.organization_id == org_id, Deal.status == DealStatus.WON.value,
            Deal.is_active.is_(True), Deal.is_deleted.is_(False),
            Deal.closed_at >= start, Deal.closed_at < end,
        )
        .group_by(Deal.owner_id)
    )
    result = await db.execute(stmt)
    revenue_map = {str(r[0]): Decimal(str(r[1] or 0)) for r in result.all()}

    quota_attainment = []
    for user in users:
        uid = str(user[0])
        quota = Decimal(str(user[2] or 50000))
        actual = revenue_map.get(uid, Decimal("0"))
        achievement = _pct(actual, quota)
        remaining = max(quota - actual, Decimal("0"))
        quota_attainment.append(QuotaAttainment(
            rep_id=uid, rep_name=user[1] or "Unknown",
            target=quota, actual=actual,
            achievement_pct=achievement, remaining=remaining,
        ))

    sorted_by_rev = sorted(quota_attainment, key=lambda x: x.actual, reverse=True)
    top_performers = [
        TopPerformer(
            rank=i + 1, rep_id=q.rep_id, rep_name=q.rep_name, revenue=q.actual,
            win_rate=next((w.win_rate for w in win_rate_by_rep if w.rep_id == q.rep_id), Decimal("0")),
            quota_pct=q.achievement_pct,
        )
        for i, q in enumerate(sorted_by_rev[:5])
    ]
    bottom_performers = [
        BottomPerformer(rep_id=q.rep_id, rep_name=q.rep_name,
                        revenue=q.actual, quota_pct=q.achievement_pct, gap=q.remaining)
        for q in sorted_by_rev if q.achievement_pct < 100
    ]

    report = SalesPerformanceReport(
        revenue_by_rep=revenue_by_rep, win_rate_by_rep=win_rate_by_rep,
        quota_attainment=quota_attainment, top_performers=top_performers,
        bottom_performers=bottom_performers, total_revenue=total_revenue, team_win_rate=team_win_rate,
    )
    return {"success": True, "message": "OK", "data": report}


@router.get(
    "/pipeline-analytics",
    response_model=StandardResponse[PipelineAnalyticsReport],
    summary="Pipeline Analytics Report",
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def get_pipeline_analytics(
    current_user: CurrentUser, db: DBSession,
    period: str = Query(default="quarter", pattern="^(week|month|quarter|year)$"),
) -> dict:
    org_id = current_user.organization_id
    now = datetime.now(timezone.utc)
    start, _ = _period_bounds(period)

    stmt = (
        select(PipelineStage.name, PipelineStage.slug, func.count(Deal.id),
               func.coalesce(func.sum(Deal.amount), 0))
        .select_from(PipelineStage)
        .outerjoin(Deal, and_(
            Deal.pipeline_stage_id == PipelineStage.id, Deal.is_active.is_(True),
            Deal.is_deleted.is_(False), Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
        ))
        .where(PipelineStage.organization_id == org_id)
        .group_by(PipelineStage.name, PipelineStage.slug, PipelineStage.sort_order)
        .order_by(PipelineStage.sort_order)
    )
    result = await db.execute(stmt)
    rows = result.all()
    total_pipeline_value = sum(Decimal(str(r[3] or 0)) for r in rows)
    pipeline_by_stage = []
    for row in rows:
        val = Decimal(str(row[3] or 0))
        pipeline_by_stage.append(PipelineByStage(
            stage=row[0], stage_slug=row[1], deal_count=int(row[2] or 0),
            total_value=val, percentage=_pct(val, total_pipeline_value),
        ))

    stmt = (
        select(cast(ActivityTimeline.payload, String).label("payload"), func.count(ActivityTimeline.id))
        .where(ActivityTimeline.organization_id == org_id, ActivityTimeline.action == "stage_changed",
               ActivityTimeline.created_at >= start)
        .group_by(cast(ActivityTimeline.payload, String))
    )
    result = await db.execute(stmt)
    conversion_counts: dict[tuple[str, str], int] = {}
    for payload_str, count in result.all():
        if payload_str:
            import json as _json
            try:
                payload = _json.loads(payload_str) if isinstance(payload_str, str) else payload_str
            except (ValueError, TypeError):
                payload = payload_str
            if isinstance(payload, dict):
                old_s = payload.get("from_stage") or payload.get("old_stage") or ""
                new_s = payload.get("to_stage") or payload.get("new_stage") or ""
                if old_s and new_s:
                    key = (str(old_s), str(new_s))
                    conversion_counts[key] = conversion_counts.get(key, 0) + int(count or 0)
    total_conversions = sum(conversion_counts.values()) or 1
    stage_conversion = [
        StageConversion(from_stage=k[0], to_stage=k[1], count=v, conversion_pct=_pct(v, total_conversions))
        for k, v in sorted(conversion_counts.items(), key=lambda x: -x[1])
    ]

    stmt = (
        select(Deal.id, Deal.name, Deal.amount, Deal.created_at, PipelineStage.name)
        .outerjoin(PipelineStage, Deal.pipeline_stage_id == PipelineStage.id)
        .where(Deal.organization_id == org_id, Deal.is_active.is_(True), Deal.is_deleted.is_(False),
               Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]))
    )
    result = await db.execute(stmt)
    open_deals = result.all()

    aging_buckets = {"0-7 days": [0, Decimal("0")], "8-14 days": [0, Decimal("0")],
                     "15-30 days": [0, Decimal("0")], "30+ days": [0, Decimal("0")]}
    stalled = []
    for deal in open_deals:
        days_open = (now - (deal[3] or now)).days if deal[3] else 0
        amt = Decimal(str(deal[2] or 0))
        b = "0-7 days" if days_open <= 7 else "8-14 days" if days_open <= 14 else "15-30 days" if days_open <= 30 else "30+ days"
        aging_buckets[b][0] += 1
        aging_buckets[b][1] += amt
        if days_open > 30:
            stalled.append(StalledDeal(deal_id=str(deal[0]), deal_name=deal[1] or "",
                                       owner_name="", stage=deal[4] or "", value=amt, days_inactive=days_open))

    pipeline_aging = [PipelineAging(bucket=k, count=v[0], value=v[1]) for k, v in aging_buckets.items()]
    stalled_deals = sorted(stalled, key=lambda x: -x.days_inactive)[:20]

    stage_days: dict[str, list[int]] = {}
    for deal in open_deals:
        stage = deal[4] or "Unknown"
        days = (now - (deal[3] or now)).days if deal[3] else 0
        stage_days.setdefault(stage, []).append(days)
    avg_time_in_stage = [
        AvgTimeInStage(stage=s, avg_days=Decimal(str(sum(d) // len(d) if d else 0)))
        for s, d in stage_days.items()
    ]

    report = PipelineAnalyticsReport(
        pipeline_by_stage=pipeline_by_stage, stage_conversion=stage_conversion,
        pipeline_aging=pipeline_aging, stalled_deals=stalled_deals, avg_time_in_stage=avg_time_in_stage,
    )
    return {"success": True, "message": "OK", "data": report}


@router.get(
    "/team-performance",
    response_model=StandardResponse[TeamPerformanceReport],
    summary="Team Performance Report",
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def get_team_performance(
    current_user: CurrentUser, db: DBSession,
    period: str = Query(default="quarter", pattern="^(week|month|quarter|year)$"),
    rep_id: Optional[str] = Query(default=None),
) -> dict:
    org_id = current_user.organization_id
    start, end = _period_bounds(period)
    prev_start, prev_end = _prev_period_bounds(period)

    won_count = func.sum(case((Deal.status == DealStatus.WON.value, 1), else_=0))
    stmt = (
        select(User.id, User.full_name, User.sales_quota,
               func.coalesce(func.sum(Deal.amount), 0), func.coalesce(won_count, 0), func.count(Deal.id))
        .select_from(User)
        .outerjoin(Deal, and_(Deal.owner_id == User.id, Deal.is_active.is_(True), Deal.is_deleted.is_(False),
                              Deal.closed_at >= start, Deal.closed_at < end))
        .where(User.organization_id == org_id, User.is_active.is_(True), User.is_deleted.is_(False))
        .group_by(User.id, User.full_name, User.sales_quota)
        .order_by(func.coalesce(func.sum(Deal.amount), 0).desc())
    )
    if rep_id:
        stmt = stmt.where(User.id == UUID(rep_id))
    result = await db.execute(stmt)
    rows = result.all()

    lost_stmt = (
        select(Deal.owner_id, func.count(Deal.id))
        .where(Deal.organization_id == org_id, Deal.status == DealStatus.LOST.value,
               Deal.is_active.is_(True), Deal.is_deleted.is_(False),
               Deal.closed_at >= start, Deal.closed_at < end)
        .group_by(Deal.owner_id)
    )
    result = await db.execute(lost_stmt)
    lost_map = {str(r[0]): int(r[1] or 0) for r in result.all()}

    leaderboard = []
    rep_comparison = []
    for i, row in enumerate(rows):
        uid = str(row[0])
        rev = Decimal(str(row[3] or 0))
        w = int(row[4] or 0)
        l = lost_map.get(uid, 0)
        quota = Decimal(str(row[2] or 50000))
        wr = _pct(w, w + l)
        avg_size = rev / w if w > 0 else Decimal("0")
        quota_pct = _pct(rev, quota)

        entry = LeaderboardEntry(rank=i + 1, rep_id=uid, rep_name=row[1] or "Unknown",
                                 revenue=rev, deals_won=w, win_rate=wr, quota_pct=quota_pct, avg_deal_size=avg_size)
        leaderboard.append(entry)
        rep_comparison.append(RepComparison(
            rep_id=uid, rep_name=row[1] or "Unknown", revenue=rev, win_rate=wr,
            deals_won=w, quota_pct=quota_pct, avg_deal_size=avg_size,
        ))

    curr_revenue = sum((e.revenue for e in leaderboard), Decimal("0"))
    curr_won = sum(e.deals_won for e in leaderboard)

    prev_stmt = (
        select(func.coalesce(func.sum(Deal.amount), 0), func.count(Deal.id))
        .where(Deal.organization_id == org_id, Deal.status == DealStatus.WON.value,
               Deal.is_active.is_(True), Deal.is_deleted.is_(False),
               Deal.closed_at >= prev_start, Deal.closed_at < prev_end)
    )
    result = await db.execute(prev_stmt)
    prev_row = result.one()
    prev_revenue = Decimal(str(prev_row[0] or 0))
    prev_won = int(prev_row[1] or 0)

    performance_vs_prior = [
        PerformanceVsPrior(metric="Revenue", current=curr_revenue, previous=prev_revenue,
                           change_pct=_pct(curr_revenue - prev_revenue, prev_revenue) if prev_revenue else Decimal("0")),
        PerformanceVsPrior(metric="Deals Won", current=Decimal(str(curr_won)), previous=Decimal(str(prev_won)),
                           change_pct=_pct(curr_won - prev_won, prev_won) if prev_won else Decimal("0")),
    ]

    report = TeamPerformanceReport(
        leaderboard=leaderboard, rep_comparison=rep_comparison, performance_vs_prior=performance_vs_prior,
    )
    return {"success": True, "message": "OK", "data": report}


@router.get(
    "/activity-analytics",
    response_model=StandardResponse[ActivityAnalyticsReport],
    summary="Activity Analytics Report",
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def get_activity_analytics(
    current_user: CurrentUser, db: DBSession,
    period: str = Query(default="quarter", pattern="^(week|month|quarter|year)$"),
) -> dict:
    org_id = current_user.organization_id
    start, _ = _period_bounds(period)

    call_q = await db.execute(select(func.count(CrmCall.id)).where(
        CrmCall.organization_id == org_id, CrmCall.is_active.is_(True), CrmCall.created_at >= start))
    email_q = await db.execute(select(func.count(CrmEmail.id)).where(
        CrmEmail.organization_id == org_id, CrmEmail.is_active.is_(True), CrmEmail.created_at >= start))
    meeting_q = await db.execute(select(func.count(Meeting.id)).where(
        Meeting.organization_id == org_id, Meeting.is_active.is_(True), Meeting.created_at >= start))
    task_q = await db.execute(select(func.count(CrmTask.id)).where(
        CrmTask.organization_id == org_id, CrmTask.is_active.is_(True), CrmTask.created_at >= start))
    note_q = await db.execute(select(func.count(ActivityTimeline.id)).where(
        ActivityTimeline.organization_id == org_id, ActivityTimeline.action == "note",
        ActivityTimeline.created_at >= start))

    c = int(call_q.scalar() or 0)
    e = int(email_q.scalar() or 0)
    m = int(meeting_q.scalar() or 0)
    t = int(task_q.scalar() or 0)
    n = int(note_q.scalar() or 0)
    activity_summary = ActivitySummary(calls=c, emails=e, meetings=m, tasks=t, notes=n, total=c + e + m + t + n)

    stmt = select(User.id, User.full_name).where(
        User.organization_id == org_id, User.is_active.is_(True), User.is_deleted.is_(False))
    result = await db.execute(stmt)
    all_users = {str(r[0]): r[1] for r in result.all()}

    activity_by_rep = []
    for uid, name in all_users.items():
        _cv_q = await db.execute(select(func.count(CrmCall.id)).where(
            CrmCall.organization_id == org_id, CrmCall.owner_id == UUID(uid),
            CrmCall.is_active.is_(True), CrmCall.created_at >= start))
        cv = int(_cv_q.scalar() or 0)
        _ev_q = await db.execute(select(func.count(CrmEmail.id)).where(
            CrmEmail.organization_id == org_id, CrmEmail.owner_id == UUID(uid),
            CrmEmail.is_active.is_(True), CrmEmail.created_at >= start))
        ev = int(_ev_q.scalar() or 0)
        _mv_q = await db.execute(select(func.count(Meeting.id)).where(
            Meeting.organization_id == org_id, Meeting.owner_id == UUID(uid),
            Meeting.is_active.is_(True), Meeting.created_at >= start))
        mv = int(_mv_q.scalar() or 0)
        _tv_q = await db.execute(select(func.count(CrmTask.id)).where(
            CrmTask.organization_id == org_id, CrmTask.owner_id == UUID(uid),
            CrmTask.is_active.is_(True), CrmTask.created_at >= start))
        tv = int(_tv_q.scalar() or 0)
        if cv + ev + mv + tv > 0:
            activity_by_rep.append(ActivityByRep(
                rep_id=uid, rep_name=name or "Unknown",
                calls=cv, emails=ev, meetings=mv, tasks=tv, total=cv + ev + mv + tv,
            ))
    activity_by_rep.sort(key=lambda x: -x.total)

    _comp_q = await db.execute(select(func.count(CrmTask.id)).where(
        CrmTask.organization_id == org_id, CrmTask.status == "completed", CrmTask.is_active.is_(True)))
    comp = int(_comp_q.scalar() or 0)
    _ov_q = await db.execute(select(func.count(CrmTask.id)).where(
        CrmTask.organization_id == org_id, CrmTask.status == "overdue", CrmTask.is_active.is_(True)))
    ov = int(_ov_q.scalar() or 0)
    _pen_q = await db.execute(select(func.count(CrmTask.id)).where(
        CrmTask.organization_id == org_id, CrmTask.status.in_(["pending", "in_progress"]),
        CrmTask.is_active.is_(True)))
    pen = int(_pen_q.scalar() or 0)
    total_tasks = comp + ov + pen
    completed_vs_overdue = CompletedVsOverdue(
        completed=comp, overdue=ov, pending=pen, completion_rate=_pct(comp, total_tasks),
    )

    report = ActivityAnalyticsReport(
        activity_summary=activity_summary, activity_by_rep=activity_by_rep, completed_vs_overdue=completed_vs_overdue,
    )
    return {"success": True, "message": "OK", "data": report}


@router.get(
    "/lead-analytics",
    response_model=StandardResponse[LeadAnalyticsReport],
    summary="Lead Analytics Report",
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def get_lead_analytics(
    current_user: CurrentUser, db: DBSession,
    period: str = Query(default="quarter", pattern="^(week|month|quarter|year)$"),
) -> dict:
    org_id = current_user.organization_id
    start, _ = _period_bounds(period)

    total_q = await db.execute(select(func.count(Lead.id)).where(
        Lead.organization_id == org_id, Lead.is_active.is_(True), Lead.is_deleted.is_(False), Lead.created_at >= start))
    total_leads = int(total_q.scalar() or 0)

    converted_q = await db.execute(select(func.count(Lead.id)).where(
        Lead.organization_id == org_id, Lead.is_active.is_(True), Lead.is_deleted.is_(False),
        Lead.status == "converted", Lead.created_at >= start))
    total_converted = int(converted_q.scalar() or 0)

    stmt = (
        select(Lead.source, func.count(Lead.id),
               func.sum(case((Lead.status == "qualified", 1), else_=0)),
               func.sum(case((Lead.status == "converted", 1), else_=0)))
        .where(Lead.organization_id == org_id, Lead.is_active.is_(True), Lead.is_deleted.is_(False),
               Lead.created_at >= start)
        .group_by(Lead.source).order_by(func.count(Lead.id).desc())
    )
    result = await db.execute(stmt)
    source_performance = []
    for row in result.all():
        src = row[0] or "unknown"
        tot = int(row[1] or 0)
        qual = int(row[2] or 0)
        conv = int(row[3] or 0)
        source_performance.append(SourcePerformance(
            source=src, total=tot, qualified=qual, converted=conv, conversion_pct=_pct(conv, tot),
        ))

    funnel_stages = ["new", "contacted", "qualified", "proposal_sent", "negotiation", "won"]
    conversion_funnel = []
    for stage in funnel_stages:
        q = await db.execute(select(func.count(Lead.id)).where(
            Lead.organization_id == org_id, Lead.is_active.is_(True), Lead.is_deleted.is_(False),
            Lead.status == stage, Lead.created_at >= start))
        cnt = int(q.scalar() or 0)
        conversion_funnel.append(ConversionFunnelStage(
            stage=stage, count=cnt, percentage=_pct(cnt, total_leads) if total_leads else Decimal("0"),
        ))

    now = datetime.now(timezone.utc)
    aging_buckets = {"New": 0, "7+ days": 0, "14+ days": 0, "30+ days": 0}
    stmt = select(Lead.created_at).where(
        Lead.organization_id == org_id, Lead.is_active.is_(True), Lead.is_deleted.is_(False),
        Lead.status.notin_(["won", "lost", "converted"]))
    result = await db.execute(stmt)
    for row in result.all():
        created = row[0]
        if created:
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            days = (now - created).days
            if days <= 0:
                aging_buckets["New"] += 1
            elif days <= 7:
                aging_buckets["7+ days"] += 1
            elif days <= 14:
                aging_buckets["14+ days"] += 1
            else:
                aging_buckets["30+ days"] += 1
    lead_aging = [LeadAging(bucket=k, count=v) for k, v in aging_buckets.items()]

    report = LeadAnalyticsReport(
        source_performance=source_performance, conversion_funnel=conversion_funnel,
        lead_aging=lead_aging, total_leads=total_leads,
        overall_conversion_rate=_pct(total_converted, total_leads),
    )
    return {"success": True, "message": "OK", "data": report}


@router.get(
    "/deal-analytics",
    response_model=StandardResponse[DealAnalyticsReport],
    summary="Deal Analytics Report",
    dependencies=[Depends(require_role("manager", "admin"))],
)
async def get_deal_analytics(
    current_user: CurrentUser, db: DBSession,
    period: str = Query(default="quarter", pattern="^(week|month|quarter|year)$"),
) -> dict:
    org_id = current_user.organization_id
    start, end = _period_bounds(period)
    now = datetime.now(timezone.utc)
    prev_start, prev_end = _prev_period_bounds(period)

    stmt = (
        select(Deal.id, Deal.name, Deal.amount, Deal.closed_at, User.full_name, Lead.created_at)
        .outerjoin(User, Deal.owner_id == User.id)
        .outerjoin(Lead, Deal.lead_id == Lead.id)
        .where(Deal.organization_id == org_id, Deal.status == DealStatus.WON.value,
               Deal.is_active.is_(True), Deal.is_deleted.is_(False),
               Deal.closed_at >= start, Deal.closed_at < end)
        .order_by(desc(Deal.amount))
    )
    result = await db.execute(stmt)
    won_deals = []
    total_won_value = Decimal("0")
    for row in result.all():
        amt = Decimal(str(row[2] or 0))
        total_won_value += amt
        closed = row[3]
        created = row[5]
        cycle = (closed - created).days if closed and created else 0
        won_deals.append(WonDealItem(
            deal_id=str(row[0]), deal_name=row[1] or "", owner_name=row[4] or "Unknown",
            amount=amt, close_date=closed.strftime("%Y-%m-%d") if closed else "", sales_cycle_days=cycle,
        ))

    stmt = (
        select(Deal.id, Deal.name, Deal.amount, Deal.closed_at, Deal.close_reason, User.full_name)
        .outerjoin(User, Deal.owner_id == User.id)
        .where(Deal.organization_id == org_id, Deal.status == DealStatus.LOST.value,
               Deal.is_active.is_(True), Deal.is_deleted.is_(False),
               Deal.closed_at >= start, Deal.closed_at < end)
        .order_by(desc(Deal.amount))
    )
    result = await db.execute(stmt)
    lost_deals = []
    total_lost_value = Decimal("0")
    for row in result.all():
        amt = Decimal(str(row[2] or 0))
        total_lost_value += amt
        lost_deals.append(LostDealItem(
            deal_id=str(row[0]), deal_name=row[1] or "", owner_name=row[5] or "Unknown",
            amount=amt, close_date=row[3].strftime("%Y-%m-%d") if row[3] else "",
            lost_reason=row[4] or "Not specified",
        ))

    reason_counts: dict[str, int] = {}
    for d in lost_deals:
        reason = d.lost_reason or "Not specified"
        reason_counts[reason] = reason_counts.get(reason, 0) + 1
    total_lost = len(lost_deals) or 1
    lost_reason_analysis = sorted([
        LostReasonAnalysis(reason=r, count=c, percentage=_pct(c, total_lost))
        for r, c in reason_counts.items()
    ], key=lambda x: -x.count)

    curr_avg = total_won_value / len(won_deals) if won_deals else Decimal("0")
    prev_stmt = select(func.coalesce(func.sum(Deal.amount), 0), func.count(Deal.id)).where(
        Deal.organization_id == org_id, Deal.status == DealStatus.WON.value,
        Deal.is_active.is_(True), Deal.is_deleted.is_(False),
        Deal.closed_at >= prev_start, Deal.closed_at < prev_end)
    result = await db.execute(prev_stmt)
    prev_row = result.one()
    prev_revenue = Decimal(str(prev_row[0] or 0))
    prev_count = int(prev_row[1] or 0)
    prev_avg = prev_revenue / prev_count if prev_count else Decimal("0")
    avg_deal_size = DealSizeStats(
        current=curr_avg, previous=prev_avg,
        change_pct=_pct(curr_avg - prev_avg, prev_avg) if prev_avg else Decimal("0"),
    )

    stmt = (
        select(Deal.id, Deal.name, Deal.amount, Deal.expected_close_date, PipelineStage.name, User.full_name)
        .outerjoin(PipelineStage, Deal.pipeline_stage_id == PipelineStage.id)
        .outerjoin(User, Deal.owner_id == User.id)
        .where(Deal.organization_id == org_id, Deal.is_active.is_(True), Deal.is_deleted.is_(False),
               Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]),
               Deal.expected_close_date.isnot(None),
               Deal.expected_close_date <= (now + timedelta(days=14)).date(),
               Deal.expected_close_date >= now.date())
        .order_by(Deal.expected_close_date)
    )
    result = await db.execute(stmt)
    deals_closing_soon = []
    for row in result.all():
        ecd = row[3]
        days_until = (ecd - now.date()).days if ecd else 0
        deals_closing_soon.append(DealClosingSoon(
            deal_id=str(row[0]), deal_name=row[1] or "", owner_name=row[5] or "Unknown",
            amount=Decimal(str(row[2] or 0)), expected_close_date=ecd.strftime("%Y-%m-%d") if ecd else "",
            days_until=max(days_until, 0), stage=row[4] or "",
        ))

    stmt = (
        select(Deal.id, Deal.name, Deal.amount, Deal.probability, Deal.created_at,
               PipelineStage.name, User.full_name)
        .outerjoin(PipelineStage, Deal.pipeline_stage_id == PipelineStage.id)
        .outerjoin(User, Deal.owner_id == User.id)
        .where(Deal.organization_id == org_id, Deal.is_active.is_(True), Deal.is_deleted.is_(False),
               Deal.status.notin_([DealStatus.WON.value, DealStatus.LOST.value]), Deal.probability < 40)
        .order_by(Deal.probability)
    )
    result = await db.execute(stmt)
    at_risk = []
    for row in result.all():
        created = row[4]
        days_old = (now - created).days if created else 0
        at_risk.append(AtRiskDeal(
            deal_id=str(row[0]), deal_name=row[1] or "", owner_name=row[6] or "Unknown",
            stage=row[5] or "", value=Decimal(str(row[2] or 0)),
            risk_reason=f"Low probability ({row[3]}%)", days_inactive=days_old,
        ))

    report = DealAnalyticsReport(
        won_deals=won_deals[:20], lost_deals=lost_deals[:20], lost_reason_analysis=lost_reason_analysis,
        avg_deal_size=avg_deal_size, deals_closing_soon=deals_closing_soon, at_risk_deals=at_risk[:20],
        total_won=len(won_deals), total_lost=len(lost_deals),
        total_won_value=total_won_value, total_lost_value=total_lost_value,
    )
    return {"success": True, "message": "OK", "data": report}
