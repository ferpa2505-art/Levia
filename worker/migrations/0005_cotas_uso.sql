-- Cotas de uso da IA com contagem atômica (substitui o contador lido/gravado no KV,
-- que deixava requisições paralelas passarem do limite).
CREATE TABLE IF NOT EXISTS cotas_uso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chave TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cotas_uso_chave_ts ON cotas_uso(chave, ts);
CREATE INDEX IF NOT EXISTS idx_cotas_uso_ts ON cotas_uso(ts);
