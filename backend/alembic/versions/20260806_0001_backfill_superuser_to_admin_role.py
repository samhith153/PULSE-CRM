"""backfill legacy is_superuser users into the admin role

Revision ID: 20260806_0001
Revises: f4b8c2d9e6a1
Create Date: 2026-08-06

Before the is_superuser column is dropped (see 20260806_0002), every user
who was a superuser must already hold the `admin` role. Historically
authorization short-circuited on `is_superuser = TRUE`; that bypass is now
gone, so a superuser without the admin role would be silently demoted to zero
privileges. This migration preserves their access by granting the admin role.

Idempotent: it creates the admin role only if absent and never duplicates an
existing role grant.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260806_0001"
down_revision = "f4b8c2d9e6a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Ensure an `admin` system role exists.
    op.execute(
        sa.text(
            """
            INSERT INTO roles (id, name, display_name, description, is_system, is_active, created_at, updated_at)
            SELECT gen_random_uuid(), 'admin', 'Administrator', 'System administrator with full access', TRUE, TRUE, now(), now()
            WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin')
            """
        )
    )

    # 2. Grant the admin role to every existing superuser who does not already
    #    hold it. assigned_by is left NULL to mark these rows as migration-
    #    introduced (the application always sets an actor id), which makes them
    #    safe to revert in downgrade().
    op.execute(
        sa.text(
            """
            INSERT INTO user_roles (id, user_id, role_id, assigned_by, assigned_at)
            SELECT gen_random_uuid(), u.id, r.id, NULL, now()
            FROM users u
            JOIN roles r ON r.name = 'admin'
            WHERE u.is_superuser = TRUE
              AND NOT EXISTS (
                  SELECT 1 FROM user_roles ur
                  WHERE ur.user_id = u.id AND ur.role_id = r.id
              )
            """
        )
    )


def downgrade() -> None:
    # Remove only the admin grants this migration introduced (marked by a NULL
    # assigned_by). Application-created grants carry an actor id and are left
    # untouched.
    op.execute(
        sa.text(
            """
            DELETE FROM user_roles ur
            USING roles r
            WHERE ur.role_id = r.id
              AND r.name = 'admin'
              AND ur.assigned_by IS NULL
            """
        )
    )
