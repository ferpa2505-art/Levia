-- Quem respondeu PARAR no WhatsApp: não recebe lembretes do teste nem outros avisos por iniciativa do Leviã.
CREATE TABLE IF NOT EXISTS wa_optout (
  phone TEXT PRIMARY KEY NOT NULL,
  criado_em TEXT NOT NULL
);
