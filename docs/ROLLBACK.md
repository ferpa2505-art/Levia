# Rollback e conferência de versão

> **Estado:** procedimento documentado, **ainda não executado em produção**. Faça o primeiro ensaio num horário calmo e anote o resultado aqui.

## 1. Descobrir o que está no ar

| Parte | Como conferir o commit publicado |
|---|---|
| Worker (`levia-ia-worker`) | `GET https://levia-ia-worker.ferpa2505.workers.dev/versao` → `{"commit":"<sha completo>"}` |
| App (leviapp.org) | `GET https://leviapp.org/sw.js` → linha `const CACHE = 'levia-v2-<7 primeiros do sha>'` |
| Landing (www.leviapp.org) | sem carimbo; use a execução "Deploy Landing" do commit em Actions |

O `/versao` só devolve o hash do commit (público). Se aparecer `desconhecido`, o Worker foi publicado sem passar pelo workflow.

## 2. Rollback — caminho recomendado (revert por PR)

Passa pelas regras de proteção e fica no histórico.

1. Em `main`, abra um PR que reverte o commit/PR problemático (botão **Revert** no PR mesclado).
2. Espere os checks `worker-api-tests` e `verify` e mescle.
3. Aprove o deploy no ambiente `production` (Actions → execução → **Review deployments**).
4. Confira `/versao` e `sw.js` (tabela acima) e o smoke test abaixo.

## 3. Rollback — emergência (volta direto à versão anterior na Cloudflare)

Use quando o revert por PR for lento demais. Precisa de login na Cloudflare (`npx wrangler login`); não digite tokens em lugar nenhum além do `wrangler`.

Worker:

```bash
cd worker
npx wrangler deployments list
npx wrangler rollback <VERSION_ID> --message "rollback: motivo"
```

App e landing (cada um tem seu config):

```bash
npx wrangler deployments list --config wrangler.app.jsonc
npx wrangler rollback <VERSION_ID> --config wrangler.app.jsonc --message "rollback: motivo"

cd site/landing
npx wrangler deployments list
npx wrangler rollback <VERSION_ID> --message "rollback: motivo"
```

Depois do rollback de emergência, o `/versao` e o `sw.js` mostram o commit **antigo** (esperado). Abra em seguida o PR de revert (seção 2) para `main` voltar a refletir o que está no ar; até lá, **não** mescle outro PR que dispare deploy.

## 4. Smoke test (antes e depois de qualquer publicação)

- [ ] `GET /health` do Worker → 200 com `{"ok":true}`.
- [ ] `GET /versao` do Worker → commit esperado.
- [ ] `https://leviapp.org/` e `https://leviapp.org/ativar` → 200, título "Leviã".
- [ ] `https://www.leviapp.org/` → 200.
- [ ] Preflight `OPTIONS` em `/v1/ativar` com `Origin: https://leviapp.org` devolve `Access-Control-Allow-Origin` igual à origem; com uma origem estranha, sem esse cabeçalho.
- [ ] `POST /v1/analisar-prato` sem credencial válida é recusado (nunca 200).
- [ ] Nenhum dado real em testes: use contas, telefones e e-mails fictícios.

Os workflows de deploy já fazem `/health` (e, no Worker, `/versao`) ao final; o restante é manual.
