# 🧪 Guia de Testes Passo a Passo - Módulo Diabetes

**Tempo estimado:** 15-20 minutos  
**Pré-requisito:** Expo está rodando (`npm start`)

---

## 🚀 PASSO 1: Abra o App no Emulador

Se você ainda **NÃO iniciou** o Expo:
```bash
npm start
```

Pressione:
- **`a`** para Android Emulator (mais rápido)
- **`i`** para iOS Simulator
- **`w`** para Web Browser
- **`j`** para abrir Metro Bundler

**Aguarde** o app carregar (2-5 minutos na primeira vez).

---

## ✅ PASSO 2: Tela Inicial - Card Diabetes

**O que verificar:**

1. [ ] Você está na tela **Home** (abas no fundo)
2. [ ] Vê o card **"Diabetes"** com ícone de gota (droplet)
3. [ ] Descrição: **"Rastreie glicemia e medicações"**
4. [ ] Card está **abaixo do card GLP-1**
5. [ ] Pode **clicar** sem erro

**Screenshot esperado:**
```
┌─────────────────────────────────┐
│  Olá, [Nome]! 👋               │
│  Bem-vindo ao seu acompanhamento│
└─────────────────────────────────┘

📊 Resumo de Hoje
[Resumo com kcal, água, peso...]

💊 GLP-1 Mode
Doses, rodízio de aplicação...

💧 Diabetes  ← AQUI
Rastreie glicemia e medicações
```

---

## ✅ PASSO 3: Navegação - Abrir Diabetes

**Ação:** Clique no card **Diabetes**

**O que verificar:**

1. [ ] **Navega** sem erro para tela `/diabetes`
2. [ ] **Header** no topo mostra: **"Diabetes"**
3. [ ] Tela carrega **sem congelar**
4. [ ] Vê **4 seções** claramente:
   - [ ] 📈 **Glicemia**
   - [ ] 💊 **Medicações**
   - [ ] 🍽️ **Refeições**
   - [ ] 📝 **Notas**

**Se vir erro:**
- [ ] Anotar: qual é o erro exatamente?
- [ ] Screenshot do stack trace

---

## ✅ PASSO 4: Seção Glicemia

### 4.1 - Verificar Dados Mockados

**O que você deve VER:**

```
📈 Glicemia (mg/dL)

Última: 128 mg/dL
Média hoje: ≈130 mg/dL

[Card 1] 08:30 → 118 mg/dL
         "Após café da manhã"

[Card 2] 12:15 → 145 mg/dL
         "Antes do almoço"

[Card 3] 18:00 → 128 mg/dL
         "Antes do jantar"
```

**Checklist:**
- [ ] 3 registros aparecem
- [ ] Valores são: 118, 145, 128
- [ ] Horários: 08:30, 12:15, 18:00
- [ ] Notas aparecem sob cada um
- [ ] Cada card tem ícone de lixo 🗑️

---

### 4.2 - Adicionar Glicemia

**Ação 1:** Clique em **"+ Adicionar"** na seção Glicemia

**O que aparece:**
- [ ] Input para digitar glicemia
- [ ] Selector: **mg/dL** ou **mmol/L** (padrão: mg/dL)
- [ ] Campo opcional: "Notas"
- [ ] Botão: **"Registrar"**
- [ ] Botão: **"Cancelar"**

**Ação 2:** Digite uma glicemia **válida**:
- Teste 1: Digite **`95`** (normal) → Clique "Registrar"
  - [ ] Novo registro aparece na lista
  - [ ] Aparece no topo com hora atual
  - [ ] Média atualiza: antes ~130, depois ~122 (aproximado)

**Ação 3:** Tente adicionar **inválido**:
- Teste 2: Digite **`0`** → Clique "Registrar"
  - [ ] Rejeita com erro (ou silenciosamente ignora)
  - [ ] Não aparece na lista

- Teste 3: Digite **`abc`** → Clique "Registrar"
  - [ ] Rejeita input não-numérico
  - [ ] Pode deixar limpo ou mostrar erro

**Ação 4:** Adicione com **nota**:
- Digite **`120`**
- Digite nota: **"Após café com fruta"**
- Clique "Registrar"
- [ ] Aparece com a nota customizada

---

### 4.3 - Deletar Glicemia

**Ação:** Clique no ícone 🗑️ de um dos registros

- [ ] Registro **desaparece** imediatamente
- [ ] Média recalcula
- [ ] Não pede confirmação (OK - é dado mockado)

---

## ✅ PASSO 5: Seção Medicações

### 5.1 - Verificar Dados Mockados

**O que você deve VER:**

```
💊 Medicações

[Card 1] 08:00
         Metformina 500mg
         "Dose matinal"

[Card 2] 21:00
         Metformina 500mg
         "Dose noturna"
```

**Checklist:**
- [ ] 2 registros aparecem
- [ ] Medicamento: Metformina
- [ ] Dosagem: 500mg
- [ ] Horários: 08:00, 21:00
- [ ] Observações aparecem

---

### 5.2 - Adicionar Medicação

**Ação 1:** Clique em **"+ Adicionar"** em Medicações

**O que aparece:**
- [ ] **Dropdown** de medicamentos com opções:
  - [ ] Metformina
  - [ ] Insulina Rápida
  - [ ] Insulina NPH
  - [ ] Glibenclamida
  - [ ] Acarbose
  - [ ] Pioglitazona
  - [ ] Rosiglitazona

- [ ] Input: **Dosagem** (em mg)
- [ ] Input: **Horário** (HH:mm)
- [ ] Campo opcional: **Observações**
- [ ] Botão: **"Registrar"**

**Ação 2:** Escolha **Insulina Rápida**, dosagem **20mg**, horário **10:30**

- [ ] Novo registro aparece
- [ ] Mostra: "Insulina Rápida | 20mg | 10:30"

**Ação 3:** Tente adicionar com **dosagem vazia**
- [ ] Rejeita ou ignora silenciosamente

---

### 5.3 - Deletar Medicação

**Ação:** Clique 🗑️ em uma medicação

- [ ] Desaparece da lista

---

## ✅ PASSO 6: Seção Refeições

### 6.1 - Verificar Dados Mockados

**O que você deve VER:**

```
🍽️ Refeições

[Card 1] 07:30 Café
         45g carboidratos
         "Ovos, pão, café"

[Card 2] 12:30 Almoço
         60g carboidratos
         "Arroz, frango, salada"

[Card 3] 19:00 Jantar
         50g carboidratos
         "Massa, brócolis"
```

**Checklist:**
- [ ] 3 refeições aparecem
- [ ] Tipos: Café, Almoço, Jantar (ou similar)
- [ ] Carboidratos: 45g, 60g, 50g
- [ ] Alimentos preenchidos
- [ ] Horários corretos

---

### 6.2 - Adicionar Refeição

**Ação 1:** Clique **"+ Adicionar"** em Refeições

**O que aparece:**
- [ ] **Dropdown tipo**: Café, Almoço, Lanche, Jantar, Outro
- [ ] Input: **Carboidratos** (gramas)
- [ ] Input: **Alimentos** (opcional)
- [ ] Input: **Observações** (opcional)
- [ ] Hora é **automática** (hora atual)
- [ ] Botão: **"Registrar"**

**Ação 2:** Escolha:
- Tipo: **Lanche**
- Carboidratos: **30**
- Alimentos: **Maçã com amendoim**

- [ ] Registro aparece na lista
- [ ] Mostra: "Lanche | 30g | Maçã com amendoim | [hora]"

**Ação 3:** Tente com **carboidratos = 0**
- [ ] Rejeita

---

### 6.3 - Deletar Refeição

**Ação:** Clique 🗑️

- [ ] Desaparece

---

## ✅ PASSO 7: Seção Notas

### 7.1 - Verificar Dados Mockados

**O que você deve VER:**

```
📝 Notas

[Card 1] Glicemia bem controlada hoje
         [hora do mockado]
```

**Checklist:**
- [ ] 1 nota aparece
- [ ] Texto: "Glicemia bem controlada hoje"
- [ ] Timestamp exibido

---

### 7.2 - Adicionar Nota

**Ação 1:** Clique **"+ Adicionar"** em Notas

**O que aparece:**
- [ ] Campo de texto grande (textarea)
- [ ] Placeholder: "Escreva sua nota..."
- [ ] Botão: **"Registrar"**

**Ação 2:** Digite uma nota:
```
Acordei bem, glicemia baixa no café.
Comi carboidrato e subiu bastante.
Caminhei 30min à noite.
```

- [ ] Clique "Registrar"
- [ ] Nova nota aparece no topo
- [ ] Mostra **toda o texto** (ou primeiras linhas + "...")
- [ ] Timestamp é hora atual

**Ação 3:** Tente adicionar nota **vazia**
- [ ] Rejeita (campo obrigatório)
- [ ] Botão fica disabled ou mostra erro

---

### 7.3 - Deletar Nota

**Ação:** Clique 🗑️

- [ ] Desaparece

---

## ✅ PASSO 8: Design e Responsividade

**Rode na tela e verifique:**

### Cores
- [ ] Fundo segue tema do app (claro/escuro)
- [ ] Texto legível
- [ ] Botões com cor primária (azul)
- [ ] Cards têm sombra sutil

### Ícones
- [ ] 💧 Droplet (glicemia) - aparece no card da home
- [ ] 💊 Pill (medicações) - aparece no header da seção
- [ ] 🍽️ Utensils (refeições) - aparece no header
- [ ] 📝 FileText (notas) - aparece no header
- [ ] 🗑️ Trash (deletar) - em cada item

### Layout
- [ ] Seções não se sobrepõem
- [ ] ScrollView funciona (role para cima/baixo)
- [ ] Inputs têm padding adequado
- [ ] Botões têm tamanho adequado (clicável)

### Responsividade
- [ ] Teste em **orientação retrato** (padrão)
- [ ] Se possível, gire para **paisagem** → [ ] Layout adapta

---

## ✅ PASSO 9: Validação de Formulários

**Teste cada regra:**

### Glicemia
- [ ] Rejeita `0`
- [ ] Rejeita números negativos (ex: `-50`)
- [ ] Aceita `95.5` (com ponto)
- [ ] Aceita `95,5` (com vírgula) → converte para ponto
- [ ] Rejeita `abc`, `xyz`, caracteres especiais

### Medicação
- [ ] Dropdown é **obrigatório** (deve escolher uma)
- [ ] Dosagem é **obrigatória**
- [ ] Rejeita dosagem = 0 ou vazia

### Refeição
- [ ] Tipo é **obrigatório**
- [ ] Carboidratos é **obrigatório**
- [ ] Rejeita carboidratos = 0
- [ ] Alimentos e observações são **opcionais**

### Nota
- [ ] Campo é **obrigatório**
- [ ] Rejeita nota vazia ou só espaços

---

## ✅ PASSO 10: Hot-Reload do Expo

**Ação 1:** Abra um arquivo TypeScript qualquer:
```
vim src/context/DiabetesContext.tsx
```

**Ação 2:** Faça uma pequena mudança (ex: adicione um comentário):
```typescript
// Teste de hot-reload - linha adicionada
const DADOS_MOCKADOS: DiabetesData = {
```

**Ação 3:** Salve (`Ctrl+S`)

**O que esperar:**
- [ ] App **recarrega automaticamente** no emulador
- [ ] **Não perde dados** (mock data permanece)
- [ ] Não mostra erro
- [ ] Volta para a tela que estava

**Ação 4:** Desfaça a mudança (remova o comentário)

---

## ✅ PASSO 11: Tradução

### 11.1 - Português (Padrão)

Verifique que está em **pt-BR**:
- [ ] Header: **"Diabetes"**
- [ ] Card home: **"Rastreie glicemia e medicações"**
- [ ] Botões: **"+ Adicionar"**, **"Registrar"**, **"Cancelar"**

### 11.2 - Mudar para Outro Idioma

**Ação:** Abra menu de **Idioma**:
1. Clique no ícone **⋮** (menu) no app
2. Selecione **Idioma**
3. Escolha **English (US)**

- [ ] Header muda para: **"Diabetes"** (em inglês)
- [ ] Card home: **"Track blood glucose and medications"**
- [ ] Botões em inglês

**Ação:** Volte para **Português**

- [ ] Tudo volta em português

---

## ✅ PASSO 12: Fluxo Completo (Integração)

**Cenário:** Usuário registra um dia de diabetes

**Sequência:**

1. [ ] Abra app na tela Home
2. [ ] Clique card **Diabetes**
3. [ ] Vê 3 glicemias mockadas
4. [ ] Adicione glicemia **100** com nota **"Manhã"** → [ ] Aparece
5. [ ] Veja que média subiu/desceu (4 valores agora)
6. [ ] Delete a última glicemia → [ ] Volta a 3
7. [ ] Adicione medicação **Metformina 500mg, 12:00** → [ ] Aparece
8. [ ] Adicione refeição **Almoço, 50g** → [ ] Aparece
9. [ ] Adicione nota **"Dia bom!"** → [ ] Aparece
10. [ ] Clique voltar (← Voltar ou gesto de volta)
11. [ ] Volta à home
12. [ ] Clique card Diabetes de novo
13. [ ] [ ] **TODOS OS DADOS PERSISTEM** (Context mantém estado)

---

## ✅ PASSO 13: Erros Conhecidos (Esperados)

Se você encontrar **estes**, **NÃO é um bug** (dados mockados):

- ❌ Sem confirmação ao deletar → OK
- ❌ Sem notificação de sucesso → OK
- ❌ Dados desaparecem ao recarregar app completo → OK (useState, não AsyncStorage ainda)
- ❌ Sem histó ico de mudanças → OK
- ❌ Sem edição de registros existentes → Apenas add/delete por enquanto

---

## 📝 Resumo de Checklist

Copie e preencha à medida que testa:

```
NAVEGAÇÃO
[ ] Card aparece na home
[ ] Clique navega sem erro
[ ] Header mostra "Diabetes"

GLICEMIA
[ ] 3 registros aparecem
[ ] Adicionar funciona (válido)
[ ] Rejeita inválido
[ ] Deletar funciona
[ ] Média atualiza

MEDICAÇÕES
[ ] 2 registros aparecem
[ ] Dropdown com 7 opções
[ ] Adicionar funciona
[ ] Deletar funciona

REFEIÇÕES
[ ] 3 registros aparecem
[ ] 5 tipos no dropdown
[ ] Adicionar funciona
[ ] Deletar funciona

NOTAS
[ ] 1 nota aparece
[ ] Adicionar funciona
[ ] Campo obrigatório
[ ] Deletar funciona

DESIGN
[ ] Cores ok
[ ] Ícones aparecem
[ ] Layout responsivo
[ ] Scrolling funciona

VALIDAÇÃO
[ ] Rejeita valores 0
[ ] Rejeita negativos
[ ] Aceita decimais (ponto/vírgula)
[ ] Campos obrigatórios validam

HOT-RELOAD
[ ] Editar arquivo → recarrega
[ ] Dados não são perdidos

TRADUÇÃO
[ ] pt-BR mostra português
[ ] en-US mostra inglês
[ ] Volta para português ok

INTEGRAÇÃO
[ ] Add/delete mantém estado
[ ] Volta e volta → dados persistem
```

---

## ❓ Se Algo Falhar

**ANOTE:**
1. Qual teste falhou exatamente?
2. Qual é o erro (screenshot do console)?
3. Em qual seção (Glicemia, Medicações, etc)?
4. Que ação fez (clicou onde, digitou o quê)?

**EXEMPLO:**
```
❌ FALHA: Adicionar Glicemia
- Teste: Digitei "95" e cliquei "Registrar"
- Resultado: Erro no console: "Cannot read property 'id' of undefined"
- Seção: Glicemia
- Print: [screenshot aqui]
```

---

## 🎉 Se Tudo Passar

✅ **Módulo Diabetes está pronto para produção!**

Próxima etapa:
```bash
git push
# Crie um Pull Request
```

---

**Bom teste! 🚀**
