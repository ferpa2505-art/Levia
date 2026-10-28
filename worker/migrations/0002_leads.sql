-- Leviã leads table for WhatsApp lead capture
-- Created as part of PR 1 - Worker hardening

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  pain_point TEXT,
  source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'web', 'typebot', 'api')),
  consent_at TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_channel ON leads(channel);
