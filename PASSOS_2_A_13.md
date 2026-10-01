# 🧪 PASSOS 2-13: GUIA VISUAL DETALHADO

## ⏱️ PASSO 2: Verificar Card Diabetes na Home (1 min)

**Status:** Quando app carregar, você verá:

```
HOME SCREEN
═══════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────────────┐
│  🏠 Home                                         🔔          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Módulos                                                    │
│  ════════════════════════════════════════════════════════  │
│                                                              │
│  ┌──────────────────────────────────────┐                  │
│  │ 💧 Diabetes                          │                  │
│  │ Rastreie glicemia e medicações      │  ← PROCURE ISTO  │
│  │                                      │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
│  ┌──────────────────────────────────────┐                  │
│  │ 🩺 GLP-1                             │                  │
│  │ Monitore seu GLP-1                  │                  │
│  │                                      │                  │
│  └──────────────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**O que testar:**

- [ ] Card "💧 Diabetes" está visível?
- [ ] Descrição "Rastreie glicemia e medicações" aparece?
- [ ] Consigo clicar no card sem erro?

**✅ RESULTADO PASSO 2:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 3: Navegação para Diabetes (1 min)

**O que acontece ao clicar no card:**

```
TELA DIABETES (após navegar)
═══════════════════════════════════════════════════════════════
┌─────────────────────────────────────────────────────────────┐
│  < Diabetes                                 ⚙️               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Glicemia                                                │
│  ───────────────────────────────────────────────────────   │
│  ├─ 118 mg/dL - 08:30                                      │
│  ├─ 145 mg/dL - 12:15                                      │
│  └─ 128 mg/dL - 17:45                                      │
│  [+ Adicionar]                                              │
│                                                              │
│  💊 Medicações                                              │
│  ───────────────────────────────────────────────────────   │
│  ├─ Metformina 500mg - 08:00                               │
│  └─ Metformina 500mg - 20:00                               │
│  [+ Adicionar]                                              │
│                                                              │
│  🍽️  Refeições                                              │
│  ───────────────────────────────────────────────────────   │
│  ├─ Café - 45g carbs                                       │
│  ├─ Almoço - 60g carbs                                     │
│  └─ Lanche - 50g carbs                                     │
│  [+ Adicionar]                                              │
│                                                              │
│  📝 Notas                                                   │
│  ───────────────────────────────────────────────────────   │
│  └─ Dia com glicemia elevada, revisar doses...             │
│  [+ Adicionar]                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**O que testar:**

- [ ] Navega para /diabetes sem erro?
- [ ] Header mostra "Diabetes"?
- [ ] 4 seções aparecem (Glicemia, Medicações, Refeições, Notas)?
- [ ] Mock data está visível em cada seção?

**✅ RESULTADO PASSO 3:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 4: Testa Glicemia (3 min)

**Sequência de testes:**

### 4.1 Verifica mock data existente

```
GLICEMIA - Estado Inicial
═══════════════════════════════════════════════════════════════
[ ] 118 mg/dL - 08:30  (com ícone Droplet)
[ ] 145 mg/dL - 12:15  (com ícone Droplet)
[ ] 128 mg/dL - 17:45  (com ícone Droplet)
[ ] Cada item tem botão 🗑️ delete
```

### 4.2 Adiciona novo registro

```
1. Clique em "+ Adicionar"
   ↓
   INPUT FORM aparece:
   ┌─────────────────────────────┐
   │ Glicemia (mg/dL)            │
   │ [_________________]         │  ← Digite: 95
   │                             │
   │ [Registrar]                 │
   └─────────────────────────────┘

2. Digite "95" no campo
   ↓
3. Clique em "Registrar"
   ↓
4. Novo registro aparece:
   [ ] 95 mg/dL - [timestamp]
```

### 4.3 Deleta registro

```
1. Clique no 🗑️ de qualquer registro
   ↓
2. Registro desaparece da lista
   ↓
3. Lista atualiza
```

**O que testar:**

- [ ] 3 registros mockados visíveis?
- [ ] Botão "+ Adicionar" funciona?
- [ ] Form valida entrada?
- [ ] Novo registro aparece?
- [ ] Botão delete funciona?
- [ ] Registro é removido?

**✅ RESULTADO PASSO 4:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 5: Testa Medicações (2 min)

**Sequência de testes:**

### 5.1 Verifica mock data

```
MEDICAÇÕES - Estado Inicial
═══════════════════════════════════════════════════════════════
[ ] Metformina 500mg - 08:00
[ ] Metformina 500mg - 20:00
[ ] Cada item tem 🗑️
```

### 5.2 Adiciona nova medicação

```
1. Clique "+ Adicionar"
   ↓
   FORM aparece:
   ┌──────────────────────────┐
   │ Medicamento              │
   │ [▼ Escolher...]          │  ← Click para dropdown
   │                          │
   │ Dosagem (mg)             │
   │ [_________________]      │
   │                          │
   │ [Registrar]              │
   └──────────────────────────┘

2. Clique dropdown, escolha medicamento
   ↓
3. Digite dosagem ex: "1000"
   ↓
4. Clique "Registrar"
   ↓
5. Novo item aparece
```

### 5.3 Deleta

```
1. Clique 🗑️
2. Desaparece
```

**O que testar:**

- [ ] 2 medicações mockadas visíveis?
- [ ] Dropdown funciona?
- [ ] Consigo adicionar?
- [ ] Aparece na lista?
- [ ] Delete funciona?

**✅ RESULTADO PASSO 5:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 6: Testa Refeições (2 min)

**Sequência de testes:**

### 6.1 Verifica mock data

```
REFEIÇÕES - Estado Inicial
═══════════════════════════════════════════════════════════════
[ ] Café - 45g carbs
[ ] Almoço - 60g carbs
[ ] Lanche - 50g carbs
```

### 6.2 Adiciona refeição

```
1. Clique "+ Adicionar"
   ↓
   FORM:
   ┌──────────────────────────┐
   │ Tipo de Refeição         │
   │ [▼ Escolher...]          │
   │                          │
   │ Carboidratos (g)         │
   │ [_________________]      │
   │                          │
   │ [Registrar]              │
   └──────────────────────────┘

2. Escolha tipo (Café/Almoço/Lanche/Ceia)
3. Digite carbs ex: "35"
4. Clique "Registrar"
5. Aparece na lista
```

### 6.3 Deleta

```
1. Clique 🗑️
2. Desaparece
```

**O que testar:**

- [ ] 3 refeições mockadas visíveis?
- [ ] Dropdown de tipos funciona?
- [ ] Consigo adicionar?
- [ ] Aparece na lista?
- [ ] Delete funciona?

**✅ RESULTADO PASSO 6:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 7: Testa Notas (2 min)

**Sequência de testes:**

### 7.1 Verifica mock data

```
NOTAS - Estado Inicial
═══════════════════════════════════════════════════════════════
[ ] "Dia com glicemia elevada, revisar doses..."
```

### 7.2 Adiciona nota

```
1. Clique "+ Adicionar"
   ↓
   FORM:
   ┌──────────────────────────┐
   │ Nota                     │
   │ [_________________]      │
   │ [_________________]      │
   │                          │
   │ [Registrar]              │
   └──────────────────────────┘

2. Digite texto qualquer
3. Clique "Registrar"
4. Aparece na lista
```

### 7.3 Deleta

```
1. Clique 🗑️
2. Desaparece
```

**O que testar:**

- [ ] 1 nota mockada visível?
- [ ] Consigo adicionar nota?
- [ ] Aparece na lista?
- [ ] Delete funciona?

**✅ RESULTADO PASSO 7:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 8: Design e UI (2 min)

**O que verificar visualmente:**

```
CHECKLIST VISUAL
═══════════════════════════════════════════════════════════════

CORES
[ ] Fundo branco/cinza claro (tema do app)?
[ ] Texto preto/cinza escuro (legível)?
[ ] Botões com cor primária (azul/verde)?
[ ] Seções separadas visualmente?

ÍCONES
[ ] 💧 Droplet na seção Glicemia?
[ ] 💊 Pill na seção Medicações?
[ ] 🍽️ Utensils na seção Refeições?
[ ] 📝 FileText na seção Notas?
[ ] 🗑️ Trash nos botões delete?

LAYOUT
[ ] ScrollView funciona (scroll vertical)?
[ ] Cards têm padding/espaçamento ok?
[ ] Botões "+ Adicionar" estão alinhados?
[ ] Form inputs têm bordas/estilos claros?

RESPONSIVIDADE
[ ] App se ajusta ao tamanho da tela?
[ ] Nada fica cortado ou sobreposto?
[ ] Tudo está legível em qualquer orientação?
```

**✅ RESULTADO PASSO 8:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 9: Validação de Formulários (2 min)

**Testa rejeição de valores inválidos:**

### 9.1 Glicemia = 0 (deve rejeitar)

```
1. Clique "+ Adicionar" em Glicemia
2. Digite "0"
3. Clique "Registrar"
   ↓
   [ ] É bloqueado/erro aparece?
   [ ] NÃO adiciona registro com 0?
```

### 9.2 Glicemia negativa (deve rejeitar)

```
1. Clique "+ Adicionar" em Glicemia
2. Digite "-50"
3. Clique "Registrar"
   ↓
   [ ] É bloqueado/erro aparece?
   [ ] NÃO adiciona registro negativo?
```

### 9.3 Glicemia com decimal (deve aceitar)

```
1. Clique "+ Adicionar" em Glicemia
2. Digite "95.5" ou "95,5"
3. Clique "Registrar"
   ↓
   [ ] Aceita decimal?
   [ ] Aparece na lista?
```

### 9.4 Campo obrigatório (vazio = rejeita)

```
1. Clique "+ Adicionar"
2. DEIXE VAZIO
3. Clique "Registrar"
   ↓
   [ ] É bloqueado?
   [ ] Mostra erro "campo obrigatório"?
```

**✅ RESULTADO PASSO 9:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 10: Hot-Reload (2 min)

**Testa que dados não se perdem com hot-reload:**

```
1. APP RODANDO com dados (ex: 3 glicemias mockadas)
   ↓
2. ABRA arquivo: app/diabetes/index.tsx
   ↓
3. Edite algo simples, ex: mude texto
   ↓
4. SALVE arquivo (Ctrl+S ou Cmd+S)
   ↓
5. App recarrega automaticamente
   ↓
   [ ] App recarregou sem erro?
   [ ] Dados ainda estão lá (3 glicemias)?
   [ ] Mudança visual apareceu?
```

**O que não deve acontecer:**

- ❌ Perder dados ao salvar
- ❌ Erro de compilação
- ❌ App crashar

**✅ RESULTADO PASSO 10:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 11: Tradução / Internacionalização (2 min)

**Testa se tradução funciona:**

```
CENÁRIO 1: Português Brasil (pt-BR)
─────────────────────────────────────────────────────────
[ ] "Diabetes" aparece em português?
[ ] "Rastreie glicemia e medicações" em português?
[ ] Todos os labels em português?

CENÁRIO 2: Inglês (en-US)
─────────────────────────────────────────────────────────
1. Abra menu de idioma do app (geralmente ⚙️ settings)
2. Mude para en-US/English
3. Volte para Diabetes
   ↓
   [ ] "Diabetes" aparece em inglês?
   [ ] Labels em inglês?
   [ ] Sem texto quebrado ou [???]?

CENÁRIO 3: Volta para Português
─────────────────────────────────────────────────────────
1. Mude de volta para pt-BR
   ↓
   [ ] Volta para português ok?
   [ ] Tudo legível?
```

**✅ RESULTADO PASSO 11:**
- [ ] PASSOU
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 12: Fluxo Completo End-to-End (3 min)

**Teste todo o ciclo de vida:**

```
SEQUÊNCIA COMPLETA:
═══════════════════════════════════════════════════════════════

1. Home Screen
   [ ] Vê card 💧 Diabetes

2. Clique no card
   [ ] Navega para /diabetes

3. Em Glicemia: Adicione registro
   [ ] Digite "110"
   [ ] Clique "Registrar"
   [ ] Aparece na lista

4. Em Medicações: Adicione registro
   [ ] Escolha "Metformina"
   [ ] Digite dosagem "750"
   [ ] Clique "Registrar"
   [ ] Aparece na lista

5. Em Refeições: Adicione registro
   [ ] Escolha "Almoço"
   [ ] Digite "75" carbs
   [ ] Clique "Registrar"
   [ ] Aparece na lista

6. Em Notas: Adicione registro
   [ ] Digite nota qualquer
   [ ] Clique "Registrar"
   [ ] Aparece na lista

7. Volta para Home
   [ ] Clique no botão voltar < ou clique Home tab

8. Volta para Diabetes
   [ ] Clique novamente no card

9. CRUCIAL: Dados ainda estão lá?
   [ ] 110 na Glicemia?
   [ ] Metformina 750 em Medicações?
   [ ] Almoço 75g em Refeições?
   [ ] Nota em Notas?
   ↓
   SE SIM → Persistência OK
   SE NÃO → ERRO (dados se perderam)
```

**✅ RESULTADO PASSO 12:**
- [ ] PASSOU (dados persistem)
- [ ] FALHOU (descreva abaixo)

Se falhou: _________________________________________________________________

---

## ⏱️ PASSO 13: Documentar Erros (se houver)

**Se algum teste falhou, documente aqui:**

```
ERROS ENCONTRADOS:
═══════════════════════════════════════════════════════════════

Erro #1:
────────
Qual passo? ___________________________
Descrição:  ___________________________
            ___________________________

Erro #2:
────────
Qual passo? ___________________________
Descrição:  ___________________________
            ___________________________

Erro #3:
────────
Qual passo? ___________________________
Descrição:  ___________________________
            ___________________________
```

---

## 📊 RESUMO FINAL

```
╔═════════════════════════════════════════════════════════════════╗
║                    RESULTADO DOS TESTES                         ║
╚═════════════════════════════════════════════════════════════════╝

PASSO 2: Card Diabetes          [ ] PASSOU  [ ] FALHOU
PASSO 3: Navegação              [ ] PASSOU  [ ] FALHOU
PASSO 4: Glicemia               [ ] PASSOU  [ ] FALHOU
PASSO 5: Medicações             [ ] PASSOU  [ ] FALHOU
PASSO 6: Refeições              [ ] PASSOU  [ ] FALHOU
PASSO 7: Notas                  [ ] PASSOU  [ ] FALHOU
PASSO 8: Design/UI              [ ] PASSOU  [ ] FALHOU
PASSO 9: Validação              [ ] PASSOU  [ ] FALHOU
PASSO 10: Hot-Reload            [ ] PASSOU  [ ] FALHOU
PASSO 11: Tradução              [ ] PASSOU  [ ] FALHOU
PASSO 12: End-to-End            [ ] PASSOU  [ ] FALHOU
PASSO 13: Erros                 [ ] N/A     [ ] ENCONTRADOS

TOTAL: _____ / 12 testes passaram

═════════════════════════════════════════════════════════════════

CONCLUSÃO:

[ ] ✅ TUDO PASSOU - PRONTO PARA PRODUÇÃO
[ ] ⚠️  ALGUNS FALHARAM - PRECISA FIX
[ ] ❌ BLOQUEADOR - NÃO MERGEÁVEL

Passos falhados: ___________________________________________________

Recomendação: [ ] MERGE   [ ] FIX E TESTAR   [ ] BLOQUEADO
```

---

## 🎯 PRÓXIMA AÇÃO

**Quando estiver pronto para começar:**

1. ✅ Escolha plataforma (a/i/w) no Expo
2. ✅ Aguarde app carregar (2-5 min)
3. ✅ Siga este guia Passo 2 até Passo 13
4. ✅ Preencha os checkboxes conforme avança
5. ✅ Documente qualquer erro encontrado
6. ✅ Me avise quando terminar (com resultado final)

**Estimado:** ~20-25 minutos total

---

💡 **DICA:** Mantenha este arquivo aberto em outra aba enquanto testa no app. Assim marca o progresso conforme vai.
