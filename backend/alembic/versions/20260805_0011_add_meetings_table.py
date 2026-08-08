"""add meetings table

Revision ID: 20260805_0011
Revises: 20260723_0010
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260805_0011"
down_revision = "20260723_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "meetings",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="scheduled"),
        sa.Column("start_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("meeting_link", sa.String(length=1000), nullable=True),
        sa.Column("location", sa.String(length=500), nullable=True),
        sa.Column("reminder_minutes", sa.Integer(), nullable=True, server_default="15"),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_contact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_company_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_deal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_contact_id"], ["contacts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_deal_id"], ["deals.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["related_lead_id"], ["leads.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meetings_id", "meetings", ["id"])
    op.create_index("ix_meetings_title", "meetings", ["title"])
    op.create_index("ix_meetings_status", "meetings", ["status"])
    op.create_index("ix_meetings_start_datetime", "meetings", ["start_datetime"])
    op.create_index("ix_meetings_end_datetime", "meetings", ["end_datetime"])
    op.create_index("ix_meetings_owner_id", "meetings", ["owner_id"])
    op.create_index("ix_meetings_organization_id", "meetings", ["organization_id"])
    op.create_index("ix_meetings_org_owner_start", "meetings", ["organization_id", "owner_id", "start_datetime"])
    op.create_index("ix_meetings_related_lead_id", "meetings", ["related_lead_id"])
    op.create_index("ix_meetings_related_contact_id", "meetings", ["related_contact_id"])
    op.create_index("ix_meetings_related_company_id", "meetings", ["related_company_id"])
    op.create_index("ix_meetings_related_deal_id", "meetings", ["related_deal_id"])
    op.create_index("ix_meetings_is_active", "meetings", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_meetings_is_active", table_name="meetings")
    op.drop_index("ix_meetings_related_deal_id", table_name="meetings")
    op.drop_index("ix_meetings_related_company_id", table_name="meetings")
    op.drop_index("ix_meetings_related_contact_id", table_name="meetings")
    op.drop_index("ix_meetings_related_lead_id", table_name="meetings")
    op.drop_index("ix_meetings_org_owner_start", table_name="meetings")
    op.drop_index("ix_meetings_organization_id", table_name="meetings")
    op.drop_index("ix_meetings_owner_id", table_name="meetings")
    op.drop_index("ix_meetings_end_datetime", table_name="meetings")
    op.drop_index("ix_meetings_start_datetime", table_name="meetings")
    op.drop_index("ix_meetings_status", table_name="meetings")
    op.drop_index("ix_meetings_title", table_name="meetings")
    op.drop_index("ix_meetings_id", table_name="meetings")
    op.drop_table("meetings")
