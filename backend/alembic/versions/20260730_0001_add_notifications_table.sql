-- Notifications table
-- Run this directly against Supabase (SQL editor) — this repo's alembic/versions
-- folder has no tracked migration history to chain an autogenerate off of.

CREATE TABLE IF NOT EXISTS notifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    is_active       boolean NOT NULL DEFAULT true,

    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by      uuid REFERENCES users(id) ON DELETE SET NULL,

    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            varchar(50) NOT NULL,
    title           varchar(255) NOT NULL,
    message         text,

    entity_type     varchar(50),
    entity_id       uuid,
    payload         jsonb,

    is_read         boolean NOT NULL DEFAULT false,
    read_at         timestamptz,

    is_dismissed    boolean NOT NULL DEFAULT false,
    dismissed_at    timestamptz,

    source_event_id uuid
);

CREATE INDEX IF NOT EXISTS ix_notifications_organization_id ON notifications (organization_id);
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS ix_notifications_is_dismissed ON notifications (is_dismissed);
CREATE INDEX IF NOT EXISTS ix_notifications_entity_type ON notifications (entity_type);
CREATE INDEX IF NOT EXISTS ix_notifications_entity_id ON notifications (entity_id);
CREATE INDEX IF NOT EXISTS ix_notifications_source_event_id ON notifications (source_event_id);

-- Fast "unread inbox for this user" lookups (bell icon + notifications page)
CREATE INDEX IF NOT EXISTS ix_notifications_user_unread
    ON notifications (user_id, organization_id, created_at DESC)
    WHERE is_dismissed = false;

-- Prevents the same outbox event from generating two notifications for the
-- same user if the worker retries/dispatches it twice.
CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_source_event_user
    ON notifications (source_event_id, user_id)
    WHERE source_event_id IS NOT NULL;
