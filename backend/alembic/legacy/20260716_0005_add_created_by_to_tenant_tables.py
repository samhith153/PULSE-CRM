"""add created_by to tenant base tables

Revision ID: 20260716_0005
Revises: 20260713_0004
Create Date: 2026-07-16 00:05:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260716_0005"
down_revision = "20260713_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_companies_created_by",
        "companies",
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "contacts",
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_contacts_created_by",
        "contacts",
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "leads",
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_leads_created_by",
        "leads",
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_leads_created_by", "leads", type_="foreignkey")
    op.drop_column("leads", "created_by")

    op.drop_constraint("fk_contacts_created_by", "contacts", type_="foreignkey")
    op.drop_column("contacts", "created_by")

    op.drop_constraint("fk_companies_created_by", "companies", type_="foreignkey")
    op.drop_column("companies", "created_by")
