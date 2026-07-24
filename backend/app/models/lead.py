"""
Lead Model
Represents a potential sales opportunity.
Linked to a Contact and optionally a Company.
"""
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.deal import Deal
    from app.models.user import User


class Lead(Base, TenantMixin):
    """
    A sales lead — tracks the progression from 'New' to 'Won'/'Lost'.
    Statuses follow a defined FSM (see LeadStatus enum in enums.py).
    """
    __tablename__ = "leads"

    # ── Identity ──────────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Pipeline ──────────────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(50), default="new", nullable=False, index=True
    )
    source: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, index=True
    )
    interest: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_crm: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    operational_systems: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ── Value ─────────────────────────────────────────────────────────────────
    estimated_value: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)

    # ── AI scoring (populated by AI module later) ─────────────────────────────
    score: Mapped[Optional[int]] = mapped_column(nullable=True)

    # ── CRM metadata ─────────────────────────────────────────────────────────
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Notes / close reason ─────────────────────────────────────────────────
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    close_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="leads", lazy="select"
    )
    company: Mapped[Optional["Company"]] = relationship(
        "Company", back_populates="leads", lazy="select"
    )
    contact: Mapped[Optional["Contact"]] = relationship(
        "Contact", back_populates="leads", lazy="select"
    )
    deal: Mapped[Optional["Deal"]] = relationship(
        "Deal", back_populates="lead", lazy="select", uselist=False
    )

    def __repr__(self) -> str:
        return f"<Lead id={self.id} title={self.title!r} status={self.status!r}>"
