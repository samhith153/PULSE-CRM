"""add ai persistence tables

Revision ID: 20260723_0008
Revises: 20260723_0007
Create Date: 2026-07-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260723_0008"
down_revision = "20260723_0007"
branch_labels = None
depends_on = None


def _uuid_type():
    return postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    op.create_table(
        "ai_scores",
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("lead_id", _uuid_type(), nullable=True),
        sa.Column("deal_id", _uuid_type(), nullable=True),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("explanation", sa.JSON(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("regenerated_from_id", _uuid_type(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("organization_id", _uuid_type(), nullable=False),
        sa.Column("created_by", _uuid_type(), nullable=True),
        sa.Column("id", _uuid_type(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["deal_id"], ["deals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["regenerated_from_id"], ["ai_scores.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "ai_recommendations",
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", _uuid_type(), nullable=True),
        sa.Column("lead_id", _uuid_type(), nullable=True),
        sa.Column("deal_id", _uuid_type(), nullable=True),
        sa.Column("recommendation", sa.Text(), nullable=False),
        sa.Column("reasoning", sa.Text(), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("regenerated_from_id", _uuid_type(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("organization_id", _uuid_type(), nullable=False),
        sa.Column("created_by", _uuid_type(), nullable=True),
        sa.Column("id", _uuid_type(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["deal_id"], ["deals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["regenerated_from_id"], ["ai_recommendations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "ai_conversation_summaries",
        sa.Column("thread_id", sa.String(length=255), nullable=False),
        sa.Column("email_id", _uuid_type(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("bullets", sa.JSON(), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("regenerated_from_id", _uuid_type(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("organization_id", _uuid_type(), nullable=False),
        sa.Column("created_by", _uuid_type(), nullable=True),
        sa.Column("id", _uuid_type(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["email_id"], ["emails.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["regenerated_from_id"], ["ai_conversation_summaries.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    for table in ("ai_scores", "ai_recommendations", "ai_conversation_summaries"):
        op.create_index(op.f(f"ix_{table}_organization_id"), table, ["organization_id"])
        op.create_index(op.f(f"ix_{table}_is_active"), table, ["is_active"])


def downgrade() -> None:
    op.drop_table("ai_conversation_summaries")
    op.drop_table("ai_recommendations")
    op.drop_table("ai_scores")
