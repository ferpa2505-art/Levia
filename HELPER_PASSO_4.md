# 📄 HELPER: PASSO 4 - HOSTEAR DOCUMENTOS (MODO AUTOMÁTICO)

Esse arquivo ajuda você a colocar documentos online SEM complicação!

---

## ⚡ OPÇÃO RECOMENDADA - GITHUB PAGES (10 MIN)

### Passo 1: Criar Repositório
```
1. Acesse: https://github.com/new
2. Preencha:
   - Repository name: levia-policies
   - Description: "Privacy Policy and Terms for Leviã App"
   - Visibility: ⭕ PUBLIC (MUITO IMPORTANTE!)
   - ✅ Initialize with README (marcar)
3. Clique: "Create repository"
```

### Passo 2: Copiar PRIVACIDADE.md
```
1. No novo repo, clique: "Add file" → "Create new file"
2. Nome: PRIVACIDADE.md
3. Conteúdo:
   a. Abra arquivo local: C:\...\PRIVACIDADE.md
   b. Selecione tudo (Ctrl+A)
   c. Copie (Ctrl+C)
   d. Cole no navegador (Ctrl+V)
4. Clique: "Commit changes"
5. Mensagem: "Add privacy policy"
6. Clique: "Commit"
```

### Passo 3: Copiar TERMOS_SERVICO.md
```
1. Clique: "Add file" → "Create new file"
2. Nome: TERMOS_SERVICO.md
3. Conteúdo:
   a. Abra arquivo local: C:\...\TERMOS_SERVICO.md
   b. Selecione tudo (Ctrl+A)
   c. Copie (Ctrl+C)
   d. Cole no navegador (Ctrl+V)
4. Clique: "Commit changes"
5. Mensagem: "Add terms of service"
6. Clique: "Commit"
```

### Passo 4: Ativar GitHub Pages
```
1. Clique em: "Settings" (no topo do repo)
2. Left menu → "Pages"
3. Em "Source":
   - Branch: "main"
   - Folder: "/" (root)
4. Clique: "Save"
5. Aguarde 30 segundos (GitHub processa)
```

### Passo 5: Copiar URLs Públicas
```
Depois que Pages ativa, procure mensagem:
"Your site is published at: https://seu-username.github.io/levia-policies"

Copie essas URLs:
- PRIVACIDADE: https://seu-username.github.io/levia-policies/PRIVACIDADE.md
- TERMOS: https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md

IMPORTANTE: Substitua "seu-username" pelo seu user do GitHub
```

---

## ✅ VALIDAÇÃO

Teste as URLs:

```
1. Copie a URL de PRIVACIDADE no navegador
2. Aperte Enter
3. Verifica que carrega ✅
4. Repita com URL de TERMOS ✅

Se der 404, aguarde 1 minuto (GitHub leva tempo)
```

---

## 📝 ANOTAR URLs

Depois que funcionam, ANOTE em arquivo de texto:

```
PRIVACIDADE:
https://seu-username.github.io/levia-policies/PRIVACIDADE.md

TERMOS:
https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md

Vai precisar dessas URLs amanhã para Passo 5 (Console)!
```

---

## ⏱️ TEMPO

```
Total: 10 minutos
- Criar repo: 1 min
- Upload PRIVACIDADE: 2 min
- Upload TERMOS: 2 min
- Ativar Pages: 1 min
- Testar URLs: 2 min
- Anotar: 2 min
```

---

## 🚀 QUANDO TERMINAR

Execute:
```bash
node validate-publication-assets.js
```

Se validação = 100% ✅:
→ Todos os Passos 2-4 COMPLETOS!
→ Você está pronto para Passo 5 amanhã!

---

**Pronto! Documentos online! 📄**
