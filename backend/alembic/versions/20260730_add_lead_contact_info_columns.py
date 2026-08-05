"""add email, phone, company_name to leads (store directly until conversion)

Revision ID: 202607300003
Revises: 202607300002
Create Date: 2026-07-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision = "202607300003"
down_revision = "202607300002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("leads", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("leads", sa.Column("phone", sa.String(30), nullable=True))
    op.add_column("leads", sa.Column("company_name", sa.String(255), nullable=True))
    op.create_index("ix_leads_email", "leads", ["email"])

    # Backfill from linked contacts/companies for existing rows
    op.execute("""
        UPDATE leads
        SET email = c.email, phone = c.phone
        FROM contacts c
        WHERE leads.contact_id = c.id
    """)
    op.execute("""
        UPDATE leads
        SET company_name = co.name
        FROM companies co
        WHERE leads.company_id = co.id
    """)


def downgrade() -> None:
    op.drop_index("ix_leads_email", table_name="leads")
    op.drop_column("leads", "company_name")
    op.drop_column("leads", "phone")
    op.drop_column("leads", "email")
