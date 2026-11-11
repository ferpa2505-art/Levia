-- WhatsApp conversation state and idempotency tables
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