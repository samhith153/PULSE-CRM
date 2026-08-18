"""add composite indexes for leads and emails performance

Revision ID: 20260818_0001
Revises: 20260812_0001
Create Date: 2026-08-18 00:00:00.000000

Adds composite covering indexes for the most common filter patterns:
- leads(organization_id, is_active, is_deleted): speeds up active lead queries
- emails(organization_id, external_entity_type, external_entity_id, direction, is_active):
  speeds up email lookups by entity (e.g., emails for a specific lead/deal/contact)
"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260818_0001"
down_revision = "20260812_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_leads_org_active_deleted",
        "leads",
        ["organization_id", "is_active", "is_deleted"],
        unique=False,
    )
    op.create_index(
        "ix_emails_org_entity_dir_active",
        "emails",
        ["organization_id", "external_entity_type", "external_entity_id", "direction", "is_active"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_emails_org_entity_dir_active", table_name="emails")
    op.drop_index("ix_leads_org_active_deleted", table_name="leads")
