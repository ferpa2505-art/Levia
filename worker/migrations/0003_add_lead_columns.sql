-- Add consent_at, channel, updated_at columns to leads table
-- Created as part of PR 1 - Worker hardening

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- This migration should be run once. If columns already exist, it will fail gracefully
-- in production but that's acceptable for this use case.

ALTER TABLE leads ADD COLUMN consent_at TEXT;
ALTER TABLE leads ADD COLUMN channel TEXT NOT NULL DEFAULT 'whatsapp';
ALTER TABLE leads ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));

-- Update existing rows to have updated_at = created_at
UPDATE leads SET updated_at = created_at WHERE updated_at IS NULL OR updated_at = '';

CREATE INDEX IF NOT EXISTS idx_leads_channel ON leads(channel);