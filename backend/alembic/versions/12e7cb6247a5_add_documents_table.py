"""add_documents_table

Revision ID: 12e7cb6247a5
Revises: 
Create Date: 2026-07-30 20:25:40.180665

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12e7cb6247a5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('documents',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('uploaded_by', sa.UUID(), nullable=True),
    sa.Column('file_name', sa.String(), nullable=False),
    sa.Column('file_path', sa.String(), nullable=False),
    sa.Column('file_type', sa.String(), nullable=False),
    sa.Column('file_size_bytes', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_organization_id'), 'documents', ['organization_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_documents_organization_id'), table_name='documents')
    op.drop_table('documents')