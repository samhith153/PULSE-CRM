"""add company and lead profile fields

Revision ID: 20260723_0007
Revises: 20260721_0006
Create Date: 2026-07-23
"""

from alembic import op
import sqlalchemy as sa


revision = "20260723_0007"
down_revision = "20260721_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("current_crm", sa.String(length=100), nullable=True))
    op.add_column("companies", sa.Column("operational_system", sa.String(length=100), nullable=True))
    op.add_column("leads", sa.Column("industry", sa.String(length=100), nullable=True))
    op.add_column("leads", sa.Column("employee_count", sa.Integer(), nullable=True))
    op.add_column("leads", sa.Column("current_crm", sa.String(length=100), nullable=True))
    op.add_column("leads", sa.Column("location", sa.String(length=150), nullable=True))
    op.add_column("leads", sa.Column("operational_systems", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("leads", "operational_systems")
    op.drop_column("leads", "location")
    op.drop_column("leads", "current_crm")
    op.drop_column("leads", "employee_count")
    op.drop_column("leads", "industry")
    op.drop_column("companies", "operational_system")
    op.drop_column("companies", "current_crm")
