# Checklist de GO — Leviã e Prof. Controller

Estado conferido em 15/11/2026, às **04:12 UTC**, por API do GitHub, `git`, D1 remoto (`levia-licencas-dev`) e requisições HTTP reais.
A decisão final de GO é do dono do produto: o que está aqui é o que foi **provado** e o que **falta**.

> **Todo sha neste documento é um retrato datado.** `main` muda a cada merge e este arquivo não se atualiza sozinho: leia como "o que era verdade às 04:12 UTC de 15/11", não como estado atual. Para o agora, use `git log -1` e o `/health` de produção.

- Leviã: `main` = **`033c0e6`** às 04:12 UTC (22 commits desde o `8e5f849` de 13/11)
- Prof. Controller: `main` local = **`319e373`** — só o sha foi relido em 15/11; o resto da seção 2 continua sendo a conferência de 13/11

> Este documento agora vive aqui, em `Levia/docs/CHECKLIST-GO.md`, para ter histórico no git. A seção 2 trata do **Prof. Controller**, que tem repositório próprio: ela está junto por conveniência da decisão de GO e pode migrar para lá depois.

---

## 1. Leviã

### 1.1 Estado do repositório (conferido em 15/11/2026)

| Item | Valor |
|---|---|
| `main` | **`033c0e6`** — retrato de 15/11 04:12 UTC; 22 commits desde o `8e5f849` |
| Produção do Worker (`/health`) | `{"ok":true,"versao":"7953cb5f-efbd-44ea-8df5-0e55e130fbc6","tag":"7495c77f5eb6f5b2752f8eec29d4df8ca1df1a59"}` — build de `7495c77`, conferido por HTTP. Não está atrasado: depois dele o `main` só recebeu mudanças de **app** |
| Deploy do Worker | ✅ `43645280749` `success` — passos `Aplicar migrations do D1`, `Deploy`, `Check /health` e `Check /versao` todos verdes |
| Deploy Landing (`www.leviapp.org`) | ✅ `43645280949` `success`; `versao.json` = **`7495c77f…`** |
| App em produção (`leviapp.org`) | `sw.js` = **`levia-v2-7495c77`** — ou seja, **sem** o #44 e o #109 |
| Deploy App pendente | ⚠️ `43659104654` (#109) em **`waiting` desde 00:37 UTC**, job `build-deploy` sem nenhum passo iniciado, aguardando a aprovação de `production` (`required_reviewers`). **Enquanto não for aprovado, #44 e #109 não estão no ar** |
| Deploy cancelado | `43644439427` (#116) — **superado** pelo `7495c77`, que já contém o `d24723f`; cancelado para liberar o `concurrency`. Nada do #116 ficou de fora |
| Smoke | **19/19** com `--sha-worker 7495c77f…`, rodado em 15/11 contra produção |
| Code scanning | **0 alertas abertos** |
| Dependabot | **6 alertas, todos `low`** (eram 2 em 13/11) |
| PRs abertos | **nenhum** |
| Working tree | limpo; só `docs/LEVIA_COMO_ATIVAR.pdf` não rastreado (decisão pendente) |

**Banco (D1 `levia-licencas-dev`, lido em 15/11):** 8 contas; **3 direitos** — 1 `active` (`monthly`, até **13/12/2026**) e 2 `revoked` com fim em 13/11/2026; **5 instalações**, 3 ativas; `alerta_envios` com a linha de **15/11** (`presas=0`, `perto_de_apagar=0`, `pagos_sem_aparelho=0`, `houve_alerta=0`), prova de que o cron das 03:00 UTC rodou.

### 1.2 Mesclado depois da primeira versão desta checklist

| PR | O que é | Merge |
|---|---|---|
| **#101** | ativação atômica: valida o código da conta e o direito; serial pago não ganha trial | `9ca6a02` |
| **#102** | termos do app sincronizados com a versão v2026-11-13 | `c25c31a` |
| **#99** | bump de `esbuild`/`vite` em `site/landing` (Dependabot) | `d78f24f` |
| **#68** | i18n: traduções aprovadas e ativação/teste/licença em 18 idiomas | `b602b4f` |
| **#24** | alimentos salvos, medidas caseiras, gráfico configurável e resumo diário | `697850d` |
| **#104** | destrava a fila do deploy do app: `concurrency` com `cancel-in-progress: true` | `6777e86` |
| **#106** | telefone do comprador respeita DDI explícito (`+` ou `00`); sem DDI, só assume Brasil se o número tiver formato brasileiro | `4538520` |
| **#107** | sem `+` no checkout (é assim que a Hotmart manda), reconhece DDI conhecido antes de desistir | `7065238` |
| **#103** | acesso pago e serial entram no **mesmo `db.batch`** (falhou a fila, nada muda e o reenvio do provedor processa de novo); aprovação depois de estorno vira `ja_revertido` | `8e5f849` |
| **#110** | alerta da fila registra o envio (tabela `alerta_envios`, retenção 31 d) e ganha rota admin `POST /v1/admin/alerta-fila` | `6d8a801` |
| **#111** | CI aplica as migrations do D1 antes do deploy | `54e7c97` |
| **#112** | remove as migrations do deploy enquanto o token não tinha permissão de D1 | `f1fe400` |
| **#113** | volta a aplicar migrations no CI, sem travar a publicação (erro `7403` vira aviso) | `edec32b` |
| **#114** | script de serial manual grava o lote em `admin_auditoria` e em `provider_subscription_id` | `8938a00` |
| **#115** | cabeçalhos de segurança em **toda** resposta do Worker (HSTS, nosniff, `X-Frame-Options`, `Referrer-Policy`, CSP) por um único ponto de saída | `07c3e74` |
| **#116** | correções da auditoria de segurança (HSTS, webhook Hotmart, plano por código, rate limit, retenção de leads) — **PR do dono, não revisado nesta sessão** | `d24723f` |
| **#117** | landing: `script-src` com `sha256` calculado no build no lugar de `'unsafe-inline'` | `acec09e` |
| **#118** | `actionlint` no PR checks e smoke exigindo `versao`/`tag` do `/health` | `7495c77` |
| **#44** | WhatsApp inbound: bug de escopo de variável e outras correções do fluxo de entrada | `96e1f0d` |
| **#109** | revogar o consentimento de fotos por IA **sem** apagar os dados do usuário | `cbad668` |

O **#44** e o **#109** mexeram só no **app** (`src/utils/iaPrato.ts`, `src/components/MenuOpcoes.tsx` e testes), não no Worker — é por isso que o `/health` continua em `7495c77` sem estar atrasado, e é por isso que a aprovação que falta é a do **Deploy App**.

Os PRs **#105**, **#108** e **#109** também foram mesclados nesse intervalo; o sha de cada um não foi conferido aqui.

Foi por causa desses PRs que o Dependabot caiu de 9 para 2 alertas em 13/11. Em 15/11 ele está em **6 alertas `low`** — as dependências novas do #116 e do #117 trouxeram avisos novos — e **não há PR aberto** no repositório.

**Atualização de 15/11:** a produção agora é o `7495c77`, que contém o #101 entre outros — o descompasso entre `main` e produção que existia em 13/11 acabou.

### 1.3 Feito e verificado

| Item | Prova |
|---|---|
| `/health` informa a versão real | produção responde `{"ok":true,"versao":"7953cb5f-…","tag":"7495c77f…"}` — id do `version_metadata` + commit |
| Deploy rastreável | run `43645280749` exige tag = SHA do build; os três hosts (Worker, landing, app) estão no mesmo commit `7495c77` |
| Rollback deixou de ser adivinhação | a `versao` do `/health` é o id que `wrangler rollback` consome |
| `main` protegida | ruleset exige `verify`, `worker-api-tests`, `CodeQL`; sem force-push, sem deleção |
| `actionlint` no CI | job novo no `pr-checks.yml` (v1.7.12, sha256 conferido). Na estreia pegou **4 avisos do shellcheck** em workflows antigos (SC2034 em três laços, SC2086 no `py_compile`) — todos corrigidos no #118 |
| CodeQL ligado e zerado | **0 alertas abertos** |
| Dependabot ligado | **6 alertas, todos `low`** — subiu de 2 para 6 com as dependências novas |
| Smoke cobre a versão | **19/19 em produção** com `--sha-worker 7495c77f…` (15/11); a checagem de `versao`/`tag` do `/health` é nova (#118) e reprova deploy sem `--tag` |
| Cabeçalhos de segurança no Worker | `Strict-Transport-Security`, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, CSP `default-src 'none'` — conferidos por HTTP em `/health`, 404 e 401 |
| CORS preservado sob os cabeçalhos novos | preflight de `/v1/ativar` com origem `https://leviapp.org` devolve `204` com `Access-Control-Allow-Origin` **e** a CSP; origem estranha não recebe CORS |
| Landing sem `'unsafe-inline'` no `script-src` | hashes `sha256` calculados no build; se a CSP sair furada, o **build falha**. Em produção conferido por HTTP |
| Landing: página e Pixel funcionam sob a CSP nova | página renderiza sem violação no console; com consentimento, `fbevents.js`, `signals/config` e `PageView` em `200` |
| Testes | worker: **268/268** em 17 suites, incluindo 7 novos de cabeçalhos; smoke unitário: 14/14 |

### 1.4 Falta — bloqueia o GO

- [ ] **`ADMIN_TOKEN` forte (32 bytes)** — só o dono vê na Cloudflare, e é `write-only`: para provar a rota é preciso rodar o `curl` ou gravar o valor em `.env.local` na raiz deste repositório (gitignored). Do `ADMIN_TOKEN` dependem os endpoints administrativos do Worker.
- [ ] **Compra real Hotmart → serial → ativação no aparelho.** O ciclo do worker está **fechado e provado** (13/11, 03:48): compra paga, plano liberado na conta do telefone certo, serial entregue no WhatsApp (`CCHV-KLNU-282D-SA99`). Falta só a confirmação no aparelho — abrir o app, ver o plano ativo e ativar com esse serial. Detalhes em 1.6.1.
- [ ] **Biometria, troca de PIN e 5 PINs errados em Android real.**
- [ ] **Migrations automáticas no CI de verdade:** com o token atual elas não rodam (o passo cai no aviso `7403`). Exige `Account → D1 → Edit` no `CLOUDFLARE_API_TOKEN` (`b83728bc9c4578e9408302d151c53ffb`).

### 1.5 Falta — não bloqueia

- [ ] **6 alertas `low` do Dependabot**: atualizar ou aceitar por escrito.
- [ ] **Backup com restore testado**: o D1 tem Time Travel da Cloudflare (30 d, recurso da plataforma) e houve dois exports manuais em 13/11, mas **nenhum restore foi ensaiado**.
- [ ] **Alerta de segurança**: pico de `401`, falha de webhook ou erro `5xx` não avisam ninguém. O `alerta_envios` já existe e poderia carregar isso.
- [ ] 429 ao vivo em produção (o teste automatizado cobre).
- [ ] Rollback de **app** e **landing** (só o do Worker foi ensaiado).
- [ ] Fluxos de escrita ao vivo (análise de foto, Hotmart).
- [ ] Domínio de envio do e-mail: `send.leviapp.org` sem MX/TXT/DKIM e `EMAIL_FROM` inexistente — o alerta sai, mas não como remetente próprio.
- [ ] Revisão jurídica da política — os termos do app já foram sincronizados no #102; falta a política de privacidade.
- [ ] Decidir o destino de `docs/LEVIA_COMO_ATIVAR.pdf` (PDF ou fonte como artefato do repositório).
- [ ] Registrar que `levia-licencas-dev` é produção de propósito.

### 1.6 Teste de compra real (Hotmart → serial → ativação)

**Compra real: executada pelo dono em 13/11 e ainda não concluída de ponta a ponta** — o serial foi entregue ao telefone errado por um bug de normalização, já corrigido no #106 e no #107 (ver 1.6.1). O pagamento é do dono; dado de pagamento não passa por aqui. O elo de transporte do webhook foi verificado com o "Enviar teste" da Hotmart e depois com a compra real.

**O fluxo tem três elos** (lido em `worker/src/hotmart.js`, `serial.js` e `index.js`):

1. `POST /v1/hotmart/webhook` — hottok no header `X-HOTMART-HOTTOK`; `PURCHASE_APPROVED`/`PURCHASE_COMPLETE` liberam o plano, reembolso/chargeback/cancelamento revogam. O telefone vem de `buyer.checkout_phone`, então **o checkout precisa pedir o WhatsApp**.
2. O bot do WhatsApp emite o serial (`emitirSerial`): só para conta `active`, no máximo 3 emissões por dia.
3. `POST /v1/ativar` com `{ serial, instalacao }` — `instalacao` precisa ser UUID; serial errado gasta tentativa e estoura em `429`.

**Provado em produção em 13/11, sem gastar nada:**

| Prova | Resultado |
|---|---|
| `POST /v1/ativar` com `instalacao` inválida | `400 {"erro":"instalacao_invalida"}` |
| `POST /v1/ativar` com UUID novo e serial inexistente | `403 {"erro":"serial_invalido"}` — endpoint vivo, D1 e chave de licença configuradas (não deu 503) |
| `POST /v1/hotmart/webhook` sem hottok | `401 {"erro":"nao_autorizado","recebido":0,"esperado":66}` — endpoint vivo e `HOTMART_HOTTOK` presente (66 caracteres) |
| **Enviar teste da Hotmart** (13/11, 03:08) | 5 eventos — compra aprovada, completa, cancelada, reembolsada e chargeback, transação `HP16015479281022` — **todos `200 - Processado`** |

O "Enviar teste" fecha o elo de transporte: o hottok do painel bate com o `HOTMART_HOTTOK` do Worker, e o endpoint aceita e responde. Continua **sem** provar a emissão do serial, porque o comprador do teste é fictício.

### 1.6.1 A compra real de 13/11 — o que aconteceu, provado pelo banco

O dono comprou **Leviã - Mensal** (`HP3976163095`), pago por PayPal: **€ 4,72**, sem cupom. O painel mostrou `200 - Processado`, e o D1 (`levia-licencas-dev`) confirmou o resto:

| Prova no banco | Valor |
|---|---|
| `payment_events` | `HP3976163095:paid` → **`liberado_monthly`** |
| Conta criada no instante do webhook | `20d95f8e-…`, plano `monthly` ativo até **13/12/2026** |
| `wa_outbox` | 2 mensagens **enviadas** para **`+5535699506350`**: o aviso de liberação e o serial **`NHQP-37X8-6FJ8-27PB`** |

**Causa:** o telefone do checkout era `35699506350` (Malta — a Hotmart manda o número **sem** o `+`). `telefoneDoComprador` tratava qualquer número de 10–11 dígitos como brasileiro e montava `+5535699506350`, um número que não existe. O plano foi liberado numa conta fantasma e o serial foi entregue a ela.

**Correção em dois passos, cada um provado por um reprocessamento real:**

1. **#106 (`4538520`, em produção)** — respeita DDI explícito (`+` ou `00`) e só assume Brasil quando o número tem formato brasileiro (DDD válido e celular com 9 inicial, ou fixo 2–5). O evento foi reprocessado e o worker devolveu **`sem_telefone`**: provou que o #106 sozinho não bastava, porque sem o `+` não havia DDI explícito. O alerta "Pagamento não liberado" chegou no WhatsApp do dono, o que também prova que a entrega de mensagens funciona.
2. **#107 (`7065238`)** — sem `+`, o número é comparado com uma tabela de DDI conhecidos antes de desistir: `35699506350` vira Malta, e um celular brasileiro sem DDI continua virando `+55`.

**Reparo concluído em 13/11, 03:48 — provado pelo banco:** a conta fantasma, o direito e o código foram apagados (cascata de 3 linhas), a linha `payment_events` foi removida e o evento foi reprocessado já com o #107 em produção (`tag 7065238`). Resultado:

| Prova final (D1) | Valor |
|---|---|
| `payment_events` | `HP3976163095:paid` → **`liberado_monthly`** |
| Conta do plano | criada em **11/11 22:06** — é a conta real do telefone, **não** uma nova |
| Direito | `monthly`, `active`, 13/11 → **13/12/2026**, 100 fotos, **1 direito** na conta (sem duplicata) |
| Aparelhos | **1** aparelho já instalado: como a liberação só troca o serial, ele passa a valer sem reativar |
| `wa_outbox` | aviso + serial **`CCHV-KLNU-282D-SA99`** para **`+35699506350`**, ambos com `enviado_em` preenchido |

A compra que tinha sido liberada para um telefone inexistente está agora na conta certa. O serial antigo (`NHQP-…`) morreu junto com a conta removida. O que resta não é do worker: **confirmar no aparelho** que o app mostra o plano e aceita o serial novo.

Nota operacional: o botão **Reprocessar** da Hotmart funciona para evento já processado com `200` — a plataforma aceita (`PUT api-postback/history` → `202`) e reenvia o mesmo payload.

**Achado no painel — ✅ resolvido em 13/11:** existiam **duas configurações ativas** ("Leviã" e "Leviã Worker") apontando para a **mesma URL** do Worker, cada compra era entregue duas vezes. O Worker tolera (`payment_events` usa `INSERT OR IGNORE` na chave `provider:event_id:event_type`), mas era ruído. **"Leviã Worker" foi desativada** e **"Leviã" ficou ativa** — a que teve os 5 eventos verificados no Enviar teste. Confirmado recarregando o painel: `Leviã` = ativa (tooltip "Desativar"), `Leviã Worker` = inativa (tooltip "Ativar").

**Roteiro para fechar:**

1. **Transporte, grátis — ✅ feito em 13/11:** Hotmart → Ferramentas → Webhook → Minhas configurações → **Enviar teste** (produto "Leviã - Mensal"). Resultado: 5 eventos, todos `200 - Processado`, no histórico do Webhook.
2. **Compra real:** produtos ativos na conta são **Leviã - Mensal (ID `8875689`)** e **Leviã Anual (ID `8876081`)**. Precisa de número de WhatsApp real no checkout — é dele que sai o telefone que o webhook usa. Conferir `200` no webhook e o registro em `payment_events`.
   - **Limite da Hotmart (importante):** não existe cupom de 100%. O campo de desconto trava em `99,99%` e o preço final tem piso de **R$ 1,00** no Brasil. Com o mensal a R$ 19,97, o maior desconto que respeita o piso é **94,99% → R$ 1,00**. Ou seja: **o teste end-to-end mais barato custa R$ 1,00 de verdade** e exige meio de pagamento (não há caminho gratuito por cupom; só uma oferta de preço zero, que é mudança de precificação e não foi feita).
   - O cupom de teste `LEVIA-TST-7K4P2` (94,99%) foi criado e **removido** em 13/11, antes da compra: a compra real saiu por preço cheio, € 4,72.
3. **Serial:** pedir no WhatsApp do bot.
4. **Ativação:** tela `/ativar` em `leviapp.org` ou `POST /v1/ativar` com o serial e um UUID de instalação. Esperado: `{ ok, licenca, plano, acessoAte }`.
5. **Revogação:** pedir reembolso e confirmar que o plano cai.

O que o agente consegue fazer depois que existir um serial: rodar a ativação e conferir a licença, e verificar o estorno pelo mesmo caminho.

---

## 2. Prof. Controller

### 2.1 Feito e verificado

| Item | Prova |
|---|---|
| `main` protegida | 6 checks obrigatórios, `strict`, `enforce_admins`, sem force-push/exclusão |
| `legacy/server` removido | PR #59 (27 arquivos, 3.594 linhas), `main` = `9908625` |
| CodeQL zerado | **0 alertas** (eram 21, todos no `legacy/server`) |
| Dependabot reduzido | **2 alertas** (minimatch, uuid; eram 7) — `qs` e `fast-uri` saíram nos bumps #53/#51 |
| `versionCode` coerente | PR #56: fórmula única, input `build_number`, `scripts/android-version.mjs` antes do Gradle |
| Pages intacto | `https://ferpa2505-art.github.io/prof-controller/` 200, `BUILD_ID 1.3.2-b441c78428` |

### 2.2 Falta

- [ ] **Ler o versionCode ativo na Play** (seção 2.3) — só o dono tem acesso.
- [ ] Resolver os 2 alertas restantes do Dependabot (o updater do `minimatch` falha: não há atualização válida dentro das restrições atuais).
- [ ] Decidir #48 (instruções do Claude Code), #44 (rascunho, keystore Android), #3 (rascunho).
- [ ] Decidir se o resto de `legacy/` (19 arquivos em `seed-scripts` e `subscription`, sem alerta) sai.

---

## 2.3 Play Console: o que conferir antes de publicar

Esta seção existe porque **a Play é a única fonte da verdade** do versionCode, e o repositório não tem como descobrir esse número sozinho.

### Onde ler o número

1. Play Console → app **Prof. Controller** → menu **Versão** (Release).
2. Abra **Produção** (Production) e localize a versão ativa.
3. Copie o campo **Versão do código** (version code) — é um inteiro, não o `1.3.2`.
4. **Repita em todas as outras faixas**: Teste interno, Teste fechado (Closed testing), Teste aberto (Open testing).
5. Considere também versões **em análise ou em rascunho**.

**Por que olhar todas as faixas:** a Play recusa qualquer AAB cujo versionCode já tenha sido enviado, em **qualquer** faixa e mesmo que nunca tenha sido publicado. Um bundle que subiu só para teste interno já consumiu aquele número. O valor que importa é o **maior** encontrado entre todas as faixas.

### A conta que o projeto usa

```
versionCode = MAJOR*1.000.000 + MINOR*10.000 + PATCH*100 + BUILD     (BUILD de 0 a 99)
```

Com o `version` atual do `package.json` (**1.3.2**), a faixa é:

| BUILD | versionCode |
|---|---|
| 0 | **1.030.200** |
| 1 | 1.030.201 |
| 99 | 1.030.299 (teto da 1.3.2) |

### O que fazer conforme o versionCode ativo (A)

| Se A for… | O que fazer |
|---|---|
| **A < 1.030.200** | Nada. Publique 1.3.2 com `build_number=0` → 1.030.200. |
| **1.030.200 ≤ A ≤ 1.030.298** | Mesma versão, outro build: use `build_number = A − 1.030.200 + 1`. Exemplo: A = 1.030.250 → build 51 → 1.030.251. |
| **A = 1.030.299** | Builds da 1.3.2 esgotados. Suba o `version` para **1.3.3** (build 0 → 1.030.300). |
| **A ≥ 1.030.300** | Suba o `version` até o primeiro código maior que A. Ex.: se A = 1.040.000 (alguém publicou a 1.4.0), 1.3.3 não basta — precisa de **1.4.1** (1.040.100) ou 1.5.0. |

Ao subir o `version`, o **versionName exibido no app também muda** (ele vem do `package.json`) — não é uma mudança invisível.

### Como provar antes de enviar

Com A em mãos, no repo `prof-controller`:

```bash
node scripts/android-version.mjs --ultimo <A>
```

- Ele imprime o versionCode calculado e **falha** se o novo for igual ou menor que A.
- Sem `--ultimo`, ele calcula mas avisa que a sequência não foi conferida.
- Se falhar: o `version` do `package.json` ainda não é suficiente — suba e repita.

No disparo manual do workflow `android.yml`:

- `ultimo_versioncode` = o A lido na Play → o build **aborta** se o versionCode calculado não for maior.
- `build_number` = 0 a 99 (só quando for reenvio da mesma versão).

Nunca use `-PversionCode` para "resolver" isso: ele ignora a fórmula e reintroduz o risco de repetir um código.

### O que continua manual

O PR #56 **não** assina AAB, **não** envia à Play e **não** usa credenciais. A checagem é preventiva: evita gastar um build com número inválido, mas o upload e a publicação continuam sendo atos humanos no Play Console.

---

## 3. O que não foi verificado

- Suíte **completa** do Leviã: em 15/11 rodaram as 17 suites de worker (**268 testes**) e as de smoke/cabeçalhos; o app React Native não foi testado nesta rodada.
- Valor do `ADMIN_TOKEN` (impossível de fora).
- Migrations do banco `levia-licencas-dev` uma a uma: as tabelas usadas em 13/11 (`payment_events`, `wa_outbox`, `accounts`, `entitlements`, `activation_codes`, `trials`, `installations`) existem e foram consultadas; a 0008 não foi conferida.
- Comportamento do #101 (ativação atômica) em produção — o código já está no Worker deployado (`697850d`), mas ninguém exercitou uma ativação real contra ele.
- O app em `leviapp.org`: `sw.js` carimbado `7065238` e os três bundles em `200 text/javascript`, mas ninguém percorreu as telas do #24/#68 no aparelho.
- O reparo da compra real está **provado no banco** (plano, serial e entrega), mas **não no aparelho**: ninguém abriu o app com o serial novo para ver o plano ativo e a IA liberada.
- **Decisão registrada — deploy do app `43358595819`: aprovado, não cancelado.** O #107 não alterou o app, então o build era exatamente o mesmo; aprovar alinhou o carimbo do `sw.js` com a `main` (`levia-v2-7065238`), provou que o pipeline continua funcionando depois do #104 e encerrou o run em vez de deixar um `waiting` pendurado pedindo aprovação para sempre.
- **versionCode ativo na Play** (seção 2.3) — requer acesso ao Play Console.
