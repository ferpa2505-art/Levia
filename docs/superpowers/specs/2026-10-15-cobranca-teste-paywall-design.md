# Cobrança: teste grátis de 7 dias, paywall e assinatura via Hotmart

Data: 15/10/2026 · Status: aguardando revisão · Escopo: Fases 1 e 2 (servidor + app)

## 1. Objetivo

Colocar a PWA do Leviã à venda por assinatura. Qualquer pessoa usa o app completo
por 7 dias, sem cartão. Depois disso o app fica em modo restrito até a pessoa assinar
(mensal ou anual) pela Hotmart.

### Decisões já tomadas com o dono do produto

| Tema | Decisão |
|---|---|
| Teste | 7 dias, ligado ao e-mail, com **3 fotos de IA no total** |
| Planos | Mensal R$ 12,97 · Anual R$ 124,51 (−20%) |
| Pagamento | Hotmart (assinatura recorrente, webhook 2.0.0) |
| Ativação | E-mail + código da transação Hotmart, **até 2 aparelhos** por assinatura |
| IA para assinante | **2 fotos por dia**, incluídas no preço |
| Fim do teste sem pagar | Vê e exporta tudo; registra **só peso e glicose**; o resto fica bloqueado |
| Chave de API própria | **Fora do lançamento** |

### Fora do escopo deste documento

- Página de vendas (Fase 3) e correções dos anúncios.
- Cobrança no app Android/iOS nativo (veja 7.1).
- Conta de usuário com senha, sincronização de dados entre aparelhos.

## 2. Visão geral

```
           ┌──────────── App (PWA) ────────────┐
           │ AssinaturaContext ── useAcesso()  │
           │   paywall · modo restrito · banner│
           └──────┬───────────────┬────────────┘
                  │ /v1/teste      │ /v1/analisar-prato
                  │ /v1/status     │
                  │ /v1/ativar     │
           ┌──────▼───────────────▼────────────┐
 Hotmart ─►│ levia-ia-worker (Cloudflare)      │──► Gemini
 webhook   │ KV LEVIA_COTAS                    │
           └───────────────────────────────────┘
```

O servidor é o mesmo worker que já existe. Ele passa a ser a fonte da verdade sobre
quem está em teste e quem assinou. Os dados de saúde continuam só no aparelho.

## 3. Servidor (worker)

### 3.1 Identidade

- **E-mail**: normalizado (`trim().toLowerCase()`), validado por regex.
- **Instalação**: o UUID que o app já gera (`levia:instalacao`).
- Nenhuma senha. O par (e-mail, instalação) identifica o aparelho; para ser assinante,
  a instalação precisa estar na lista de aparelhos da assinatura.

### 3.2 Chaves no KV

| Chave | Valor | Validade |
|---|---|---|
| `teste:<email>` | `{ inicio, fim, fotos: number[] }` | 30 dias após `fim` |
| `teste-inst:<instalacao>` | `<email>` | 30 dias após o fim do teste |
| `assin:<email>` | `{ status, plano, validoAte, transacoes: string[], assinante, aparelhos: {id, desde}[], atualizadoEm }` | 400 dias após `validoAte` |
| `evento:<id do evento Hotmart>` | `1` (para não processar duas vezes) | 30 dias |
| `ia-dia:<email>:<AAAA-MM-DD>` | contador de fotos do assinante no dia (fuso America/Sao_Paulo) | 2 dias |
| `dia:<data>` / `ip:<ip>:<hora>` | contadores atuais (mantidos) | atuais |

`teste-inst` impede que o mesmo aparelho abra vários testes trocando de e-mail.
Quem limpar os dados do navegador **e** usar outro e-mail consegue outro teste;
isso é aceito no lançamento (veja Riscos).

### 3.3 Endpoints novos

Todos exigem o cabeçalho `x-levia-app` atual e respondem com CORS para as origens web
já permitidas.

**`POST /v1/teste`** `{ email, instalacao }`
- Se `assin:<email>` está ativa e a instalação está na lista → responde o status de assinante.
- Se a instalação já tem teste com **outro** e-mail → `409 { erro: 'aparelho_com_outro_teste', email: '<mascarado>' }`.
- Se `teste:<email>` não existe → cria com `inicio = agora`, `fim = agora + 7 dias`.
- Responde o mesmo formato do `/v1/status`.

**`POST /v1/status`** `{ email, instalacao }` → 
```json
{ "fase": "teste" | "assinante" | "expirado" | "sem_teste",
  "testeFim": "ISO|null", "validoAte": "ISO|null", "plano": "mensal|anual|null",
  "fotosRestantes": 0, "fotosTipo": "teste|dia" }
```
- `assinante`: `assin.status` em (`ativa`, `cancelada_no_fim`), `agora < validoAte`
  e instalação na lista.
- `teste`: `agora < teste.fim`.
- `expirado`: teve teste (ou assinatura) e acabou.

**`POST /v1/ativar`** `{ email, transacao, instalacao }`
- Procura `assin:<email>`; `transacao` precisa estar em `transacoes`.
  Erro genérico `404 { erro: 'nao_encontrado' }` para e-mail ou código errado,
  para não revelar se o e-mail comprou.
- Aparelhos: se a instalação já está na lista, ok. Se há menos de 2, adiciona.
  Se já há 2, **substitui o mais antigo** e devolve `substituiu: true`.
  Isso resolve troca de celular sem suporte manual e limita o uso simultâneo a 2.
- Limite: 10 tentativas por IP por hora (`ativar-ip:<ip>:<hora>`).

**`POST /v1/webhook/hotmart`**
- Valida `X-HOTMART-HOTTOK` contra o segredo `HOTMART_HOTTOK`, em tempo constante
  (a função `iguais` já existe). Inválido → `401`.
- Idempotência por `evento:<id>`. Se o id já existe, responde `200` sem fazer nada.
- Ignora produto diferente de `HOTMART_PRODUTO_ID`.
- Plano: compara o código do plano/oferta com `HOTMART_PLANO_MENSAL` / `HOTMART_PLANO_ANUAL`.

| Evento | Efeito em `assin:<email>` |
|---|---|
| `PURCHASE_APPROVED`, `PURCHASE_COMPLETE` | `status = ativa`; adiciona a transação; `validoAte = max(validoAte, agora) + 31 dias (mensal) ou 366 (anual)` + 3 dias de folga |
| `SUBSCRIPTION_CANCELLATION` | `status = cancelada_no_fim` (continua até `validoAte`) |
| `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_PROTEST` | `status = revogada`; `validoAte = agora` |
| `PURCHASE_DELAYED`, `PURCHASE_EXPIRED`, `PURCHASE_CANCELED` | não muda (a validade vence sozinha) |
| `SWITCH_PLAN` | atualiza `plano` |
| outros | `200`, ignora |

> **A conferir no primeiro teste:** os nomes exatos dos campos (e-mail do comprador,
> código da transação, código do assinante, plano). O código vai ler esses campos de um
> único módulo `hotmart.js`, ajustado a partir de um evento de teste real enviado pelo
> painel da Hotmart (aba Histórico do Webhook).

### 3.4 Mudanças em `/v1/analisar-prato`

Corpo passa a ter `email` (obrigatório na web). Ordem das verificações:
1. Token do app, formato, tamanho (como hoje).
2. Limite por IP por hora (como hoje).
3. Status (mesma lógica do `/v1/status`):
   - **assinante** → `ia-dia:<email>:<hoje>` < 2, senão `429 { erro: 'cota_dia', liberaEm }`.
     Assinante **não** entra no teto global `MAX_FOTOS_DIA`, para que abuso no teste
     não derrube quem paga.
   - **teste** → `teste.fotos.length < 3` e teto global do dia, senão `402 { erro: 'cota_teste' }`.
   - **expirado / sem teste** → `402 { erro: 'assinatura_necessaria' }`.
4. Conta a foto só se a IA respondeu (como hoje).

A cota antiga por instalação (`inst:<id>`, `FOTOS_GRATIS_7D`) sai. Versões antigas
do app nativo que não mandam `email` continuam na regra antiga até a decisão do 7.1.

### 3.5 Configuração (wrangler)

`[vars]`: `TESTE_DIAS = "7"`, `FOTOS_TESTE = "3"`, `FOTOS_ASSINANTE_DIA = "2"`,
`MAX_APARELHOS = "2"`, `HOTMART_PRODUTO_ID`, `HOTMART_PLANO_MENSAL`, `HOTMART_PLANO_ANUAL`.
Segredo novo: `HOTMART_HOTTOK`.

### 3.6 Organização do código

O `worker/src/index.js` hoje tem 242 linhas. Para não virar um arquivo enorme:
- `index.js`: rotas e CORS.
- `ia.js`: Gemini e prompt (movido sem mudança).
- `acesso.js`: teste, status, ativação e cotas (funções puras + KV).
- `hotmart.js`: leitura do payload e mapeamento de eventos.

## 4. App

### 4.1 Onde a cobrança vale

Constante `COBRANCA_ATIVA = Platform.OS === 'web'`. No app nativo nada muda por
enquanto (veja 7.1).

### 4.2 `AssinaturaContext` + `useAcesso()`

Novo provider em `app/_layout.tsx`, abaixo de `ProfileProvider`.
- Estado salvo em AsyncStorage (`levia:acesso`): última resposta do status + `consultadoEm`.
- Consulta `/v1/status` ao abrir o app, ao voltar para o app depois de 1 h e depois de
  pagar/ativar.
- **Sem internet**: usa o último status. Assinante continua liberado até `validoAte`;
  teste continua até `testeFim`. A conta da data vem do aparelho; burlar mudando o
  relógio é aceito no lançamento.
- `useAcesso()` expõe: `fase`, `diasRestantes`, `podeRegistrar(tipo)`, `exigirAssinatura()`.
- `podeRegistrar(tipo)`: em `teste` ou `assinante` → tudo; em `expirado` → só
  `'peso'` e `'glicemia'`.
- A regra de decisão fica numa função pura `calcularAcesso(status, agora)`, testável.

### 4.3 Início do teste

Depois do onboarding (ou ao abrir o app, para quem já tinha feito o onboarding),
se a fase for `sem_teste`: tela **"Ative seus 7 dias grátis"** pede o e-mail (pré-preenchido
com `profile.email`), explica que não pede cartão e chama `/v1/teste`. O e-mail fica salvo
em `profile.email`, que já existe.

### 4.4 Modo restrito

Bloqueio em **duas camadas**:
1. **Interface**: os botões de registro (refeição, água, exercício, medicação, notas,
   apetite, GLP-1, receitas, foto) chamam `exigirAssinatura()`, que abre o paywall
   em vez de abrir o formulário. Peso e glicose continuam normais.
2. **Contextos**: as funções de escrita de `RecordsContext`, `DiabetesContext`,
   `Glp1Context`, `MedicacoesContext` e `CustomRecipesContext` conferem
   `podeRegistrar(...)` e não gravam se for proibido. A exceção é `adicionarPeso`
   e `adicionarGlicemia`. Remover registros continua permitido (a pessoa pode limpar
   os próprios dados).

Leitura, gráficos, relatórios, exportação e backup seguem liberados.

O bloqueio é no navegador, então quem sabe mexer nas ferramentas de desenvolvedor
consegue contornar o modo restrito. Isso é aceito: a única coisa que custa dinheiro
(a IA) está protegida no servidor.

### 4.5 Paywall (`app/assinar.tsx`)

- Dois cartões: **Anual** (destaque, "R$ 0,34 por dia", R$ 124,51/ano) e **Mensal**
  (R$ 12,97).
- O botão abre o checkout da Hotmart em nova aba, com o e-mail na URL
  (`?email=` — a conferir na Hotmart) para a compra cair no mesmo e-mail do teste.
- Link **"Já paguei"** → formulário de e-mail + código da transação → `/v1/ativar`.
  O texto explica onde achar o código (e-mail de confirmação da Hotmart, começa com `HP`).
- Ao voltar para a aba do app, ele reconsulta o status automaticamente.
- Aviso fixo: "Cancele quando quiser pela Hotmart. Garantia de 7 dias."

### 4.6 Avisos

- Banner no Início durante o teste: "Seu teste termina em N dias · Assinar".
- No último dia e quando expira: aviso único em tela cheia, com o paywall.
- Na análise de foto: mostrar "fotos restantes" (`fotosRestantes`) e mensagens
  próprias para `cota_teste`, `cota_dia` e `assinatura_necessaria`.
- Textos novos nos 20 idiomas, pelo fluxo de traduções que já existe
  (`scripts/adicionar_textos.py`).

## 5. Erros e casos-limite

| Caso | Comportamento |
|---|---|
| Worker fora do ar ao abrir | Usa o último status salvo; sem status salvo → trata como `teste` por 24 h e tenta de novo |
| Webhook chega antes da pessoa ativar | Normal: a assinatura fica esperando a ativação com o código |
| Pagou com outro e-mail | O "Já paguei" aceita e-mail + código da compra; o app passa a usar esse e-mail |
| Reembolso dentro dos 7 dias (CDC art. 49) | `PURCHASE_REFUNDED` revoga na hora; o app vê na próxima consulta |
| Renovação mensal | Novo `PURCHASE_APPROVED` estende `validoAte`; ninguém precisa reativar |
| Hotmart reenviando o mesmo evento | Idempotência por `evento:<id>` |
| Celular novo | Ativa de novo com o código; o aparelho mais antigo sai da lista |

## 6. Testes

- **Worker** (Jest, offline, no padrão de `worker-api-synthetic.test.ts`):
  hottok inválido → 401; evento duplicado; aprovação → ativa; cancelamento mantém até
  `validoAte`; reembolso revoga; teste cria/expira; aparelho com outro e-mail → 409;
  3ª foto no teste ok e 4ª → 402; assinante 2/dia e a 3ª → 429; assinante fora do teto
  global; ativação com código errado → 404 genérico; 3º aparelho substitui o mais antigo.
- **App**: testes unitários de `calcularAcesso` (fases, offline, datas no limite) e de
  `podeRegistrar`.
- **Manual antes de lançar**: compra real de R$ 12,97 no ambiente da Hotmart com
  reembolso em seguida, conferindo webhook, ativação, renovação e revogação.
- CI: as duas suítes novas entram no `pr-checks.yml`.

## 7. Riscos e pontos em aberto

1. **App nativo (Play Store):** pelas regras do Google, assinatura de conteúdo digital
   vendida dentro do app normalmente precisa passar pelo faturamento do Google Play.
   Não verifiquei a regra atual para o Brasil. Por isso a cobrança fica só na web
   neste momento.
2. **Novo teste com outro e-mail:** possível limpando o navegador. Fechar isso exigiria
   verificar o e-mail por código ou pedir cartão no início. Fica para depois do lançamento.
3. **E-mail sem verificação no teste:** alguém pode começar um teste com o e-mail de
   outra pessoa. O dano é pequeno (a outra pessoa perde o teste grátis).
4. **Campos do payload da Hotmart:** confirmar com um evento de teste real antes de
   publicar.
5. **LGPD:** o servidor passa a guardar e-mail e situação de pagamento. A política de
   privacidade precisa mencionar isso (finalidade: controle de acesso; retenção: até
   400 dias após o fim da assinatura).
6. **Custo da IA:** com 2 fotos por dia, um assinante custa no máximo cerca de
   R$ 1,20 a R$ 3,00 por mês (estimativa). Medir nos logs do worker nas 2 primeiras semanas.

## 8. O que o dono do produto faz fora do código

1. Na Hotmart: criar o produto (categoria software/app) com assinatura e 2 planos
   (mensal e anual), com 7 dias de garantia.
2. Pegar o **hottok** e os códigos do produto e dos planos.
3. Cadastrar o webhook (versão 2.0.0) para
   `https://levia-ia-worker.ferpa2505.workers.dev/v1/webhook/hotmart` com os eventos
   da tabela 3.3.
4. Cadastrar `HOTMART_HOTTOK` como segredo do worker na Cloudflare.
5. Fazer a compra de teste com reembolso.

## 9. Ordem de implementação

1. Worker: reorganizar em módulos (sem mudar comportamento) + testes atuais passando.
2. Worker: teste, status, ativação, webhook, nova regra da IA + testes.
3. App: `calcularAcesso` + `AssinaturaContext` + testes.
4. App: tela de início do teste, paywall, "Já paguei", banner.
5. App: modo restrito nas telas e nos contextos.
6. Traduções.
7. Teste ponta a ponta com a Hotmart.
