"""add email tracking fields and email_events table

Revision ID: 202607290001
Revises: a0aca9d06e17
Create Date: 2026-07-29 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202607290001"
down_revision: Union[str, None] = "a0aca9d06e17"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Add Brevo tracking columns to emails ─────────────────────────────
    op.add_column("emails", sa.Column("brevo_message_id", sa.String(255), nullable=True))
    op.add_column("emails", sa.Column("status", sa.String(50), nullable=False, server_default="sent"))
    op.add_column("emails", sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emails", sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emails", sa.Column("clicked_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emails", sa.Column("bounced_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emails", sa.Column("deferred_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emails", sa.Column("spam_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emails", sa.Column("unsubscribed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("emails", sa.Column("last_event_at", sa.DateTime(timezone=True), nullable=True))

    op.create_index(op.f("ix_emails_brevo_message_id"), "emails", ["brevo_message_id"], unique=False)
    op.create_index(op.f("ix_emails_status"), "emails", ["status"], unique=False)

    # ── Create email_events table ────────────────────────────────────────
    op.create_table(
        "email_events",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email_id", sa.UUID(), nullable=False),
        sa.Column("event_key", sa.String(500), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("event_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["email_id"], ["emails.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_key", name="uq_email_event_key"),
    )
    op.create_index(op.f("ix_email_events_email_id"), "email_events", ["email_id"], unique=False)
    op.create_index(op.f("ix_email_events_event_type"), "email_events", ["event_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_email_events_event_type"), table_name="email_events")
    op.drop_index(op.f("ix_email_events_email_id"), table_name="email_events")
    op.drop_table("email_events")

    op.drop_index(op.f("ix_emails_status"), table_name="emails")
    op.drop_index(op.f("ix_emails_brevo_message_id"), table_name="emails")
    op.drop_column("emails", "last_event_at")
    op.drop_column("emails", "unsubscribed_at")
    op.drop_column("emails", "spam_at")
    op.drop_column("emails", "deferred_at")
    op.drop_column("emails", "bounced_at")
    op.drop_column("emails", "clicked_at")
    op.drop_column("emails", "opened_at")
    op.drop_column("emails", "delivered_at")
    op.drop_column("emails", "status")
    op.drop_column("emails", "brevo_message_id")
