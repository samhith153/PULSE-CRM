"""
FeatureVector Model
Stores engineered features and scores for leads.
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.lead import Lead
    from app.models.organization import Organization
    from app.models.user import User


class FeatureVector(Base, TenantMixin):
    __tablename__ = "feature_vectors"

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

    # ── Engagement Feature Scores ─────────────────────────────────────────────
    average_response_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    response_time_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    days_since_last_outbound: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engagement_decay_penalty: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_intent_category_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    buying_stage_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    customer_initiative_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    engagement_trend_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # ── Response Time Accumulators ───────────────────────────────────────────
    num_response_pairs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    last_processed_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Fit Feature Scores ────────────────────────────────────────────────────
    company_size_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    industry_complexity_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    software_gap_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    operational_system_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    customization_potential_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    lead: Mapped["Lead"] = relationship("Lead", back_populates="feature_vector", lazy="select")
    organization: Mapped["Organization"] = relationship("Organization", lazy="select")
    creator: Mapped[Optional["User"]] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return f"<FeatureVector id={self.id} lead_id={self.lead_id}>"
