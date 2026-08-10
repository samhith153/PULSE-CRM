"""add crm_emails table

Revision ID: a1b2c3d4e5f6
Revises: f4b8c2d9e6a1
Create Date: 2026-08-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f4b8c2d9e6a1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'crm_emails',
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('direction', sa.String(length=20), nullable=False, server_default='outbound'),
        sa.Column('recipient_email', sa.String(length=255), nullable=True),
        sa.Column('recipient_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='completed'),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('related_entity_type', sa.String(length=50), nullable=True),
        sa.Column('related_lead_id', sa.UUID(), nullable=True),
        sa.Column('related_contact_id', sa.UUID(), nullable=True),
        sa.Column('related_company_id', sa.UUID(), nullable=True),
        sa.Column('related_deal_id', sa.UUID(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['related_lead_id'], ['leads.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['related_contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['related_company_id'], ['companies.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['related_deal_id'], ['deals.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_crm_emails_subject', 'crm_emails', ['subject'], unique=False)
    op.create_index('ix_crm_emails_direction', 'crm_emails', ['direction'], unique=False)
    op.create_index('ix_crm_emails_status', 'crm_emails', ['status'], unique=False)
    op.create_index('ix_crm_emails_priority', 'crm_emails', ['priority'], unique=False)
    op.create_index('ix_crm_emails_sent_at', 'crm_emails', ['sent_at'], unique=False)
    op.create_index('ix_crm_emails_organization_id', 'crm_emails', ['organization_id'], unique=False)
    op.create_index('ix_crm_emails_owner_id', 'crm_emails', ['owner_id'], unique=False)
    op.create_index('ix_crm_emails_related_entity_type', 'crm_emails', ['related_entity_type'], unique=False)
    op.create_index('ix_crm_emails_related_lead_id', 'crm_emails', ['related_lead_id'], unique=False)
    op.create_index('ix_crm_emails_id', 'crm_emails', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_crm_emails_id', table_name='crm_emails')
    op.drop_index('ix_crm_emails_related_lead_id', table_name='crm_emails')
    op.drop_index('ix_crm_emails_related_entity_type', table_name='crm_emails')
    op.drop_index('ix_crm_emails_owner_id', table_name='crm_emails')
    op.drop_index('ix_crm_emails_organization_id', table_name='crm_emails')
    op.drop_index('ix_crm_emails_sent_at', table_name='crm_emails')
    op.drop_index('ix_crm_emails_priority', table_name='crm_emails')
    op.drop_index('ix_crm_emails_status', table_name='crm_emails')
    op.drop_index('ix_crm_emails_direction', table_name='crm_emails')
    op.drop_index('ix_crm_emails_subject', table_name='crm_emails')
    op.drop_table('crm_emails')
