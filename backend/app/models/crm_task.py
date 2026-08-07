"""
CRM Task Model
Represents a to-do / follow-up task linked to any CRM entity.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.deal import Deal
    from app.models.lead import Lead
    from app.models.organization import Organization
    from app.models.user import User


class CrmTask(Base, TenantMixin):
    """A sales task / follow-up owned by a CRM user."""

    __tablename__ = "crm_tasks"

    subject: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Status / Priority ─────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending", index=True
    )
    # pending | in_progress | completed | overdue

    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium", index=True
    )
    # urgent | high | medium | low

    # ── Timing ────────────────────────────────────────────────────────────────
    due_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Reminder ─────────────────────────────────────────────────────────────
    reminder_minutes: Mapped[Optional[int]] = mapped_column(nullable=True, default=15)

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
    related_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, index=True
    )
    # lead | contact | company | deal
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
        return f"<CrmTask id={self.id} subject={self.subject!r} status={self.status!r}>"
