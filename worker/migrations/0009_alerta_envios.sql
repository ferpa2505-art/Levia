-- Prova de execução do alerta diário da fila de pagamento (src/alertaFila.js).
-- O cron roda, mede e grava aqui uma linha por dia: se havia o que alertar e se o Resend
-- aceitou o e-mail. Sem isso, "não recebi e-mail" era indistinguível de "o cron nem rodou".
-- Só contagens e status HTTP: nunca telefone, nome, e-mail, serial ou texto das mensagens.
-- criado_em/atualizado_em em milissegundos desde 1970 (UTC), como wa_outbox.
CREATE TABLE IF NOT EXISTS alerta_envios (
  id TEXT PRIMARY KEY NOT NULL,            -- alerta-fila-AAAA-MM-DD
  dia TEXT NOT NULL,
  presas INTEGER NOT NULL DEFAULT 0,
  perto_de_apagar INTEGER NOT NULL DEFAULT 0,
  pagos_sem_aparelho INTEGER NOT NULL DEFAULT 0,
  houve_alerta INTEGER NOT NULL DEFAULT 0 CHECK (houve_alerta IN (0, 1)),
  whatsapp INTEGER NOT NULL DEFAULT 0 CHECK (whatsapp IN (0, 1)),
  email INTEGER NOT NULL DEFAULT 0 CHECK (email IN (0, 1)),
  email_status INTEGER,
  email_erro TEXT,
  criado_em INTEGER NOT NULL,
  atualizado_em INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerta_envios_criado ON alerta_envios(criado_em DESC);
