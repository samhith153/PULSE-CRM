"""add_revoked_tokens_table

Revision ID: 921e008a492b
Revises: b407209e1775
Create Date: 2026-08-12 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '921e008a492b'
down_revision: Union[str, None] = 'b407209e1775'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'revoked_tokens')")
    )
    table_exists = result.scalar()
    if not table_exists:
        op.create_table(
            'revoked_tokens',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('jti', sa.String(length=64), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=True),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('revoked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('jti'),
        )
        op.create_index(op.f('ix_revoked_tokens_jti'), 'revoked_tokens', ['jti'], unique=True)
        op.create_index(op.f('ix_revoked_tokens_user_id'), 'revoked_tokens', ['user_id'], unique=False)
        op.create_index(op.f('ix_revoked_tokens_expires_at'), 'revoked_tokens', ['expires_at'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'revoked_tokens')")
    )
    table_exists = result.scalar()
    if table_exists:
        op.drop_index(op.f('ix_revoked_tokens_expires_at'), table_name='revoked_tokens')
        op.drop_index(op.f('ix_revoked_tokens_user_id'), table_name='revoked_tokens')
        op.drop_index(op.f('ix_revoked_tokens_jti'), table_name='revoked_tokens')
        op.drop_table('revoked_tokens')
