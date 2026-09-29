# 📋 TAREFAS CRÍTICAS ANTES PUBLICAÇÃO (Google Play + App Store)

**Objetivo**: 100% compliance com marketing promises antes de submeter

---

## ✅ TAREFA 1: Diabetes Type Onboarding (COMPLETA)

**Status**: ✅ **CONCLUÍDO**  
**Data**: 2026-09-29  
**Commits**: 2be5d04, 1793e26  

### Implementado:
- ✅ Tipo 1 vs Tipo 2 na tela de onboarding (passo 8 de 9)
- ✅ UI com cards selecionáveis com coração ❤️
- ✅ Descrições claras do mecanismo de cada tipo
- ✅ Traduções em 20 idiomas
- ✅ Dados salvos em `UserProfile.tipoDiabetes`

### Testes Pendentes:
- [ ] Visual no Expo (aguardando Metro compilar)
- [ ] Seleção de tipo 1 e tipo 2
- [ ] Traduções em 3+ idiomas
- [ ] Dados persistem após fechamento

### Próximo: Testes visuais assim que Metro terminar compilação

---

## 🎬 TAREFA 2: Reconhecimento de Comida (PLANEJADO)

**Status**: 🔴 **NÃO INICIADO**  
**Estimativa**: 2-3 horas  
**Blocker**: Metro deve estar pronto antes  

### Requisitos:
- Câmera em tempo real
- Análise ML/IA do alimento
- Retorna: calorias, proteína, carboidratos, gordura
- Integração no Diário (novo botão "📷")

### Arquitetura:
```
app/(tabs)/camera.tsx
├── Câmera ao vivo
├── Button capturar
└── Preview foto

app/food-recognition/result.tsx
├── Mostra foto
├── Resultado da análise
└── Button "Adicionar ao Diário"

Integração no Diário (app/(tabs)/index.tsx)
├── Novo button "📷 Tirar foto"
└── Fluxo: câmera → ML → pré-preenche → salva
```

### Próximas Etapas:
1. [ ] Instalar `expo-camera` + ML.js
2. [ ] Criar UI da câmera
3. [ ] Implementar análise ML
4. [ ] Integrar no Diário
5. [ ] Traduzir em 20 idiomas
6. [ ] Testar no Expo

---

## 💳 TAREFA 3: Sistema de Pagamento (PLANEJADO)

**Status**: 🔴 **NÃO INICIADO**  
**Estimativa**: 3-4 horas  
**Blocker**: Precisa decisão de plataforma (Stripe vs RevenueCat)  

### Requisitos:
- Pacote Anual com 20% OFF - R$12,97/mês
- Checkout funcionando
- Validação de assinatura
- Feature gating (acesso a features premium)

### Opções de Plataforma:

| Plataforma | Prós | Contras | Tempo |
|-----------|------|---------|-------|
| **RevenueCat** | Managed, suporta ambas lojas, fácil | Caro (30% da receita) | 2h |
| **Stripe** | Barato, customizável | Precisa backend próprio | 3h |
| **Google Play Billing** | Nativo Android | iOS precisa separado | 2h |

### Recomendação:
**RevenueCat** - Mais rápido, suporta Android + iOS, gerencia tudo

### Próximas Etapas:
1. [ ] Escolher plataforma (DECISÃO NECESSÁRIA)
2. [ ] Criar conta + obter credenciais
3. [ ] Instalar SDK
4. [ ] Criar tela de Pacotes/Paywall
5. [ ] Implementar checkout
6. [ ] Feature gating
7. [ ] Testar em device real
8. [ ] Submeter para review das lojas

---

## 📊 RESUMO DE PROGRESSO

| Tarefa | Status | % | Prioridade |
|--------|--------|---|-----------|
| 1️⃣ Diabetes Type | ✅ PRONTO | 100% | 🔴 |
| 2️⃣ Câmera + ML | 🔴 NÃO INICIADO | 0% | 🟡 |
| 3️⃣ Pagamento | 🔴 NÃO INICIADO | 0% | 🔴 |
| **TOTAL** | **33% PRONTO** | **33%** | - |

---

## 📝 NOTAS IMPORTANTES

### Antes de Submeter:
- ✅ Diabetes Type: PRONTO para testar
- ⏳ Câmera: INICIANDO após Metro estar pronto
- ⏳ Pagamento: AGUARDANDO DECISÃO (Stripe vs RevenueCat)

### Decisões Necessárias:
1. **Câmera**: Usar ML.js local ou API externa (Google Vision API)?
   - Local: mais rápido, sem internet
   - API: mais preciso, mas requer conexão
   
2. **Pagamento**: Qual plataforma escolher?
   - RevenueCat (recomendado)
   - Stripe (mais barato)
   - Google Play Billing

### Timeline Total:
- Tarefa 1: ✅ PRONTA (2h feito)
- Tarefa 2: ~2-3 horas (após Metro pronto)
- Tarefa 3: ~3-4 horas (após decisão)
- **TOTAL: ~7-9 horas** (menos 2h da tarefa 1 = ~5-7h restante)

---

## 📅 PRÓXIMOS PASSOS

### AGORA (em progresso):
1. ✅ Metro compilando (aguardando)
2. 🔄 Testar Tarefa 1 visualmente
3. 📋 Decidir: ML.js vs API (câmera)
4. 📋 Decidir: RevenueCat vs Stripe (pagamento)

### Depois:
1. Implementar Tarefa 2 (câmera)
2. Implementar Tarefa 3 (pagamento)
3. Testes completos
4. Submeter Google Play + App Store

---

**Responsável**: Copilot  
**Última atualização**: 2026-09-29 19:14 UTC+2  
**Próxima revisão**: Após Metro pronto + Tarefa 1 testada
