# 🗺️ ROADMAP — Levia App

## 📍 Posição Atual

**Etapas 1–2: 95% Completas**

```
████████████████████████░ 95%
```

---

## ✅ Etapas Completas

### Etapa 1 — Esqueleto (✅ 100%)
- [x] Projeto Expo + React Native + TypeScript
- [x] 3 abas navegáveis (Expo Router)
- [x] Sistema de design centralizado
- [x] Componentes base (Button, Text, View)
- [x] Suporte a tema claro/escuro
- [x] Documentação

### Etapa 2 — Ícone + Splash + Quiz (✅ 95%)
- [x] Ícone Levia em 3 versões (SVG)
- [x] Componente LeviaLogo (React Native)
- [x] Paleta de cores profissional + WCAG AA
- [x] Splash screen animada
- [x] Navegação onboarding (Splash → Quiz → Result)
- [x] Quiz estrutura com 8 passos
- [x] Cálculo de metas (Mifflin-St Jeor)
- [x] Result screen com metas personalizadas
- [x] Documentação completa
- [ ] ⏳ Inputs visuais do Quiz (TextInput, RadioButton, Slider) — **20 min**
- [ ] ⏳ Integração com app root (condicionar onboarding vs home) — **10 min**

**Status:** Estrutura pronta, faltam apenas inputs visuais.

---

## ⏳ Próximas Etapas

### Etapa 3 — Supabase (Autenticação + BD)
**Tempo estimado:** 2–3 horas

#### 3.1 — Setup Supabase
- [ ] Criar conta Supabase (free tier)
- [ ] Criar projeto PostgreSQL
- [ ] Habilitar Auth (Apple, Google, E-mail)
- [ ] Configurar variáveis de ambiente `.env.local`

#### 3.2 — Banco de Dados
- [ ] Criar tabela `profiles` (user_id, gender, age, height, current_weight, goal_weight, activity_level, glp1_user)
- [ ] Criar tabela `daily_goals` (profile_id, calories, protein, water, date)
- [ ] Criar tabela `weight_logs` (profile_id, weight, date, time)
- [ ] Criar tabela `meals` (profile_id, name, calories, protein, carbs, fat, fiber, date, time)
- [ ] Criar tabela `water_logs` (profile_id, ml, date, time)
- [ ] Implementar Row Level Security (RLS) — cada usuário vê só seus dados

#### 3.3 — Integração no App
- [ ] Instalar `@supabase/supabase-js`
- [ ] Criar hook `useSupabase()` para autenticação
- [ ] Implementar login/signup screen
- [ ] Salvar quiz data no `profiles` table
- [ ] Criar contexto de usuário logado
- [ ] Condicionar onboarding vs home baseado em auth state

#### 3.4 — Teste
- [ ] Login via e-mail
- [ ] Login via Google
- [ ] Login via Apple
- [ ] Verificar se dados são salvos em Supabase
- [ ] Verificar RLS (usuário A não vê dados de usuário B)

---

### Etapa 4 — Home Screen + Registro
**Tempo estimado:** 1–2 horas

#### 4.1 — Home Screen
- [ ] Resumo do dia
- [ ] Cards de progresso (calorias, proteína, água, passos)
- [ ] Anéis de progresso (circular)
- [ ] Botão "Adicionar refeição"
- [ ] Histórico de peso (gráfico)

#### 4.2 — Registro de Refeição
- [ ] Database de alimentos (integração com API — OpenFoodFacts ou similar)
- [ ] Search + histórico
- [ ] Adicionar quantidade
- [ ] Salvar em `meals` table
- [ ] Validação (não exceder calorias do dia)

#### 4.3 — Registro de Peso
- [ ] Tela para adicionar peso
- [ ] Gráfico de evolução
- [ ] Validações (não muito diferente do anterior)

---

### Etapa 5 — Perfil + Configurações
**Tempo estimado:** 1 hora

#### 5.1 — Tela de Perfil
- [ ] Avatar do usuário (gravatar ou upload)
- [ ] Informações pessoais (nome, e-mail)
- [ ] Editar metas (calorias, proteína, água)
- [ ] Modo GLP-1 (toggle + ícone de badge)
- [ ] Notificações (on/off)
- [ ] Logout

#### 5.2 — Diário
- [ ] Visualizar registro do dia (refeições + água)
- [ ] Editar/deletar entrada
- [ ] Ver nutrição por refeição

---

### Etapa 6 — Paywall + Assinaturas
**Tempo estimado:** 2 horas

#### 6.1 — App Store + Google Play Setup
- [ ] Criar contas desenvolvedor (Apple + Google)
- [ ] Configura produtos de assinatura
- [ ] Testar compras em sandbox

#### 6.2 — Paywall Screen
- [ ] Após onboarding, mostrar paywall
- [ ] 3 planos: Básico (free), Plus (mensal), Pro (anual)
- [ ] Calcular `cost` e benefícios
- [ ] CTA para upgrade

#### 6.3 — Integração de Pagamento
- [ ] Instalar RevenueCat ou similar
- [ ] Validar assinatura no Supabase
- [ ] Features premium no app
- [ ] Sync entre dispositivos

---

### Etapa 7 — Features Premium
**Tempo estimado:** Variável

#### 7.1 — Relatórios
- [ ] Semanal (progresso)
- [ ] Mensal (metas vs real)
- [ ] CSV export

#### 7.2 — Modo GLP-1
- [ ] Badge no app
- [ ] Metas ajustadas (menos caloria se em tratamento)
- [ ] Dicas sobre adesão ao GLP-1

#### 7.3 — Notificações
- [ ] Lembrete de beber água
- [ ] Lembrete de pesar
- [ ] Motivação matinal
- [ ] Push via Firebase Cloud Messaging

#### 7.4 — Gráficos & Análise
- [ ] Charts detalhados (calorias, peso, nutrientes)
- [ ] Tendências
- [ ] Alertas (ex: peso aumentou)

---

### Etapa 8 — Beta Tester Feedback
**Tempo estimado:** 1–2 semanas

- [ ] Distribuir via TestFlight (iOS)
- [ ] Distribuir via Google Play Beta (Android)
- [ ] Coletar feedback
- [ ] Iterar baseado em feedback
- [ ] Bugs e UX adjustments

---

### Etapa 9 — App Store Release
**Tempo estimado:** 1 semana

- [ ] App Store Connect review
- [ ] Google Play Console review
- [ ] Preparar store listing (screenshots, description)
- [ ] Criar conta GitHub/GitLab
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Launch! 🚀

---

### Etapa 10+ — Ongoing
- [ ] Monitoramento de performance
- [ ] Analytics (que features usam mais)
- [ ] Support via e-mail
- [ ] Regular updates (novos alimentos, filtros, etc.)
- [ ] Marketing (social media, content)

---

## 📊 Timeline Estimada

| Etapa | Horas | Data Estimada |
|-------|-------|--------------|
| 1–2 (atual) | ✅ 8h | 21/09/2026 |
| 3 (Supabase) | 3h | 22–23/09 |
| 4 (Home + Registro) | 2h | 24/09 |
| 5 (Perfil) | 1h | 25/09 |
| 6 (Paywall) | 2h | 26–27/09 |
| 7 (Premium Features) | 8h | 28–30/09 |
| 8 (Beta Testers) | 14d | Out/2026 |
| 9 (Release) | 7d | Nov/2026 |

**MVP Funcional:** 30 de setembro de 2026 (2 semanas)
**App Store Release:** Novembro de 2026

---

## 🎯 Checklist de Qualidade

### Código
- [ ] TypeScript 100% typado (sem `any`)
- [ ] Testes unitários (Jest)
- [ ] Testes E2E (Detox)
- [ ] Linting (ESLint)
- [ ] Código bem documentado (comentários em português)

### Design
- [ ] WCAG AA (acessibilidade)
- [ ] Dark mode completo
- [ ] Daltonismo-friendly
- [ ] Responsivo em todas as telas
- [ ] Animações suaves

### Performance
- [ ] Bundle size < 100 MB (app size)
- [ ] Startup time < 2 segundos
- [ ] Scroll 60 FPS
- [ ] Memory usage < 300 MB

### Segurança
- [ ] Autenticação segura (Supabase Auth)
- [ ] Dados criptografados em trânsito (HTTPS)
- [ ] Senhas nunca armazenadas localmente
- [ ] RLS habilitado no banco
- [ ] Sem dados sensíveis em logs

### Compliance
- [ ] LGPD (Lei Geral de Proteção de Dados)
- [ ] GDPR (se tiver usuários na EU)
- [ ] App Store guidelines (Apple)
- [ ] Google Play policies (Android)
- [ ] Health Data regulations

---

## 💡 Notas Importantes

### Design System
- **Nunca usar vermelho** para excesso de calorias (evita culpa)
- **Acolhedor, não clínico** (não é um app de hospital)
- **Premium sem ser caro** (elegância, não só botões grandes)
- **Leveza visual** (cores suaves, espaço branco)

### Funcionalidades Chave
- **Cálculo de metas honesto** (Mifflin-St Jeor, sem promessas falsas)
- **GLP-1 first-class** (não é "feature adicional", é modo completo)
- **Sem shame** (app acolhedor, nunca julga)
- **Dados sincronizados** (Supabase, funciona offline depois)

### Mercados
- 🇧🇷 Brasil (português BR)
- 🇵🇹 Portugal (português PT)
- 🇪🇸 Espanha (espanhol)
- 🇺🇸 EUA (inglês)
- 🇬🇧 Reino Unido (inglês)
- 🇮🇹 Itália (italiano)
- 🇫🇷 França (francês)

Todas as cores devem ser safety-checked nesses mercados (sem conotações negativas).

---

## 🚀 Começando Agora

```bash
# Etapa 2.5 — Completar inputs do Quiz (20 min)
npm install
npm start
# Implementar TextInput, Slider, RadioButton para cada passo

# Depois: Etapa 3 — Supabase (2–3h)
# npm install @supabase/supabase-js
# ... configurar banco e auth
```

---

**Última atualização:** 21/09/2026

"Mais leve a cada dia" 🍃
