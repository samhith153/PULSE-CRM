"""
Email Summary Model
Stores AI-generated summaries and analysis for email threads.
"""
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class EmailSummary(Base, TenantMixin):
    __tablename__ = "email_summaries"
    __table_args__ = (
        UniqueConstraint("thread_id", name="uq_email_summary_thread"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    thread_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary_word: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sentiment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    intent: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    key_points: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    action_items: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    draft_reply: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    follow_up_suggestion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    follow_up_timing: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    processing_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", lazy="select")

    def __repr__(self) -> str:
        return f"<EmailSummary id={self.id} thread_id={self.thread_id!r}>"
