# Bot de vendas do Leviã no WhatsApp (projeto B)

Data: 15/10/2026 · Revisão 1 · Status: aguardando revisão

Depende de: `2026-10-15-cobranca-teste-paywall-design.md` (projeto A: verificação pelo
WhatsApp, teste, licença, serial, webhook Hotmart).

## 1. Objetivo

Transformar quem clica num anúncio do Facebook/Instagram em assinante, por uma conversa
no WhatsApp: tirar dúvidas, começar o teste grátis, lembrar do fim do teste, levar ao
checkout da Hotmart e entregar o serial.

### Decisões já tomadas com o dono do produto

| Tema | Decisão |
|---|---|
| Canal | WhatsApp **oficial** (Cloud API da Meta), número dedicado |
| Onde roda | No worker da Cloudflare que já existe; sem PC ligado |
| Conteúdo | **Roteiro de perguntas e respostas escrito**; respostas sempre em texto |
| Áudio recebido | **Transcrito** (Whisper no Workers AI) e respondido em texto; se falhar, pede educadamente para digitar |
| Idiomas | Responde no idioma de quem escreve; roteiro começa em português |
| ZapBot atual | **Não é reaproveitado** (usa Baileys, conexão não oficial, e roda no PC). Só as ideias de roteiro e personalidade |

### Fora do escopo

- Áudios do bot (o bot não manda áudio).
- Campanhas em massa para listas compradas ou contatos que não escreveram primeiro.
- Atendimento humano completo (há só uma passagem simples, 3.6).

## 2. Funil

```
 Anúncio "clique para WhatsApp"
        │  (janela grátis de 72 h, regra da Meta)
        ▼
 1. Boas-vindas + pergunta de objetivo (peso · diabetes · GLP-1)
        ▼
 2. Dúvidas respondidas pelo roteiro
        ▼
 3. Link do teste com telefone já comprovado  ──► PWA: só informa o e-mail
        ▼
 4. "Posso te avisar quando o teste estiver acabando?" (opt-in)
        ▼
 5. Dia 5: lembrete + dica de uso   ·   Dia 7: fim do teste + link do checkout
        ▼
 6. Hotmart aprova ──► serial por e-mail (projeto A) e por WhatsApp
        ▼
 7. Pós-venda: como instalar, como ativar no 2º aparelho
```

Etapas guardadas por contato: `novo` → `qualificado` → `link_enviado` →
`teste_ativo` → `lembrete_d5` → `fim_teste` → `checkout_enviado` → `assinante` /
`perdido`.

## 3. Componentes

### 3.1 Rota e módulos

- `POST /v1/whatsapp` (do projeto A) separa: código `LEVIA <6 dígitos>` → verificação;
  o resto → bot.
- Módulos novos no worker: `bot/conversa.js` (estado e etapas), `bot/ia.js` (resposta
  com o roteiro), `bot/audio.js` (download e transcrição), `bot/lembretes.js`
  (agendamento), `bot/envio.js` (mensagens e templates).

### 3.2 Estado da conversa (KV)

`conv:<telHmac>` → `{ waId, idioma, objetivo, etapa, optIn, origemAnuncio,
historico: últimas 10 mensagens, email?, testeFim?, humanoAte?, atualizadoEm }`.

- `waId` (o número em texto) fica guardado **só para quem escreveu primeiro**, porque é
  necessário para responder e para os lembretes autorizados.
- Validade: 90 dias sem conversa. "PARAR" ou "SAIR" apaga o opt-in na hora; "APAGAR MEUS
  DADOS" remove o registro (GDPR/LGPD).

### 3.3 Roteiro e resposta da IA

- Arquivos `bot/roteiro/pt.md` (e depois `es.md`, `en.md`): perguntas e respostas
  aprovadas pelo dono do produto, mais preços, links e regras de tom.
- A cada mensagem, o Gemini (o mesmo modelo da análise de foto) recebe o roteiro, as
  últimas mensagens e a etapa, e devolve JSON:
  `{ resposta, acao: 'nenhuma'|'enviar_link_teste'|'enviar_checkout'|'pedir_optin'|'chamar_humano', idioma }`.
- Regras fixas no prompt:
  - Responder **só sobre o Leviã**, com base no roteiro. Fora disso: "Isso eu não sei
    responder por aqui" + oferta de passar para o atendimento. Isso também cumpre a regra
    da Meta contra assistente genérico.
  - **Nunca** orientar dose, remédio, diagnóstico ou substituir médico.
  - Sem promessa de resultado ("emagreça X kg").
  - Respostas curtas (até ~400 caracteres), no idioma da pessoa.
- Preços e links vêm do roteiro e da configuração, nunca "inventados" pela IA. O link de
  teste e o de checkout são montados pelo código, não pela IA.

### 3.4 Áudio

1. A Meta avisa que chegou um áudio; o worker baixa o arquivo pela API (sem custo).
2. Áudio com até 2 minutos → **Whisper no Workers AI** → texto → mesmo caminho do 3.3.
   A resposta começa com "🎧 Entendi: …" quando a transcrição for curta, para a pessoa
   perceber se houve erro.
3. Mais de 2 minutos, falha, ou cota diária esgotada → "Desculpe, não consegui entender
   seu áudio 🙏 Pode escrever sua pergunta? Respondo na hora."
4. O áudio não é guardado; a transcrição entra só no histórico curto (3.2).

Custo (página de preços da Cloudflare): cota grátis de 10.000 neurons/dia, cerca de
243 minutos de Whisper por dia; acima disso, cerca de US$ 0,0005 por minuto. Conferir no
painel antes de ativar.

### 3.5 Lembretes

- Só para quem disse **sim** ao opt-in (etapa 4).
- Um Cron Trigger do worker roda a cada hora e procura contatos com `testeFim` chegando:
  - **Dia 5**: lembrete + dica ("já testou a foto do prato?").
  - **Dia 7**: fim do teste + link do checkout.
  - **Dia 9** (se não comprou): última mensagem, com o anual em destaque. Depois disso,
    nenhuma outra mensagem ativa.
- Dentro da janela grátis (72 h do anúncio ou 24 h da última mensagem da pessoa) vão como
  texto comum. Fora dela, vão como **template aprovado pela Meta** (cobrado por mensagem,
  com preço por país).
- Templates necessários (português, depois espanhol e inglês): `lembrete_teste`,
  `fim_teste`, `serial_entregue`.

### 3.6 Passagem para humano

- A IA pede `chamar_humano` quando a pergunta sai do roteiro, a pessoa pede atendente,
  ou há reclamação.
- O bot avisa a pessoa e para de responder naquele contato por 24 h (`humanoAte`).
- O dono do produto recebe aviso no **WhatsApp pessoal** (template `atendimento_pedido`)
  com nome, idioma e resumo da conversa.
- **A decidir:** por onde o dono responde. Opção 1: recurso de "coexistência" da Meta,
  que permite usar o mesmo número no app WhatsApp Business e na API (verificar se está
  disponível para a conta). Opção 2: uma página simples de atendimento. A opção 1 é a
  preferida, se existir.

### 3.7 Ligação com o projeto A

- **Link do teste:** o bot gera um `tokenTelefone` (projeto A, 3.3) a partir do número
  da conversa e manda `https://<app>/?t=<token>`. Na PWA, a pessoa só informa o e-mail.
- Quando `/v1/teste` é concluído com um `tokenTelefone` do bot, o worker grava `email` e
  `testeFim` em `conv:<telHmac>` e muda a etapa para `teste_ativo`.
- Quando o webhook da Hotmart aprova uma compra de um e-mail ligado a uma conversa, o bot
  manda o template `serial_entregue` com o serial e muda a etapa para `assinante`.

### 3.8 Limites e custos

- Até 20 mensagens por contato por hora; acima disso o bot pausa 1 hora.
- Teto diário de chamadas de IA do bot (`BOT_MAX_IA_DIA`), separado do teto de fotos.
- Custo por conversa típica (8 a 12 mensagens): centavos de IA (estimativa); mensagens
  grátis dentro das janelas; templates de lembrete pagos por país.

### 3.9 Métricas

Contadores por dia e por etapa, sem dados pessoais: conversas novas, links de teste
enviados, testes iniciados, opt-ins, checkouts enviados, assinantes, perdidos, áudios
transcritos, passagens para humano. Visíveis nos logs do worker; um painel fica para
depois.

## 4. Anúncios (o que o dono faz)

- Formato "clique para WhatsApp" apontando para o número oficial.
- Seguir as regras de anúncios de saúde da Meta: sem nome de remédio (usar "GLP-1"), sem
  "antes e depois", sem promessa de quilos.
- Texto inicial sugerido da conversa: "Quero testar o Leviã grátis".

## 5. Testes

- Webhook: assinatura inválida → 401; mensagem repetida ignorada.
- Roteamento: `LEVIA 123456` vai para a verificação; texto comum vai para o bot.
- IA (simulada): resposta fora do roteiro aciona `chamar_humano`; pedido de dose é
  recusado; link de teste montado pelo código, com token válido.
- Áudio (simulado): até 2 min transcreve; acima disso ou com falha, pede para digitar.
- Lembretes: só com opt-in; texto comum dentro da janela, template fora dela; sem
  mensagem depois do dia 9.
- PARAR / APAGAR MEUS DADOS funcionam.
- Integração com o projeto A: teste iniciado pelo link muda a etapa; compra aprovada manda
  o serial.

## 6. Riscos

1. **Regras da Meta:** número pode ser restrito por denúncias de spam. Por isso só há
   mensagem ativa com opt-in e no máximo 3 lembretes.
2. **Custo de templates** por país, principalmente fora do Brasil. Medir antes de escalar
   anúncios.
3. **Erro da IA:** pode responder algo fora do roteiro. Mitigação: regras fixas,
   respostas curtas, revisão semanal de amostras das conversas pelo dono.
4. **Erro de transcrição:** "🎧 Entendi: …" deixa a pessoa corrigir.
5. **Privacidade:** conversas e números de quem escreveu ficam até 90 dias; precisa
   constar na política de privacidade (GDPR/LGPD).

## 7. O que o dono do produto faz fora do código

1. Revisar e aprovar o roteiro `pt.md` (eu faço o primeiro rascunho).
2. Criar e enviar para aprovação os templates na Meta.
3. Decidir a forma de passagem para humano (3.6).
4. Montar os anúncios.

## 8. Ordem de implementação (depois do projeto A estar no ar)

1. Roteamento no `/v1/whatsapp` + estado da conversa + PARAR/APAGAR.
2. Rascunho do roteiro em português + resposta da IA com regras fixas.
3. Link do teste ligado ao projeto A.
4. Transcrição de áudio.
5. Opt-in, lembretes e templates.
6. Serial por WhatsApp e passagem para humano.
7. Roteiro em espanhol e inglês.
