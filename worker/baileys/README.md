# Baileys Gateway - Leviã

Gateway WhatsApp headless usando [Baileys](https://github.com/WhiskeySockets/Baileys) que conecta ao WhatsApp Web e encaminha mensagens recebidas para o endpoint `/api/wa/inbound` do Worker Leviã.

## Arquitetura

```
WhatsApp Web → Baileys (Docker) → /api/wa/inbound (Worker) → fluxo.js → D1 + PWA
```

## Componentes

- **src/index.js** - Gateway principal com reconexão automática e heartbeat
- **Dockerfile** - Container otimizado (Node 20 Alpine)
- **docker-compose.yml** - Orquestração com volume persistente para auth
- **.env.example** - Template de configuração

## Pré-requisitos

- Docker + Docker Compose
- Segredo HMAC (`WHATSAPP_WEBHOOK_SECRET`) - gere com `openssl rand -hex 32`
- Worker deployado com `/api/wa/inbound` ativo

## Configuração

```bash
cd worker/baileys
cp .env.example .env
# Edite .env com seus valores
```

### Variáveis obrigatórias

| Variável | Descrição |
|----------|-----------|
| `WORKER_URL` | URL do Worker (ex: `https://levia-ia-worker.ferpa2505.workers.dev`) |
| `WHATSAPP_WEBHOOK_SECRET` | Segredo HMAC para assinar payloads (mesmo do Worker) |

### Variáveis opcionais

| Variável | Default | Descrição |
|----------|---------|-----------|
| `HEARTBEAT_INTERVAL_MS` | `30000` | Intervalo do ping de keep-alive |
| `RECONNECT_DELAY_MS` | `5000` | Delay entre tentativas de reconexão |
| `SESSION_NAME` | `levia-gateway` | Nome para logs |

## Execução

### Desenvolvimento
```bash
npm install
npm run dev
```

### Produção (Docker)
```bash
docker-compose up -d --build
```

### Ver logs
```bash
docker-compose logs -f
```

## Primeira conexão

1. Inicie o gateway: `docker-compose up -d`
2. Verifique logs: `docker-compose logs -f`
3. QR Code aparecerá no terminal
4. Escaneie com WhatsApp no celular (Dispositivos conectados → Conectar aparelho)
5. Gateway conectado! Mensagens serão encaminhadas ao Worker

## Heartbeat & Monitoramento

- **Heartbeat**: Ping a cada 30s (configurável) para manter conexão viva
- **Reconexão automática**: Em caso de queda, reconecta após 5s (configurável)
- **Healthcheck Docker**: Verifica se processo Node está rodando
- **Logs estruturados**: JSON via Pino para integração com Loki/Datadog/etc

## Volumes persistentes

- `baileys-auth` - Credenciais de sessão (não perca isso!)
- `./logs` - Logs da aplicação

## Segurança

- HMAC-SHA256 em todos os payloads enviados ao Worker
- Segredo compartilhado apenas entre Gateway e Worker
- Container roda como non-root (Node Alpine default)

## Troubleshooting

### "Sessão expirada"
```bash
docker-compose down
docker volume rm baileys-auth  # Remove credenciais antigas
docker-compose up -d --build  # Nova sessão, novo QR
```

### Worker retorna 401/403
- Verifique se `WHATSAPP_WEBHOOK_SECRET` é igual no Gateway e Worker
- Verifique se Worker tem o secret configurado no Cloudflare

### Conexão cai frequentemente
- Aumente `HEARTBEAT_INTERVAL_MS` para 60000
- Verifique conectividade de rede do container

## Próximos passos (PR 4+)

- [ ] Alertas via webhook/email quando gateway cai
- [ ] Métricas Prometheus (/metrics endpoint)
- [ ] Suporte a múltiplas sessões (multi-tenant)
- [ ] Envio de mensagens (outbound) via API