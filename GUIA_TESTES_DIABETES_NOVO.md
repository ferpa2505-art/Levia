# 📸 GUIA DE TESTES - ABA DIABETES

**Status:** Aba Diabetes adicionada à navegação ✅
**Data:** 29 de setembro de 2026

---

## 🎯 OBJETIVO

Testar a funcionalidade completa da aba Diabetes e capturar screenshots para o Google Play Console.

---

## ✅ CHECKLIST DE TESTES

### Teste 1: Aparecer a aba Diabetes
- [ ] Aba "Diabetes" aparecer na barra inferior
- [ ] Ícone: gotinha de sangue (Droplet)
- [ ] Posição: entre Diário e Exercícios
- [ ] Clicável e funcional

### Teste 2: Tela Inicial da Diabetes
- [ ] Carrega sem erros
- [ ] Mostra "Rastreamento de Glicemia" como título
- [ ] Visualizar dados mockados iniciais

### Teste 3: Adicionar Glicemia
- [ ] Botão "+" está visível
- [ ] Clica em "+" → abre modal/formulário
- [ ] Campo para inserir valor de glicemia (mg/dL)
- [ ] Campo para notas (opcional)
- [ ] Botão "Salvar" funciona
- [ ] Glicemia aparece na lista

### Teste 4: Adicionar Medicação
- [ ] Clica em "Medicações"
- [ ] Abre lista de medicações (Metformina, Insulina, etc.)
- [ ] Seleciona uma medicação
- [ ] Insere horário
- [ ] Clica "Salvar"
- [ ] Medicação aparece na lista

### Teste 5: Adicionar Refeição
- [ ] Clica em "Refeições"
- [ ] Abre seletor de tipo de refeição
- [ ] Seleciona tipo (Café da manhã, Almoço, etc.)
- [ ] Insere descrição
- [ ] Insere carboidratos (opcional)
- [ ] Clica "Salvar"
- [ ] Refeição aparece na lista

### Teste 6: Adicionar Nota
- [ ] Clica em "Notas"
- [ ] Campo de texto para inserir nota
- [ ] Clica "Salvar"
- [ ] Nota aparece na lista

### Teste 7: Remover Registros
- [ ] Cada registro tem botão deletar (ícone X)
- [ ] Confirma deleção
- [ ] Registro é removido da lista

### Teste 8: Histórico/Data
- [ ] Mostra data de hoje
- [ ] Dados agrupados por data
- [ ] Scroll funciona para ver mais dados

---

## 📸 SCREENSHOTS PARA GOOGLE PLAY

Você precisa capturar 8 screenshots. **AGORA COM A ABA DIABETES!**

### Sugestão de Screenshots (em ordem):

1. **01-home.png** - Home Screen
   - Qualquer aba, mostrando navegação inferior com Diabetes visível

2. **02-diabetes-overview.png** - Diabetes Overview (Tela inicial)
   - Abre a aba Diabetes
   - Mostra o header "Rastreamento de Glicemia"
   - Mostra dados mockados

3. **03-glicemia.png** - Seção de Glicemia
   - Mostra lista de glicemias adicionadas
   - Ou formulário para adicionar glicemia

4. **04-medicacoes.png** - Seção de Medicações
   - Lista de medicações
   - Ou seletor de medicações

5. **05-refeicoes.png** - Seção de Refeições
   - Lista de refeições do dia
   - Ou formulário para adicionar refeição

6. **06-notas.png** - Seção de Notas
   - Lista de notas
   - Ou formulário para adicionar nota

7. **07-adicionar.png** - Modal/Formulário
   - Qualquer formulário aberto (glicemia, medicação, etc.)
   - Mostrar a interação de adicionar dados

8. **08-app-icon.png** - Ícone do App
   - Screenshot do app icon na tela home do Android

---

## 🚀 PASSO A PASSO PARA CAPTURAR

### 1. Prepare o Emulador/Device
```bash
# Terminal 1: Emulador/Device aberto
# Android Studio → AVD Manager → Play
# OU conectar device com USB debugging
```

### 2. Rode o App
```bash
# Terminal 2: Na pasta do projeto
npm start
# Escolha: a (para Android)
```

### 3. Tire Screenshots
```
Para CADA screenshot:

1. Navegue para a tela desejada
2. Tire screenshot:
   - Emulador: Ctrl + S
   - Device: Power + Volume Down
3. Mova para: screenshots/
4. Renomeie com nomes exatos (veja lista acima)
```

### 4. Valide
```bash
# Terminal 3: Na pasta do projeto
node validate-publication-assets.js
```

Resultado esperado: **100% ✅**

---

## 💡 DICAS IMPORTANTES

✅ **Telas bonitas:**
- Mostrar dados reais (não vazios)
- Backgrounds coloridos
- Componentes bem posicionados
- Sem erros ou warnings

✅ **Cada screenshot deve:**
- Ser 1080x1920 pixels (automático no Android)
- Mostrar a funcionalidade principal
- Estar em português (pt-BR)
- Ser claro e fácil de entender

✅ **Não mostrar:**
- Status bar (hora, sinais, etc.) - cortar se possível
- Notificações
- Erros ou crashes
- Data/hora da captura

---

## 📈 DEPOIS DOS TESTES

Uma vez que tiver testado tudo:

1. ✅ Testes básicos da aba Diabetes funcionam
2. ✅ 8 screenshots capturados e salvos
3. ✅ `node validate-publication-assets.js` retorna 100%
4. ✅ Screenshots com nomes corretos

Então você está **100% PRONTO** para submeter amanhã!

---

## 🎯 PRÓXIMOS PASSOS

**Hoje (29/09):**
1. Verifique aba Diabetes no app (deve estar lá agora!)
2. Teste cada funcionalidade
3. Tire os 8 screenshots

**Amanhã (30/09):**
1. Abra: PASSO_5_GOOGLE_PLAY_FINAL.md
2. Use: DADOS_CONSOLE_FINAL.md
3. Login Google Play Console
4. Siga 10 etapas do guia
5. Submeta para review ✨

**01-02/10:**
- Google revisa (24-48h automático)

**03/10:**
- 🎉 APP LIVE NO GOOGLE PLAY!

---

## ❓ TROUBLESHOOTING

### "Aba Diabetes não aparece"
- Faça F5 no Expo Go
- Ou recarregue o app
- Se persisti, execute: `npm start` novamente

### "Erros na aba Diabetes"
- Verifique console (terminal do npm start)
- Veja se há mensagens de erro
- Se houver, tire print e envie

### "Não consigo adicionar glicemia"
- Clique no botão "+"
- Preencha o campo de glicemia
- Clique "Salvar"
- Se não funcionar, tente outro campo

---

**Sucesso! A aba Diabetes está pronta para testes! 🚀**
