# GitHub Actions Workflows - Leviã

Este diretório contém todos os workflows de CI/CD do projeto Leviã.

---

## 📋 Workflows Disponíveis

### 🚀 Deploy
| Workflow | Descrição | Trigger | Status |
|----------|-----------|---------|--------|
| [`deploy-app-cloudflare.yml`](deploy-app-cloudflare.yml) | Deploy do app PWA via Cloudflare Workers | Push na main | ✅ Produção |
| [`deploy-cloudflare-worker.yml`](deploy-cloudflare-worker.yml) | Deploy do Cloudflare Worker (backend) | Push na main | ✅ Produção |
| [`deploy-landing.yml`](deploy-landing.yml) | Deploy da landing page | Push na main | ✅ Produção |

### 🔒 Segurança
| Workflow | Descrição | Trigger | Status |
|----------|-----------|---------|--------|
| [`security-audit.yml`](security-audit.yml) | Auditoria de segurança (npm audit, gitleaks, trivy, codeql) | Push/PR/main, Diário às 02:00 | ✅ Ativo |
| [`security-monitoring.yml`](security-monitoring.yml) | Monitoramento de segurança (health checks, rate limiting, uptime) | Cada 6 horas | ✅ Ativo |

### 💾 Backup
| Workflow | Descrição | Trigger | Status |
|----------|-----------|---------|--------|
| [`d1-backup.yml`](d1-backup.yml) | Backup do D1 + teste de restauração | Segunda-feira às 03:00 | ⚠️ Configurar R2 |

### ✅ Qualidade
| Workflow | Descrição | Trigger | Status |
|----------|-----------|---------|--------|
| [`pr-checks.yml`](pr-checks.yml) | Checks de PR (lint, type-check) | Pull Request | ✅ Ativo |
| [`verify.yml`](verify.yml) | Verificação de configurações | Pull Request | ✅ Ativo |
| [`smoke.yml`](smoke.yml) | Testes smoke | Pull Request | ✅ Ativo |

---

## 🔧 Configuração dos Workflows

### 1. Security Audit (`security-audit.yml`)
**O que faz:**
- `npm audit` - Verifica vulnerabilidades em dependências
- `gitleaks` - Detecta secrets no código
- `trivy` - Scan de vulnerabilidades em arquivos
- `codeql` - Análise estática de código (GitHub Advanced Security)

**Requisitos:**
- Nenhum secret adicional necessário (usa GITHUB_TOKEN)

**Como ativar:**
- JÁ ATIVO - Funciona automaticamente

---

### 2. Security Monitoring (`security-monitoring.yml`)
**O que faz:**
- Health check do worker e landing page
- Verificação de security headers
- Teste de configuração CORS
- Teste de rate limiting
- Monitoramento de uptime

**Requisitos:**
- Nenhum secret adicional necessário

**Como ativar:**
- JÁ ATIVO - Funciona automaticamente

---

### 3. D1 Backup (`d1-backup.yml`)
**O que faz:**
1. Exporta o banco D1 de produção
2. Upload para bucket R2 privado
3. Testa restauração em banco temporário
4. Limpa arquivos locais

**Requisitos (Secrets necessários):**
```bash
# No GitHub Secrets (Settings > Secrets > Actions):
CLOUDFLARE_API_TOKEN     # Token com permissão de D1 export/import
CLOUDFLARE_ACCOUNT_ID    # ID da conta Cloudflare
R2_BUCKET_NAME           # Nome do bucket R2 para backups
```

**Como ativar:**
1. Adicione os secrets acima no GitHub
2. Crie o bucket R2: `wrangler r2 bucket create BACKUP_BUCKET_NAME`
3. O workflow executará automaticamente toda segunda-feira

**Comando manual:**
```bash
# Para executar manualmente
gh workflow run d1-backup.yml
```

---

## 📊 Prioridades de Execução

| Nível | Workflows | Descrição |
|-------|-----------|-----------|
| 🔴 **Crítico** | security-audit, d1-backup | Previnem vulnerabilidades e perda de dados |
| 🟡 **Importante** | security-monitoring, pr-checks | Garantem qualidade e disponibilidade |
| 🟢 **Normal** | deploy-*, verify, smoke | Deploy e validação |

---

## 🎯 Boas Práticas

### 1. Antes de mergear um PR
- ✅ Todos os checks de PR passaram (`pr-checks.yml`)
- ✅ Security audit passou (`security-audit.yml`)
- ✅ Nenhum secret detectado

### 2. Ao adicionar novas dependências
- ✅ Executar `npm audit` localmente
- ✅ Verificar se a dependência tem vulnerabilidades

### 3. Ao modificar o banco de dados
- ✅ Atualizar migrations
- ✅ Testar backup e restore

### 4. Em caso de vulnerabilidade
- ✅ Não abrir issue público
- ✅ Enviar e-mail para ferpa2505@gmail.com
- ✅ Aplicar fix o mais rápido possível

---

## 🚨 Solução de Problemas

### Workflow falhou?
1. Verifique os logs no GitHub Actions
2. Veja se os secrets estão configurados
3. Confira se o formato do código está correto

### Backup falhou?
1. Verifique se o CLOUDFLARE_API_TOKEN tem permissão de D1
2. Confira se o bucket R2 existe
3. Verifique o limite de armazenamento do R2

### Security audit falhou?
1. Execute `npm audit` localmente para ver as vulnerabilidades
2. Atualize as dependências com vulnerabilidades
3. Verifique se há secrets no código

---

## 📚 Documentação Relacionada

- [SECURITY.md](../SECURITY.md) - Política de Segurança
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Última atualização:** 2024
**Responsável:** ferpa2505@gmail.com
