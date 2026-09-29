# 📋 Roteiro de Validação Final - LEVIA App

**Data**: 29/09/2026  
**Objetivo**: Validar se as 3 tarefas principais estão prontas para publicação no Google Play Store e Apple App Store

---

## ✅ TASK 1: Diabetes Type Onboarding

### Status: ✅ COMPLETO

**Arquivos**:
- `app/onboarding/diabetes-type.tsx` - Tela de seleção de tipo de diabetes

**Checklist de Teste**:
- [ ] 1. Abrir o app (primeira vez)
- [ ] 2. Proceder pela onboarding
- [ ] 3. Na tela de "Tipo de Diabetes", aparecem 3 opções:
  - [ ] Tipo 1
  - [ ] Tipo 2
  - [ ] Pré-diabetes
- [ ] 4. Clicar em uma opção
- [ ] 5. Tipo selecionado é salvo no contexto
- [ ] 6. Na aba "Diabetes", confirmar que o tipo aparece na tela

**Funcionalidades**:
✅ Seleção de tipo de diabetes  
✅ Persistência de dados  
✅ Integração com DiabetesContext  
✅ Tradução em 20 idiomas

---

## 🎥 TASK 2: Food Recognition (Camera + ML Analysis)

### Status: ✅ COMPLETO + Google Vision API Integrada

**Arquivos**:
- `app/camera.tsx` - Tela de câmera e captura de foto
- `app/food-result.tsx` - Tela de análise de alimentos
- `src/services/googleVisionService.ts` - Serviço de integração com Google Vision API (NOVO)

**Checklist de Teste**:
- [ ] 1. Na aba "Início", clicar no botão 📷 (câmera)
- [ ] 2. Câmera abre e pede permissão
- [ ] 3. Conceder permissão de câmera
- [ ] 4. Tirar foto de um alimento
- [ ] 5. Foto é processada e análise aparece:
  - [ ] Nome do alimento
  - [ ] Calorias
  - [ ] Carboidratos, proteína, gordura, fibra
  - [ ] Índice glicêmico (com alerta se alto)
- [ ] 6. Ajustar quantidade usando -/+ botões
- [ ] 7. Clicar "Adicionar ao Diário"
- [ ] 8. Refeição é adicionada ao histórico de Diabetes

**Funcionalidades**:
✅ Captura de foto com câmera  
✅ Google Vision API integrada (com fallback para mock database)  
✅ Análise de 10 alimentos principais  
✅ Alertas de índice glicêmico alto  
✅ Integração com DiabetesContext  
✅ Tradução em 20 idiomas

**Notas Técnicas**:
- Se Google Vision API key não estiver configurada, usa mock FOOD_DATABASE
- Suporta 10 alimentos: maçã, banana, pão, frango, arroz, batata, brócolis, abóbora, ovos, iogurte
- Em produção, integrar com banco de dados nutricional real

---

## 💳 TASK 3: Payment System (RevenueCat + Paywall)

### Status: ✅ COMPLETO + SDK Integrado

**Arquivos**:
- `src/context/SubscriptionContext.tsx` - Gerenciador de assinaturas com RevenueCat
- `app/paywall.tsx` - Tela de cobrança com planos
- `app/_layout.tsx` - SubscriptionProvider integrado na raiz

**Checklist de Teste**:
- [ ] 1. Ir para aba "Perfil"
- [ ] 2. Clicar no card "Versão Premium" com ícone de coroa 👑
- [ ] 3. Tela de pagamento abre com 2 planos:
  - [ ] Plano Mensal: R$19.90/mês
  - [ ] Plano Anual: R$155.76/ano (20% de economia)
- [ ] 4. Clicar em "Assinar Agora"
- [ ] 5. Mock purchase flow é executado
- [ ] 6. Status muda para "Premium Ativo" ✅

**Funcionalidades**:
✅ RevenueCat SDK integrado  
✅ Dois planos de preço  
✅ UI de paywall responsiva  
✅ Integração com ProfileContext  
✅ Tradução em 20 idiomas

**Notas Técnicas**:
- API Key RevenueCat: Placeholder no código
- Mock purchase flow está ativo para MVP
- Em produção: Conectar com RevenueCat dashboard

---

## 🔔 Sistema de Alarme para Medicação

### Status: ✅ IMPLEMENTADO

**Arquivos**:
- `src/types/diabetes.ts` - Tipos de alarme definidos
- `src/components/diabetes/ConfiguradorAlarmesMedicacao.tsx` - UI para configurar alarmes
- `src/components/diabetes/StatusAlarmeIndicador.tsx` - Indicador de status do alarme
- `src/hooks/useMedicacaoAlarmes.ts` - Hook com lógica de alarmes
- `app/diabetes/index.tsx` - Tela principal integrando alarmes

**Funcionalidades**:
✅ Configurar frequência: hora em hora, 2h, 3h, 4h, 6h, 8h, 12h, diária, semanal, quinzenal, mensal  
✅ Definir horários específicos  
✅ Obrigatório para insulina e diabetes-tratamento  
✅ Obrigatório para medicações de uso contínuo  
✅ Notificações push integradas  
✅ Cálculo de próximo alarme

**Checklist de Teste**:
- [ ] 1. Na aba "Diabetes", clicar em "Adicionar Medicação"
- [ ] 2. Selecionar uma medicação de diabetes (insulina ou diabetes-tratamento)
- [ ] 3. Preencher dosagem
- [ ] 4. Sistema automaticamente abre configurador de alarme (obrigatório)
- [ ] 5. Selecionar frequência (ex: 8h em 8h)
- [ ] 6. Confirmar horários gerados
- [ ] 7. Ativar notificações
- [ ] 8. Salvar medicação
- [ ] 9. Medicação aparece na lista com badge "⏰ Alarme Ativo"

---

## 📱 Verificação Geral

### Tradução (20 idiomas)
- [ ] Português Brasil (pt-BR) ✅
- [ ] Inglês USA (en-US) ✅
- [ ] Inglês UK (en-GB) ✅
- [ ] Espanhol (es) ✅
- [ ] Francês (fr) ✅
- [ ] Alemão (de) ✅
- [ ] Italiano (it) ✅
- [ ] Árabe (ar) ✅
- [ ] Hindi (hi) ✅
- [ ] Indonésio (id) ✅
- [ ] Japonês (ja) ✅
- [ ] Coreano (ko) ✅
- [ ] Holandês (nl) ✅
- [ ] Polonês (pl) ✅
- [ ] Russo (ru) ✅
- [ ] Tailandês (th) ✅
- [ ] Turco (tr) ✅
- [ ] Vietnamita (vi) ✅
- [ ] Chinês Simplificado (zh-CN) ✅
- [ ] Português Portugal (pt-PT) ✅

### Compilação
- [ ] TypeScript compila sem erros críticos
- [ ] Metro bundler rodando e hot-reloading funciona
- [ ] Sem erros de importação

---

## 🚀 Próximos Passos (Pré-Publicação)

### Crítico (deve ser feito antes de publicar):
1. **Obter Google Vision API Key**
   - Localização atual: `C:\Users\ferpa\Desktop\levia-para-claude\backend\google-vision-key.json.json`
   - Ação: Integrar com arquivo de credenciais reais

2. **Obter RevenueCat API Key**
   - Ação: Acessar https://app.revenuecat.com e copiar Production API Key
   - Substituir placeholder em `src/context/SubscriptionContext.tsx` linha ~23

3. **Testar localmente em device/emulador**
   - Android: `eas build --platform android --type app-bundle`
   - iOS: `eas build --platform ios --type app-store`

4. **Testes E2E**
   - Validar onboarding completo
   - Tirar foto e processar alimento real
   - Testar pagamento (testflight/google play beta)
   - Testar alarmes de medicação

### Importante (antes de lançar para beta):
5. Preparar screenshots para app stores (mínimo 2-3 em cada idioma)
6. Escrever descrição do app (com menção aos 3 features)
7. Configurar categoria: Health & Fitness
8. Definir preço e disponibilidade por país

---

## 🔗 Recursos

**Documentos**:
- CHECKLIST_PUBLICACAO.md - Guia de publicação
- DIABETES_README.md - Documentação do módulo

**Comandos Úteis**:

```bash
# Verificar TypeScript
npx tsc --noEmit --skipLibCheck

# Build Android
eas build --platform android --type app-bundle

# Build iOS
eas build --platform ios --type app-store

# Rodar app em development
npm start -- --clear
```

---

**Status Geral**: 🟢 **Pronto para Testes** (aguardando validação final dos 3 features)
