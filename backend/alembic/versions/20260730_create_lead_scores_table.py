"""create lead_scores table + remove score columns from leads

Revision ID: 20260730_create_lead_scores
Revises: 202607300004
Create Date: 2026-07-30 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "20260730_create_lead_scores"
down_revision: Union[str, None] = "202607300004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Create lead_scores table ──────────────────────────────────────────
    op.create_table(
        "lead_scores",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("lead_id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("fit_score", sa.Integer(), nullable=True),
        sa.Column("fit_reasons", sa.JSON(), nullable=True),
        sa.Column("engagement_score", sa.Integer(), nullable=True),
        sa.Column("engagement_reasons", sa.JSON(), nullable=True),
        sa.Column("overall_score", sa.Integer(), nullable=True),
        sa.Column("priority_tier", sa.String(20), nullable=True),
        sa.Column("top_reasons", sa.JSON(), nullable=True),
        sa.Column("scored_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lead_id", name="uq_lead_scores_lead_id"),
    )
    op.create_index("ix_lead_scores_lead_id", "lead_scores", ["lead_id"])
    op.create_index("ix_lead_scores_organization_id", "lead_scores", ["organization_id"])

    # ── 2. Migrate existing score data from leads → lead_scores ──────────────
    op.execute(
        "INSERT INTO lead_scores (lead_id, organization_id, created_by, "
        "overall_score, fit_score, engagement_score, priority_tier, top_reasons, scored_at) "
        "SELECT id, organization_id, created_by, "
        "score, fit_score, engagement_score, priority_tier, "
        "top_reasons::jsonb, NOW() "
        "FROM leads WHERE score IS NOT NULL "
        "OR fit_score IS NOT NULL OR engagement_score IS NOT NULL"
    )

    # ── 3. Drop score columns from leads ─────────────────────────────────────
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS score")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS fit_score")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS engagement_score")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS top_reasons")
    op.execute("ALTER TABLE leads DROP COLUMN IF EXISTS priority_tier")


def downgrade() -> None:
    # ── 1. Restore columns on leads ──────────────────────────────────────────
    op.add_column("leads", sa.Column("score", sa.Integer(), nullable=True))
    op.add_column("leads", sa.Column("fit_score", sa.Integer(), nullable=True))
    op.add_column("leads", sa.Column("engagement_score", sa.Integer(), nullable=True))
    op.add_column("leads", sa.Column("top_reasons", sa.JSON(), nullable=True))
    op.add_column("leads", sa.Column("priority_tier", sa.String(20), nullable=True))

    # ── 2. Restore data from lead_scores into leads ──────────────────────────
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            "SELECT lead_id, overall_score, fit_score, engagement_score, "
            "priority_tier, top_reasons FROM lead_scores"
        )
    ).fetchall()
    for row in rows:
        conn.execute(
            sa.text(
                "UPDATE leads SET score = :overall_score, fit_score = :fit_score, "
                "engagement_score = :engagement_score, priority_tier = :priority_tier, "
                "top_reasons = :top_reasons WHERE id = :lead_id"
            ),
            {
                "lead_id": row[0],
                "overall_score": row[1],
                "fit_score": row[2],
                "engagement_score": row[3],
                "priority_tier": row[4],
                "top_reasons": row[5],
            },
        )

    # ── 3. Drop lead_scores table ────────────────────────────────────────────
    op.drop_index("ix_lead_scores_organization_id", table_name="lead_scores")
    op.drop_index("ix_lead_scores_lead_id", table_name="lead_scores")
    op.drop_constraint("uq_lead_scores_lead_id", "lead_scores", type_="unique")
    op.drop_table("lead_scores")
