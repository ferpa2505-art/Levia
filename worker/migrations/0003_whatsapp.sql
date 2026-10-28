-- Leviã WhatsApp conversation state and idempotency tables
-- Created as part of PR 1 - Worker hardening

-- WhatsApp session state (persisted in D1, survives gateway restarts)
CREATE TABLE IF NOT EXISTS wa_sessions (
  phone TEXT PRIMARY KEY NOT NULL,
  stage TEXT NOT NULL DEFAULT 'consent',
  data_json TEXT NOT NULL DEFAULT '{}',
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_sessions_updated ON wa_sessions(updated_at DESC);

-- Idempotency: track processed WhatsApp message IDs to ignore duplicates/retries
CREATE TABLE IF NOT EXISTS wa_processed (
  msg_id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_processed_created ON wa_processed(created_at DESC);

-- Add new columns to leads table (if not already present from 0002)
-- These will be added via ALTER TABLE when applying this migration
-- Note: SQLite doesn't support IF NOT EXISTS for columns, so we handle this in application code
-- or use a separate migration for safety. For now, we document the expected schema:
/*
ALTER TABLE leads ADD COLUMN consent_at TEXT;
ALTER TABLE leads ADD COLUMN channel TEXT NOT NULL DEFAULT 'whatsapp';
ALTER TABLE leads ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
*/