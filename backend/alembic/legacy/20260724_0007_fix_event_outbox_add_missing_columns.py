"""fix event_outbox - add processing_status, attempts, next_attempt_at, processed_at, last_error

Revision ID: 20260724_0007
Revises: 20260721_0006
Create Date: 2026-07-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260724_0007"
down_revision = "20260721_0006"
branch_labels = None
depends_on = None


def _add_column_if_not_exists(table: str, column_name: str, column_type_str: str):
    """Execute ALTER TABLE ADD COLUMN IF NOT EXISTS using raw SQL.
    This is safe to run even if the column already exists (e.g., if another
    branch migration already added it)."""
    op.execute(
        f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column_name} {column_type_str}"
    )


def upgrade() -> None:
    _add_column_if_not_exists(
        "event_outbox",
        "processing_status",
        "VARCHAR(30) DEFAULT 'pending' NOT NULL",
    )
    _add_column_if_not_exists(
        "event_outbox",
        "attempts",
        "INTEGER DEFAULT 0 NOT NULL",
    )
    _add_column_if_not_exists(
        "event_outbox",
        "next_attempt_at",
        "TIMESTAMPTZ",
    )
    _add_column_if_not_exists(
        "event_outbox",
        "processed_at",
        "TIMESTAMPTZ",
    )
    _add_column_if_not_exists(
        "event_outbox",
        "last_error",
        "TEXT",
    )


def downgrade() -> None:
    op.drop_column("event_outbox", "last_error")
    op.drop_column("event_outbox", "processed_at")
    op.drop_column("event_outbox", "next_attempt_at")
    op.drop_column("event_outbox", "attempts")
    op.drop_column("event_outbox", "processing_status")
