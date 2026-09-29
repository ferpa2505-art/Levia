# 📄 GITHUB PAGES HELPER - GUIA RÁPIDO

## ⚡ 4 PASSOS (10 MINUTOS)

### Passo 1: Criar Repositório (2 min)

1. Abra: https://github.com/new
2. Preencha:
   - **Repository name:** `levia-policies`
   - **Description:** "Privacy Policy and Terms of Service for Leviã App"
   - **Visibility:** 🔘 PUBLIC (IMPORTANTE!)
   - ☑️ Initialize with README
3. Clique: **Create repository**

✅ Repositório criado!

---

### Passo 2: Upload PRIVACIDADE.md (3 min)

1. No novo repositório, clique: **Add file** → **Create new file**
2. No campo de nome, digite: `PRIVACIDADE.md`
3. Copie o conteúdo:
   - Abra arquivo local: `C:\...\PRIVACIDADE.md`
   - Selecione TUDO (Ctrl+A)
   - Copie (Ctrl+C)
4. Cole no GitHub (Ctrl+V)
5. Clique: **Commit changes**
6. Mensagem: `Add privacy policy`
7. Clique: **Commit**

✅ Arquivo PRIVACIDADE.md uploadado!

---

### Passo 3: Upload TERMOS_SERVICO.md (3 min)

Repita Passo 2, mas:
- Nome: `TERMOS_SERVICO.md`
- Conteúdo: De `C:\...\TERMOS_SERVICO.md`
- Mensagem: `Add terms of service`

✅ Arquivo TERMOS_SERVICO.md uploadado!

---

### Passo 4: Ativar GitHub Pages (2 min)

1. Clique em: **Settings** (no topo do repo)
2. Left menu → **Pages**
3. Em **Source**:
   - Branch: **main**
   - Folder: **/ (root)**
4. Clique: **Save**
5. Aguarde 30-60 segundos (GitHub processa)

✅ GitHub Pages ativado!

---

## 🔗 COPIAR URLs

Depois que Pages ativa, você verá mensagem:
```
Your site is published at: https://seu-username.github.io/levia-policies
```

Copie estas URLs (substitua `seu-username` pelo seu user do GitHub):

```
PRIVACIDADE:
https://seu-username.github.io/levia-policies/PRIVACIDADE.md

TERMOS:
https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md
```

---

## ✅ TESTAR URLs

1. Cole a URL de PRIVACIDADE no navegador
2. Aperte Enter
3. Verifica se carrega ✅
4. Repita com URL de TERMOS ✅

Se der 404:
- Aguarde 1-2 minutos (GitHub leva tempo)
- Limpe cache (Ctrl+Shift+Delete)
- Tente de novo

---

## 📝 ANOTAR PARA AMANHÃ

Salve essas URLs em arquivo de texto, vai precisar amanhã para Passo 5 (Console):

```
PRIVACIDADE:
https://seu-username.github.io/levia-policies/PRIVACIDADE.md

TERMOS:
https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md
```

---

## 🎯 QUANDO TERMINAR

Execute:
```bash
node validate-publication-assets.js
```

Resultado esperado: **100% ✅** (se screenshots também estiverem prontos)

---

**Pronto! Documentos online! 🎉**
