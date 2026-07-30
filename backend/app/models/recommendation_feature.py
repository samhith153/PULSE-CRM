"""
Recommendation feature store model.
Stores recommendation-engine features without modifying source domain tables.
"""
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, CheckConstraint, Enum, Float, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin
from app.utils.enums import MeetingAttendanceStatus

if TYPE_CHECKING:
    from app.models.lead import Lead
    from app.models.organization import Organization


class RecommendationFeature(Base, TenantMixin):
    __tablename__ = "recommendation_features"
    __table_args__ = (
        CheckConstraint(
            "days_since_last_activity IS NULL OR days_since_last_activity >= 0",
            name="ck_recommendation_features_days_since_last_activity_nonnegative",
        ),
        CheckConstraint(
            "deal_value IS NULL OR deal_value >= 0",
            name="ck_recommendation_features_deal_value_nonnegative",
        ),
        CheckConstraint(
            "email_open_count >= 0",
            name="ck_recommendation_features_email_open_count_nonnegative",
        ),
        CheckConstraint(
            "rep_active_action_count >= 0",
            name="ck_recommendation_features_rep_active_action_count_nonnegative",
        ),
        CheckConstraint(
            "stage_dwell_time IS NULL OR stage_dwell_time >= 0",
            name="ck_recommendation_features_stage_dwell_time_nonnegative",
        ),
        Index(
            "ix_recommendation_features_org_lead_created_at",
            "organization_id",
            "lead_id",
            "created_at",
        ),
        Index(
            "ix_recommendation_features_meeting_attendance_status",
            "meeting_attendance_status",
        ),
    )

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    current_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    current_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    days_since_last_activity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reply_received_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    deal_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    email_open_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    email_opened_no_reply_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    meeting_attendance_status: Mapped[Optional[MeetingAttendanceStatus]] = mapped_column(
        Enum(
            MeetingAttendanceStatus,
            name="meeting_attendance_status_enum",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=True,
    )
    rep_active_action_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_contact_time_slot: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    has_upcoming_activity: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stage_dwell_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    lead: Mapped["Lead"] = relationship(
        "Lead",
        back_populates="recommendation_features",
        lazy="select",
    )
    organization: Mapped["Organization"] = relationship("Organization", lazy="select")

    def __repr__(self) -> str:
        return f"<RecommendationFeature id={self.id} lead_id={self.lead_id}>"
