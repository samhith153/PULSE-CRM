"""create event_outbox table

Revision ID: 20260721_0006
Revises: 20260716_0005
Create Date: 2026-07-21 00:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "20260721_0006"
down_revision = "20260716_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_outbox",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("event_name", sa.String(length=150), nullable=False),
        sa.Column("aggregate_type", sa.String(length=100), nullable=True),
        sa.Column("aggregate_id", sa.String(length=64), nullable=True),
        sa.Column("source", sa.String(length=120), nullable=True),
        sa.Column("correlation_id", sa.String(length=120), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_event_outbox_organization_occurred_at", "event_outbox", ["organization_id", "occurred_at"], unique=False)
    op.create_index("ix_event_outbox_event_type_occurred_at", "event_outbox", ["event_type", "occurred_at"], unique=False)
    op.create_index("ix_event_outbox_aggregate_lookup", "event_outbox", ["aggregate_type", "aggregate_id"], unique=False)
    op.create_index("ix_event_outbox_organization_id", "event_outbox", ["organization_id"], unique=False)
    op.create_index("ix_event_outbox_actor_id", "event_outbox", ["actor_id"], unique=False)
    op.create_index("ix_event_outbox_event_type", "event_outbox", ["event_type"], unique=False)
    op.create_index("ix_event_outbox_correlation_id", "event_outbox", ["correlation_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_event_outbox_correlation_id", table_name="event_outbox")
    op.drop_index("ix_event_outbox_event_type", table_name="event_outbox")
    op.drop_index("ix_event_outbox_actor_id", table_name="event_outbox")
    op.drop_index("ix_event_outbox_organization_id", table_name="event_outbox")
    op.drop_index("ix_event_outbox_aggregate_lookup", table_name="event_outbox")
    op.drop_index("ix_event_outbox_event_type_occurred_at", table_name="event_outbox")
    op.drop_index("ix_event_outbox_organization_occurred_at", table_name="event_outbox")
    op.drop_table("event_outbox")
