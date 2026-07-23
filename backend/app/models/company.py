"""
Company Model
Represents a B2B account — a business entity tracked in the CRM.
One Organization → Many Companies.
One Company → Many Contacts, Many Leads.
"""
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.contact import Contact
    from app.models.lead import Lead


class Company(Base, TenantMixin):
    """
    A prospect or customer company.
    Unique per organization (you cannot have two companies with the same
    name inside the same org).
    """
    __tablename__ = "companies"
    __table_args__ = (
        UniqueConstraint(
            "organization_id", "name",
            name="uq_company_name_per_org",
        ),
    )

    # ── Core identity ─────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Contact details ───────────────────────────────────────────────────────
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    fax: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    # ── Address ───────────────────────────────────────────────────────────────
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # ── Business metadata ─────────────────────────────────────────────────────
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_crm: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    operational_system: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    company_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    employee_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    annual_revenue: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    twitter_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ── CRM metadata ─────────────────────────────────────────────────────────
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Tenancy FK ────────────────────────────────────────────────────────────
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="companies", lazy="select"
    )
    contacts: Mapped[List["Contact"]] = relationship(
        "Contact", back_populates="company", lazy="select"
    )
    leads: Mapped[List["Lead"]] = relationship(
        "Lead", back_populates="company", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Company id={self.id} name={self.name!r}>"
