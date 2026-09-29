# 📋 Checklist de Testes - Módulo Diabetes

**Status:** ✅ IMPLEMENTAÇÃO COMPLETA  
**Data:** 2026-09-29  
**Commits:** 3 commits realizados (tipos, context, UI, layouts, traduções)

---

## 🎯 Testes de Navegação

- [ ] **Home Screen**: Card Diabetes aparece após GLP-1
- [ ] **Ícone**: Droplet (gota) renderiza com cor primária
- [ ] **Descrição**: "Rastreie glicemia e medicações" aparece em pt-BR
- [ ] **Clique**: Navega para `/diabetes` sem erros
- [ ] **Header**: Mostra "Diabetes" no topo (traduzido no idioma do device)

---

## 📊 Seção de Glicemia

### Visualização
- [ ] Mostra 3 leituras mockadas (118, 145, 128 mg/dL)
- [ ] Exibe horários (08:30, 12:15, 18:00)
- [ ] Mostra notas ("Após café", "Antes do almoço", "Antes do jantar")
- [ ] Valor médio calculado corretamente: ~130 mg/dL
- [ ] Último valor exibido: 128 mg/dL

### Adicionar Glicemia
- [ ] Botão "+ Adicionar" abre formulário
- [ ] Input de glicemia aceita números com ponto ou vírgula
- [ ] Selector de unidade (mg/dL / mmol/L) funciona
- [ ] Campo de notas é opcional
- [ ] Rejeita valores ≤ 0 ou não-numéricos
- [ ] Novo registro aparece na lista imediatamente

### Deletar Glicemia
- [ ] Ícone de lixo aparece em cada item
- [ ] Clique remove o registro
- [ ] Média e último valor atualizam corretamente

---

## 💊 Seção de Medicações

### Visualização
- [ ] Mostra 2 medicações mockadas (Metformina)
- [ ] Exibe dosagem (500mg)
- [ ] Mostra horários (08:00, 21:00)
- [ ] Observações aparecem corretamente

### Adicionar Medicação
- [ ] Botão "+ Adicionar" abre formulário
- [ ] Dropdown de medicamentos oferece 7 opções:
  - [ ] Metformina
  - [ ] Insulina Rápida
  - [ ] Insulina NPH
  - [ ] Glibenclamida
  - [ ] Acarbose
  - [ ] Pioglitazona
  - [ ] Rosiglitazona
- [ ] Input de dosagem aceita números
- [ ] Hora pode ser editada
- [ ] Observações são opcionais
- [ ] Novo registro aparece na lista

### Deletar Medicação
- [ ] Ícone de lixo funciona
- [ ] Medicação desaparece da lista

---

## 🍽️ Seção de Refeições

### Visualização
- [ ] Mostra 3 refeições mockadas
- [ ] Exibe tipo (Café, Almoço, Lanche, Jantar, Outro)
- [ ] Mostra carboidratos em gramas (45g, 60g, 50g)
- [ ] Horários aparecem corretamente
- [ ] Campo de alimentos preenchido

### Adicionar Refeição
- [ ] Botão "+ Adicionar" abre formulário
- [ ] Dropdown de tipo de refeição com 5 opções
- [ ] Input de carboidratos aceita números
- [ ] Campo de alimentos é opcional
- [ ] Campo de observações é opcional
- [ ] Novo registro aparece na lista

### Deletar Refeição
- [ ] Ícone de lixo funciona
- [ ] Refeição desaparece da lista

---

## 📝 Seção de Notas

### Visualização
- [ ] Mostra 1 nota mockada
- [ ] Exibe conteúdo: "Glicemia bem controlada hoje"
- [ ] Mostra horário da nota

### Adicionar Nota
- [ ] Botão "+ Adicionar" abre formulário
- [ ] Campo de conteúdo é obrigatório
- [ ] Rejeita notas vazias
- [ ] Timestamp é capturado automaticamente
- [ ] Nova nota aparece na lista

### Deletar Nota
- [ ] Ícone de lixo funciona
- [ ] Nota desaparece da lista

---

## 🎨 Design e Responsividade

- [ ] Cores seguem o tema do app (sage/petrol blue)
- [ ] Icons renderizam (Droplet, Pill, Utensils, FileText, Trash)
- [ ] Layout responsivo em diferentes tamanhos de tela
- [ ] ScrollView funciona quando conteúdo excede tela
- [ ] Botões têm feedback visual (variante secondary)
- [ ] Inputs têm espaçamento correto
- [ ] Cards têm sombra e border-radius

---

## ✔️ Validação de Formulários

- [ ] Glicemia rejeita valores zerados
- [ ] Glicemia rejeita valores negativos
- [ ] Glicemia rejeita entrada não-numérica
- [ ] Dosagem rejeita valores inválidos
- [ ] Carboidratos rejeita valores zerados
- [ ] Campos obrigatórios são validados
- [ ] Mensagens de erro aparecem (se houver)

---

## 🔄 Hot-Reload (Expo)

- [ ] Alterações em código refletem imediatamente
- [ ] Contexto mantém dados durante reload
- [ ] UI atualiza sem perder estado de formulário aberto

---

## 🌍 Tradução

### Português (pt-BR)
- [ ] "Diabetes" aparece no header e card
- [ ] "Rastreie glicemia e medicações" aparece no card home

### Outros Idiomas (verificar pelo menos 2)
- [ ] Chaves "titulos.diabetes" e "home.diabetesDesc" existem
- [ ] Textos aparecem em idiomas diferentes
- [ ] Seletor de idioma não quebra

---

## 🏗️ Arquitetura e Code

- [ ] `src/types/diabetes.ts` contém 5 interfaces
- [ ] `src/constants/diabetes.ts` contém medicamentos, tipos, ranges
- [ ] `src/context/DiabetesContext.tsx` exporta `useDiabetes()`
- [ ] `app/diabetes/index.tsx` é um componente funcional válido
- [ ] Imports usam aliases (@models, @context, @components, @constants)
- [ ] Sem erros TypeScript (npx tsc --noEmit)
- [ ] Sem warnings de React/ESLint significativos

---

## 🚀 Funcionalidade Completa

### Fluxo Completo
1. [ ] Usuário abre app
2. [ ] Navega para card Diabetes na home
3. [ ] Entra na tela `/diabetes`
4. [ ] Vê 4 seções com dados mockados
5. [ ] Adiciona glicemia
6. [ ] Adiciona medicação
7. [ ] Adiciona refeição
8. [ ] Adiciona nota
9. [ ] Deleta um item de cada seção
10. [ ] Volta para home com router.goBack()
11. [ ] Card ainda mostra dados (Context mantém estado)

---

## 📝 Notas

- Dados são **em memória** (useState) — não persistem entre reloads do app
- Futura integração com AsyncStorage está preparada (código comments)
- Validação básica de formulários implementada
- Design segue padrão do módulo GLP-1

---

## ✅ Conclusão

**Marque os testes à medida que passa. Se algum falhar:**
1. Describe o erro exatamente
2. Paste o stack trace (se houver)
3. Confirme dispositivo/versão do Expo

🎉 **Quando TODOS os testes passarem, o módulo está pronto para produção!**
