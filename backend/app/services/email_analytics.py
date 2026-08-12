"""
Email Analytics Service

Provides email-derived statistics for leads: inbound/outbound counts,
initiated_count, last_inbound_at, days_since_last_outbound.

All calculations are stateless — no database writes, no side-effects.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.email import Email
from app.utils.enums import EmailDirection

logger = get_logger(__name__)


# ── initiated_count rule (single source of truth) ──────────────────────
#
# An inbound email counts as a customer-initiated interaction when EITHER:
#
#   (a) It opens a thread (thread-opener from the customer — the first
#       email in the conversation is inbound), OR
#
#   (b) The customer sends another inbound email before the salesperson
#       replies (consecutive inbound — the previous email in the same
#       thread is also inbound).
#
# In other words: the customer is driving the conversation, not responding
# to a sales outbound.
# ──────────────────────────────────────────────────────────────────────


def _count_inbound_initiated(
    emails: list,
) -> tuple[int, int, int, Optional[datetime]]:
    """
    Pure-Python email statistics (no DB access).

    Parameters
    ----------
    emails : list
        Email ORM objects sorted by (sent_at ASC, created_at ASC),
        all linked to the same lead (external_entity_id == lead_id),
        active only.

    Returns
    -------
    (inbound_count, initiated_count, outbound_count, last_inbound_at)
    """
    inbound_count = 0
    initiated_count = 0
    outbound_count = 0
    last_inbound_at: Optional[datetime] = None

    # Group by thread for per-thread initiated_count
    threads: dict[str, list] = {}
    no_thread: list = []
    for e in emails:
        tid = getattr(e, "thread_id", None)
        if tid:
            threads.setdefault(tid, []).append(e)
        else:
            no_thread.append(e)

    def _process_thread(thread_emails: list) -> None:
        nonlocal inbound_count, initiated_count, outbound_count, last_inbound_at
        sorted_emails = sorted(
            thread_emails,
            key=lambda x: (x.sent_at or datetime.min.replace(tzinfo=timezone.utc)),
        )
        for i, e in enumerate(sorted_emails):
            direction = getattr(e, "direction", None)
            sent_at = getattr(e, "sent_at", None)

            if direction == EmailDirection.INBOUND.value:
                inbound_count += 1
                if sent_at and (last_inbound_at is None or sent_at > last_inbound_at):
                    last_inbound_at = sent_at
                is_first = i == 0
                prev_inbound = (
                    i > 0
                    and getattr(sorted_emails[i - 1], "direction", None)
                    == EmailDirection.INBOUND.value
                )
                if is_first or prev_inbound:
                    initiated_count += 1

            elif direction == EmailDirection.OUTBOUND.value:
                outbound_count += 1

    for thread_emails in threads.values():
        _process_thread(thread_emails)
    for e in no_thread:
        _process_thread([e])

    return inbound_count, initiated_count, outbound_count, last_inbound_at


class EmailStatsService:
    """Async DB queries + pure-Python computation for email statistics."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_lead_email_stats(
        self,
        lead_id: UUID,
        organization_id: UUID,
    ) -> dict:
        """
        Compute email statistics for a lead across all linked threads.

        Returns
        -------
        dict with keys:
            inbound_count          int
            initiated_count        int
            outbound_email_count   int
            last_inbound_at        datetime | None
            days_since_last_outbound  int | None
        """
        stmt = (
            select(Email)
            .where(
                Email.organization_id == organization_id,
                Email.external_entity_type == "lead",
                Email.external_entity_id == lead_id,
                Email.is_active.is_(True),
            )
            .order_by(Email.sent_at.asc(), Email.created_at.asc())
        )
        result = await self.db.execute(stmt)
        emails = list(result.scalars().all())

        if not emails:
            return {
                "inbound_count": 0,
                "initiated_count": 0,
                "outbound_email_count": 0,
                "last_inbound_at": None,
                "days_since_last_outbound": None,
            }

        inbound, initiated, outbound, last_inbound = _count_inbound_initiated(emails)

        days_since_outbound = None
        outbound_emails = [
            e for e in emails
            if getattr(e, "direction", None) == EmailDirection.OUTBOUND.value
            and getattr(e, "sent_at", None) is not None
        ]
        if outbound_emails:
            latest_outbound = max(e.sent_at for e in outbound_emails)
            tz = latest_outbound.tzinfo or timezone.utc
            now = datetime.now(tz)
            if latest_outbound.tzinfo is None:
                latest_outbound = latest_outbound.replace(tzinfo=timezone.utc)
            days_since_outbound = (now - latest_outbound).days

        return {
            "inbound_count": inbound,
            "initiated_count": initiated,
            "outbound_email_count": outbound,
            "last_inbound_at": last_inbound,
            "days_since_last_outbound": days_since_outbound,
        }

    async def batch_get_lead_email_stats(
        self,
        lead_ids: list[UUID],
        organization_id: UUID,
    ) -> dict[UUID, dict]:
        """
        Batch-compute email statistics for multiple leads in a single query.
        Returns a dict mapping lead_id → stats dict (same shape as get_lead_email_stats).
        """
        if not lead_ids:
            return {}

        stmt = (
            select(Email)
            .where(
                Email.organization_id == organization_id,
                Email.external_entity_type == "lead",
                Email.external_entity_id.in_(lead_ids),
                Email.is_active.is_(True),
            )
            .order_by(Email.external_entity_id, Email.sent_at.asc(), Email.created_at.asc())
        )
        result = await self.db.execute(stmt)
        all_emails = list(result.scalars().all())

        # Group by lead_id
        emails_by_lead: dict[UUID, list] = {}
        for email in all_emails:
            lid = email.external_entity_id
            if lid:
                emails_by_lead.setdefault(lid, []).append(email)

        stats_map: dict[UUID, dict] = {}
        _empty = {
            "inbound_count": 0,
            "initiated_count": 0,
            "outbound_email_count": 0,
            "last_inbound_at": None,
            "days_since_last_outbound": None,
        }
        for lead_id in lead_ids:
            emails = emails_by_lead.get(lead_id, [])
            if not emails:
                stats_map[lead_id] = _empty
                continue

            inbound, initiated, outbound, last_inbound = _count_inbound_initiated(emails)

            days_since_outbound = None
            outbound_emails = [
                e for e in emails
                if getattr(e, "direction", None) == EmailDirection.OUTBOUND.value
                and getattr(e, "sent_at", None) is not None
            ]
            if outbound_emails:
                latest_outbound = max(e.sent_at for e in outbound_emails)
                tz = latest_outbound.tzinfo or timezone.utc
                now = datetime.now(tz)
                if latest_outbound.tzinfo is None:
                    latest_outbound = latest_outbound.replace(tzinfo=timezone.utc)
                days_since_outbound = (now - latest_outbound).days

            stats_map[lead_id] = {
                "inbound_count": inbound,
                "initiated_count": initiated,
                "outbound_email_count": outbound,
                "last_inbound_at": last_inbound,
                "days_since_last_outbound": days_since_outbound,
            }

        return stats_map
