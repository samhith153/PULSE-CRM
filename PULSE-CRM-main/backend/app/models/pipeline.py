"""
Pipeline Stage Model
Represents a deal stage in the sales pipeline.
"""
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TenantMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.deal import Deal
    from app.models.user import User


class PipelineStage(Base, TenantMixin):
    __tablename__ = "pipeline_stages"
    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="uq_pipeline_stage_slug_per_org"),
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    probability: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

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
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="pipeline_stages", lazy="select"
    )
    deals: Mapped[List["Deal"]] = relationship(
        "Deal",
        back_populates="pipeline_stage",
        foreign_keys="Deal.pipeline_stage_id",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<PipelineStage id={self.id} slug={self.slug!r} org={self.organization_id}>"