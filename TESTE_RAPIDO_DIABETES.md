# 🩸 TESTE RÁPIDO - ABA DIABETES (2 MINUTOS)

## ⏱️ Tempo Total: ~2 minutos

## 📱 ANTES DE COMEÇAR

- [ ] Expo Go aberto no seu device/emulator
- [ ] Conectado em `exp://192.168.0.21:8083`
- [ ] Barra de navegação visível (6 abas)
- [ ] App não está congelado

---

## 🚀 TESTE 1: Verificar se Aba Aparece (30 segundos)

### PASSO 1: Recarregar App
```
Option A (Recomendado):
  - Aperte o menu (3 linhas) → "Reload"
  - Espere 5 segundos
  
Option B (Alternativa):
  - Shake o device (Android: pressure, iOS: physical shake)
  - Espere 5 segundos
```

### PASSO 2: Observar Barra de Abas
Você deve ver:
```
[🏠] [📔] [🩸] [💪] [📰] [👤]
      ↓    ↑    ↓
    Diário Diabetes Exercícios
```

✅ **Sucesso se:** Aba 🩸 **Diabetes** aparece entre Diário e Exercícios

❌ **Falha se:** 
- Aba não aparece
- App trava
- Vê erro vermelho

---

## 🎯 TESTE 2: Clicar na Aba (30 segundos)

### PASSO 1: Clique na Aba Diabetes
Toque no ícone 🩸 ou na palavra "Diabetes"

### PASSO 2: Aguarde Carregar
Espere 2-3 segundos para carregamento

### PASSO 3: Verifique as 4 Seções
Você deve ver:
```
┌─────────────────────────┐
│   📊 GLICEMIA            │ ← com valor 118 mg/dL
│   Valor: 118 mg/dL      │
│   [+ Adicionar]         │
└─────────────────────────┘

┌─────────────────────────┐
│   💊 MEDICAÇÕES         │ ← com Metformina
│   Metformina            │
│   [+ Adicionar]         │
└─────────────────────────┘

┌─────────────────────────┐
│   🍽️ REFEIÇÕES           │ ← com Café, Almoço, Jantar
│   Café / Almoço / Jantar │
│   [+ Adicionar]         │
└─────────────────────────┘

┌─────────────────────────┐
│   📝 NOTAS              │
│   [+ Adicionar]         │
└─────────────────────────┘
```

✅ **Sucesso se:** Todas as 4 seções aparecem com ícones e dados

❌ **Falha se:**
- Screen está em branco
- Vê erro ou stack trace
- Só aparece 1-2 seções

---

## ⚡ TESTE 3: Adicionar Dado (45 segundos)

### PASSO 1: Clique em "+ Adicionar" (Glicemia)
Toque no botão azul "+ Adicionar" na seção **Glicemia**

### PASSO 2: Preencha o Formulário
```
Campo: Glicemia
Valor: 142 (ou qualquer número entre 70-400)
Unidade: mg/dL (padrão)
Clique: Salvar
```

### PASSO 3: Verifique se Aparece
A entrada `142 mg/dL` deve aparecer na lista de Glicemia acima do botão "+ Adicionar"

✅ **Sucesso se:** Novo valor aparece e é salvo

❌ **Falha se:**
- Formulário não abre
- Erro ao salvar
- Valor não aparece na lista

---

## 🗑️ TESTE 4: Deletar Dado (30 segundos)

### PASSO 1: Encontre um Item com Lixeira
Procure por um ícone 🗑️ (lixeira) em qualquer item

### PASSO 2: Clique na Lixeira
Toque no ícone 🗑️

### PASSO 3: Confirme Deleção
Se pedir confirmação, clique "Sim" ou "Deletar"

### PASSO 4: Verifique se Desapareceu
O item deve sumir da lista imediatamente

✅ **Sucesso se:** Item desaparece

❌ **Falha se:**
- Lixeira não funciona
- Item fica na lista
- App trava

---

## 🔄 TESTE 5: Persistência (30 segundos)

### PASSO 1: Saia da Aba Diabetes
Clique em outra aba (ex: 📰 Notícias)

### PASSO 2: Volte para Diabetes
Clique novamente em 🩸 Diabetes

### PASSO 3: Verifique os Dados
Os dados que você adicionou/deletou devem estar lá

✅ **Sucesso se:** Dados persistem

❌ **Falha se:**
- Dados sumiram
- Voltaram dados antigos

---

## 📊 RESULTADO FINAL

Se **todos os 5 testes passaram** ✅:

```
┌─────────────────────────────────────────┐
│  🚀 DIABETES 100% FUNCIONAL E PRONTO!   │
│                                         │
│  ✅ Navegação OK                        │
│  ✅ UI Funcional                        │
│  ✅ CRUD (Create/Read/Update/Delete)    │
│  ✅ Persistência de Dados               │
│                                         │
│  Próximo: Capturar screenshots!         │
│  Guia: GUIA_TESTES_DIABETES_NOVO.md   │
└─────────────────────────────────────────┘
```

Se **algum teste falhou** ❌:

1. Tente fazer Reload novamente
2. Feche Expo Go completamente e abra novamente
3. Se persistir, execute:
   ```bash
   npm start -- --clear
   ```

---

## 📸 PRÓXIMO PASSO (Se Tudo OK)

Abra: **GUIA_TESTES_DIABETES_NOVO.md**

E siga para capturar 8 screenshots com as especificações exatas para Google Play!

---

**Criado em:** 29/09/2026  
**Versão:** 1.0  
**Readiness:** 95%
