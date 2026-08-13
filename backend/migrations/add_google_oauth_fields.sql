-- Migration: Add Google OAuth fields to users table
-- Date: 2026-08-12
-- Description: Add google_id and auth_provider fields to support Google OAuth authentication
-- Safe to re-run (all statements are idempotent).

-- Add google_id column (nullable, unique)
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id);

-- Add auth_provider column (default 'password')
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'password' NOT NULL;

-- Make hashed_password nullable (for OAuth users who don't have passwords)
ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.google_id IS 'Google user ID for OAuth authentication';
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: password, google, etc.';
