# Cobrança: teste grátis de 7 dias, paywall e assinatura via Hotmart

Data: 15/10/2026 · Revisão 4 · Status: aguardando revisão · Escopo: Fases 1 e 2 (servidor + app)

Projeto relacionado: `2026-10-15-bot-vendas-whatsapp-design.md` (projeto B), que depende
deste.

## 1. Objetivo

Colocar a PWA do Leviã à venda por assinatura, **no mundo todo**. Qualquer pessoa usa o
app completo por 7 dias, sem cartão. Depois disso o app fica em modo restrito até a
pessoa assinar (mensal ou anual) pela Hotmart.

### Decisões já tomadas com o dono do produto

| Tema | Decisão |
|---|---|
| Onde vende | **Só na PWA (web)**, para qualquer país. Sem Play Store por enquanto |
| Teste | 7 dias, com **3 fotos de IA no total**, ligado a um **telefone verificado pelo WhatsApp** |
| Telefone repetido | Mesmo telefone com outro e-mail **não ganha** novo teste |
| Planos | Mensal R$ 12,97 · Anual R$ 124,51 (−20%); a Hotmart converte para a moeda de quem compra |
| Pagamento | Hotmart (assinatura recorrente, webhook 2.0.0) |
| Licença | **Serial próprio do Leviã**, enviado ao comprador; vale em **até 2 aparelhos** |
| 3º aparelho | Desliga o mais antigo, que tem **uma última entrada** com **backup por e-mail** e depois trava |
| IA para assinante | **2 fotos por dia**, incluídas no preço |
| Fim do teste sem pagar | Vê e exporta tudo; registra **só peso e glicose**; o resto fica bloqueado |
| Testadores | **15 cortesias** com acesso de assinante por 10 anos, mesmos limites |
| Chave de API própria | Fora do lançamento |

### Fora do escopo

- Bot de vendas no WhatsApp (projeto B), página de vendas e anúncios.
- Cobrança no app nativo Android/iOS. O app nativo continua como está.
- Conta com senha e sincronização contínua de dados entre aparelhos.

## 2. Visão geral

```
           ┌──────────── App (PWA) ─────────────────┐
           │ AssinaturaContext ── useAcesso()       │
           │ paywall · modo restrito · serial       │
           │ última entrada + backup                │
           └──┬──────────────┬───────────────┬──────┘
 abre WhatsApp│ /v1/...      │               │ /v1/analisar-prato
 "LEVIA 4829" │              │               │
      ▼       │              ▼               ▼
 WhatsApp ──► Meta ──► ┌───────────────────────────────┐
 do usuário   webhook  │ levia-ia-worker (Cloudflare)  │──► Gemini
                       │ KV LEVIA_COTAS                │──► Resend (e-mail)
 Hotmart ────────────► │                               │──► WhatsApp Cloud API
 webhook               └───────────────────────────────┘
 GitHub Actions ── "Criar cortesia" / "Revogar licença" ──► KV
```

O worker que já existe passa a ser a fonte da verdade sobre quem está em teste e quem
assinou. Os dados de saúde continuam só no aparelho. A única exceção é o backup da
última entrada, que passa pelo servidor **já criptografado** e não fica guardado (3.9).

## 3. Servidor (worker)

### 3.1 Identidade

- **E-mail**: normalizado. Minúsculas, sem espaços. Para `gmail.com`/`googlemail.com`
  também tira os pontos e o `+apelido`; para os demais domínios tira o `+apelido`.
- **Telefone**: qualquer país, no formato E.164. Comprovado porque **o próprio
  usuário manda uma mensagem do WhatsApp dele** para o número oficial do Leviã
  (3.3). O número vem do webhook da Meta, assinado; o app nunca informa o telefone.
  O servidor guarda **só um HMAC do telefone** (segredo `TELEFONE_PEPPER`).
- **Instalação**: o UUID que o app já gera (`levia:instalacao`).
- **Serial**: `LEVIA-XXXX-XXXX-XXXX` (Crockford base32, 60 bits aleatórios). O servidor
  guarda **só o hash SHA-256**.

### 3.2 Chaves no KV

| Chave | Valor | Validade |
|---|---|---|
| `verif:<codigo>` | `{ instalacao, criado, telHmac?, confirmadoEm? }` | 15 min |
| `tel:<hmac>` | `{ email, testeInicio }` | 2 anos |
| `teste:<email>` | `{ inicio, fim, fotos: number[], telHmac }` | 30 dias após `fim` |
| `teste-inst:<instalacao>` | `<email>` | 30 dias após o fim do teste |
| `lic:<email>` | `{ status, plano, validoAte, transacoes, serialHash, aparelhos: {id, desde}[], desligados: {id, em, entradaFinalUsada}[], origem, idioma, atualizadoEm }` | 400 dias após `validoAte` (cortesia: sem expiração) |
| `serial:<hash>` | `<email>` | igual à licença |
| `evento:<id>` | `1` (idempotência dos webhooks) | 30 dias |
| `ia-dia:<email>:<AAAA-MM-DD>` | fotos do assinante no dia (UTC) | 2 dias |
| `backup-dia:<email>:<data>` | backups enviados no dia | 2 dias |
| `dia:<data>` / `ip:<ip>:<hora>` | contadores atuais (mantidos) | atuais |
| `lim:<rota>:<chave>:<hora>` | limite de tentativas por rota | 2 h |

### 3.3 Verificação do telefone pelo WhatsApp

1. O app chama `POST /v1/verificacao` `{ instalacao }` e recebe
   `{ codigo: "LEVIA 482913", numero: "<número oficial>", expira }`.
2. O app mostra o botão **"Confirmar pelo WhatsApp"**, que abre
   `https://wa.me/<número>?text=LEVIA%20482913`. A pessoa só toca em enviar.
3. A Meta entrega a mensagem em `POST /v1/whatsapp`. O worker confere a assinatura
   `X-Hub-Signature-256` (segredo `META_APP_SECRET`), acha o código, grava o `telHmac`
   em `verif:<codigo>` e responde no WhatsApp: "Número confirmado ✅ Pode voltar ao app."
   Essa resposta está dentro da janela aberta pelo próprio usuário e **não é cobrada**
   (regra de preços da Meta).
4. O app consulta `POST /v1/verificacao/estado` `{ codigo, instalacao }` a cada 3 s
   (por até 10 min) e recebe `{ confirmado: true, tokenTelefone }`. O token é assinado
   (3.10), vale 30 min e contém só o `telHmac`.

**Pelo funil de vendas (projeto B):** quando a pessoa já está conversando com o bot, o
bot manda um link `https://<app>/?t=<tokenTelefone>` com o telefone já comprovado
(validade de 24 h). A pessoa abre e só informa o e-mail.

Regras do código: 6 dígitos, uso único, ligado à instalação que pediu, expira em
10 min, no máximo 5 códigos por instalação por hora. Mensagens com código errado
recebem resposta genérica.

**Por que não há fraude de SMS:** o servidor não manda nenhuma mensagem paga para
iniciar a verificação. Quem manda é o usuário, do próprio WhatsApp.

**Quem não tem WhatsApp:** não consegue começar o teste grátis, mas pode assinar
direto. A tela explica isso.

### 3.4 Barreiras contra teste repetido

1. **Telefone comprovado pelo WhatsApp** é obrigatório para começar o teste.
2. **Telefone já usado** em um teste, com qualquer e-mail → sem teste novo. A pessoa vai
   para o paywall com a mensagem "Este telefone já usou o teste grátis".
3. **Apelidos do mesmo e-mail** contam como um só (3.1).
4. **E-mails descartáveis** recusados por uma lista embutida.
5. **Um navegador, um teste** (`teste-inst`).
6. **Limites por IP e por instalação** em todas as rotas.

O que continua possível: alguém com outro chip **e** outra conta de WhatsApp. Isso custa
dinheiro e tempo de quem tenta, o que basta para um app de R$ 12,97.

### 3.5 Endpoints

Todos (menos os webhooks) exigem o cabeçalho `x-levia-app` atual, respondem com CORS para
as origens web permitidas e têm limite por IP. Erros de e-mail, serial e código são
**genéricos**, para não revelar se um e-mail comprou.

**`POST /v1/verificacao`** e **`POST /v1/verificacao/estado`** (3.3).

**`GET /v1/whatsapp`**: handshake de cadastro do webhook da Meta (`hub.verify_token`
igual a `WHATSAPP_VERIFY_TOKEN`).

**`POST /v1/whatsapp`**: mensagens recebidas. Confere `X-Hub-Signature-256`.
Idempotência pelo id da mensagem. Mensagem `LEVIA <6 dígitos>` → verificação (3.3).
Qualquer outra mensagem → entregue ao bot (projeto B). Enquanto o projeto B não existir,
responde uma mensagem fixa com o link do app.

**`POST /v1/teste`** `{ email, tokenTelefone, instalacao }`
- Confere o `tokenTelefone`.
- `tel:<hmac>` já existe → `403 telefone_ja_usou_teste`.
- Instalação já com teste de outro e-mail → `409 aparelho_com_outro_teste`.
- `teste:<email>` já existe → só devolve o status (o teste não recomeça).
- Senão cria `teste:<email>` (`fim = agora + 7 dias`), `tel:<hmac>` e `teste-inst`.
- Responde como o `/v1/status`.

**`POST /v1/status`** `{ email, instalacao }` → `{ fase, testeFim, validoAte, plano,
fotosRestantes, fotosTipo, entradaFinal, token }`
- `fase`: `assinante` · `teste` · `expirado` · `sem_teste` · `desligado`.
- `entradaFinal`: só com `desligado`; `true` enquanto a última entrada não foi usada.
- `token`: status **assinado** (3.10), válido por 3 dias.

**`POST /v1/ativar`** `{ email, serial, instalacao }` **ou** `{ email, transacao, instalacao }`
- Com **serial**: `serial:<hash(serial)>` precisa apontar para o e-mail informado.
- Com **código da transação Hotmart** (reserva para quem não recebeu o serial): a
  transação precisa estar em `lic.transacoes`; o servidor gera um serial novo, mostra
  na tela e reenvia por e-mail.
- Aparelhos: já na lista → ok. Menos de 2 → adiciona. Já há 2 → o mais antigo vai para
  `desligados` (`entradaFinalUsada = false`) e a resposta traz `desligou: true`. Se a
  instalação que ativa estava em `desligados`, sai de lá.
- Limite: 10 tentativas por IP por hora.

**`POST /v1/entrada-final`** `{ email, instalacao }` → marca `entradaFinalUsada = true`.
O app chama **ao abrir** a última entrada.

**`POST /v1/backup-email`** `{ email, instalacao, arquivo }` (3.9).

**`POST /v1/reenviar-serial`** `{ email }` → serial novo por e-mail se houver licença
válida (o antigo não ativa mais aparelhos; os já ativados seguem). Sempre responde `200`.

**`POST /v1/webhook/hotmart`**
- Valida `X-HOTMART-HOTTOK` contra `HOTMART_HOTTOK` em tempo constante.
- Idempotência por `evento:<id>`. Ignora produto diferente de `HOTMART_PRODUTO_ID`.
- Plano pelo código do plano/oferta (`HOTMART_PLANO_MENSAL` / `HOTMART_PLANO_ANUAL`).
- Guarda o idioma provável do comprador (país do comprador no payload, se houver) para
  escolher o idioma dos e-mails.

| Evento | Efeito na licença |
|---|---|
| `PURCHASE_APPROVED`, `PURCHASE_COMPLETE` | `status = ativa`; guarda a transação; `validoAte = max(validoAte, agora) + 31 dias (mensal) ou 366 (anual)` + 3 dias de folga. **Primeira compra**: gera o serial e manda o e-mail de boas-vindas |
| `SUBSCRIPTION_CANCELLATION` | `status = cancelada_no_fim` (vale até `validoAte`) |
| `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_PROTEST` | `status = revogada`, `validoAte = agora` |
| `PURCHASE_DELAYED`, `PURCHASE_EXPIRED`, `PURCHASE_CANCELED` | não muda (a validade vence sozinha) |
| `SWITCH_PLAN` | atualiza `plano` |
| outros | `200`, ignora |

> **A conferir no primeiro teste:** nomes exatos dos campos dos payloads da Hotmart e da
> Meta. A leitura fica isolada em `hotmart.js` e `whatsapp.js`, ajustada a partir de
> eventos de teste reais.

### 3.6 Mudanças em `/v1/analisar-prato`

Corpo passa a ter `email` (obrigatório na web). Ordem:
1. Token do app, formato, tamanho (como hoje).
2. Limite por IP por hora (como hoje).
3. Status (mesma regra do `/v1/status`):
   - **assinante** → `ia-dia:<email>:<hoje UTC>` < 2, senão `429 cota_dia` com `liberaEm`.
     Assinante **não** entra no teto global `MAX_FOTOS_DIA`.
   - **teste** → menos de 3 fotos no teste e teto global do dia, senão `402 cota_teste`.
   - **expirado / sem teste / desligado** → `402 assinatura_necessaria`.
4. Conta a foto só se a IA respondeu (como hoje).

O dia da cota usa UTC porque os usuários estão em vários fusos.
A cota antiga por instalação (`inst:<id>`) continua valendo **só** para pedidos sem
`email`, que vêm do app nativo atual.

### 3.7 Aparelho substituído: última entrada e backup

1. A pessoa ativa o serial num aparelho novo; o mais antigo vai para `desligados`.
2. Quando o aparelho antigo abre o app, o status vem `desligado` com
   `entradaFinal = true`. O app chama `/v1/entrada-final` e mostra uma tela única:
   "Sua assinatura foi ativada em outro aparelho. Esta é a última vez que o Leviã abre
   aqui. Vamos mandar seus dados para o seu e-mail."
3. A pessoa cria uma **senha do backup** (ou usa a que já tem). O app gera o backup com a
   criptografia que já existe (`cifraBackup.ts`), manda para `/v1/backup-email` e oferece
   o **download** do arquivo.
4. Depois disso, ou se a pessoa sair, o app trava por completo. Só aparece "Ative com seu
   serial" (que, se usado, desliga o outro aparelho).
5. No aparelho novo, a pessoa restaura pelo **Importar backup**, que já existe.

**Limite honesto:** o backup só sai se o aparelho antigo **for aberto de novo**. Celular
perdido, roubado ou quebrado não manda nada. Por isso há lembretes de backup (4.7).

### 3.8 E-mail

Provedor: **Resend** (plano grátis: 3.000 e-mails/mês, 100/dia, segundo fontes de
terceiros). Exige **domínio próprio verificado**. Segredo `RESEND_API_KEY`.
E-mails: boas-vindas com serial, serial reenviado, backup da última entrada.
Idiomas dos textos: pt, en, es, fr e it (os mesmos do banco de alimentos); os demais
recebem em inglês.

**Sem domínio:** o serial aparece na tela na primeira ativação (e-mail + código da
transação Hotmart) e o backup da última entrada fica **só como download**. O envio é
ligado por configuração (`EMAIL_ATIVO`).

### 3.9 Backup por e-mail

- O arquivo chega **criptografado com a senha do usuário**. O servidor não tem a senha e
  não consegue ler o conteúdo.
- O servidor **não guarda** o arquivo nem o registra em log: repassa ao Resend como anexo
  e descarta.
- Só aceita de instalação em `desligados` (entrada final) ou ativa na licença.
- Limite de tamanho: 10 MB. Acima disso → `413` e o app fica só com o download.
- Limite: 3 backups por licença por dia.
- Aviso na tela: "Sem a senha do backup não é possível abrir o arquivo. Nós não
  conseguimos recuperar essa senha."

### 3.10 Segurança

1. **Status assinado** com chave Ed25519 (`STATUS_CHAVE_PRIVADA`). O app confere com a
   chave pública embutida. Editar o armazenamento do navegador não vira "assinante". O
   `tokenTelefone` usa a mesma chave.
2. **Validade curta offline:** token de 3 dias.
3. **O que custa dinheiro fica no servidor:** a IA só responde depois que o servidor
   confere teste ou licença.
4. **Segredos só na Cloudflare:** Gemini, hottok, Resend, chave de assinatura,
   `TELEFONE_PEPPER`, `META_APP_SECRET`, `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN`.
5. **Webhooks conferidos:** Hotmart pelo hottok, Meta pela assinatura HMAC-SHA256 do
   corpo. Ambos em tempo constante e com idempotência.
6. **Telefone guardado como HMAC**, serial como hash, erros genéricos, limites por IP e
   por instalação.
7. **Backup:** criptografado no aparelho; o servidor só repassa.
8. **Última entrada controlada pelo servidor**, marcada ao abrir.
9. **Dados mínimos** no servidor: e-mail, datas, plano, ids de aparelho, HMAC do telefone.
   Logs só com contagens.

O que não se resolve: quem alterar o código do app consegue usar o modo completo **sem
IA**. Isso é aceito.

### 3.11 Cortesias para os 15 testadores

- Workflow manual no GitHub Actions **"Criar cortesia"**: campo com o e-mail do testador.
- Cria `lic:<email>` com `origem = 'cortesia'`, `validoAte = agora + 10 anos`, mesmos
  limites de assinante. Testador **não** precisa verificar telefone.
- Mostra o serial no resumo do workflow (repositório privado), para você mandar por
  WhatsApp; com e-mail ativo, também envia por e-mail.
- Workflow **"Revogar licença"**.
- Usa o `CLOUDFLARE_API_TOKEN` que já existe. Nenhuma rota de administração no worker.

### 3.12 Configuração

`[vars]`: `TESTE_DIAS = "7"`, `FOTOS_TESTE = "3"`, `FOTOS_ASSINANTE_DIA = "2"`,
`MAX_APARELHOS = "2"`, `TOKEN_STATUS_DIAS = "3"`, `BACKUP_MAX_MB = "10"`,
`EMAIL_ATIVO`, `EMAIL_REMETENTE`, `WHATSAPP_NUMERO`, `WHATSAPP_PHONE_ID`,
`HOTMART_PRODUTO_ID`, `HOTMART_PLANO_MENSAL`, `HOTMART_PLANO_ANUAL`.
Segredos novos: `HOTMART_HOTTOK`, `RESEND_API_KEY`, `STATUS_CHAVE_PRIVADA`,
`TELEFONE_PEPPER`, `META_APP_SECRET`, `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN`.

### 3.13 Organização do código

`worker/src/index.js` (242 linhas hoje) fica dividido em:
- `index.js`: rotas, CORS, limites.
- `ia.js`: Gemini e prompt (movido sem mudança).
- `acesso.js`: e-mail normalizado, teste, status, cotas.
- `verificacao.js`: códigos, `tokenTelefone`, HMAC.
- `whatsapp.js`: webhook da Meta (assinatura, leitura, envio de resposta).
- `licenca.js`: serial, aparelhos, desligados, entrada final, cortesia.
- `hotmart.js`: payload e eventos.
- `email.js`: Resend, textos, anexo do backup.
- `assinatura.js`: tokens Ed25519.

## 4. App

### 4.1 Onde a cobrança vale

`COBRANCA_ATIVA = Platform.OS === 'web'`. No app nativo nada muda.

### 4.2 `AssinaturaContext` + `useAcesso()`

Provider novo em `app/_layout.tsx`, abaixo de `ProfileProvider`.
- Guarda em AsyncStorage (`levia:acesso`) o último token assinado.
- Consulta `/v1/status` ao abrir, ao voltar para o app depois de 1 h e depois de
  pagar/ativar.
- Confere a assinatura do token. Inválido ou vencido → modo restrito até consultar.
- `useAcesso()` expõe `fase`, `diasRestantes`, `fotosRestantes`, `podeRegistrar(tipo)`,
  `exigirAssinatura()`.
- `podeRegistrar(tipo)`: `teste`/`assinante` → tudo; `expirado` → só `'peso'` e
  `'glicemia'`; `desligado` → nada.
- A decisão fica numa função pura `calcularAcesso(token, agora)`, testável.

### 4.3 Cadastro e início do teste

Depois do onboarding (ou ao abrir, para quem já fez) e com fase `sem_teste`: tela
**"Ative seus 7 dias grátis"**.
1. **Confirmar pelo WhatsApp** (3.3): botão que abre o WhatsApp com a mensagem pronta;
   a tela espera a confirmação e avança sozinha. Se a pessoa chegou por um link do bot
   (`?t=`), este passo já vem feito.
2. **E-mail** (pré-preenchido com `profile.email`), obrigatório, com explicação de que
   o serial e o backup chegam por ele.
3. Chama `/v1/teste`. E-mail e o telefone mascarado (`+55 ••• ••• 4821`) ficam no perfil
   do aparelho.
4. Telefone já usado: mensagem clara e paywall.

Link **"Já tenho um serial"** na mesma tela. Quem ativa por serial não verifica telefone.

### 4.4 Modo restrito (teste acabou, sem pagar)

Bloqueio em duas camadas:
1. **Telas:** os botões de registro (refeição, água, exercício, medicação, notas, apetite,
   GLP-1, receitas, foto) chamam `exigirAssinatura()`, que abre o paywall. Peso e glicose
   seguem normais.
2. **Contextos:** as funções de escrita de `RecordsContext`, `DiabetesContext`,
   `Glp1Context`, `MedicacoesContext` e `CustomRecipesContext` conferem
   `podeRegistrar(...)`. As exceções são `adicionarPeso` e `adicionarGlicemia`. Remover
   registros continua permitido.

Leitura, gráficos, relatórios, exportação e backup seguem liberados.

### 4.5 Aparelho desligado

- `entradaFinal = true`: fluxo do 3.7.
- `entradaFinal = false`: tela única "Este aparelho foi substituído. Para usar aqui,
  ative com seu serial (isso desliga o outro aparelho)."

### 4.6 Paywall (`app/assinar.tsx`)

- Dois cartões: **Anual** (destaque, valor por dia) e **Mensal**.
- Preços exibidos por moeda a partir de uma tabela no app (`precos.ts`: BRL, EUR, USD,
  GBP), escolhida pelo idioma/região do aparelho, com a nota "valor final na sua moeda no
  checkout". BRL: R$ 12,97 / R$ 124,51. Os valores em EUR/USD/GBP são definidos por você
  na Hotmart e copiados para essa tabela.
- O botão abre o checkout da Hotmart em nova aba, com o e-mail na URL (`?email=`, a
  conferir), para a compra cair no mesmo e-mail.
- **"Já paguei"** → e-mail + serial. "Não recebi o serial" → código da transação Hotmart
  (começa com `HP`) ou reenvio por e-mail.
- Ao voltar para a aba do app, ele reconsulta o status.
- Aviso fixo: "Cancele quando quiser pela Hotmart. Garantia de 7 dias."

### 4.7 Outras telas e avisos

- **Minha assinatura** (Perfil): plano, validade, aparelhos ativos, "Reenviar serial".
- Banner no Início durante o teste: "Seu teste termina em N dias · Assinar".
- Último dia do teste e expiração: aviso em tela cheia, uma vez, com o paywall.
- **Lembrete de backup** a cada 30 dias.
- Na análise de foto: "fotos restantes" e mensagens para `cota_teste`, `cota_dia` e
  `assinatura_necessaria`.
- Textos novos nos 20 idiomas, pelo fluxo de traduções que já existe.

## 5. Erros e casos-limite

| Caso | Comportamento |
|---|---|
| Worker fora do ar ao abrir | Usa o token salvo enquanto valer (até 3 dias) |
| Pessoa não toca em enviar no WhatsApp | O código expira em 10 min; botão "gerar outro" |
| Mandou o código de outro número de WhatsApp | Vale o número que mandou; é ele que fica registrado |
| Sem WhatsApp | Não começa teste; pode assinar direto |
| Telefone já usou o teste | Paywall com mensagem própria |
| Webhook da Hotmart antes da ativação | Normal: a licença espera o serial |
| Pagou com outro e-mail | Ativa com o e-mail da compra + serial |
| E-mail de boas-vindas não chegou | Código da transação Hotmart ou reenvio |
| Reembolso nos 7 dias (CDC art. 49 / direito de arrependimento da UE) | `PURCHASE_REFUNDED` revoga; acesso cai na próxima consulta ou em até 3 dias |
| Renovação mensal | Novo `PURCHASE_APPROVED` estende `validoAte` |
| Webhook repetido (Hotmart ou Meta) | Idempotência |
| Celular novo | Ativa com serial; o antigo ganha a última entrada com backup |
| Celular antigo perdido | Sem backup automático; vale o último backup feito |
| Backup maior que 10 MB | Só download |
| Esqueceu a senha do backup | Arquivo não abre; não há recuperação |
| Serial vazou | "Reenviar serial" gera outro |

## 6. Testes

- **Worker** (Jest, offline, no padrão de `worker-api-synthetic.test.ts`):
  hottok inválido → 401; assinatura da Meta inválida → 401; handshake da Meta; evento
  duplicado (Hotmart e Meta); código de verificação certo, errado, expirado, de outra
  instalação; `tokenTelefone` vencido ou adulterado; aprovação gera serial; cancelamento
  mantém até `validoAte`; reembolso revoga; normalização de e-mail; e-mail descartável;
  telefone já usado com outro e-mail → 403; aparelho com outro e-mail → 409; 3ª foto do
  teste ok e 4ª → 402; assinante 2/dia e 3ª → 429; assinante fora do teto global; serial
  errado → 404 genérico; 3º aparelho desliga o mais antigo; `desligado` com `entradaFinal`
  true e depois false; backup acima do limite → 413; backup de instalação estranha →
  recusa; token assinado confere e adulterado falha.
- **App:** `calcularAcesso` (todas as fases, token vencido/adulterado, datas no limite) e
  `podeRegistrar`.
- **Manual antes de lançar:** verificação real pelo WhatsApp (um número do Brasil e um de
  Malta); compra real com reembolso logo depois; ativação em 3 aparelhos conferindo
  última entrada, e-mail do backup e restauração; renovação e revogação.
- CI: suítes novas no `pr-checks.yml`.

## 7. Riscos e pontos em aberto

1. **Residência em Malta:** o GDPR vale diretamente para você como responsável pelos
   dados. Dados de saúde exigem consentimento explícito (art. 9), e o app já os mantém
   no aparelho. A tributação depende da sua residência fiscal, não só do CPF da conta
   Hotmart. Consultar um contador. Não sou advogado; isto é um mapa de riscos.
2. **Hotmart:** possível limite de saque para conta de pessoa física (fontes divergem) e
   moeda de repasse que depende do país da conta. Conferir no painel.
3. **WhatsApp oficial:** número dedicado, conta Meta Business, webhook. Conta sem
   verificação de empresa começa com limite de 250 contatos novos por dia para mensagens
   iniciadas pela empresa; as respostas a quem escreveu primeiro não contam nesse limite.
4. **Atrito da verificação:** sair do app, mandar a mensagem e voltar faz uma parte das
   pessoas desistir. Pelo funil do bot (link `?t=`), esse atrito some.
5. **Domínio:** sem domínio próprio não há serial nem backup por e-mail (3.8).
6. **Campos dos payloads (Hotmart e Meta) e `?email=` no checkout:** confirmar com testes
   reais.
7. **Privacidade:** o servidor passa a guardar e-mail, HMAC do telefone e situação de
   pagamento, e repassa o backup criptografado. A política de privacidade precisa dizer
   isso, citando Meta (WhatsApp), Cloudflare, Resend, Hotmart e Google (Gemini) como
   operadores.
8. **Custo da IA:** com 2 fotos por dia, até cerca de R$ 1,20 a R$ 3,00 por assinante por
   mês (estimativa). 15 cortesias no limite: até ~R$ 45/mês.

## 8. O que o dono do produto faz fora do código

1. Hotmart: produto (software/app), assinatura com 2 planos, preços por moeda e 7 dias de
   garantia; hottok e códigos do produto e dos planos.
2. Webhook Hotmart 2.0.0 para
   `https://levia-ia-worker.ferpa2505.workers.dev/v1/webhook/hotmart`.
3. Meta: conta Business, app com WhatsApp, **número dedicado**, webhook para
   `https://levia-ia-worker.ferpa2505.workers.dev/v1/whatsapp`, token permanente.
4. Domínio próprio, verificação no Resend e chave de API.
5. Segredos do worker na Cloudflare (eu passo os comandos, um por vez).
6. Lista de e-mails dos 15 testadores.
7. Compra de teste com reembolso.

## 9. Ordem de implementação

1. Worker: dividir em módulos sem mudar comportamento + testes atuais passando.
2. Worker: e-mail normalizado, verificação pelo WhatsApp, teste, status assinado,
   licença, serial, ativação, desligados e entrada final, backup por e-mail, webhook
   Hotmart, nova regra da IA + testes.
3. Workflows "Criar cortesia" e "Revogar licença".
4. App: `calcularAcesso` + verificação do token + `AssinaturaContext` + testes.
5. App: cadastro com WhatsApp, ativação por serial, paywall com moedas,
   "Minha assinatura", banner.
6. App: modo restrito; aparelho desligado (última entrada + backup).
7. Traduções.
8. Teste ponta a ponta (WhatsApp, Hotmart, 3 aparelhos); criação das 15 cortesias.
