-- Leviã D1 development schema
-- This migration only creates the foundation. Runtime routes are added in a later PR.

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  email_hash TEXT NOT NULL UNIQUE,
  email_ciphertext TEXT,
  phone_hash TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'blocked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS trials (
  account_id TEXT PRIMARY KEY NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  photo_limit INTEGER NOT NULL DEFAULT 2 CHECK (photo_limit >= 0),
  photo_used INTEGER NOT NULL DEFAULT 0 CHECK (photo_used >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkout_intents (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'annual')),
  expected_amount_cents INTEGER NOT NULL CHECK (expected_amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  external_reference TEXT NOT NULL UNIQUE,
  provider_checkout_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  signature_valid INTEGER NOT NULL CHECK (signature_valid IN (0, 1)),
  processed_at TEXT,
  processing_result TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'annual')),
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'revoked', 'expired')),
  photo_limit INTEGER NOT NULL DEFAULT 0 CHECK (photo_limit >= 0),
  photo_used INTEGER NOT NULL DEFAULT 0 CHECK (photo_used >= 0),
  current_period_start TEXT,
  current_period_end TEXT,
  provider_subscription_id TEXT,
  last_payment_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activation_codes (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  entitlement_id TEXT REFERENCES entitlements(id) ON DELETE SET NULL,
  code_hash TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  invalidated_at TEXT
);

CREATE TABLE IF NOT EXISTS installations (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  public_key TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_trials_status_expires ON trials(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_checkout_account_status ON checkout_intents(account_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_events_processed ON payment_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_entitlements_account_status ON entitlements(account_id, status);
CREATE INDEX IF NOT EXISTS idx_activation_codes_account_expires ON activation_codes(account_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_installations_account_active ON installations(account_id, revoked_at);
