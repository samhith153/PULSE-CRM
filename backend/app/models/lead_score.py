"""
LeadScore Model
Stores computed AI scores and reasons for each lead.
One row per lead (unique on lead_id), cascade-deletes with the lead.
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.lead import Lead
    from app.models.organization import Organization
    from app.models.user import User


class LeadScore(Base, TenantMixin):
    __tablename__ = "lead_scores"

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    fit_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fit_reasons: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    engagement_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engagement_reasons: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    overall_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    priority_tier: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    top_reasons: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    scored_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    lead: Mapped["Lead"] = relationship("Lead", back_populates="lead_score", lazy="select")
    organization: Mapped["Organization"] = relationship("Organization", lazy="select")
    creator: Mapped[Optional["User"]] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return f"<LeadScore id={self.id} lead_id={self.lead_id} overall={self.overall_score}>"
