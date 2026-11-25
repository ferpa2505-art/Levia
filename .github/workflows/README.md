# Workflows do GitHub Actions — Leviã

Lista dos workflows que estão no repositório. Cada um tem o gatilho descrito abaixo; o arquivo é a fonte da verdade.

## Deploy (produção)
| Workflow | O que faz | Gatilho |
|---|---|---|
| [`deploy-app-cloudflare.yml`](deploy-app-cloudflare.yml) | Publica a PWA (leviapp.org) | Push na `main` (exige aprovação do ambiente `production`) |
| [`deploy-cloudflare-worker.yml`](deploy-cloudflare-worker.yml) | Publica o Worker `levia-ia-worker` | Push na `main` com mudanças em `worker/` |
| [`deploy-landing.yml`](deploy-landing.yml) | Publica a landing (www.leviapp.org) | Push na `main` com mudanças em `site/` |

## Segurança e backup
| Workflow | O que faz | Gatilho |
|---|---|---|
| [`security-audit.yml`](security-audit.yml) | npm audit, gitleaks e trivy | Push/PR na `main`, diário às 02:00 UTC |
| [`backup-d1.yml`](backup-d1.yml) | Exporta o D1 de produção, envia ao R2 e testa a restauração | Domingo às 02:41 UTC |

## Qualidade
| Workflow | O que faz | Gatilho |
|---|---|---|
| [`verify.yml`](verify.yml) | Type-check e checagem de sintaxe | PR e push na `main` |
| [`pr-checks.yml`](pr-checks.yml) | actionlint (sintaxe destes workflows) e testes do Worker | PR e push na `main` |
| [`smoke.yml`](smoke.yml) | Teste smoke somente leitura | Manual |

## Regras do repositório
- A `main` aceita mudanças só por Pull Request.
- Todas as ações externas precisam estar fixadas em SHA completo (não em tag).
