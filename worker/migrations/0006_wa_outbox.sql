-- Fila de lembretes do atendimento por WhatsApp: o Worker agenda, o gateway busca e envia.
-- Tempos em milissegundos desde 1970 (UTC). enviado_em é gravado ao entregar a mensagem ao gateway,
-- então cada lembrete sai no máximo uma vez.
CREATE TABLE IF NOT EXISTS wa_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  phone TEXT NOT NULL,
  texto TEXT NOT NULL,
  enviar_em INTEGER NOT NULL,
  criado_em INTEGER NOT NULL,
  enviado_em INTEGER,
  cancelado_em INTEGER
);

CREATE INDEX IF NOT EXISTS idx_wa_outbox_pendentes ON wa_outbox(enviar_em)
  WHERE enviado_em IS NULL AND cancelado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_wa_outbox_phone ON wa_outbox(phone);
