"""
Sentiment Analysis Service
Rule-based sentiment engine — no external LLM/AI required.
All analysis from live CRM text (activities, emails, notes).

RBAC: admin=org, manager=team, sales_rep=own.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.sentiment_repository import SentimentRepository
from app.schemas.ai_insights import (
    SentimentDistribution,
    SentimentItem,
    SentimentListResponse,
    SentimentMoodPoint,
    SentimentNotification,
    SentimentSummaryResponse,
    SentimentTrend,
)

# ── Sentiment score map ────────────────────────────────────────────────────────
_SCORE_MAP: dict[str, int] = {
    "Very Positive": 100,
    "Excited":        90,
    "Positive":       80,
    "Interested":     75,
    "Neutral":        50,
    "Confused":       40,
    "Negative":       25,
    "Frustrated":     15,
    "Angry":           5,
    "Very Negative":   0,
}

# ── Keyword dictionaries ──────────────────────────────────────────────────────
_KEYWORDS: dict[str, list[str]] = {
    "Very Positive": [
        "outstanding", "exceptional", "perfect", "absolutely love",
        "couldn't be happier", "best ever", "highly recommend",
        "exceeded expectations", "delighted", "fantastic",
    ],
    "Excited": [
        "excited", "thrilled", "amazing", "awesome", "can't wait",
        "looking forward", "love it", "wonderful", "incredible",
    ],
    "Positive": [
        "great", "excellent", "happy", "good", "approved", "thanks",
        "perfect", "satisfied", "helpful", "appreciate", "positive",
        "well done", "nicely done", "progressing", "on track",
    ],
    "Interested": [
        "demo", "pricing", "proposal", "quote", "meeting", "buy",
        "purchase", "next step", "interested", "schedule", "when can",
        "let's proceed", "sounds good", "tell me more", "explore",
    ],
    "Neutral": [
        "okay", "fine", "noted", "understood", "received",
        "will check", "let me know", "will review", "acknowledged",
    ],
    "Confused": [
        "clarify", "confused", "not sure", "explain", "question",
        "understand", "what do you mean", "could you elaborate",
        "unclear", "need more info",
    ],
    "Negative": [
        "issue", "problem", "delay", "not happy", "poor",
        "disappointing", "doesn't work", "unhappy", "wrong",
        "incorrect", "late", "overdue", "missing",
    ],
    "Frustrated": [
        "frustrated", "annoyed", "tired of", "keep asking",
        "already told", "still waiting", "no response", "ignored",
        "wasted time", "unacceptable",
    ],
    "Angry": [
        "angry", "furious", "unacceptable", "outrageous",
        "demand refund", "legal action", "ridiculous", "appalling",
        "disgusted", "never again",
    ],
    "Very Negative": [
        "cancel", "refund", "complaint", "lawsuit", "terrible",
        "horrible", "worst", "fraud", "scam", "misleading",
    ],
}

_COMPLAINT_KEYWORDS = [
    "complaint", "cancel", "refund", "lawsuit", "legal",
    "terrible", "fraud", "scam", "worst", "horrible",
]


# ── Rule-based engine functions ───────────────────────────────────────────────

def _analyze_text(text: str) -> tuple[str, int, int]:
    """
    Returns (sentiment_label, score, confidence).
    Confidence = f(keyword_count, phrase_coverage).
    """
    if not text or not text.strip():
        return "Neutral", 50, 30

    t = text.lower()
    hits: dict[str, int] = {}

    for label, keywords in _KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in t)
        if count:
            hits[label] = count

    if not hits:
        return "Neutral", 50, 25

    # Highest-hit label wins; ties resolved by score priority
    best = max(hits, key=lambda lbl: (hits[lbl], _SCORE_MAP[lbl]))
    total_hits = sum(hits.values())

    # Confidence: ratio of best-label hits vs total, boosted by total count
    confidence_raw = (hits[best] / max(total_hits, 1)) * 100
    # Boost for multiple keywords: up to +20 pts
    boost = min(total_hits * 4, 20)
    confidence = int(round(min(confidence_raw + boost, 100)))

    return best, _SCORE_MAP[best], confidence


def _has_complaint(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in _COMPLAINT_KEYWORDS)


def _risk_level(score: int, negative_streak: int, complaint: bool) -> str:
    if complaint or score <= 5 or negative_streak >= 3:
        return "Critical"
    if score <= 25 or negative_streak >= 2:
        return "High"
    if score <= 40:
        return "Medium"
    return "Low"


def _trend(current_avg: float, previous_avg: float) -> SentimentTrend:
    if previous_avg == 0:
        return SentimentTrend(
            trend="Stable", change="0%",
            current_avg=round(current_avg, 1),
            previous_avg=round(previous_avg, 1),
        )
    pct = ((current_avg - previous_avg) / max(previous_avg, 1)) * 100
    if pct >= 10:
        direction = "Improving"
    elif pct <= -10:
        direction = "Declining"
    else:
        direction = "Stable"
    sign = "+" if pct >= 0 else ""
    return SentimentTrend(
        trend=direction,
        change=f"{sign}{pct:.0f}%",
        current_avg=round(current_avg, 1),
        previous_avg=round(previous_avg, 1),
    )


def _recommend(
    sentiment: str,
    score: int,
    risk: str,
    negative_streak: int,
    complaint: bool,
    deal_value: float,
) -> str:
    if complaint:
        return "Close complaint immediately — assign a customer success manager and schedule a resolution call."
    if sentiment == "Angry":
        return "Customer is angry — escalate to Sales Manager and offer immediate executive callback."
    if sentiment == "Very Negative":
        return "Very negative sentiment detected — arrange a support call and review all pending issues."
    if sentiment == "Frustrated":
        return "Customer appears frustrated — send a personal apology and resolve pending issues within 24 hours."
    if negative_streak >= 3:
        return f"Three consecutive negative interactions — schedule a manager-level review call immediately."
    if sentiment == "Interested":
        return "Customer is showing buying intent — send a tailored proposal and schedule a follow-up demo."
    if sentiment == "Excited":
        return "Customer is excited — capitalize on momentum by fast-tracking the proposal and contract steps."
    if sentiment in ("Very Positive", "Positive") and deal_value >= 500_000:
        return "High-value customer with positive sentiment — prepare executive-level next steps and contract review."
    if sentiment in ("Very Positive", "Positive"):
        return "Positive sentiment — confirm next steps and request a customer testimonial or referral."
    if sentiment == "Confused":
        return "Customer seems confused — send a detailed FAQ, product brochure, or offer a clarification call."
    if score <= 40:
        return "Sentiment is declining — re-engage with a personalized email and offer product demo or discount."
    return "Review conversation history and schedule a proactive check-in call."


class SentimentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = SentimentRepository(db)

    # ── RBAC scope ────────────────────────────────────────────────────────────

    async def _scope(self, user: User):
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

    # ── Per-lead sentiment builder ────────────────────────────────────────────

    async def _build_item(
        self,
        row: dict[str, Any],
        org_id: UUID,
    ) -> SentimentItem:
        lead_id  = row.get("lead_id")
        act_text = row.get("activity_text") or ""

        # Fetch email text for this lead
        email_rows = []
        if lead_id:
            email_rows = await self.repo.fetch_lead_email_rows(org_id, lead_id)
        email_text = " ".join(
            (r.get("subject") or "") + " " + (r.get("body_preview") or "")
            for r in email_rows
        )
        full_text = act_text + " " + email_text

        # Overall sentiment
        sentiment, score, confidence = _analyze_text(full_text)
        complaint = _has_complaint(full_text)

        # Per-interaction timeline
        mood_timeline: list[SentimentMoodPoint] = []
        act_rows = []
        if lead_id:
            act_rows = await self.repo.fetch_lead_activity_rows(org_id, lead_id)

        negative_streak = 0
        max_streak = 0
        current_streak = 0
        for ar in reversed(act_rows):  # oldest→newest for streak
            text = (ar.get("title") or "") + " " + (ar.get("description") or "")
            s_label, s_score, s_conf = _analyze_text(text)
            if s_score <= 25:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0
            mood_timeline.append(SentimentMoodPoint(
                date=ar["created_at"],
                sentiment=s_label,
                score=s_score,
                confidence=s_conf,
                source_type="activity",
                title=ar.get("title"),
            ))

        for er in email_rows:
            text = (er.get("subject") or "") + " " + (er.get("body_preview") or "")
            s_label, s_score, s_conf = _analyze_text(text)
            mood_timeline.append(SentimentMoodPoint(
                date=er["sent_at"],
                sentiment=s_label,
                score=s_score,
                confidence=s_conf,
                source_type="email",
                title=er.get("subject"),
            ))

        mood_timeline.sort(
            key=lambda x: x.date if x.date.tzinfo else x.date.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        negative_streak = max_streak

        # Trend
        trend_texts = {"current": [], "previous": []}
        if lead_id:
            trend_texts = await self.repo.fetch_trend_texts(org_id, lead_id)
        cur_scores  = [_analyze_text(t)[1] for t in trend_texts["current"]  if t.strip()]
        prev_scores = [_analyze_text(t)[1] for t in trend_texts["previous"] if t.strip()]
        cur_avg  = sum(cur_scores)  / max(len(cur_scores),  1)
        prev_avg = sum(prev_scores) / max(len(prev_scores), 1)
        trend_obj = _trend(cur_avg, prev_avg)

        # Distribution
        all_sentiments = [mp.sentiment for mp in mood_timeline]
        total_pts = max(len(all_sentiments), 1)
        dist = SentimentDistribution(
            very_positive =round(all_sentiments.count("Very Positive")  / total_pts * 100, 1),
            positive      =round(all_sentiments.count("Positive")       / total_pts * 100, 1),
            neutral       =round(all_sentiments.count("Neutral")        / total_pts * 100, 1),
            negative      =round(all_sentiments.count("Negative")       / total_pts * 100, 1),
            very_negative =round(all_sentiments.count("Very Negative")  / total_pts * 100, 1),
            interested    =round(all_sentiments.count("Interested")     / total_pts * 100, 1),
            frustrated    =round(all_sentiments.count("Frustrated")     / total_pts * 100, 1),
            excited       =round(all_sentiments.count("Excited")        / total_pts * 100, 1),
            confused      =round(all_sentiments.count("Confused")       / total_pts * 100, 1),
            angry         =round(all_sentiments.count("Angry")          / total_pts * 100, 1),
        )

        deal_value = float(row.get("deal_amount") or 0)
        risk = _risk_level(score, negative_streak, complaint)
        recommendation = _recommend(sentiment, score, risk, negative_streak, complaint, deal_value)

        last_at = row.get("last_activity_at")
        if last_at and hasattr(last_at, "tzinfo") and last_at.tzinfo is None:
            last_at = last_at.replace(tzinfo=timezone.utc)

        return SentimentItem(
            lead_id=lead_id,
            customer=row.get("lead_name") or row.get("company_name") or "Unknown",
            owner=row.get("owner_name"),
            owner_id=row.get("owner_id"),
            company=row.get("company_name"),
            deal_name=row.get("deal_name"),
            deal_value=deal_value,
            sentiment=sentiment,
            score=score,
            confidence=confidence,
            trend=trend_obj.trend,
            change=trend_obj.change,
            risk=risk,
            recommendation=recommendation,
            mood_timeline=mood_timeline[:10],
            distribution=dist,
            total_interactions=int(row.get("activity_count") or 0) + len(email_rows),
            negative_streak=negative_streak,
            last_interaction_at=last_at,
        )

    # ── Public: list ──────────────────────────────────────────────────────────

    async def get_sentiment_list(
        self,
        user: User,
        *,
        page: int = 1,
        page_size: int = 20,
        owner_id: UUID | None = None,
        lead_id: UUID | None = None,
        company_id: UUID | None = None,
        deal_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        sentiment_filter: str | None = None,
        sort: str = "interaction_date",
    ) -> SentimentListResponse:
        user_id, team_ids = await self._scope(user)
        if owner_id:
            user_id, team_ids = owner_id, None

        rows = await self.repo.fetch_interactions(
            user.organization_id, user_id, team_ids,
            lead_id=lead_id, company_id=company_id, deal_id=deal_id,
            date_from=date_from, date_to=date_to,
        )

        items = []
        for r in rows:
            item = await self._build_item(r, user.organization_id)
            items.append(item)

        # Filter by sentiment
        if sentiment_filter:
            items = [i for i in items if i.sentiment.lower() == sentiment_filter.lower()]

        # Sort
        if sort == "score":
            items.sort(key=lambda x: x.score, reverse=True)
        elif sort == "risk":
            _ro = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
            items.sort(key=lambda x: _ro.get(x.risk, 0), reverse=True)
        else:
            items.sort(
                key=lambda x: x.last_interaction_at or datetime.min.replace(tzinfo=timezone.utc),
                reverse=True,
            )

        total = len(items)
        start = (page - 1) * page_size
        total_pages = max(1, math.ceil(total / page_size))
        return SentimentListResponse(
            total_records=total,
            page=page,
            page_size=page_size,
            has_next=page < total_pages,
            data=items[start: start + page_size],
        )

    # ── Public: summary ───────────────────────────────────────────────────────

    async def get_summary(self, user: User) -> SentimentSummaryResponse:
        result = await self.get_sentiment_list(user, page=1, page_size=500)
        items = result.data

        if not items:
            return SentimentSummaryResponse(
                averageScore=0, positive=0, neutral=0, negative=0,
                interested=0, frustrated=0, highRiskCustomers=0,
                improvingCustomers=0, decliningCustomers=0,
                averageConfidence=0, total_analyzed=0,
            )

        avg_score      = round(sum(i.score for i in items) / len(items), 1)
        avg_conf       = round(sum(i.confidence for i in items) / len(items), 1)
        positive       = sum(1 for i in items if i.sentiment in ("Very Positive", "Positive", "Excited"))
        neutral        = sum(1 for i in items if i.sentiment == "Neutral")
        negative       = sum(1 for i in items if i.sentiment in ("Negative", "Very Negative", "Angry", "Frustrated"))
        interested     = sum(1 for i in items if i.sentiment == "Interested")
        frustrated     = sum(1 for i in items if i.sentiment in ("Frustrated", "Angry"))
        high_risk      = sum(1 for i in items if i.risk in ("Critical", "High"))
        improving      = sum(1 for i in items if i.trend == "Improving")
        declining      = sum(1 for i in items if i.trend == "Declining")

        return SentimentSummaryResponse(
            averageScore=avg_score,
            positive=positive,
            neutral=neutral,
            negative=negative,
            interested=interested,
            frustrated=frustrated,
            highRiskCustomers=high_risk,
            improvingCustomers=improving,
            decliningCustomers=declining,
            averageConfidence=avg_conf,
            total_analyzed=len(items),
        )

    # ── Public: timeline ──────────────────────────────────────────────────────

    async def get_timeline(
        self,
        user: User,
        lead_id: UUID | None = None,
    ) -> list[SentimentMoodPoint]:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id

        if lead_id:
            act_rows   = await self.repo.fetch_lead_activity_rows(org_id, lead_id)
            email_rows = await self.repo.fetch_lead_email_rows(org_id, lead_id)
        else:
            # Aggregate across all accessible leads — sample first 100 acts
            from app.models.activity import ActivityTimeline
            from sqlalchemy import select as _select
            q = (
                _select(
                    ActivityTimeline.id,
                    ActivityTimeline.action,
                    ActivityTimeline.title,
                    ActivityTimeline.description,
                    ActivityTimeline.created_at,
                )
                .where(ActivityTimeline.organization_id == org_id)
                .order_by(ActivityTimeline.created_at.desc())
                .limit(100)
            )
            if user_id is not None:
                q = q.where(ActivityTimeline.created_by == user_id)
            elif team_ids is not None:
                q = q.where(ActivityTimeline.created_by.in_(team_ids))
            r = await self.db.execute(q)
            act_rows   = [dict(row) for row in r.mappings().all()]
            email_rows = []

        points: list[SentimentMoodPoint] = []
        for ar in act_rows:
            text = (ar.get("title") or "") + " " + (ar.get("description") or "")
            s, sc, conf = _analyze_text(text)
            points.append(SentimentMoodPoint(
                date=ar["created_at"],
                sentiment=s, score=sc, confidence=conf,
                source_type="activity", title=ar.get("title"),
            ))
        for er in email_rows:
            text = (er.get("subject") or "") + " " + (er.get("body_preview") or "")
            s, sc, conf = _analyze_text(text)
            points.append(SentimentMoodPoint(
                date=er["sent_at"],
                sentiment=s, score=sc, confidence=conf,
                source_type="email", title=er.get("subject"),
            ))

        points.sort(
            key=lambda x: x.date if x.date.tzinfo else x.date.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        return points[:50]

    # ── Public: notifications ─────────────────────────────────────────────────

    async def get_notifications(self, user: User) -> list[SentimentNotification]:
        result = await self.get_sentiment_list(user, page=1, page_size=100)
        alerts: list[SentimentNotification] = []
        seen: set = set()

        for item in result.data:
            lid = item.lead_id

            if item.sentiment == "Very Negative":
                key = (lid, "very_negative")
                if key not in seen:
                    seen.add(key)
                    alerts.append(SentimentNotification(
                        lead_id=lid, customer=item.customer,
                        type="very_negative", severity="critical",
                        message=f"Very Negative sentiment detected — {item.customer}. Immediate action required.",
                    ))

            if item.sentiment == "Angry":
                key = (lid, "angry")
                if key not in seen:
                    seen.add(key)
                    alerts.append(SentimentNotification(
                        lead_id=lid, customer=item.customer,
                        type="angry", severity="critical",
                        message=f"Customer is angry — {item.customer}. Escalate to Sales Manager immediately.",
                    ))

            if item.negative_streak >= 3:
                key = (lid, "consecutive_negative")
                if key not in seen:
                    seen.add(key)
                    alerts.append(SentimentNotification(
                        lead_id=lid, customer=item.customer,
                        type="consecutive_negative", severity="high",
                        message=f"{item.negative_streak} consecutive negative interactions — {item.customer}.",
                    ))

            if item.deal_value >= 500_000 and item.trend == "Declining":
                key = (lid, "high_value_decline")
                if key not in seen:
                    seen.add(key)
                    alerts.append(SentimentNotification(
                        lead_id=lid, customer=item.customer,
                        type="high_value_decline", severity="high",
                        message=f"High-value customer sentiment declining — {item.customer} (₹{int(item.deal_value):,}).",
                    ))

            if item.risk == "Critical":
                key = (lid, "complaint_detected")
                if key not in seen:
                    seen.add(key)
                    alerts.append(SentimentNotification(
                        lead_id=lid, customer=item.customer,
                        type="complaint_detected", severity="critical",
                        message=f"Critical risk customer — {item.customer}. Complaint signals detected.",
                    ))

        sev = {"critical": 3, "high": 2, "medium": 1}
        alerts.sort(key=lambda a: sev.get(a.severity, 0), reverse=True)
        return alerts[:50]
