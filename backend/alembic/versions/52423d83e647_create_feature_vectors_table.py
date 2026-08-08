"""create feature_vectors table

Revision ID: 52423d83e647
Revises: 8d904a0222cf
Create Date: 2026-07-29 13:08:56.350611

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '52423d83e647'
down_revision = '8d904a0222cf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "feature_vectors",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("lead_id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lead_id", name="uq_feature_vectors_lead_id"),
    )
    op.create_index("ix_feature_vectors_lead_id", "feature_vectors", ["lead_id"])
    op.create_index("ix_feature_vectors_organization_id", "feature_vectors", ["organization_id"])


def downgrade() -> None:
    op.drop_index("ix_feature_vectors_organization_id")
    op.drop_index("ix_feature_vectors_lead_id")
    op.drop_table("feature_vectors")
