"""
Conversation Intelligence Service
Analyzes calls, meetings, emails, notes → engagement score,
quality score, buying signals, objection detection, action items,
recommendations, and timeline.
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
from app.repositories.conversation_intelligence_repository import (
    ConversationIntelligenceRepository,
    _CALL_ACTIONS,
    _MEETING_ACTIONS,
    _NOTE_ACTIONS,
)
from app.schemas.ai_insights import (
    ActionItemDetected,
    BuyingSignal,
    ConversationDetailResponse,
    ConversationIntelligenceSummaryResponse,
    ConversationItem,
    ConversationListResponse,
    ConversationNotification,
    ConversationQualityComponents,
    ConversationTimelineEntry,
    EngagementScoreComponents,
    ObjectionDetected,
)

# ── Signal keyword catalogs ───────────────────────────────────────────────────

_BUYING_KEYWORDS = {
    "Pricing Request":      ["pric", "cost", "fee", "rate", "quote"],
    "Budget Discussion":    ["budget", "fund", "allocat", "invest"],
    "Requested Demo":       ["demo", "show", "walkthrough", "trial"],
    "Proposal Requested":   ["proposal", "rfp", "bid", "offer"],
    "Timeline Discussion":  ["timeline", "deadline", "launch", "go-live"],
    "Security Questions":   ["security", "complian", "gdpr", "iso", "audit"],
    "Technical Evaluation": ["technical", "integration", "api", "architect"],
    "Purchase Approval":    ["approv", "sign", "purchase order", "po"],
    "Decision Maker Joined":["ceo", "cto", "director", "vp", "head of", "exec"],
    "Contract Review":      ["contract", "agreement", "sla", "nda", "legal"],
}

_OBJECTION_KEYWORDS = {
    "Too Expensive":   (["expensive", "costly", "price too high", "unaffordable"], "High"),
    "Need Approval":   (["need approval", "check with", "manager", "board"], "Medium"),
    "No Budget":       (["no budget", "budget cut", "freeze", "not allocated"], "High"),
    "Using Competitor":(["competitor", "already using", "vendor", "alternative"], "High"),
    "Not Interested":  (["not interested", "no longer", "cancelled", "opt out"], "High"),
    "Need More Time":  (["more time", "not ready", "later", "next quarter"], "Medium"),
    "Security Concern":(["security concern", "data privacy", "breach", "risk"], "Medium"),
    "Integration Issue":(["integration", "not compatible", "legacy", "technical barrier"], "Medium"),
}

_ACTION_KEYWORDS = {
    "Send Proposal":         ["proposal", "send quote", "rfp"],
    "Arrange Demo":          ["demo", "demo request", "product show"],
    "Schedule Follow-up":    ["follow-up", "follow up", "callback"],
    "Call Customer":         ["call", "phone", "reach out"],
    "Send Pricing":          ["send pricing", "price list", "cost sheet"],
    "Review Contract":       ["review contract", "legal review", "sign"],
    "Technical Meeting":     ["technical meeting", "architecture review", "it team"],
    "Escalate to Manager":   ["escalate", "manager review", "senior"],
}


def _scan_text(text: str | None, catalog: dict) -> list[str]:
    if not text:
        return []
    t = text.lower()
    return [label for label, kws in catalog.items() if any(k in t for k in kws)]


def _scan_buying(text: str | None) -> list[BuyingSignal]:
    if not text:
        return []
    t = text.lower()
    signals = []
    for label, kws in _BUYING_KEYWORDS.items():
        matches = sum(1 for k in kws if k in t)
        if matches:
            confidence = "High" if matches >= 2 else "Medium" if matches == 1 else "Low"
            signals.append(BuyingSignal(signal=label, confidence=confidence))
    return signals


def _scan_objections(text: str | None) -> list[ObjectionDetected]:
    if not text:
        return []
    t = text.lower()
    objs = []
    for label, (kws, severity) in _OBJECTION_KEYWORDS.items():
        if any(k in t for k in kws):
            objs.append(ObjectionDetected(
                type=label,
                severity=severity,
                description=f"Detected in conversation: '{label}' signal found.",
            ))
    return objs


def _scan_actions(text: str | None) -> list[ActionItemDetected]:
    if not text:
        return []
    t = text.lower()
    actions = []
    for label, kws in _ACTION_KEYWORDS.items():
        if any(k in t for k in kws):
            priority = "High" if label in (
                "Send Proposal", "Arrange Demo", "Call Customer", "Escalate to Manager"
            ) else "Medium"
            actions.append(ActionItemDetected(title=label, priority=priority))
    return actions


def _health_status(score: int) -> str:
    if score >= 90: return "Excellent"
    if score >= 75: return "Healthy"
    if score >= 50: return "Average"
    return "Needs Attention"


def _conv_type(action: str) -> str:
    if action in _CALL_ACTIONS:    return "Call"
    if action in _MEETING_ACTIONS: return "Meeting"
    if action in _NOTE_ACTIONS:    return "Internal Note"
    return "Activity"


class ConversationIntelligenceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ConversationIntelligenceRepository(db)

    # ── RBAC ──────────────────────────────────────────────────────────────────

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

    # ── Engagement score ──────────────────────────────────────────────────────

    def _engagement_score(self, sig: dict[str, Any]) -> tuple[int, EngagementScoreComponents]:
        """
        Email Replies 20% + Meetings Attended 20% + Calls Completed 20%
        + Response Time 15% + Notes Added 10% + Follow-ups Completed 15%
        Normalize 0-100.
        """
        email_raw   = min(sig["email_replies"] * 25.0,  100.0)
        mtg_raw     = min(sig["meetings_attended"] * 20.0, 100.0)
        calls_raw   = min(sig["calls"] * 20.0,          100.0)
        # Response time: fast = high score (< 1 day = 100, > 7 days = 0)
        days_wait   = sig["days_since_last"]
        resp_raw    = max(0.0, 100.0 - days_wait * 14.0)
        notes_raw   = min(sig["notes"] * 20.0,          100.0)
        # Follow-ups completed proxied by recent activity
        followup_raw = min(sig["recent_acts"] * 15.0,   100.0)

        score = (
            email_raw    * 0.20
            + mtg_raw    * 0.20
            + calls_raw  * 0.20
            + resp_raw   * 0.15
            + notes_raw  * 0.10
            + followup_raw * 0.15
        )
        components = EngagementScoreComponents(
            email_replies=round(email_raw,    1),
            meetings_attended=round(mtg_raw,  1),
            calls_completed=round(calls_raw,  1),
            response_time=round(resp_raw,     1),
            notes_added=round(notes_raw,      1),
            followups_completed=round(followup_raw, 1),
        )
        return int(round(min(score, 100))), components

    # ── Quality score ─────────────────────────────────────────────────────────

    def _quality_score(
        self,
        sig: dict[str, Any],
        buying_signals: list,
        objections: list,
        action_items: list,
    ) -> tuple[int, ConversationQualityComponents]:
        """
        Customer Participation 25% + Positive Responses 20%
        + Questions Asked 15% + Action Items Created 15%
        + Buying Signals 15% + Objections Resolved 10%
        """
        participation_raw = min(
            (sig["calls"] + sig["meetings_attended"]) * 15.0, 100.0
        )
        # Positive responses = email replies + inbound signals
        positive_raw  = min(sig["email_replies"] * 30.0 + sig["recent_acts"] * 10.0, 100.0)
        questions_raw = min(sig["notes"] * 15.0, 100.0)   # notes proxy questions asked
        actions_raw   = min(len(action_items) * 20.0, 100.0)
        buying_raw    = min(len(buying_signals) * 20.0, 100.0)
        # Objections resolved: fewer cancelled meetings = better
        resolved_raw  = max(0.0, 100.0 - sig["meetings_cancelled"] * 30.0)

        score = (
            participation_raw * 0.25
            + positive_raw    * 0.20
            + questions_raw   * 0.15
            + actions_raw     * 0.15
            + buying_raw      * 0.15
            + resolved_raw    * 0.10
        )
        components = ConversationQualityComponents(
            customer_participation=round(participation_raw, 1),
            positive_responses=round(positive_raw,    1),
            questions_asked=round(questions_raw,       1),
            action_items_created=round(actions_raw,    1),
            buying_signals=round(buying_raw,           1),
            objections_resolved=round(resolved_raw,    1),
        )
        return int(round(min(score, 100))), components

    # ── Dynamic summary builder ───────────────────────────────────────────────

    def _build_summary(self, row: dict, buying: list, objections: list) -> str:
        parts = []
        desc = row.get("description") or row.get("body_preview") or ""
        title = row.get("title") or row.get("subject") or ""
        if title:
            parts.append(f"Conversation: {title}.")
        if desc:
            preview = desc[:120].rstrip()
            parts.append(preview + ("..." if len(desc) > 120 else "."))
        if buying:
            parts.append(f"Buying signals detected: {', '.join(b.signal for b in buying[:3])}.")
        if objections:
            parts.append(f"Objections raised: {', '.join(o.type for o in objections[:2])}.")
        return " ".join(parts) if parts else "No details available for this conversation."

    # ── Dynamic recommendations ───────────────────────────────────────────────

    def _recommendations(
        self,
        engagement: int,
        quality: int,
        buying: list,
        objections: list,
        actions: list,
        days_inactive: int,
    ) -> list[str]:
        recs = []
        if engagement < 40:
            recs.append("Engagement is low — reach out with a personalized re-engagement email or call.")
        if days_inactive >= 7:
            recs.append(f"No interaction for {days_inactive} days — follow up within 24 hours.")
        if any(b.signal == "Requested Demo" for b in buying):
            recs.append("Demo requested — schedule a product walkthrough at the earliest convenience.")
        if any(b.signal == "Proposal Requested" for b in buying):
            recs.append("Proposal requested — prepare and send a tailored proposal within 24 hours.")
        if any(b.signal == "Decision Maker Joined" for b in buying):
            recs.append("Decision maker involved — schedule an executive-level presentation.")
        if any(b.signal == "Contract Review" for b in buying):
            recs.append("Contract review stage — loop in legal/finance team and prepare final terms.")
        if any(o.type == "Too Expensive" for o in objections):
            recs.append("Price objection detected — prepare a revised pricing or ROI analysis.")
        if any(o.type == "Using Competitor" for o in objections):
            recs.append("Competitor mention — send a competitive comparison and customer success story.")
        if any(o.type == "No Budget" for o in objections):
            recs.append("Budget constraint — explore phased payment or a trimmed starter package.")
        if any(a.title == "Arrange Demo" for a in actions):
            recs.append("Arrange demo is a pending action — confirm a time slot with the customer.")
        if quality >= 75 and engagement >= 75:
            recs.append("High-quality conversation — capitalize on momentum by sending next-step confirmation.")
        if not recs:
            recs.append("Review account status and schedule a check-in call to confirm next steps.")
        return recs[:5]

    # ── Row → ConversationItem ────────────────────────────────────────────────

    def _build_item_from_row(self, row: dict, conv_type: str, sig: dict) -> ConversationItem:
        """Build a ConversationItem from a row dict and pre-fetched signals (no DB calls)."""
        text = (
            (row.get("description") or "")
            + " " + (row.get("body_preview") or "")
            + " " + (row.get("title") or row.get("subject") or "")
        )
        buying  = _scan_buying(text)
        objects_ = _scan_objections(text)
        actions = _scan_actions(text)

        eng_score, eng_comp = self._engagement_score(sig)
        qua_score, qua_comp = self._quality_score(sig, buying, objects_, actions)
        summary = self._build_summary(row, buying, objects_)
        recs = self._recommendations(
            eng_score, qua_score, buying, objects_, actions,
            sig["days_since_last"],
        )

        return ConversationItem(
            id=row["id"],
            type=conv_type,
            title=row.get("title") or row.get("subject") or conv_type,
            date=row.get("created_at") or row.get("sent_at"),
            owner=row.get("owner_name"),
            owner_id=row.get("created_by") or row.get("owner_id"),
            related_lead=row.get("lead_name"),
            related_lead_id=row.get("lead_id"),
            related_deal=row.get("deal_name"),
            related_deal_id=row.get("deal_id"),
            related_company=row.get("company_name"),
            related_contact=(
                f"{row.get('contact_first','')} {row.get('contact_last','')}".strip() or None
            ),
            summary=summary,
            engagement_score=eng_score,
            quality_score=qua_score,
            health_status=_health_status(min(eng_score, qua_score)),
            buying_signals=buying,
            objections=objects_,
            action_items=actions,
            recommendations=recs,
            description=row.get("description") or row.get("body_preview"),
        )

    async def _to_item(self, row: dict, conv_type: str) -> ConversationItem:
        entity_id   = row.get("lead_id") or row.get("deal_id") or row.get("id")
        entity_type = "lead" if row.get("lead_id") else "deal" if row.get("deal_id") else "system"
        sig         = await self.repo.get_entity_signals(
            row.get("organization_id") or UUID(int=0),
            entity_id,
            entity_type,
        ) if entity_id else {
            "calls": 0, "meetings": 0, "meetings_attended": 0,
            "meetings_cancelled": 0, "notes": 0, "recent_acts": 0,
            "email_total": 0, "email_replies": 0, "days_since_last": 999,
            "last_activity_at": None,
        }

        text = (
            (row.get("description") or "")
            + " " + (row.get("body_preview") or "")
            + " " + (row.get("title") or row.get("subject") or "")
        )
        buying  = _scan_buying(text)
        objects_ = _scan_objections(text)
        actions = _scan_actions(text)

        eng_score, eng_comp = self._engagement_score(sig)
        qua_score, qua_comp = self._quality_score(sig, buying, objects_, actions)
        summary = self._build_summary(row, buying, objects_)
        recs = self._recommendations(
            eng_score, qua_score, buying, objects_, actions,
            sig["days_since_last"],
        )

        return ConversationItem(
            id=row["id"],
            type=conv_type,
            title=row.get("title") or row.get("subject") or conv_type,
            date=row.get("created_at") or row.get("sent_at"),
            owner=row.get("owner_name"),
            owner_id=row.get("created_by") or row.get("owner_id"),
            related_lead=row.get("lead_name"),
            related_lead_id=row.get("lead_id"),
            related_deal=row.get("deal_name"),
            related_deal_id=row.get("deal_id"),
            related_company=row.get("company_name"),
            related_contact=(
                f"{row.get('contact_first','')} {row.get('contact_last','')}".strip() or None
            ),
            summary=summary,
            engagement_score=eng_score,
            quality_score=qua_score,
            health_status=_health_status(min(eng_score, qua_score)),
            buying_signals=buying,
            objections=objects_,
            action_items=actions,
            recommendations=recs,
            description=row.get("description") or row.get("body_preview"),
        )

    # ── Public: list ──────────────────────────────────────────────────────────

    async def get_conversations(
        self,
        user: User,
        *,
        page: int = 1,
        page_size: int = 20,
        conversation_type: str | None = None,
        lead_id: UUID | None = None,
        company_id: UUID | None = None,
        deal_id: UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        owner_id_filter: UUID | None = None,
    ) -> ConversationListResponse:
        user_id, team_ids = await self._scope(user)
        if owner_id_filter:
            user_id = owner_id_filter
            team_ids = None

        org_id = user.organization_id
        skip_email = conversation_type and conversation_type.lower() not in ("email",)
        skip_act   = conversation_type and conversation_type.lower() == "email"

        # Fetch a bounded batch from each source instead of ALL rows.
        # We fetch page_size * 3 to have enough for sorting + pagination after merge.
        fetch_limit = page_size * 3

        raw_items: list[tuple[dict, str]] = []

        if not skip_act:
            act_rows = await self.repo.fetch_activity_conversations(
                org_id, user_id, team_ids,
                conversation_type=conversation_type,
                lead_id=lead_id, company_id=company_id, deal_id=deal_id,
                date_from=date_from, date_to=date_to,
                limit=fetch_limit,
            )
            for r in act_rows:
                r["organization_id"] = org_id
                raw_items.append((r, _conv_type(r["action"])))

        if not skip_email:
            email_rows = await self.repo.fetch_email_conversations(
                org_id, user_id, team_ids,
                lead_id=lead_id, company_id=company_id, deal_id=deal_id,
                date_from=date_from, date_to=date_to,
                limit=fetch_limit,
            )
            for r in email_rows:
                r["organization_id"] = org_id
                r["created_by"] = r.get("owner_id")
                r["title"] = r.get("subject")
                r["description"] = r.get("body_preview")
                r["created_at"] = r.get("sent_at")
                raw_items.append((r, "Email"))

        # Batch-fetch entity signals for all unique entities (eliminates N+1)
        entities = []
        for r, _ in raw_items:
            eid = r.get("lead_id") or r.get("deal_id") or r.get("id")
            if eid:
                etype = "lead" if r.get("lead_id") else "deal" if r.get("deal_id") else "system"
                entities.append((eid, etype))
        unique_entities = list({eid: etype for eid, etype in entities}.items())
        signals_map = await self.repo.get_entity_signals_batch(org_id, unique_entities)

        # Build items with pre-fetched signals
        items = []
        for r, conv_type in raw_items:
            entity_id = r.get("lead_id") or r.get("deal_id") or r.get("id")
            sig = signals_map.get(entity_id, {
                "calls": 0, "meetings": 0, "meetings_attended": 0,
                "meetings_cancelled": 0, "notes": 0, "recent_acts": 0,
                "email_total": 0, "email_replies": 0, "days_since_last": 999,
                "last_activity_at": None,
            })
            items.append(self._build_item_from_row(r, conv_type, sig))

        items.sort(key=lambda x: x.date or datetime.min.replace(tzinfo=timezone.utc), reverse=True)

        total = len(items)
        start = (page - 1) * page_size
        total_pages = max(1, math.ceil(total / page_size))
        return ConversationListResponse(
            total_records=total,
            page=page,
            page_size=page_size,
            has_next=page < total_pages,
            data=items[start: start + page_size],
        )

    # ── Public: detail ────────────────────────────────────────────────────────

    async def get_conversation_detail(
        self, user: User, conversation_id: UUID
    ) -> ConversationDetailResponse:
        user_id, team_ids = await self._scope(user)
        org_id = user.organization_id

        # Try activity first — single-row fetch by ID (no full-table scan)
        row = await self.repo.fetch_activity_conversation_by_id(
            org_id, user_id, team_ids, conversation_id,
        )
        if row:
            row["organization_id"] = org_id
            entity_id = row.get("lead_id") or row.get("deal_id") or row.get("id")
            entity_type = "lead" if row.get("lead_id") else "deal" if row.get("deal_id") else "system"
            sig = await self.repo.get_entity_signals(org_id, entity_id, entity_type) if entity_id else {
                "calls": 0, "meetings": 0, "meetings_attended": 0,
                "meetings_cancelled": 0, "notes": 0, "recent_acts": 0,
                "email_total": 0, "email_replies": 0, "days_since_last": 999,
                "last_activity_at": None,
            }
            item = self._build_item_from_row(row, _conv_type(row["action"]), sig)
        else:
            # Try email — single-row fetch by ID
            row = await self.repo.fetch_email_conversation_by_id(
                org_id, user_id, team_ids, conversation_id,
            )
            if not row:
                from app.core.exceptions import NotFoundException
                raise NotFoundException("Conversation", conversation_id)
            row["organization_id"] = org_id
            row["created_by"] = row.get("owner_id")
            row["title"] = row.get("subject")
            row["description"] = row.get("body_preview")
            row["created_at"] = row.get("sent_at")
            entity_id = row.get("lead_id") or row.get("deal_id") or row.get("id")
            entity_type = "lead" if row.get("lead_id") else "deal" if row.get("deal_id") else "system"
            sig = await self.repo.get_entity_signals(org_id, entity_id, entity_type) if entity_id else {
                "calls": 0, "meetings": 0, "meetings_attended": 0,
                "meetings_cancelled": 0, "notes": 0, "recent_acts": 0,
                "email_total": 0, "email_replies": 0, "days_since_last": 999,
                "last_activity_at": None,
            }
            item = self._build_item_from_row(row, "Email", sig)

        # Build timeline for entity
        entity_id = item.related_lead_id or item.related_deal_id
        entity_type = "lead" if item.related_lead_id else "deal"
        timeline: list[ConversationTimelineEntry] = []
        if entity_id:
            t_rows = await self.repo.fetch_activity_conversations(
                org_id, user_id, team_ids,
                lead_id=entity_id if entity_type == "lead" else None,
                deal_id=entity_id if entity_type == "deal" else None,
            )
            for tr in t_rows[:20]:
                timeline.append(ConversationTimelineEntry(
                    id=tr["id"],
                    type=_conv_type(tr["action"]),
                    title=tr["title"],
                    date=tr["created_at"],
                    owner=tr.get("owner_name"),
                    owner_id=tr.get("created_by"),
                    description=tr.get("description"),
                    entity_type=tr.get("entity_type"),
                    entity_id=tr.get("entity_id"),
                ))

        sig = await self.repo.get_entity_signals(org_id, entity_id or conversation_id, entity_type)
        _, eng_comp = self._engagement_score(sig)
        _, qua_comp = self._quality_score(sig, item.buying_signals, item.objections, item.action_items)

        return ConversationDetailResponse(
            id=item.id,
            type=item.type,
            summary=item.summary,
            engagement_score=item.engagement_score,
            quality_score=item.quality_score,
            health_status=item.health_status,
            buying_signals=item.buying_signals,
            objections=item.objections,
            action_items=item.action_items,
            recommendations=item.recommendations,
            timeline=timeline,
            engagement_components=eng_comp,
            quality_components=qua_comp,
        )

    # ── Public: timeline ──────────────────────────────────────────────────────

    async def get_timeline(
        self, user: User,
        lead_id: UUID | None = None,
        deal_id: UUID | None = None,
    ) -> list[ConversationTimelineEntry]:
        user_id, team_ids = await self._scope(user)
        rows = await self.repo.fetch_activity_conversations(
            user.organization_id, user_id, team_ids,
            lead_id=lead_id, deal_id=deal_id,
        )
        entries = [
            ConversationTimelineEntry(
                id=r["id"],
                type=_conv_type(r["action"]),
                title=r["title"],
                date=r["created_at"],
                owner=r.get("owner_name"),
                owner_id=r.get("created_by"),
                description=r.get("description"),
                entity_type=r.get("entity_type"),
                entity_id=r.get("entity_id"),
            )
            for r in rows
        ]
        entries.sort(key=lambda x: x.date or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
        return entries

    # ── Public: summary ───────────────────────────────────────────────────────

    async def get_summary(self, user: User) -> ConversationIntelligenceSummaryResponse:
        user_id, team_ids = await self._scope(user)
        counts = await self.repo.get_summary_counts(user.organization_id, user_id, team_ids)

        # Avg scores: sample first page
        result = await self.get_conversations(user, page=1, page_size=20)
        items = result.data
        avg_eng = round(sum(i.engagement_score for i in items) / max(len(items), 1), 1)
        avg_qua = round(sum(i.quality_score for i in items) / max(len(items), 1), 1)

        return ConversationIntelligenceSummaryResponse(
            total_conversations=counts["total_conversations"],
            calls=counts["calls"],
            meetings=counts["meetings"],
            emails=counts["emails"],
            notes=counts["notes"],
            average_engagement=avg_eng,
            average_quality=avg_qua,
            buying_signals=counts["buying_signals"],
            open_actions=counts["open_actions"],
        )

    # ── Public: notifications ─────────────────────────────────────────────────

    async def get_notifications(self, user: User) -> list[ConversationNotification]:
        user_id, team_ids = await self._scope(user)
        result  = await self.get_conversations(user, page=1, page_size=50)
        no_resp = await self.repo.get_no_response_entities(
            user.organization_id, user_id, team_ids
        )

        alerts: list[ConversationNotification] = []
        seen: set = set()

        for item in result.data:
            pid = item.id

            # High buying signal
            critical_buys = [b for b in item.buying_signals if b.confidence == "High"]
            if critical_buys:
                key = (pid, "buying_signal")
                if key not in seen:
                    seen.add(key)
                    alerts.append(ConversationNotification(
                        conversation_id=pid,
                        title=item.title,
                        type="buying_signal",
                        severity="critical",
                        message=f"High buying signal: {critical_buys[0].signal} — {item.related_lead or item.related_deal}.",
                    ))

            # Critical objection
            critical_obs = [o for o in item.objections if o.severity == "High"]
            if critical_obs:
                key = (pid, "critical_objection")
                if key not in seen:
                    seen.add(key)
                    alerts.append(ConversationNotification(
                        conversation_id=pid,
                        title=item.title,
                        type="critical_objection",
                        severity="high",
                        message=f"Critical objection: {critical_obs[0].type} — {item.related_lead or item.related_deal}.",
                    ))

            # Proposal requested
            if any(b.signal == "Proposal Requested" for b in item.buying_signals):
                key = (pid, "proposal_requested")
                if key not in seen:
                    seen.add(key)
                    alerts.append(ConversationNotification(
                        conversation_id=pid,
                        title=item.title,
                        type="proposal_requested",
                        severity="high",
                        message=f"Proposal requested by {item.related_lead or item.related_company} — action required.",
                    ))

            # Decision maker identified
            if any(b.signal == "Decision Maker Joined" for b in item.buying_signals):
                key = (pid, "decision_maker")
                if key not in seen:
                    seen.add(key)
                    alerts.append(ConversationNotification(
                        conversation_id=pid,
                        title=item.title,
                        type="decision_maker",
                        severity="critical",
                        message=f"Decision maker involved — {item.related_lead}. Escalate conversation.",
                    ))

        # No response 7+ days
        for nr in no_resp[:10]:
            key = (nr["lead_id"], "no_response")
            if key not in seen:
                seen.add(key)
                alerts.append(ConversationNotification(
                    conversation_id=nr["lead_id"],
                    title=f"No response — {nr['lead_name']}",
                    type="no_response",
                    severity="high",
                    message=f"No customer interaction for 7+ days — {nr['lead_name']}.",
                ))

        sev_order = {"critical": 3, "high": 2, "medium": 1}
        alerts.sort(key=lambda a: sev_order.get(a.severity, 0), reverse=True)
        return alerts[:50]
