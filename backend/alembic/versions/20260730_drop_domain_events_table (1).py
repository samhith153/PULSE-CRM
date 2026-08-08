"""drop stale domain_events table (replaced by event_outbox)

Revision ID: 20260730_drop_domain_events
Revises: 20260730_create_lead_scores
Create Date: 2026-07-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision = "20260730_drop_domain_events"
down_revision = "20260730_create_lead_scores"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.drop_index("ix_domain_events_topic", table_name="domain_events")
    op.drop_index("ix_domain_events_organization_id", table_name="domain_events")
    op.drop_index("ix_domain_events_is_active", table_name="domain_events")
    op.drop_index("ix_domain_events_id", table_name="domain_events")
    op.drop_index("ix_domain_events_event_type", table_name="domain_events")
    op.drop_index("ix_domain_events_aggregate_type", table_name="domain_events")
    op.drop_index("ix_domain_events_aggregate_id", table_name="domain_events")
    op.drop_table("domain_events")


def downgrade() -> None:
    op.create_table(
        "domain_events",
        sa.Column("aggregate_type", sa.String(length=50), nullable=False),
        sa.Column("aggregate_id", sa.UUID(), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("topic", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("source", sa.String(length=100), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_domain_events_aggregate_id", "domain_events", ["aggregate_id"], unique=False)
    op.create_index("ix_domain_events_aggregate_type", "domain_events", ["aggregate_type"], unique=False)
    op.create_index("ix_domain_events_event_type", "domain_events", ["event_type"], unique=False)
    op.create_index("ix_domain_events_id", "domain_events", ["id"], unique=False)
    op.create_index("ix_domain_events_is_active", "domain_events", ["is_active"], unique=False)
    op.create_index("ix_domain_events_organization_id", "domain_events", ["organization_id"], unique=False)
    op.create_index("ix_domain_events_topic", "domain_events", ["topic"], unique=False)
