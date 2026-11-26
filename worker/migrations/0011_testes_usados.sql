-- Telefones que já usaram o teste grátis de 7 dias: só o hash HMAC do telefone (o mesmo de accounts.phone_hash)
-- e a data do primeiro teste. Fica mesmo depois de APAGAR, para o teste não ser repetido apagando a conta.
-- Não guarda nome, e-mail, telefone em texto nem dado de saúde.
CREATE TABLE IF NOT EXISTS testes_usados (
  phone_hash TEXT PRIMARY KEY NOT NULL,
  primeiro_teste_em TEXT NOT NULL
);

-- quem já tem teste hoje entra na lista
INSERT OR IGNORE INTO testes_usados (phone_hash, primeiro_teste_em)
  SELECT a.phone_hash, MIN(t.started_at)
    FROM trials t JOIN accounts a ON a.id = t.account_id
   WHERE a.phone_hash IS NOT NULL
   GROUP BY a.phone_hash;
