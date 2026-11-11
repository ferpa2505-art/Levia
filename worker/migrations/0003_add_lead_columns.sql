-- Add consent_at, channel, updated_at columns to leads table
-- Created as part of PR 1 - Worker hardening

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- This migration should be run once. If columns already exist, it will fail gracefully
-- in production but that's acceptable for this use case.

-- No-op: a 0002 já cria a tabela leads com consent_at, channel e updated_at.
-- Esta migration foi aplicada em produção antes de a 0002 passar a criar as colunas; em banco
-- novo os ALTER TABLE falhavam com "duplicate column name". O nome é mantido porque já consta
-- em d1_migrations na produção, e renomear criaria uma migration pendente.