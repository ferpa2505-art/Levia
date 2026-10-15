# Cobrança: teste grátis de 7 dias, paywall e assinatura via Hotmart

Data: 15/10/2026 · Revisão 2 · Status: aguardando revisão · Escopo: Fases 1 e 2 (servidor + app)

## 1. Objetivo

Colocar a PWA do Leviã à venda por assinatura. Qualquer pessoa usa o app completo
por 7 dias, sem cartão. Depois disso o app fica em modo restrito até a pessoa assinar
(mensal ou anual) pela Hotmart.

### Decisões já tomadas com o dono do produto

| Tema | Decisão |
|---|---|
| Onde vende | **Só na PWA (web).** Sem Play Store por enquanto (exige CNPJ) |
| Teste | 7 dias, ligado a um e-mail **verificado**, com **3 fotos de IA no total** |
| Planos | Mensal R$ 12,97 · Anual R$ 124,51 (−20%) |
| Pagamento | Hotmart (assinatura recorrente, webhook 2.0.0), vendendo como pessoa física |
| Licença | **Serial próprio do Leviã**, enviado ao comprador; vale em **até 2 aparelhos** |
| 3º aparelho | Ativar num aparelho novo desliga o aparelho ativado há mais tempo |
| IA para assinante | **2 fotos por dia**, incluídas no preço |
| Fim do teste sem pagar | Vê e exporta tudo; registra **só peso e glicose**; o resto fica bloqueado |
| Testadores | **15 cortesias** com acesso de assinante por 10 anos, mesmos limites |
| Chave de API própria | Fora do lançamento |

### Fora do escopo

- Página de vendas (Fase 3) e correções dos anúncios.
- Cobrança no app nativo Android/iOS. O app nativo continua como está.
- Conta com senha e sincronização de dados entre aparelhos.

## 2. Visão geral

```
           ┌──────────── App (PWA) ────────────────┐
           │ AssinaturaContext ── useAcesso()      │
           │ paywall · modo restrito · ativar serial│
           └──────┬────────────────┬───────────────┘
                  │ /v1/codigo      │ /v1/analisar-prato
                  │ /v1/teste       │
                  │ /v1/status      │
                  │ /v1/ativar      │
           ┌──────▼────────────────▼───────────────┐
 Hotmart ─►│ levia-ia-worker (Cloudflare)          │──► Gemini
 webhook   │ KV LEVIA_COTAS                        │──► Resend (e-mail)
           └───────────────────────────────────────┘
 GitHub Actions ── "Criar cortesia" ──► KV
```

O worker que já existe passa a ser a fonte da verdade sobre quem está em teste e quem
assinou. Os dados de saúde continuam só no aparelho.

## 3. Servidor (worker)

### 3.1 Identidade

- **E-mail**: normalizado. Minúsculas, sem espaços. Para `gmail.com`/`googlemail.com`
  também tira os pontos e o `+apelido`; para os demais domínios tira o `+apelido`.
  Assim `ana.silva+1@gmail.com` e `anasilva@gmail.com` contam como o mesmo e-mail.
- **Instalação**: o UUID que o app já gera (`levia:instalacao`).
- **Serial**: `LEVIA-XXXX-XXXX-XXXX` (alfabeto Crockford base32, sem letras ambíguas;
  60 bits aleatórios). O servidor guarda **só o hash SHA-256**, nunca o serial em si.
- Sem senha. Um aparelho é assinante se a instalação dele está na lista de aparelhos
  de uma licença válida.

### 3.2 Chaves no KV

| Chave | Valor | Validade |
|---|---|---|
| `otp:<email>` | `{ hash do código, expira, tentativas }` | 10 min |
| `teste:<email>` | `{ inicio, fim, fotos: number[] }` | 30 dias após `fim` |
| `teste-inst:<instalacao>` | `<email>` | 30 dias após o fim do teste |
| `lic:<email>` | `{ status, plano, validoAte, transacoes: string[], serialHash, aparelhos: {id, desde}[], origem: 'hotmart'\|'cortesia', atualizadoEm }` | 400 dias após `validoAte` (cortesia: sem expiração) |
| `serial:<hash>` | `<email>` | igual à licença |
| `evento:<id do evento Hotmart>` | `1` (idempotência) | 30 dias |
| `ia-dia:<email>:<AAAA-MM-DD>` | fotos do assinante no dia (fuso America/Sao_Paulo) | 2 dias |
| `dia:<data>` / `ip:<ip>:<hora>` | contadores atuais (mantidos) | atuais |
| `lim:<rota>:<ip>:<hora>` | limite de tentativas por rota | 2 h |

### 3.3 Barreiras contra teste repetido (pedido do item 5)

1. **E-mail verificado**: o teste só começa depois que a pessoa digita um código de
   6 dígitos enviado ao e-mail (vale 10 min, 5 tentativas). Isso impede e-mails
   inventados.
2. **Apelidos do mesmo e-mail** contam como um só (3.1).
3. **E-mails descartáveis** (mailinator, 10minutemail etc.) são recusados por uma
   lista embutida no worker.
4. **Um aparelho, um teste**: `teste-inst` impede abrir outro teste no mesmo navegador.
5. **Limites por IP**: 5 pedidos de código e 3 testes novos por IP por hora.

O que continua possível: alguém com vários e-mails reais **e** limpando o navegador a
cada vez. Fechar isso de vez exigiria cartão ou celular verificado no início; para um
app de R$ 12,97 isso não compensa.

### 3.4 Endpoints

Todos exigem o cabeçalho `x-levia-app` atual, respondem com CORS para as origens web
já permitidas e têm limite por IP. Erros de e-mail/serial/código são **genéricos**
(`404 nao_encontrado` ou `400 codigo_invalido`), para não revelar se um e-mail comprou.

**`POST /v1/codigo`** `{ email }` → envia o código de verificação. Recusa e-mail
descartável. Sempre responde `200` (mesmo se o e-mail já tiver teste) para não
revelar nada.

**`POST /v1/teste`** `{ email, codigo, instalacao }`
- Confere o código. Inválido → `400 codigo_invalido`.
- Instalação já com teste de **outro** e-mail → `409 aparelho_com_outro_teste`.
- `teste:<email>` não existe → cria com `fim = agora + 7 dias`. Se já existe,
  só devolve o status (o teste não recomeça).
- Responde como o `/v1/status`.

**`POST /v1/status`** `{ email, instalacao }` → `{ fase, testeFim, validoAte, plano,
fotosRestantes, fotosTipo, token }`
- `fase`: `assinante` (licença com `status` em `ativa`/`cancelada_no_fim`,
  `agora < validoAte` e instalação na lista) · `teste` · `expirado` · `sem_teste`.
- `token`: o status **assinado** pelo servidor (3.7), com validade de 3 dias.

**`POST /v1/ativar`** `{ email, serial, instalacao }` **ou** `{ email, transacao, instalacao }`
- Com **serial**: `serial:<hash(serial)>` precisa apontar para o e-mail informado.
- Com **código da transação Hotmart** (caminho de reserva para quem não recebeu o
  serial): a transação precisa estar em `lic.transacoes`. Nesse caso o servidor
  **gera um serial novo**, devolve na tela e reenvia por e-mail.
- Aparelhos: se a instalação já está na lista, ok. Se há menos de 2, adiciona. Se já
  há 2, **tira o mais antigo** e devolve `desligou: true`. O aparelho desligado perde o
  acesso na próxima consulta ou, sem internet, em no máximo 3 dias (validade do token).
- Limite: 10 tentativas por IP por hora.

**`POST /v1/reenviar-serial`** `{ email }` → se houver licença válida, gera um serial
novo (o antigo deixa de valer para **novas** ativações; aparelhos já ativados seguem)
e manda por e-mail. Sempre responde `200`.

**`POST /v1/webhook/hotmart`**
- Valida `X-HOTMART-HOTTOK` contra o segredo `HOTMART_HOTTOK` em tempo constante
  (a função `iguais` já existe). Inválido → `401`.
- Idempotência por `evento:<id>`.
- Ignora produto diferente de `HOTMART_PRODUTO_ID`.
- Plano: compara o código do plano/oferta com `HOTMART_PLANO_MENSAL` / `HOTMART_PLANO_ANUAL`.

| Evento | Efeito na licença |
|---|---|
| `PURCHASE_APPROVED`, `PURCHASE_COMPLETE` | `status = ativa`; guarda a transação; `validoAte = max(validoAte, agora) + 31 dias (mensal) ou 366 (anual)` + 3 dias de folga. **Na primeira compra**: gera o serial e manda o e-mail de boas-vindas |
| `SUBSCRIPTION_CANCELLATION` | `status = cancelada_no_fim` (vale até `validoAte`) |
| `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_PROTEST` | `status = revogada`, `validoAte = agora` |
| `PURCHASE_DELAYED`, `PURCHASE_EXPIRED`, `PURCHASE_CANCELED` | não muda (a validade vence sozinha) |
| `SWITCH_PLAN` | atualiza `plano` |
| outros | `200`, ignora |

> **A conferir no primeiro teste:** os nomes exatos dos campos do payload (e-mail do
> comprador, código da transação, plano, id do evento). Toda a leitura fica em
> `hotmart.js`, ajustada a partir de um evento de teste real enviado pelo painel da
> Hotmart (aba Histórico do Webhook).

### 3.5 Mudanças em `/v1/analisar-prato`

Corpo passa a ter `email` (obrigatório na web). Ordem:
1. Token do app, formato, tamanho (como hoje).
2. Limite por IP por hora (como hoje).
3. Status (mesma regra do `/v1/status`):
   - **assinante** → `ia-dia:<email>:<hoje>` < 2, senão `429 cota_dia` com `liberaEm`.
     Assinante **não** entra no teto global `MAX_FOTOS_DIA`, para que abuso no teste
     não derrube quem paga.
   - **teste** → menos de 3 fotos no teste e teto global do dia, senão `402 cota_teste`.
   - **expirado / sem teste** → `402 assinatura_necessaria`.
4. Conta a foto só se a IA respondeu (como hoje).

A cota antiga por instalação (`inst:<id>`) continua valendo **só** para pedidos sem
`email`, que vêm do app nativo atual.

### 3.6 E-mail

Provedor: **Resend** (plano grátis: 3.000 e-mails/mês, 100/dia, segundo fontes de
terceiros). Exige **um domínio próprio verificado** para enviar a qualquer endereço.
Segredo `RESEND_API_KEY`. E-mails enviados:
- Código de verificação do teste.
- Boas-vindas com o serial (primeira compra).
- Serial reenviado.

Os textos dos e-mails ficam em português nesta versão.

**Sem domínio**, dá para lançar assim: sem verificação de e-mail no teste (as
barreiras 2 a 5 continuam) e com o serial aparecendo **na tela** quando a pessoa
ativa pela primeira vez com e-mail + código da transação Hotmart. O envio por e-mail
entra quando o domínio existir. O código é o mesmo; o envio é ligado por configuração
(`EMAIL_ATIVO`).

### 3.7 Segurança (pedido do item 6)

1. **Status assinado.** O servidor assina o status com uma chave Ed25519 secreta
   (`STATUS_CHAVE_PRIVADA`). O app guarda o token e confere a assinatura com a chave
   pública embutida no código. Editar o armazenamento do navegador para virar
   "assinante" não funciona. Para burlar, alguém teria que alterar o código do app.
2. **Validade curta offline.** O token vale 3 dias. Sem internet por mais que isso,
   o app volta ao modo restrito até conseguir consultar o servidor.
3. **O que custa dinheiro fica no servidor.** A IA só responde depois que o servidor
   confere teste/licença. Burlar o app não dá foto grátis.
4. **Segredos só na Cloudflare.** Gemini, hottok, Resend e a chave de assinatura nunca
   vão para o código do app nem para o repositório. O `TOKEN_APP` do app não é segredo
   (já documentado) e continua só como freio.
5. **Serial guardado como hash**, mensagens de erro genéricas, limites por IP em todas
   as rotas e comparação em tempo constante no hottok.
6. **Dados mínimos.** No servidor ficam só e-mail, datas, plano e ids de aparelho.
   Os logs registram contagens, nunca e-mail (quando preciso, um hash curto).

O que não se resolve: quem alterar o código JavaScript do app consegue usar o modo
completo **sem IA**. Isso é aceito.

### 3.8 Cortesias para os 15 testadores

- Workflow manual no GitHub Actions **"Criar cortesia"** (`workflow_dispatch`), com
  um campo: e-mail do testador.
- Cria `lic:<email>` com `origem = 'cortesia'`, `plano = 'cortesia'`,
  `validoAte = agora + 10 anos`, mesmos limites de assinante (2 fotos/dia, 2 aparelhos).
- Mostra o serial no resumo do workflow (repositório privado), para você mandar por
  WhatsApp. Se o e-mail estiver ativo, também envia por e-mail.
- Workflow **"Revogar licença"** para tirar o acesso de alguém.
- Usa o `CLOUDFLARE_API_TOKEN` que já existe nos segredos do repositório. Não cria
  nenhuma rota de administração no worker (nada novo exposto na internet).

### 3.9 Configuração

`[vars]`: `TESTE_DIAS = "7"`, `FOTOS_TESTE = "3"`, `FOTOS_ASSINANTE_DIA = "2"`,
`MAX_APARELHOS = "2"`, `TOKEN_STATUS_DIAS = "3"`, `EMAIL_ATIVO`, `EMAIL_REMETENTE`,
`HOTMART_PRODUTO_ID`, `HOTMART_PLANO_MENSAL`, `HOTMART_PLANO_ANUAL`.
Segredos novos: `HOTMART_HOTTOK`, `RESEND_API_KEY`, `STATUS_CHAVE_PRIVADA`.

### 3.10 Organização do código

`worker/src/index.js` hoje tem 242 linhas. Fica dividido em:
- `index.js`: rotas, CORS, limites por IP.
- `ia.js`: Gemini e prompt (movido sem mudança).
- `acesso.js`: e-mail normalizado, teste, status, ativação, cotas.
- `licenca.js`: serial (gerar, hash), aparelhos, cortesia.
- `hotmart.js`: leitura do payload e mapeamento de eventos.
- `email.js`: envio pelo Resend e textos.
- `assinatura.js`: token Ed25519.

## 4. App

### 4.1 Onde a cobrança vale

`COBRANCA_ATIVA = Platform.OS === 'web'`. No app nativo nada muda.

### 4.2 `AssinaturaContext` + `useAcesso()`

Provider novo em `app/_layout.tsx`, abaixo de `ProfileProvider`.
- Guarda em AsyncStorage (`levia:acesso`) o último token assinado.
- Consulta `/v1/status` ao abrir, ao voltar para o app depois de 1 h e depois de
  pagar/ativar.
- Confere a assinatura do token. Token inválido, adulterado ou vencido → trata como
  `expirado` até conseguir consultar.
- `useAcesso()` expõe `fase`, `diasRestantes`, `fotosRestantes`, `podeRegistrar(tipo)`
  e `exigirAssinatura()`.
- `podeRegistrar(tipo)`: em `teste` ou `assinante` → tudo; em `expirado` → só
  `'peso'` e `'glicemia'`.
- A decisão fica numa função pura `calcularAcesso(token, agora)`, testável.

### 4.3 Início do teste

Depois do onboarding (ou ao abrir, para quem já fez o onboarding) e com fase
`sem_teste`: tela **"Ative seus 7 dias grátis"**.
1. Pede o e-mail (pré-preenchido com `profile.email`) e explica que não pede cartão.
2. Pede o código de 6 dígitos que chegou no e-mail (se o e-mail estiver ativo).
3. Chama `/v1/teste` e salva o e-mail em `profile.email`, que já existe.

Link **"Já tenho um serial"** na mesma tela, para assinantes e testadores.

### 4.4 Modo restrito

Bloqueio em duas camadas:
1. **Telas**: os botões de registro (refeição, água, exercício, medicação, notas,
   apetite, GLP-1, receitas, foto) chamam `exigirAssinatura()`, que abre o paywall
   em vez do formulário. Peso e glicose continuam normais.
2. **Contextos**: as funções de escrita de `RecordsContext`, `DiabetesContext`,
   `Glp1Context`, `MedicacoesContext` e `CustomRecipesContext` conferem
   `podeRegistrar(...)` e não gravam se for proibido. A exceção é `adicionarPeso`
   e `adicionarGlicemia`. Remover registros continua permitido.

Leitura, gráficos, relatórios, exportação e backup seguem liberados.

### 4.5 Paywall (`app/assinar.tsx`)

- Dois cartões: **Anual** (destaque, "R$ 0,34 por dia", R$ 124,51/ano) e **Mensal**
  (R$ 12,97).
- O botão abre o checkout da Hotmart em nova aba, com o e-mail na URL (`?email=`,
  a conferir na Hotmart), para a compra cair no mesmo e-mail do teste.
- **"Já paguei"** → formulário com e-mail + serial. Link secundário "Não recebi o
  serial" → e-mail + código da transação Hotmart (começa com `HP`) ou reenvio do
  serial por e-mail.
- Ao voltar para a aba do app, ele reconsulta o status.
- Aviso fixo: "Cancele quando quiser pela Hotmart. Garantia de 7 dias."

### 4.6 Tela "Minha assinatura" (no Perfil)

Mostra plano, validade, aparelhos ativos (este aparelho + outro, se houver) e o botão
"Reenviar serial por e-mail".

### 4.7 Avisos

- Banner no Início durante o teste: "Seu teste termina em N dias · Assinar".
- No último dia e ao expirar: aviso em tela cheia, uma vez, com o paywall.
- Quando o aparelho for desligado por ativação em outro: "Sua assinatura foi ativada
  em outro aparelho. Para usar aqui, ative com seu serial."
- Na análise de foto: "fotos restantes" e mensagens para `cota_teste`, `cota_dia`
  e `assinatura_necessaria`.
- Textos novos nos 20 idiomas, pelo fluxo de traduções que já existe
  (`scripts/adicionar_textos.py`).

## 5. Erros e casos-limite

| Caso | Comportamento |
|---|---|
| Worker fora do ar ao abrir | Usa o token salvo enquanto ele valer (até 3 dias) |
| Webhook chega antes da ativação | Normal: a licença espera o serial ser usado |
| Pagou com outro e-mail | Ativa com o e-mail da compra + serial; o app passa a usar esse e-mail |
| E-mail de boas-vindas não chegou | "Não recebi o serial": código da transação Hotmart ou reenvio |
| Reembolso nos 7 dias (CDC art. 49) | `PURCHASE_REFUNDED` revoga; o app perde o acesso na próxima consulta ou em até 3 dias |
| Renovação mensal | Novo `PURCHASE_APPROVED` estende `validoAte`; ninguém reativa |
| Hotmart reenvia o mesmo evento | Idempotência por `evento:<id>` |
| Celular novo | Ativa com o serial; o aparelho mais antigo é desligado |
| Serial vazou | "Reenviar serial" gera outro; o antigo não ativa mais aparelhos |

## 6. Testes

- **Worker** (Jest, offline, no padrão de `worker-api-synthetic.test.ts`): hottok
  inválido → 401; evento duplicado; aprovação gera serial; cancelamento mantém até
  `validoAte`; reembolso revoga; normalização de e-mail (pontos e `+` do Gmail);
  e-mail descartável recusado; código errado/expirado/5 tentativas; teste cria e expira;
  aparelho com outro e-mail → 409; 3ª foto do teste ok e 4ª → 402; assinante 2/dia
  e 3ª → 429; assinante fora do teto global; ativação com serial errado → 404 genérico;
  3º aparelho desliga o mais antigo; token assinado confere e token adulterado falha.
- **App**: testes de `calcularAcesso` (fases, token vencido/adulterado, datas no
  limite) e de `podeRegistrar`.
- **Manual antes de lançar**: compra real de R$ 12,97 com reembolso logo depois,
  conferindo webhook, e-mail com serial, ativação em 3 aparelhos, renovação e revogação.
- CI: as suítes novas entram no `pr-checks.yml`.

## 7. Riscos e pontos em aberto

1. **Saque como pessoa física na Hotmart:** o blog oficial da Hotmart fala em limite
   mensal de saque para CPF (R$ 1.900,00); outra fonte diz que o limite caiu. Conferir
   no painel. Imposto de renda sobre as vendas é responsabilidade sua; consulte um contador.
2. **Domínio para e-mail:** sem domínio próprio, não há código de verificação nem serial
   por e-mail (veja 3.6).
3. **Campos do payload da Hotmart e `?email=` no checkout:** confirmar com testes reais.
4. **LGPD:** o servidor passa a guardar e-mail e situação de pagamento. A política de
   privacidade precisa dizer isso (finalidade: controle de acesso; retenção: até 400 dias
   após o fim da licença).
5. **Custo da IA:** com 2 fotos por dia, um assinante custa no máximo cerca de
   R$ 1,20 a R$ 3,00 por mês (estimativa). 15 cortesias no limite máximo: até ~R$ 45/mês.
   Medir nos logs do worker.

## 8. O que o dono do produto faz fora do código

1. Hotmart: criar o produto (software/app), assinatura com 2 planos e 7 dias de garantia.
2. Pegar o **hottok** e os códigos do produto e dos planos.
3. Cadastrar o webhook 2.0.0 para
   `https://levia-ia-worker.ferpa2505.workers.dev/v1/webhook/hotmart` com os eventos da
   tabela 3.4.
4. Domínio (se for usar e-mail): registrar, verificar no Resend, criar a chave.
5. Cadastrar os segredos do worker na Cloudflare (eu passo os comandos, um por vez).
6. Enviar a lista de e-mails dos 15 testadores.
7. Fazer a compra de teste com reembolso.

## 9. Ordem de implementação

1. Worker: dividir em módulos sem mudar comportamento + testes atuais passando.
2. Worker: e-mail normalizado, código, teste, status assinado, licença/serial, ativação,
   webhook, nova regra da IA + testes.
3. Workflows "Criar cortesia" e "Revogar licença".
4. App: `calcularAcesso` + verificação do token + `AssinaturaContext` + testes.
5. App: início do teste, ativação por serial, paywall, "Minha assinatura", banner.
6. App: modo restrito nas telas e nos contextos.
7. Traduções.
8. Teste ponta a ponta com a Hotmart; criação das 15 cortesias.
