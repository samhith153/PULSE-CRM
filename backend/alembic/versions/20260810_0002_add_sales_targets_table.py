"""Add sales_targets table

Revision ID: 20260810_0002
Revises: e5f9c1d8a7b6
Create Date: 2026-08-10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "20260810_0002"
down_revision = "e5f9c1d8a7b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sales_targets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("organization_id", UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False),
        sa.Column("rep_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("target_type", sa.String(30), nullable=False, server_default="revenue"),
        sa.Column("target_amount", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("period_type", sa.String(20), nullable=False, server_default="monthly"),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.UniqueConstraint("rep_id", "period_type", "period_start", "organization_id", name="uq_target_rep_period"),
    )


def downgrade() -> None:
    op.drop_table("sales_targets")
