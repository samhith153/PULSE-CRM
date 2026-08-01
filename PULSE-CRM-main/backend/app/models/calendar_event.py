"""
Calendar Event Model
Stores all CRM calendar activities: meetings, calls, follow-ups, demos, tasks, etc.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.lead import Lead
    from app.models.contact import Contact
    from app.models.company import Company
    from app.models.deal import Deal
    from app.models.organization import Organization


class CalendarEvent(Base, TenantMixin):
    """
    A scheduled CRM activity on the calendar.
    """
    __tablename__ = "calendar_events"

    # ── Core fields ───────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Type / Status / Priority ──────────────────────────────────────────────
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True, default="meeting"
    )
    # meeting | call | follow_up | task | demo | reminder | personal | internal | deadline

    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="scheduled", index=True
    )
    # scheduled | completed | cancelled | rescheduled | missed | in_progress

    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium"
    )
    # low | medium | high | critical

    # ── Timing ────────────────────────────────────────────────────────────────
    start_datetime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    end_datetime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    is_all_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Location / virtual ────────────────────────────────────────────────────
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    meeting_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # ── Tenancy ───────────────────────────────────────────────────────────────
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Ownership ─────────────────────────────────────────────────────────────
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── CRM relations (all optional) ──────────────────────────────────────────
    related_lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    related_contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
    )
    related_company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
    )
    related_deal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deals.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ── Soft delete ───────────────────────────────────────────────────────────
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Reminder config (minutes before) ─────────────────────────────────────
    reminder_minutes: Mapped[Optional[int]] = mapped_column(nullable=True, default=15)

    # ── Relationships ─────────────────────────────────────────────────────────
    owner: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[owner_id], lazy="select"
    )
    related_lead: Mapped[Optional["Lead"]] = relationship(
        "Lead", foreign_keys=[related_lead_id], lazy="select"
    )
    related_contact: Mapped[Optional["Contact"]] = relationship(
        "Contact", foreign_keys=[related_contact_id], lazy="select"
    )
    related_company: Mapped[Optional["Company"]] = relationship(
        "Company", foreign_keys=[related_company_id], lazy="select"
    )
    related_deal: Mapped[Optional["Deal"]] = relationship(
        "Deal", foreign_keys=[related_deal_id], lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"<CalendarEvent id={self.id} title={self.title!r} "
            f"type={self.event_type!r} status={self.status!r}>"
        )
