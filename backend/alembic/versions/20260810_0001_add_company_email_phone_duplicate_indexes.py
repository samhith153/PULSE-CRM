"""add company email and phone duplicate indexes

Revision ID: 20260810_0001
Revises: 20260806_0011
Create Date: 2026-08-10
"""
from alembic import op


revision = "20260810_0001"
down_revision = "20260806_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ux_companies_org_normalized_email")
    op.execute("""
        CREATE UNIQUE INDEX ux_companies_org_normalized_email
        ON companies (organization_id, lower(trim(email)))
        WHERE is_deleted = false AND email IS NOT NULL AND trim(email) <> ''
    """)

    op.execute("DROP INDEX IF EXISTS ux_companies_org_normalized_phone")
    op.execute("""
        CREATE UNIQUE INDEX ux_companies_org_normalized_phone
        ON companies (organization_id, regexp_replace(coalesce(phone, ''), '\D+', '', 'g'))
        WHERE is_deleted = false AND phone IS NOT NULL AND regexp_replace(phone, '\D+', '', 'g') <> ''
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ux_companies_org_normalized_phone")
    op.execute("DROP INDEX IF EXISTS ux_companies_org_normalized_email")
