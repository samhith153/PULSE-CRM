"""add google oauth fields

Revision ID: 20260812_add_google_oauth
Revises: (current head)
Create Date: 2026-08-12

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260812_add_google_oauth'
down_revision = None  # Set this to your current head revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add google_id column (nullable, unique)
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)
    
    # Add auth_provider column (default 'password')
    op.add_column('users', sa.Column('auth_provider', sa.String(length=50), nullable=False, server_default='password'))
    
    # Make hashed_password nullable (for OAuth users)
    op.alter_column('users', 'hashed_password',
               existing_type=sa.String(length=255),
               nullable=True)


def downgrade() -> None:
    # Remove columns
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'auth_provider')
    
    # Make hashed_password NOT NULL again
    op.alter_column('users', 'hashed_password',
               existing_type=sa.String(length=255),
               nullable=False)
