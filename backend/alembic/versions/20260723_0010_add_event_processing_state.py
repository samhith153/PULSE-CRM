"""add event outbox processing state

Revision ID: 20260723_0010
Revises: 20260723_0009
Create Date: 2026-07-23
"""

from alembic import op
import sqlalchemy as sa

revision = "20260723_0010"
down_revision = "20260723_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("event_outbox", sa.Column("processing_status", sa.String(length=30), nullable=False, server_default="pending"))
    op.add_column("event_outbox", sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("event_outbox", sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("event_outbox", sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("event_outbox", sa.Column("last_error", sa.Text(), nullable=True))
    op.create_index("ix_event_outbox_processing_status", "event_outbox", ["processing_status", "next_attempt_at"])


def downgrade() -> None:
    op.drop_index("ix_event_outbox_processing_status", table_name="event_outbox")
    op.drop_column("event_outbox", "last_error")
    op.drop_column("event_outbox", "processed_at")
    op.drop_column("event_outbox", "next_attempt_at")
    op.drop_column("event_outbox", "attempts")
    op.drop_column("event_outbox", "processing_status")
