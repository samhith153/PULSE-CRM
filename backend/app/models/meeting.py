"""
Meeting Model
Dedicated CRM meeting records for owner-scoped schedules and dashboard data.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
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


class Meeting(Base, TenantMixin):
    """A scheduled sales meeting owned by a CRM user."""

    __tablename__ = "meetings"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="scheduled", nullable=False, index=True)

    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    meeting_link: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    reminder_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=15)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    related_lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    related_contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    related_company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    related_deal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deals.id", ondelete="SET NULL"),
        nullable=True, index=True,
    )

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    owner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[owner_id], lazy="select")
    related_lead: Mapped[Optional["Lead"]] = relationship("Lead", foreign_keys=[related_lead_id], lazy="select")
    related_contact: Mapped[Optional["Contact"]] = relationship("Contact", foreign_keys=[related_contact_id], lazy="select")
    related_company: Mapped[Optional["Company"]] = relationship("Company", foreign_keys=[related_company_id], lazy="select")
    related_deal: Mapped[Optional["Deal"]] = relationship("Deal", foreign_keys=[related_deal_id], lazy="select")

    def __repr__(self) -> str:
        return f"<Meeting id={self.id} title={self.title!r} status={self.status!r}>"
