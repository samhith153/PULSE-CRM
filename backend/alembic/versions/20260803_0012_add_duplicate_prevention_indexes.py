"""add duplicate prevention indexes

Revision ID: 20260803_0012
Revises: 206727f7ae42
Create Date: 2026-08-03
"""
from alembic import op


revision = "20260803_0012"
down_revision = "206727f7ae42"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ux_companies_org_normalized_name")
    op.execute(r"""
        CREATE UNIQUE INDEX ux_companies_org_normalized_name
        ON companies (organization_id, regexp_replace(translate(lower(trim(name)), ' !"#$%&''()*+,-./:;<=>?@[\]^_`{|}~', ''), '\s+', ' ', 'g'))
        WHERE is_deleted = false
    """)

    op.execute("DROP INDEX IF EXISTS ux_contacts_org_normalized_email")
    op.execute("""
        CREATE UNIQUE INDEX ux_contacts_org_normalized_email
        ON contacts (organization_id, lower(trim(email)))
        WHERE is_deleted = false AND email IS NOT NULL AND trim(email) <> ''
    """)

    op.execute("DROP INDEX IF EXISTS ux_contacts_org_normalized_phone")
    op.execute(r"""
        CREATE UNIQUE INDEX ux_contacts_org_normalized_phone
        ON contacts (organization_id, regexp_replace(coalesce(phone, ''), '\D+', '', 'g'))
        WHERE is_deleted = false AND phone IS NOT NULL AND regexp_replace(phone, '\D+', '', 'g') <> ''
    """)

    op.execute("DROP INDEX IF EXISTS ux_leads_org_normalized_email")
    op.execute("""
        CREATE UNIQUE INDEX ux_leads_org_normalized_email
        ON leads (organization_id, lower(trim(email)))
        WHERE is_deleted = false AND email IS NOT NULL AND trim(email) <> ''
    """)

    op.execute("DROP INDEX IF EXISTS ux_leads_org_normalized_phone")
    op.execute(r"""
        CREATE UNIQUE INDEX ux_leads_org_normalized_phone
        ON leads (organization_id, regexp_replace(coalesce(phone, ''), '\D+', '', 'g'))
        WHERE is_deleted = false AND phone IS NOT NULL AND regexp_replace(phone, '\D+', '', 'g') <> ''
    """)

    op.execute("DROP INDEX IF EXISTS ux_leads_org_company_normalized_title")
    op.execute(r"""
        CREATE UNIQUE INDEX ux_leads_org_company_normalized_title
        ON leads (organization_id, company_id, regexp_replace(translate(lower(trim(title)), ' !"#$%&''()*+,-./:;<=>?@[\]^_`{|}~', ''), '\s+', ' ', 'g'))
        WHERE is_deleted = false AND company_id IS NOT NULL
    """)

    op.execute("DROP INDEX IF EXISTS ux_deals_lead_active")
    op.execute("""
        CREATE UNIQUE INDEX ux_deals_lead_active
        ON deals (lead_id)
        WHERE is_deleted = false AND lead_id IS NOT NULL
    """)

    op.execute("DROP INDEX IF EXISTS ux_deals_org_normalized_name")
    op.execute(r"""
        CREATE UNIQUE INDEX ux_deals_org_normalized_name
        ON deals (organization_id, regexp_replace(translate(lower(trim(name)), ' !"#$%&''()*+,-./:;<=>?@[\]^_`{|}~', ''), '\s+', ' ', 'g'))
        WHERE is_deleted = false
    """)

    op.execute("DROP INDEX IF EXISTS ux_users_normalized_email")
    op.execute("""
        CREATE UNIQUE INDEX ux_users_normalized_email
        ON users (lower(trim(email)))
        WHERE is_deleted = false
    """)

    op.execute("DROP INDEX IF EXISTS ux_users_normalized_phone")
    op.execute(r"""
        CREATE UNIQUE INDEX ux_users_normalized_phone
        ON users (regexp_replace(coalesce(phone, ''), '\D+', '', 'g'))
        WHERE is_deleted = false AND phone IS NOT NULL AND regexp_replace(phone, '\D+', '', 'g') <> ''
    """)

    op.execute("DROP INDEX IF EXISTS ux_organizations_normalized_name")
    op.execute(r"""
        CREATE UNIQUE INDEX ux_organizations_normalized_name
        ON organizations (regexp_replace(translate(lower(trim(name)), ' !"#$%&''()*+,-./:;<=>?@[\]^_`{|}~', ''), '\s+', ' ', 'g'))
        WHERE is_deleted = false
    """)

    op.execute("DROP INDEX IF EXISTS ux_emails_org_gmail_message_thread")
    op.execute("""
        CREATE UNIQUE INDEX ux_emails_org_gmail_message_thread
        ON emails (organization_id, gmail_message_id, coalesce(thread_id, ''))
        WHERE is_active = true
    """)


def downgrade() -> None:
    for index_name in (
        "ux_emails_org_gmail_message_thread",
        "ux_organizations_normalized_name",
        "ux_users_normalized_phone",
        "ux_users_normalized_email",
        "ux_deals_org_normalized_name",
        "ux_deals_lead_active",
        "ux_leads_org_company_normalized_title",
        "ux_leads_org_normalized_phone",
        "ux_leads_org_normalized_email",
        "ux_contacts_org_normalized_phone",
        "ux_contacts_org_normalized_email",
        "ux_companies_org_normalized_name",
    ):
        op.execute(f"DROP INDEX IF EXISTS {index_name}")
