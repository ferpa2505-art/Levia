# ⚡ Checklist de Validação Rápida - LEVIA App MVP

**Objetivo**: Validar rapidamente se os 3 features principais estão funcionando  
**Tempo estimado**: 15-20 minutos por feature  
**Pré-requisito**: App rodando com `npm start` e Expo Go aberto no telefone

---

## 📋 Checklist Interativo

### ✅ PRÉ-REQUISITOS
- [ ] Terminal aberto na pasta do projeto
- [ ] Comandos rodados:
  ```bash
  npm start --clear
  ```
- [ ] QR code apareceu no terminal
- [ ] Expo Go instalado no telefone
- [ ] Telefone conectado na mesma rede WiFi

---

## 🎯 TASK 1: Diabetes Type Onboarding (5 minutos)

### Teste 1.1: Seleção de Tipo
- [ ] Abrir app (primeira vez ou após limpar dados)
- [ ] Proceder pelo onboarding
- [ ] Chegar na tela "Qual é seu tipo de diabetes?"
- [ ] Verificar que aparecem 3 opções:
  - [ ] Tipo 1
  - [ ] Tipo 2
  - [ ] Pré-diabetes
- [ ] Clicar em uma opção (ex: Tipo 2)
- [ ] Tipo fica selecionado (visual de check/highlight)

### Teste 1.2: Persistência
- [ ] Continuar onboarding
- [ ] Finalizar onboarding
- [ ] Ir para aba "Diabetes"
- [ ] Verificar que o tipo de diabetes selecionado aparece na tela
- [ ] Fechar e reabrir app
- [ ] ✅ Tipo ainda está lá (persistiu)

### Teste 1.3: Tradução
- [ ] Menu ⋮ → Idioma → Selecionar "English"
- [ ] Voltar para tela de diabetes
- [ ] ✅ Textos aparecem em inglês
- [ ] Mudar de volta para Português

**Status Teste 1**: ✅ PASSOU / ❌ FALHOU

---

## 📸 TASK 2: Food Recognition (10 minutos)

### Teste 2.1: Câmera Abre
- [ ] Ir para aba "Início"
- [ ] Procurar botão 📷 (câmera)
- [ ] Clicar nele
- [ ] ✅ Câmera abre
- [ ] ✅ Aparece preview ao vivo

### Teste 2.2: Captura de Foto
- [ ] Apontar câmera para qualquer objeto
- [ ] Clicar botão de captura (grande no centro)
- [ ] Foto é tirada e congelada
- [ ] ✅ Aparece botão "Confirmar" ou "Retomar"

### Teste 2.3: Análise de Alimento
- [ ] Clicar "Confirmar" na foto
- [ ] ✅ Tela de análise carrega (pode levar 2-3s)
- [ ] ✅ Aparece:
  - [ ] Nome do alimento
  - [ ] Calorias
  - [ ] Macros (carboidratos, proteína, gordura, fibra)
  - [ ] Porção padrão
  - [ ] Confiança (%)

### Teste 2.4: Quantidade Ajustável
- [ ] Na tela de análise, procurar -/+ botões
- [ ] Clicar - para diminuir quantidade
- [ ] ✅ Valores de calorias e macros diminuem
- [ ] Clicar + para aumentar
- [ ] ✅ Valores aumentam proporcionalmente

### Teste 2.5: Alerta de Glicemia Alta
- [ ] Se o alimento tem índice glicêmico alto (ex: banana)
- [ ] ✅ Deve aparecer alerta visual ("Alimento com alto índice glicêmico")
- [ ] Alerta em cor de aviso (amarelo/laranja)

### Teste 2.6: Salvando no Diário
- [ ] Clicar "Adicionar ao Diário" ou botão similar
- [ ] ✅ Aparecer confirmação
- [ ] Ir para aba "Diabetes"
- [ ] ✅ Refeição aparece na lista do dia
- [ ] ✅ Carboidratos aparecem acumulados

**Status Teste 2**: ✅ PASSOU / ❌ FALHOU

---

## 💳 TASK 3: Payment System (5 minutos)

### Teste 3.1: Abrir Paywall
- [ ] Ir para aba "Perfil"
- [ ] Procurar card com ícone de coroa 👑 ("Versão Premium" ou similar)
- [ ] Clicar nele
- [ ] ✅ Tela de preços abre

### Teste 3.2: Ver Planos
- [ ] ✅ Aparecem 2 planos:
  - [ ] **Mensal**: R$ 19,90/mês (ou em outro idioma)
  - [ ] **Anual**: R$ 155,76/ano com badge "20% de economia"
- [ ] ✅ Descrição de benefícios premium aparece

### Teste 3.3: Selecionar Plano
- [ ] Clicar em "Assinar Agora" (no plano mensal, por exemplo)
- [ ] ✅ Tela de checkout começa
- [ ] Mock purchase flow executa (pode demorar 2-3s)

### Teste 3.4: Confirmação
- [ ] ✅ Mensagem de sucesso aparece
- [ ] ✅ Status muda para "Premium Ativo" ✅
- [ ] Voltar para Perfil
- [ ] ✅ Badge premium aparece no perfil

### Teste 3.5: Tradução
- [ ] Menu ⋮ → Idioma → Selecionar outro idioma (ex: English)
- [ ] Voltar para Perfil e clicar Premium novamente
- [ ] ✅ Planos aparecem em inglês
- [ ] Mudar de volta para Português

**Status Teste 3**: ✅ PASSOU / ❌ FALHOU

---

## 🔔 BÔNUS: Alarmes de Medicação (5 minutos)

### Teste B1: Adicionar Medicação com Alarme
- [ ] Ir para aba "Diabetes"
- [ ] Clicar "Adicionar Medicação"
- [ ] Selecionar uma medicação de diabetes (com "Insulina" no nome)
- [ ] Preencher dosagem (ex: "10 unidades")
- [ ] Clicar "Próximo" ou "Continuar"
- [ ] ✅ Tela de configuração de alarme abre automaticamente (obrigatório para insulina)

### Teste B2: Configurar Frequência
- [ ] Selecionar frequência (ex: "A cada 8 horas")
- [ ] ✅ Horários sugeridos aparecem (ex: 08:00, 16:00, 00:00)
- [ ] Ativar "Notificações"
- [ ] Clicar "Salvar"

### Teste B3: Verificar Medicação Salva
- [ ] ✅ Medicação aparece na lista com badge "⏰ Alarme Ativo"
- [ ] Ver próximo horário do alarme exibido
- [ ] Fechar e reabrir aba
- [ ] ✅ Medicação e alarme ainda estão lá

**Status Teste Bonus**: ✅ PASSOU / ❌ FALHOU

---

## 📊 Resumo de Resultados

| Feature | Status | Notas |
|---------|--------|-------|
| Task 1: Diabetes Onboarding | ✅ / ❌ | |
| Task 2: Food Recognition | ✅ / ❌ | |
| Task 3: Payment System | ✅ / ❌ | |
| Bônus: Alarmes | ✅ / ❌ | |

---

## ⚠️ Possíveis Problemas e Soluções

### Problema: Câmera não funciona
**Solução**:
1. Verificar permissão no telefone (Settings → App Permissions)
2. Dar permissão de câmera para Expo Go
3. Reiniciar o app

### Problema: Análise de alimento sempre mostra o mesmo
**Esperado** - Isso é normal! Sistema está usando mock database (10 alimentos)
- Google Vision API real será ativada com API key

### Problema: Notificações não aparecem
**Solução**:
1. Verificar configuração de notificações no telefone
2. Abrir Settings → Notifications → Permitir notificações
3. Reiniciar app

### Problema: App não hot-reloads
**Solução**:
```bash
# Parar o servidor
Ctrl + C

# Limpar cache e reiniciar
npm start --clear
```

---

## 🎉 Se Todos os Testes Passarem

Parabéns! O LEVIA App MVP está **100% funcional** e pronto para:
1. ✅ Testes mais detalhados
2. ✅ Build para Android/iOS
3. ✅ Publicação nas app stores

**Próximo passo**: Seguir o guia `GUIA_PUBLICACAO_GOOGLE_PLAY.md`

---

**Última atualização**: 29/09/2026  
**Versão app**: 0.1.0 (MVP)  
**Tempo total de teste recomendado**: 25-30 minutos
