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

Há um script **somente de leitura** (`scripts/smoke.cjs`): só faz GET, HEAD e OPTIONS (qualquer outro método é recusado antes de sair da máquina), sem token, sem criar conta, sem enviar foto e sem chamar rotas administrativas. Não usa dado real.

```bash
npm run smoke                      # confere o que está no ar
npm run smoke -- --sha <commit>    # exige o APP nesse commit
npm run smoke -- --sha-worker <commit>  # exige o Worker nesse commit (só muda quando worker/** muda)
npm run smoke -- --json            # saída em JSON
```

Também roda no GitHub, manualmente: **Actions → "Smoke test (somente leitura)" → Run workflow** (campo opcional com o commit esperado). Sai com código 0 se tudo passou e 1 se algo falhou.

O que ele confere (18 checagens):

- Worker: `/health`, `/versao` (commit), rota inexistente → 404 sem detalhe, sitekey do Turnstile só com a chave pública.
- CORS: preflight aceita `https://leviapp.org` e `https://www.leviapp.org` (sem `*`, com `Vary: Origin`, sem credenciais) e recusa origens estranhas.
- App: `/` e `/ativar` (título "Leviã"), manifesto, `sw.js` carimbado com o commit e sem cache, ícones, cabeçalhos de segurança (nosniff, Referrer-Policy, CSP com `frame-ancestors 'none'`).
- Landing: `/` e `/versao.json`. A landing só muda com `site/landing`, então pode estar num commit mais antigo que o app: o `--sha` não é exigido dela.

**O que ele não cobre** (por ser somente leitura): ativação com serial, análise de foto, webhook da Hotmart e rotas administrativas. Esses fluxos de escrita têm um teste à parte, **local**, em `scripts/e2e-local.cjs` (`npm run e2e:local`): sobe o Worker de verdade (`wrangler dev --local`) com um banco e um KV descartáveis e segredos gerados na hora, e percorre webhook da Hotmart (compra, repetição, reembolso) → serial → ativação de aparelhos e limite de dispositivos → rotas admin fechadas e auditoria → CORS. **Não toca a produção**, não usa conta da Cloudflare nem dado real. A análise de foto só é testada até a recusa sem licença (não há chave real do Gemini).

Os workflows de deploy já fazem `/health` e `/versao` (Worker) e `versao.json` (landing) ao final.

## 5. Ensaio realizado (12/11/2026, autorizado pelo responsável)

Rollback de **emergência do Worker** (`levia-ia-worker`) ensaiado em produção com `wrangler rollback`, nesta ordem:

| Momento | Versão do Worker | `/versao` | `/health` | Smoke (`scripts/smoke.cjs`) |
|---|---|---|---|---|
| Antes | `0d9afb8c-c6d7-423a-9400-46412688132c` | `fee7dcd63e414e38c4b96d124d614f3099b0f947` | `{"ok":true}` | (18 de 18 na rodada anterior) |
| Rollback para a versão do deploy de `e3d6fe2` | `28ae7f39-cf0a-4ed4-933e-4fd18d06846c` | `e3d6fe22399531087b399575170016812190b748` | `{"ok":true}` | **18 de 18** com `--sha-worker e3d6fe2` |
| Volta | `0d9afb8c-c6d7-423a-9400-46412688132c` | `fee7dcd63e414e38c4b96d124d614f3099b0f947` | `{"ok":true}` | **18 de 18** com `--sha-worker fee7dcd` |

O que o ensaio mostrou:
- O rollback levou segundos e o `/versao` passou a informar o commit **antigo**, como descrito na seção 3.
- As rotas admin continuaram fechadas durante o rollback (`401`, não `503`): o `ADMIN_TOKEN` seguiu configurado.
- **Cuidado com secrets:** a versão `16b7c1bd` (03:55 UTC) é uma "Secret Change" (criação do `ADMIN_TOKEN`). Reverter para uma versão **anterior** a ela pode desfazer secrets. Só reverta para versões posteriores à última troca de secret, e confira `wrangler deployments list` antes.
- Comando usado: `cd worker && npx wrangler rollback <VERSION_ID> --message "motivo" --yes`.

**Não foram ensaiados:** rollback do **app** e da **landing** (cada um tem seu config, ver seção 3) e o caminho de revert por PR (seção 2).
