"""Rebuild ai_summaries for per-thread AI summaries

Revision ID: 20260731_0011
Revises: ac74c9e9ffb1
Create Date: 2026-07-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260731_0011'
down_revision: Union[str, None] = 'ac74c9e9ffb1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old ai_summaries table (aggregated dashboard summaries)
    op.drop_table('ai_summaries')

    # Create new ai_summaries table for per-thread AI conversation summaries
    op.create_table('ai_summaries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),

        sa.Column('thread_id', sa.String(length=255), nullable=False, index=True),

        # ── Foreign Keys ──
        sa.Column('lead_id', sa.UUID(), nullable=True),
        sa.Column('deal_id', sa.UUID(), nullable=True),
        sa.Column('email_id', sa.UUID(), nullable=True),
        sa.Column('owner_id', sa.UUID(), nullable=True),

        # ── AI Content ──
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('summary_word', sa.String(length=20), nullable=False, server_default='neutral'),
        sa.Column('sentiment', sa.String(length=20), nullable=False, server_default='neutral'),
        sa.Column('intent', sa.String(length=50), nullable=False, server_default='other'),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='0.1'),
        sa.Column('key_points', sa.JSON(), nullable=False),
        sa.Column('action_items', sa.JSON(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='general'),
        sa.Column('draft_reply', sa.Text(), nullable=False, server_default='No reply suggested.'),
        sa.Column('follow_up_suggestion', sa.Text(), nullable=False, server_default='No follow-up suggested.'),
        sa.Column('follow_up_timing', sa.String(length=50), nullable=False, server_default='no_followup'),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('model_version', sa.String(length=100), nullable=False),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False),

        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['deal_id'], ['deals.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['email_id'], ['emails.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_index(op.f('ix_ai_summaries_id'), 'ai_summaries', ['id'], unique=False)
    op.create_index(op.f('ix_ai_summaries_is_active'), 'ai_summaries', ['is_active'], unique=False)
    op.create_index(op.f('ix_ai_summaries_organization_id'), 'ai_summaries', ['organization_id'], unique=False)
    op.create_index(op.f('ix_ai_summaries_thread_id'), 'ai_summaries', ['thread_id'], unique=False)
    op.create_index(op.f('ix_ai_summaries_lead_id'), 'ai_summaries', ['lead_id'], unique=False)
    op.create_index(op.f('ix_ai_summaries_deal_id'), 'ai_summaries', ['deal_id'], unique=False)
    op.create_index(op.f('ix_ai_summaries_email_id'), 'ai_summaries', ['email_id'], unique=False)
    op.create_index(op.f('ix_ai_summaries_owner_id'), 'ai_summaries', ['owner_id'], unique=False)
    op.create_index('ix_ai_summaries_org_thread', 'ai_summaries', ['organization_id', 'thread_id'])
    op.create_index('ix_ai_summaries_org_generated', 'ai_summaries', ['organization_id', 'generated_at'])


def downgrade() -> None:
    # Drop new table
    op.drop_table('ai_summaries')

    # Recreate old aggregated summary table
    op.create_table('ai_summaries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),

        sa.Column('summary_type', sa.String(length=50), nullable=False),
        sa.Column('period', sa.String(length=50), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('executive_summary', sa.Text(), nullable=True),
        sa.Column('critical_insights', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('recommendations_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('related_deals_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('related_leads_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('positive_trends', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('negative_trends', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('source_modules', sa.JSON(), nullable=False),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('owner_id', sa.UUID(), nullable=True),
        sa.Column('notification_sent', sa.Boolean(), nullable=False, server_default='false'),

        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_index(op.f('ix_ai_summaries_id'), 'ai_summaries', ['id'], unique=False)
    op.create_index(op.f('ix_ai_summaries_is_active'), 'ai_summaries', ['is_active'], unique=False)
    op.create_index(op.f('ix_ai_summaries_organization_id'), 'ai_summaries', ['organization_id'], unique=False)
    op.create_index(op.f('ix_ai_summaries_summary_type'), 'ai_summaries', ['summary_type'], unique=False)
    op.create_index(op.f('ix_ai_summaries_period'), 'ai_summaries', ['period'], unique=False)
    op.create_index(op.f('ix_ai_summaries_priority'), 'ai_summaries', ['priority'], unique=False)
    op.create_index(op.f('ix_ai_summaries_owner_id'), 'ai_summaries', ['owner_id'], unique=False)
    op.create_index('ix_ai_summaries_org_generated_at', 'ai_summaries', ['organization_id', 'generated_at'])
    op.create_index('ix_ai_summaries_org_type_period', 'ai_summaries', ['organization_id', 'summary_type', 'period'])
    op.create_index('ix_ai_summaries_owner_org', 'ai_summaries', ['owner_id', 'organization_id'])
