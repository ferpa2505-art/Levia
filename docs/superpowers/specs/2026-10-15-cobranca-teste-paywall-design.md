# Cobrança: teste grátis de 7 dias, paywall e assinatura via Hotmart

Data: 15/10/2026 · Revisão 3 · Status: aguardando revisão · Escopo: Fases 1 e 2 (servidor + app)

## 1. Objetivo

Colocar a PWA do Leviã à venda por assinatura. Qualquer pessoa usa o app completo
por 7 dias, sem cartão. Depois disso o app fica em modo restrito até a pessoa assinar
(mensal ou anual) pela Hotmart.

### Decisões já tomadas com o dono do produto

| Tema | Decisão |
|---|---|
| Onde vende | **Só na PWA (web).** Sem Play Store por enquanto (exige CNPJ) |
| Teste | 7 dias, com **3 fotos de IA no total**, ligado a um **telefone verificado por SMS** |
| Telefone repetido | Mesmo telefone com outro e-mail **não ganha** novo teste |
| Planos | Mensal R$ 12,97 · Anual R$ 124,51 (−20%) |
| Pagamento | Hotmart (assinatura recorrente, webhook 2.0.0), vendendo como pessoa física |
| Licença | **Serial próprio do Leviã**, enviado ao comprador; vale em **até 2 aparelhos** |
| 3º aparelho | Desliga o aparelho mais antigo. Ele tem **uma última entrada**, que dispara o **backup por e-mail**, e depois trava por completo |
| IA para assinante | **2 fotos por dia**, incluídas no preço |
| Fim do teste sem pagar | Vê e exporta tudo; registra **só peso e glicose**; o resto fica bloqueado |
| Testadores | **15 cortesias** com acesso de assinante por 10 anos, mesmos limites |
| Chave de API própria | Fora do lançamento |

### Fora do escopo

- Página de vendas (Fase 3) e correções dos anúncios.
- Cobrança no app nativo Android/iOS. O app nativo continua como está.
- Conta com senha e sincronização contínua de dados entre aparelhos.

## 2. Visão geral

```
           ┌──────────── App (PWA) ─────────────────┐
           │ AssinaturaContext ── useAcesso()       │
           │ paywall · modo restrito · serial       │
           │ última entrada + backup                │
           └──┬──────────────┬───────────────┬──────┘
   SMS ◄──────┤ Firebase     │ /v1/...       │ /v1/analisar-prato
 (código)     │ Phone Auth   │               │
              └──────┬───────▼───────────────▼──────┐
 Hotmart ─────────►  │ levia-ia-worker (Cloudflare)  │──► Gemini
 webhook             │ KV LEVIA_COTAS                │──► Resend (e-mail)
                     └───────────────────────────────┘
 GitHub Actions ── "Criar cortesia" / "Revogar licença" ──► KV
```

O worker que já existe passa a ser a fonte da verdade sobre quem está em teste e quem
assinou. Os dados de saúde continuam só no aparelho. A única exceção é o backup da
última entrada, que passa pelo servidor **já criptografado** e não fica guardado (3.8).

## 3. Servidor (worker)

### 3.1 Identidade

- **E-mail**: normalizado. Minúsculas, sem espaços. Para `gmail.com`/`googlemail.com`
  também tira os pontos e o `+apelido`; para os demais domínios tira o `+apelido`.
- **Telefone**: só números do Brasil (+55), no formato E.164. Verificado por SMS
  pelo **Firebase Authentication**. O worker confere o token do Firebase (JWT
  RS256, chaves públicas do Google em cache, `aud` = id do projeto) e lê o
  `phone_number` dele. O app nunca informa o telefone diretamente.
  O servidor guarda **só um HMAC do telefone** (com o segredo `TELEFONE_PEPPER`):
  dá para saber se o número se repete, mas não dá para ler o número.
- **Instalação**: o UUID que o app já gera (`levia:instalacao`).
- **Serial**: `LEVIA-XXXX-XXXX-XXXX` (Crockford base32, 60 bits aleatórios).
  O servidor guarda **só o hash SHA-256**.

### 3.2 Chaves no KV

| Chave | Valor | Validade |
|---|---|---|
| `tel:<hmac>` | `{ email, testeInicio }` | 2 anos |
| `teste:<email>` | `{ inicio, fim, fotos: number[], telHmac }` | 30 dias após `fim` |
| `teste-inst:<instalacao>` | `<email>` | 30 dias após o fim do teste |
| `lic:<email>` | `{ status, plano, validoAte, transacoes, serialHash, aparelhos: {id, desde}[], desligados: {id, em, entradaFinalUsada}[], origem, atualizadoEm }` | 400 dias após `validoAte` (cortesia: sem expiração) |
| `serial:<hash>` | `<email>` | igual à licença |
| `evento:<id>` | `1` (idempotência do webhook) | 30 dias |
| `ia-dia:<email>:<AAAA-MM-DD>` | fotos do assinante no dia (fuso America/Sao_Paulo) | 2 dias |
| `backup-dia:<email>:<data>` | backups enviados no dia | 2 dias |
| `dia:<data>` / `ip:<ip>:<hora>` | contadores atuais (mantidos) | atuais |
| `lim:<rota>:<chave>:<hora>` | limite de tentativas por rota | 2 h |

### 3.3 Barreiras contra teste repetido

1. **Telefone verificado por SMS** é obrigatório para começar o teste.
2. **Telefone já usado** em um teste, com qualquer e-mail → sem teste novo. A pessoa
   vai direto para o paywall, com a mensagem "Este telefone já usou o teste grátis".
3. **Apelidos do mesmo e-mail** contam como um só (3.1).
4. **E-mails descartáveis** recusados por uma lista embutida.
5. **Um navegador, um teste** (`teste-inst`).
6. **Limites por IP** em todas as rotas.

O que continua possível: alguém com **outro chip** de celular. Isso já custa dinheiro
e tempo para quem tenta, o que basta para um app de R$ 12,97.

Proteção contra **fraude de SMS** (ataque em que robôs pedem SMS em massa para gerar
cobrança): região do Firebase restrita ao Brasil, reCAPTCHA invisível do Firebase,
limite por número e por IP, e alerta de orçamento na conta do Google Cloud.

### 3.4 Endpoints

Todos exigem o cabeçalho `x-levia-app` atual, respondem com CORS para as origens web
já permitidas e têm limite por IP. Erros de e-mail, serial e código são **genéricos**,
para não revelar se um e-mail comprou.

**`POST /v1/teste`** `{ email, tokenFirebase, instalacao }`
- Confere o token do Firebase e calcula o HMAC do telefone.
- `tel:<hmac>` já existe → `403 telefone_ja_usou_teste` (vale para qualquer e-mail).
- Instalação já com teste de outro e-mail → `409 aparelho_com_outro_teste`.
- `teste:<email>` já existe → só devolve o status (o teste não recomeça).
- Senão cria `teste:<email>` (`fim = agora + 7 dias`), `tel:<hmac>` e `teste-inst`.
- Responde como o `/v1/status`.

**`POST /v1/status`** `{ email, instalacao }` → `{ fase, testeFim, validoAte, plano,
fotosRestantes, fotosTipo, entradaFinal, token }`
- `fase`: `assinante` · `teste` · `expirado` · `sem_teste` · **`desligado`**
  (instalação em `lic.desligados`).
- `entradaFinal`: só com `desligado`. `true` enquanto a última entrada não foi usada.
- `token`: status **assinado** (3.9), válido por 3 dias.

**`POST /v1/ativar`** `{ email, serial, instalacao }` **ou** `{ email, transacao, instalacao }`
- Com **serial**: `serial:<hash(serial)>` precisa apontar para o e-mail informado.
- Com **código da transação Hotmart** (reserva para quem não recebeu o serial):
  a transação precisa estar em `lic.transacoes`. O servidor gera um serial novo,
  devolve na tela e reenvia por e-mail.
- Aparelhos: se a instalação já está na lista, ok. Menos de 2, adiciona. Já há 2 →
  o mais antigo vai para `desligados` com `entradaFinalUsada = false` e a resposta
  traz `desligou: true`. Se a instalação que está ativando estava em `desligados`,
  sai de lá.
- Limite: 10 tentativas por IP por hora.

**`POST /v1/entrada-final`** `{ email, instalacao }` → marca `entradaFinalUsada = true`
para essa instalação. O app chama isso **ao abrir** a última entrada, não ao sair:
fechar o app no meio também conta como entrada usada.

**`POST /v1/backup-email`** `{ email, instalacao, arquivo }` (3.8)

**`POST /v1/reenviar-serial`** `{ email }` → se houver licença válida, gera serial novo
(o antigo não ativa mais aparelhos; os já ativados seguem) e manda por e-mail.
Sempre responde `200`.

**`POST /v1/webhook/hotmart`**
- Valida `X-HOTMART-HOTTOK` contra o segredo `HOTMART_HOTTOK` em tempo constante.
- Idempotência por `evento:<id>`. Ignora produto diferente de `HOTMART_PRODUTO_ID`.
- Plano pelo código do plano/oferta (`HOTMART_PLANO_MENSAL` / `HOTMART_PLANO_ANUAL`).

| Evento | Efeito na licença |
|---|---|
| `PURCHASE_APPROVED`, `PURCHASE_COMPLETE` | `status = ativa`; guarda a transação; `validoAte = max(validoAte, agora) + 31 dias (mensal) ou 366 (anual)` + 3 dias de folga. **Primeira compra**: gera o serial e manda o e-mail de boas-vindas |
| `SUBSCRIPTION_CANCELLATION` | `status = cancelada_no_fim` (vale até `validoAte`) |
| `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_PROTEST` | `status = revogada`, `validoAte = agora` |
| `PURCHASE_DELAYED`, `PURCHASE_EXPIRED`, `PURCHASE_CANCELED` | não muda (a validade vence sozinha) |
| `SWITCH_PLAN` | atualiza `plano` |
| outros | `200`, ignora |

> **A conferir no primeiro teste:** os nomes exatos dos campos do payload. Toda a
> leitura fica em `hotmart.js`, ajustada a partir de um evento de teste real enviado
> pelo painel da Hotmart (aba Histórico do Webhook).

### 3.5 Mudanças em `/v1/analisar-prato`

Corpo passa a ter `email` (obrigatório na web). Ordem:
1. Token do app, formato, tamanho (como hoje).
2. Limite por IP por hora (como hoje).
3. Status (mesma regra do `/v1/status`):
   - **assinante** → `ia-dia:<email>:<hoje>` < 2, senão `429 cota_dia` com `liberaEm`.
     Assinante **não** entra no teto global `MAX_FOTOS_DIA`.
   - **teste** → menos de 3 fotos no teste e teto global do dia, senão `402 cota_teste`.
   - **expirado / sem teste / desligado** → `402 assinatura_necessaria`.
4. Conta a foto só se a IA respondeu (como hoje).

A cota antiga por instalação (`inst:<id>`) continua valendo **só** para pedidos sem
`email`, que vêm do app nativo atual.

### 3.6 Aparelho substituído: última entrada e backup

1. A pessoa ativa o serial num aparelho novo; o mais antigo vai para `desligados`.
2. Quando o aparelho antigo abre o app, o status vem como `desligado` com
   `entradaFinal = true`. O app chama `/v1/entrada-final` e mostra uma tela única:
   "Sua assinatura foi ativada em outro aparelho. Esta é a última vez que o Leviã
   abre aqui. Vamos mandar seus dados para o seu e-mail."
3. A pessoa cria uma **senha do backup** (ou usa a que já tem). O app gera o backup
   com a criptografia que já existe (`cifraBackup.ts`), manda para
   `/v1/backup-email` e, ao mesmo tempo, oferece o **download** do arquivo.
4. Depois disso, ou se a pessoa sair, o app trava por completo. Só aparece a tela
   "Ative com seu serial" (que, se usada, desliga o outro aparelho).
5. No aparelho novo, a pessoa restaura pelo **Importar backup**, que já existe,
   usando o arquivo do e-mail e a senha.

**Limites honestos:** o backup só sai se o aparelho antigo **for aberto de novo**.
Celular perdido, roubado ou quebrado não manda nada. O app não roda em segundo plano
no navegador. Por isso entram também (4.7) lembretes de backup periódico.

### 3.7 E-mail

Provedor: **Resend** (plano grátis: 3.000 e-mails/mês, 100/dia, segundo fontes de
terceiros). Exige **domínio próprio verificado**. Segredo `RESEND_API_KEY`.
E-mails enviados: boas-vindas com serial, serial reenviado, backup da última entrada.
Textos em português nesta versão.

**Sem domínio:** o serial aparece na tela na primeira ativação (com e-mail + código
da transação Hotmart) e o backup da última entrada fica **só como download**. O código
é o mesmo; o envio é ligado por configuração (`EMAIL_ATIVO`).

### 3.8 Backup por e-mail

- O arquivo chega **criptografado com a senha do usuário**. O servidor não tem a senha
  e não consegue ler o conteúdo.
- O servidor **não guarda** o arquivo nem o registra em log: repassa ao Resend como
  anexo e descarta.
- Só aceita de instalação que esteja em `desligados` (entrada final) ou ativa na licença.
- Limite de tamanho: 10 MB. Acima disso → `413` e o app fica só com o download.
- Limite: 3 backups por licença por dia.
- Aviso na tela: "Sem a senha do backup não é possível abrir o arquivo. Nós não
  conseguimos recuperar essa senha."

### 3.9 Segurança

1. **Status assinado** com chave Ed25519 (`STATUS_CHAVE_PRIVADA`). O app confere com
   a chave pública embutida. Editar o armazenamento do navegador não vira "assinante".
2. **Validade curta offline:** token de 3 dias. Depois disso, sem internet, o app vai
   para o modo restrito até consultar o servidor.
3. **O que custa dinheiro fica no servidor:** a IA só responde depois que o servidor
   confere teste ou licença.
4. **Segredos só na Cloudflare:** Gemini, hottok, Resend, chave de assinatura,
   `TELEFONE_PEPPER` e o id do projeto Firebase.
5. **Telefone guardado como HMAC**, serial como hash, erros genéricos, limites por IP
   e por número, comparação em tempo constante no hottok.
6. **Token do Firebase conferido no servidor:** o app não consegue inventar um telefone.
7. **Backup:** criptografado no aparelho; o servidor só repassa.
8. **Última entrada controlada pelo servidor** (`entradaFinalUsada`), marcada ao abrir.
9. **Dados mínimos** no servidor: e-mail, datas, plano, ids de aparelho, HMAC do
   telefone. Logs só com contagens.

O que não se resolve: quem alterar o código do app consegue usar o modo completo
**sem IA**. Isso é aceito.

### 3.10 Cortesias para os 15 testadores

- Workflow manual no GitHub Actions **"Criar cortesia"**: campo com o e-mail do testador.
- Cria `lic:<email>` com `origem = 'cortesia'`, `validoAte = agora + 10 anos`, mesmos
  limites de assinante. Testador **não precisa** de SMS nem de teste.
- Mostra o serial no resumo do workflow (repositório privado) para você mandar por
  WhatsApp; com e-mail ativo, também envia por e-mail.
- Workflow **"Revogar licença"**.
- Usa o `CLOUDFLARE_API_TOKEN` que já existe. Nenhuma rota de administração no worker.

### 3.11 Configuração

`[vars]`: `TESTE_DIAS = "7"`, `FOTOS_TESTE = "3"`, `FOTOS_ASSINANTE_DIA = "2"`,
`MAX_APARELHOS = "2"`, `TOKEN_STATUS_DIAS = "3"`, `BACKUP_MAX_MB = "10"`,
`EMAIL_ATIVO`, `EMAIL_REMETENTE`, `FIREBASE_PROJETO`,
`HOTMART_PRODUTO_ID`, `HOTMART_PLANO_MENSAL`, `HOTMART_PLANO_ANUAL`.
Segredos novos: `HOTMART_HOTTOK`, `RESEND_API_KEY`, `STATUS_CHAVE_PRIVADA`,
`TELEFONE_PEPPER`.

### 3.12 Organização do código

`worker/src/index.js` (242 linhas hoje) fica dividido em:
- `index.js`: rotas, CORS, limites.
- `ia.js`: Gemini e prompt (movido sem mudança).
- `acesso.js`: e-mail normalizado, teste, status, cotas.
- `telefone.js`: conferência do token Firebase e HMAC.
- `licenca.js`: serial, aparelhos, desligados, entrada final, cortesia.
- `hotmart.js`: payload e eventos.
- `email.js`: Resend, textos, anexo do backup.
- `assinatura.js`: token Ed25519.

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

Depois do onboarding (ou ao abrir, para quem já fez) e com fase `sem_teste`:
tela **"Ative seus 7 dias grátis"**.
1. E-mail (pré-preenchido com `profile.email`) e **telefone celular, obrigatório**.
2. Código de 6 dígitos por SMS (Firebase, com reCAPTCHA invisível).
3. Chama `/v1/teste`. E-mail e telefone ficam salvos no perfil do aparelho
   (`profile.email` já existe; entra `profile.telefone`).
4. Se o telefone já usou o teste: mensagem clara e paywall.

Link **"Já tenho um serial"** na mesma tela, para assinantes e testadores. Quem ativa
por serial **não** passa pelo SMS: a compra já comprova a pessoa.

### 4.4 Modo restrito (teste acabou, sem pagar)

Bloqueio em duas camadas:
1. **Telas:** os botões de registro (refeição, água, exercício, medicação, notas,
   apetite, GLP-1, receitas, foto) chamam `exigirAssinatura()`, que abre o paywall.
   Peso e glicose seguem normais.
2. **Contextos:** as funções de escrita de `RecordsContext`, `DiabetesContext`,
   `Glp1Context`, `MedicacoesContext` e `CustomRecipesContext` conferem
   `podeRegistrar(...)`. As exceções são `adicionarPeso` e `adicionarGlicemia`.
   Remover registros continua permitido.

Leitura, gráficos, relatórios, exportação e backup seguem liberados.

### 4.5 Aparelho desligado

- Com `entradaFinal = true`: fluxo do 3.6 (tela única, senha do backup, envio por
  e-mail, download).
- Com `entradaFinal = false`: tela única "Este aparelho foi substituído. Para usar
  aqui, ative com seu serial (isso desliga o outro aparelho)." Nada mais do app abre.

### 4.6 Paywall (`app/assinar.tsx`)

- Dois cartões: **Anual** (destaque, "R$ 0,34 por dia", R$ 124,51/ano) e **Mensal**
  (R$ 12,97).
- O botão abre o checkout da Hotmart em nova aba, com o e-mail na URL (`?email=`,
  a conferir), para a compra cair no mesmo e-mail.
- **"Já paguei"** → e-mail + serial. "Não recebi o serial" → código da transação
  Hotmart (começa com `HP`) ou reenvio por e-mail.
- Ao voltar para a aba do app, ele reconsulta o status.
- Aviso fixo: "Cancele quando quiser pela Hotmart. Garantia de 7 dias."

### 4.7 Outras telas e avisos

- **Minha assinatura** (Perfil): plano, validade, aparelhos ativos, "Reenviar serial".
- Banner no Início durante o teste: "Seu teste termina em N dias · Assinar".
- Último dia do teste e expiração: aviso em tela cheia, uma vez, com o paywall.
- **Lembrete de backup** a cada 30 dias (assinantes e teste), já que celular perdido
  não manda backup.
- Na análise de foto: "fotos restantes" e mensagens para `cota_teste`, `cota_dia`
  e `assinatura_necessaria`.
- Textos novos nos 20 idiomas, pelo fluxo de traduções que já existe.

## 5. Erros e casos-limite

| Caso | Comportamento |
|---|---|
| Worker fora do ar ao abrir | Usa o token salvo enquanto valer (até 3 dias) |
| SMS não chega | Reenviar após 60 s, até 3 vezes; depois, tentar mais tarde |
| Telefone já usou o teste | Paywall com mensagem própria |
| Webhook chega antes da ativação | Normal: a licença espera o serial |
| Pagou com outro e-mail | Ativa com o e-mail da compra + serial |
| E-mail de boas-vindas não chegou | Código da transação Hotmart ou reenvio |
| Reembolso nos 7 dias (CDC art. 49) | `PURCHASE_REFUNDED` revoga; acesso cai na próxima consulta ou em até 3 dias |
| Renovação mensal | Novo `PURCHASE_APPROVED` estende `validoAte` |
| Hotmart reenvia o mesmo evento | Idempotência por `evento:<id>` |
| Celular novo | Ativa com serial; o antigo ganha a última entrada com backup |
| Celular antigo perdido | Sem backup automático (3.6); vale o último backup feito |
| Backup maior que 10 MB | Só download |
| Esqueceu a senha do backup | Arquivo não abre; não há recuperação |
| Serial vazou | "Reenviar serial" gera outro |

## 6. Testes

- **Worker** (Jest, offline, no padrão de `worker-api-synthetic.test.ts`):
  hottok inválido → 401; evento duplicado; aprovação gera serial; cancelamento mantém
  até `validoAte`; reembolso revoga; normalização de e-mail; e-mail descartável
  recusado; token Firebase inválido/expirado/de outro projeto → recusa; telefone já
  usado com outro e-mail → 403; aparelho com outro e-mail → 409; 3ª foto do teste ok e
  4ª → 402; assinante 2/dia e 3ª → 429; assinante fora do teto global; serial errado →
  404 genérico; 3º aparelho desliga o mais antigo; status `desligado` com
  `entradaFinal` true e depois false; backup acima do limite → 413; backup de
  instalação estranha → recusa; token assinado confere e adulterado falha.
- **App:** `calcularAcesso` (todas as fases, token vencido/adulterado, datas no limite)
  e `podeRegistrar`.
- **Manual antes de lançar:** SMS real; compra real de R$ 12,97 com reembolso logo
  depois; ativação em 3 aparelhos conferindo última entrada, e-mail do backup e
  restauração no aparelho novo; renovação e revogação.
- CI: suítes novas no `pr-checks.yml`.

## 7. Riscos e pontos em aberto

1. **Saque como pessoa física na Hotmart:** possível limite mensal de R$ 1.900,00 para
   CPF (fontes divergem). Conferir no painel. Imposto de renda: responsabilidade sua;
   consulte um contador.
2. **Custo do SMS:** o Firebase cobra por SMS e não encontrei o preço para o Brasil.
   Fontes de terceiros citam 10 SMS grátis por dia e cobrança por SMS acima disso. Exige
   conta de faturamento no Google Cloud com cartão (não exige CNPJ). Configurar alerta
   de orçamento.
3. **Atrito do SMS:** pedir telefone e código antes de testar vai fazer uma parte das
   pessoas desistir. Aceito em troca do bloqueio.
4. **Domínio:** sem domínio próprio não há serial nem backup por e-mail (3.7).
5. **Tamanho do app:** o SDK do Firebase Auth aumenta o pacote web. Carregar só na tela
   de cadastro (import dinâmico).
6. **Campos do payload da Hotmart e `?email=` no checkout:** confirmar com testes reais.
7. **LGPD:** o servidor passa a guardar e-mail, HMAC do telefone e situação de pagamento,
   e repassa o backup criptografado. A política de privacidade precisa dizer isso, e o
   Firebase (Google) entra como operador para o SMS.
8. **Custo da IA:** com 2 fotos por dia, até cerca de R$ 1,20 a R$ 3,00 por assinante por
   mês (estimativa). 15 cortesias no limite: até ~R$ 45/mês.

## 8. O que o dono do produto faz fora do código

1. Hotmart: produto (software/app), assinatura com 2 planos e 7 dias de garantia.
2. Hottok e códigos do produto e dos planos.
3. Webhook 2.0.0 para
   `https://levia-ia-worker.ferpa2505.workers.dev/v1/webhook/hotmart`.
4. Firebase: projeto, login por telefone ativado, região de SMS só Brasil, domínio da
   PWA autorizado, faturamento com cartão e alerta de orçamento.
5. Domínio próprio, verificação no Resend e chave de API.
6. Segredos do worker na Cloudflare (eu passo os comandos, um por vez).
7. Lista de e-mails dos 15 testadores.
8. Compra de teste com reembolso.

## 9. Ordem de implementação

1. Worker: dividir em módulos sem mudar comportamento + testes atuais passando.
2. Worker: e-mail normalizado, Firebase/telefone, teste, status assinado, licença,
   serial, ativação, desligados e entrada final, backup por e-mail, webhook, nova regra
   da IA + testes.
3. Workflows "Criar cortesia" e "Revogar licença".
4. App: `calcularAcesso` + verificação do token + `AssinaturaContext` + testes.
5. App: cadastro com telefone e SMS, ativação por serial, paywall, "Minha assinatura",
   banner.
6. App: modo restrito; aparelho desligado (última entrada + backup).
7. Traduções.
8. Teste ponta a ponta (SMS, Hotmart, 3 aparelhos); criação das 15 cortesias.
