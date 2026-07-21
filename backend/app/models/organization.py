"""
Organization Model
Root tenant entity — every User, Company, Contact, and Lead belongs to one Organization.
"""
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, AuditMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.lead import Lead
    from app.models.deal import Deal
    from app.models.pipeline import PipelineStage
    from app.models.email import Email, GmailConnection


class Organization(Base, AuditMixin):
    """
    Multi-tenant root.
    One organization owns all CRM data belonging to a company/team.
    """
    __tablename__ = "organizations"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_org_slug"),
        UniqueConstraint("name", name="uq_org_name"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Subscription / plan info (for future billing module)
    plan: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    max_users: Mapped[int] = mapped_column(default=5, nullable=False)

    # Soft delete
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────────
    users: Mapped[List["User"]] = relationship(
        "User", back_populates="organization", lazy="select"
    )
    companies: Mapped[List["Company"]] = relationship(
        "Company", back_populates="organization", lazy="select"
    )
    contacts: Mapped[List["Contact"]] = relationship(
        "Contact", back_populates="organization", lazy="select"
    )
    leads: Mapped[List["Lead"]] = relationship(
        "Lead", back_populates="organization", lazy="select"
    )
    deals: Mapped[List["Deal"]] = relationship(
        "Deal", back_populates="organization", lazy="select"
    )
    pipeline_stages: Mapped[List["PipelineStage"]] = relationship(
        "PipelineStage", back_populates="organization", lazy="select"
    )
    emails: Mapped[List["Email"]] = relationship(
        "Email", back_populates="organization", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name!r}>"
