# ✅ CHECKLIST INTERATIVO - PASSOS 2-4

**Data Início:** 29/09/2026
**Prazo:** HOJE (35 minutos)
**Status:** 🚀 READY TO EXECUTE

---

## 🎬 PASSO 2: CAPTURAR SCREENSHOTS

### Preparação
- [ ] Emulador Android aberto OU device conectado
- [ ] App LEVIÃ rodando (npm start → escolher 'a')
- [ ] Câmera de tela funciona (testar Print Screen)

### Screenshots a Capturar

#### Screenshot 1: HOME
- [ ] Navegar para: Home screen
- [ ] Capturar imagem
- [ ] Salvar como: `screenshots/01-home.png`
- [ ] Validar: 1080x1920 pixels

#### Screenshot 2: DIABETES OVERVIEW
- [ ] Clicar em: "Diabetes" (abas)
- [ ] Capturar imagem mostrando overview
- [ ] Salvar como: `screenshots/02-diabetes-overview.png`
- [ ] Validar: 1080x1920 pixels

#### Screenshot 3: GLICEMIA
- [ ] Dentro Diabetes, clicar em: "Glicemia"
- [ ] Capturar gráfico + histórico
- [ ] Salvar como: `screenshots/03-glicemia.png`
- [ ] Validar: 1080x1920 pixels

#### Screenshot 4: MEDICAÇÕES
- [ ] Dentro Diabetes, clicar em: "Medicações"
- [ ] Capturar lista de medicamentos
- [ ] Salvar como: `screenshots/04-medicacoes.png`
- [ ] Validar: 1080x1920 pixels

#### Screenshot 5: REFEIÇÕES
- [ ] Dentro Diabetes, clicar em: "Refeições"
- [ ] Capturar lista de refeições
- [ ] Salvar como: `screenshots/05-refeicoes.png`
- [ ] Validar: 1080x1920 pixels

#### Screenshot 6: NOTAS
- [ ] Dentro Diabetes, clicar em: "Notas"
- [ ] Capturar lista de notas
- [ ] Salvar como: `screenshots/06-notas.png`
- [ ] Validar: 1080x1920 pixels

#### Screenshot 7: MODAL ADICIONAR
- [ ] Ir para: Glicemia
- [ ] Clicar no botão: "+"
- [ ] Capturar modal de adição
- [ ] Salvar como: `screenshots/07-adicionar-glicemia.png`
- [ ] Validar: 1080x1920 pixels

#### Screenshot 8: ÍCONE DO APP
- [ ] Voltar: Home screen do Android
- [ ] Capturar ícone do app visível
- [ ] Salvar como: `screenshots/08-app-icon.png`
- [ ] Validar: 1080x1920 pixels (ou recorte contendo ícone)

### Validação Final de Screenshots
- [ ] Pasta `screenshots/` criada
- [ ] 8 arquivos PNG presentes
- [ ] Todos são 1080x1920 pixels (validar propriedades)
- [ ] Sem barra de sistema visível
- [ ] Dados mockados aparecem corretamente
- [ ] Qualidade legível (não borrado)
- [ ] Nomes descritivos (01-home.png, etc)

**Quando pronto:** Marque abaixo
- [ ] ✅ PASSO 2 CONCLUÍDO

---

## 🎨 PASSO 3: CONVERTER ÍCONE

### Opção Escolhida: 
- [ ] A - CloudConvert.com (recomendado)
- [ ] B - ImageMagick (linha comando)
- [ ] C - GIMP (interface gráfica)

### Se Escolheu CloudConvert:
- [ ] Acessar: https://cloudconvert.com/svg-to-png
- [ ] Fazer upload: `assets/icon.svg`
- [ ] Configurar saída:
  - [ ] Formato: PNG
  - [ ] Largura: 512
  - [ ] Altura: 512
  - [ ] Qualidade: 100%
- [ ] Clicar: "Convert"
- [ ] Aguardar conversão (5-10 seg)
- [ ] Download do arquivo
- [ ] Salvar em: `assets/icon-512.png`

### Se Escolheu ImageMagick:
- [ ] Verificar instalação: `magick --version`
- [ ] Se não tem, instalar (chocolatey ou download)
- [ ] Executar no terminal:
  ```bash
  magick assets/icon.svg -resize 512x512 assets/icon-512.png
  ```
- [ ] Validar criação: `dir assets/icon-512.png`

### Se Escolheu GIMP:
- [ ] Instalar GIMP (se não tem)
- [ ] Abrir GIMP
- [ ] File → Open → `assets/icon.svg`
- [ ] Na janela de importação:
  - [ ] Width: 512
  - [ ] Height: 512
  - [ ] Clique: "Import"
- [ ] File → Export As...
- [ ] Nome: `icon-512.png`
- [ ] Localização: `assets/`
- [ ] Clique: "Export"
- [ ] Confirm PNG settings

### Validação Final do Ícone
- [ ] Arquivo existe: `assets/icon-512.png`
- [ ] Tamanho exato: 512x512 pixels
- [ ] Formato: PNG (não SVG!)
- [ ] Tamanho de arquivo: 50-200 KB
- [ ] Cores visíveis: Red heart + Blue drop + Green background
- [ ] Sem pixelização (ao fazer zoom)

**Quando pronto:** Marque abaixo
- [ ] ✅ PASSO 3 CONCLUÍDO

---

## 📄 PASSO 4: HOSTEAR DOCUMENTOS NO GITHUB

### Criar Repositório
- [ ] Acessar: https://github.com/new
- [ ] Preencher:
  - [ ] Repository name: `levia-policies`
  - [ ] Description: "Privacy Policy and Terms of Service for Leviã App"
  - [ ] Visibility: ⭕ PUBLIC (IMPORTANTE!)
  - [ ] ✅ Initialize with README (marcar)
- [ ] Clique: "Create repository"
- [ ] Aguardar redirecionamento

### Upload PRIVACIDADE.md
- [ ] No novo repo, clique: "Add file" → "Create new file"
- [ ] Nome do arquivo: `PRIVACIDADE.md`
- [ ] Conteúdo:
  - [ ] Abra arquivo local: `PRIVACIDADE.md`
  - [ ] Copie TODO (Ctrl+A, Ctrl+C)
  - [ ] Cole no navegador (Ctrl+V)
- [ ] Clique: "Commit changes"
- [ ] Mensagem: "Add privacy policy"
- [ ] Clique: "Commit"

### Upload TERMOS_SERVICO.md
- [ ] Clique: "Add file" → "Create new file"
- [ ] Nome do arquivo: `TERMOS_SERVICO.md`
- [ ] Conteúdo:
  - [ ] Abra arquivo local: `TERMOS_SERVICO.md`
  - [ ] Copie TODO (Ctrl+A, Ctrl+C)
  - [ ] Cole no navegador (Ctrl+V)
- [ ] Clique: "Commit changes"
- [ ] Mensagem: "Add terms of service"
- [ ] Clique: "Commit"

### Ativar GitHub Pages
- [ ] Clique: "Settings" (aba no topo)
- [ ] Left menu → "Pages"
- [ ] Em "Source":
  - [ ] Selecione: Branch "main"
  - [ ] Folder: "/" (root)
- [ ] Clique: "Save"
- [ ] Aguarde 30-60 segundos

### Copiar URLs Públicas
- [ ] Volte para "Pages" (pode aparecer mensagem de sucesso)
- [ ] Procure texto: "Your site is published at..."
- [ ] Copie base URL: `https://seu-username.github.io/levia-policies`
- [ ] Monte as URLs completas:
  ```
  PRIVACIDADE: https://seu-username.github.io/levia-policies/PRIVACIDADE.md
  TERMOS: https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md
  ```
- [ ] **SALVE ESTAS URLs EM UM ARQUIVO DE TEXTO!** (vai usar amanhã)

### Testar URLs
- [ ] Abra navegador
- [ ] Copie URL PRIVACIDADE: `https://seu-username.github.io/levia-policies/PRIVACIDADE.md`
- [ ] Clique Enter
- [ ] Valide:
  - [ ] Página carrega (não 404)
  - [ ] Markdown renderiza
  - [ ] Conteúdo aparece completo
  - [ ] Pode fazer scroll
- [ ] Repita para TERMOS:
  - [ ] URL: `https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md`
  - [ ] Valide: carrega, renderiza, conteúdo visível

### Validação Final de Documentos
- [ ] Repo `levia-policies` criado (público)
- [ ] PRIVACIDADE.md uploadado
- [ ] TERMOS_SERVICO.md uploadado
- [ ] GitHub Pages ativado
- [ ] URLs funcionam no navegador
- [ ] Markdown renderiza corretamente
- [ ] URLs anotadas em texto (para amanhã)

**Quando pronto:** Marque abaixo
- [ ] ✅ PASSO 4 CONCLUÍDO

---

## 📋 RESUMO FINAL

### Passos 2-4 Concluídos?

- [ ] ✅ PASSO 2: Screenshots (8 imagens em `screenshots/`)
- [ ] ✅ PASSO 3: Ícone (PNG 512x512 em `assets/`)
- [ ] ✅ PASSO 4: Documentos (URLs públicas no GitHub)

### Assets Prontos?

- [ ] 📸 `screenshots/` com 8 imagens (1080x1920 cada)
- [ ] 🎨 `assets/icon-512.png` (512x512)
- [ ] 📄 URLs PRIVACIDADE funcionando
- [ ] 📄 URLs TERMOS funcionando
- [ ] 📦 AAB pronto para download (já feito)
- [ ] ⚙️ app.json validado (já feito)

### Próximo Passo?

Quando tudo acima estiver marcado:

- [ ] Validar com script: `node validate-publication-assets.js`
- [ ] Se 100% ✅ → Pronto para Passo 5!
- [ ] Se não 100% → Verificar itens faltando acima

---

## ⏱️ TIMING

```
Tempo    Atividade               Status
─────────────────────────────────────────
00:00    Iniciar Passo 2         ⏳
05:00    Screenshots 1-2         ⏳
10:00    Screenshots 3-4         ⏳
15:00    Screenshots 5-6         ⏳
20:00    Screenshots 7-8         ⏳
25:00    Passo 3: Converter      ⏳
30:00    Passo 4: GitHub Pages   ⏳
35:00    ✅ TUDO PRONTO!         ✅
─────────────────────────────────────────
```

---

## 🚀 QUANDO TERMINAR

1. Marque todos os checkboxes acima ✅
2. Execute: `node validate-publication-assets.js`
3. Se validação = 100%:
   - Parabéns! 🎉
   - Você está pronto para Passo 5 (amanhã)
   - Vejo [GUIA_PUBLICACAO_GOOGLE_PLAY.md](./GUIA_PUBLICACAO_GOOGLE_PLAY.md)

4. Se validação < 100%:
   - Revise items faltando acima
   - Procure em documentos específicos
   - Tente novamente

---

**Bom trabalho! 💪 Você consegue!**
