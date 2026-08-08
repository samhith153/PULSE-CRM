"""
CRM Email Model
Represents a user-created email activity linked to any CRM entity.
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


class CrmEmail(Base, TenantMixin):
    """A user-created email activity logged in the CRM."""

    __tablename__ = "crm_emails"

    subject: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Email details ─────────────────────────────────────────────────────
    direction: Mapped[str] = mapped_column(String(20), nullable=False, default="outbound", index=True)
    # inbound | outbound

    recipient_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    recipient_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ── Status / Priority ─────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="completed", index=True
    )
    # pending | in_progress | completed

    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium", index=True
    )
    # urgent | high | medium | low

    # ── Timing ────────────────────────────────────────────────────────────────
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

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
        return f"<CrmEmail id={self.id} subject={self.subject!r} direction={self.direction!r}>"
