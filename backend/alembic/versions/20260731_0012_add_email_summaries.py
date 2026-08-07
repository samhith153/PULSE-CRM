"""Add email_summaries table

Revision ID: 20260731_0012
Revises: 20260731_0011
Create Date: 2026-07-31 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20260731_0012'
down_revision: Union[str, None] = '20260731_0011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('email_summaries',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),

        sa.Column('thread_id', sa.String(length=255), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('summary_word', sa.String(length=50), nullable=True),
        sa.Column('sentiment', sa.String(length=50), nullable=True),
        sa.Column('intent', sa.String(length=100), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('key_points', sa.JSON(), nullable=True),
        sa.Column('action_items', sa.JSON(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('draft_reply', sa.Text(), nullable=True),
        sa.Column('follow_up_suggestion', sa.Text(), nullable=True),
        sa.Column('follow_up_timing', sa.String(length=50), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('model_version', sa.String(length=100), nullable=True),

        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('thread_id', name='uq_email_summary_thread'),
    )

    op.create_index(op.f('ix_email_summaries_id'), 'email_summaries', ['id'], unique=False)
    op.create_index(op.f('ix_email_summaries_is_active'), 'email_summaries', ['is_active'], unique=False)
    op.create_index(op.f('ix_email_summaries_organization_id'), 'email_summaries', ['organization_id'], unique=False)
    op.create_index(op.f('ix_email_summaries_thread_id'), 'email_summaries', ['thread_id'], unique=False)


def downgrade() -> None:
    op.drop_table('email_summaries')
