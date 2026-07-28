CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_crm VARCHAR(100);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS operational_system VARCHAR(100);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS current_crm VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS operational_system VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS location VARCHAR(150);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS operational_systems VARCHAR(255);

ALTER TABLE emails ADD COLUMN IF NOT EXISTS brevo_message_id VARCHAR(255);
ALTER TABLE emails ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'sent';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS deferred_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS spam_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_brevo_message_id
    ON emails (brevo_message_id)
    WHERE brevo_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails (status);

CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE NOT NULL,
    event_key VARCHAR(500) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_at TIMESTAMP NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_key ON email_events(event_key);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
