-- Auditoria das rotas administrativas (/v1/admin/pagina/*): quem chamou, de qual IP,
-- o que aconteceu e quando. Não guarda token, header Authorization nem corpo da requisição.
-- criado_em em milissegundos desde 1970 (UTC), como wa_outbox.
CREATE TABLE IF NOT EXISTS admin_auditoria (
  id TEXT PRIMARY KEY NOT NULL,
  rota TEXT NOT NULL,
  metodo TEXT NOT NULL,
  ip TEXT NOT NULL,
  status INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  detalhe TEXT,
  criado_em INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_auditoria_criado ON admin_auditoria(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_admin_auditoria_ip ON admin_auditoria(ip, criado_em DESC);
