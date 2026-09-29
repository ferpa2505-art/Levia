# 📄 PASSO 4: HOSTEAR DOCUMENTOS LEGAIS NO GITHUB PAGES

**Data:** 29/09/2026
**Status:** 🚀 READY TO EXECUTE
**Tempo:** ~10 minutos
**Arquivos:** PRIVACIDADE.md + TERMOS_SERVICO.md
**Destino:** GitHub Pages (grátis!)

---

## 📋 Resumo Rápido

| Item | Valor |
|------|-------|
| **O que fazer** | Colocar PRIVACIDADE.md + TERMOS_SERVICO.md em URL pública |
| **Onde** | GitHub Pages (repo público) |
| **Custo** | Grátis! |
| **Tempo** | ~10 minutos |
| **Resultado** | URLs públicas para Google Play Console |

---

## ⚠️ POR QUE PRECISA DE URLs PÚBLICAS?

Google Play Console **EXIGE** que você defina:
- ✅ URL da Política de Privacidade
- ✅ URL dos Termos de Serviço

Isso precisa ser acessível publicamente. GitHub Pages é a forma **MAIS FÁCIL E GRÁTIS**.

---

## 🎯 PASSO A PASSO: GitHub Pages

### PASSO 1: Criar novo repositório

**1a. Abra GitHub:**
- Vá para: https://github.com/new
- OU clique em "+" no topo do GitHub → "New repository"

**1b. Preencha os dados:**
```
Repository name: levia-policies
Description: Privacy Policy and Terms of Service for Leviã App
Visibility: ⭕ PUBLIC (IMPORTANTE! Precisa ser público!)
Initialize with README: ✅ (marcar)
```

**1c. Clique em "Create repository"**

Você será redirecionado para a página do novo repo.

---

### PASSO 2: Upload dos arquivos

**2a. Copiar conteúdo de PRIVACIDADE.md:**
1. Abra arquivo local: `C:\...\PRIVACIDADE.md`
2. Copie TUDO (Ctrl+A, Ctrl+C)

**2b. Criar arquivo no GitHub:**
1. No repo, clique em "Add file" → "Create new file"
2. Nome: `PRIVACIDADE.md`
3. Cole o conteúdo
4. Clique em "Commit changes"
5. Mensagem: "Add privacy policy"
6. Clique em "Commit"

**2c. Repetir para TERMOS_SERVICO.md:**
1. "Add file" → "Create new file"
2. Nome: `TERMOS_SERVICO.md`
3. Cole conteúdo de `TERMOS_SERVICO.md`
4. Commit com mensagem: "Add terms of service"

---

### PASSO 3: Ativar GitHub Pages

**3a. Vá para Settings do repo:**
1. Clique em "Settings" (engrenagem, à direita)
2. Left menu → "Pages"

**3b. Configurar Pages:**
- Em "Source"
- Selecione: Branch "main" ou "master"
- Folder: "/ (root)"
- Clique em "Save"

**3c. Aguarde alguns segundos**
- GitHub vai processar
- Você verá mensagem: "Your site is published at..."
- URL base será algo como: `https://seu-username.github.io/levia-policies`

---

### PASSO 4: Copiar URLs

Depois que Pages ativa, as URLs serão:

```
https://seu-username.github.io/levia-policies/PRIVACIDADE.md
https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md
```

**IMPORTANTE:** Substitua `seu-username` pelo seu user do GitHub (exemplo: `ferpa2505-art`)

Então no seu caso seria:
```
https://ferpa2505-art.github.io/levia-policies/PRIVACIDADE.md
https://ferpa2505-art.github.io/levia-policies/TERMOS_SERVICO.md
```

---

## ✅ Testar que as URLs funcionam

Copie cada URL acima e:

**1. Cole no navegador:**
```
https://ferpa2505-art.github.io/levia-policies/PRIVACIDADE.md
```

**2. Aperte Enter**

**3. Verifique:**
- ✅ Página carrega (não 404)
- ✅ Markdown renderiza corretamente
- ✅ Conteúdo completo aparece
- ✅ Pode rolar (scroll) toda a página

**4. Repita para TERMOS:**
```
https://ferpa2505-art.github.io/levia-policies/TERMOS_SERVICO.md
```

---

## 📝 Exemplo Visual

Se tudo correto, ao entrar na URL você verá:

```
PRIVACIDADE - Leviã App

1. COLETA DE DADOS
   Coletamos apenas os dados necessários...

2. USO DOS DADOS
   Usamos seus dados para...

3. ARMAZENAMENTO
   Seus dados são armazenados em...

[continua...]
```

---

## 🔧 Alternativa: Se Quiser Usar Seu Repo Existente

Se quiser colocar em seu repo `levia` já existente:

1. Crie uma pasta `/docs` no repo
2. Upload: `PRIVACIDADE.md` e `TERMOS_SERVICO.md` para `/docs/`
3. Settings → Pages → Source: "Deploy from a branch" → Branch "main" → Folder "/docs"
4. URLs serão:
   ```
   https://ferpa2505-art.github.io/levia/docs/PRIVACIDADE.md
   https://ferpa2505-art.github.io/levia/docs/TERMOS_SERVICO.md
   ```

(Essa opção é mais longa - recomendado usar repo separado `levia-policies`)

---

## 🚀 Alternativa: Anotar em arquivo local

Se GitHub Pages tiver problema, crie um arquivo local anotando as URLs:

```bash
# No seu projeto
cat > URLS_PUBLICAS.txt << EOF
# URLs dos Documentos Legais

PRIVACIDADE:
https://ferpa2505-art.github.io/levia-policies/PRIVACIDADE.md

TERMOS:
https://ferpa2505-art.github.io/levia-policies/TERMOS_SERVICO.md

Nota: Essas URLs serão usadas no Google Play Console
EOF
```

---

## ✅ Checklist de Conclusão

- [ ] Criar repo `levia-policies` no GitHub (público!)
- [ ] Upload: PRIVACIDADE.md
- [ ] Upload: TERMOS_SERVICO.md
- [ ] Ativar GitHub Pages (Settings → Pages)
- [ ] Testar URL privacidade no navegador (abre ✅)
- [ ] Testar URL termos no navegador (abre ✅)
- [ ] Anotar as 2 URLs (copiar para texto)

Quando tudo pronto → **PASSO 5: SUBMETER NO GOOGLE PLAY CONSOLE (AMANHÃ)**

---

## 🔗 URLs Finais

**IMPORTANTE:** Copie estas URLs e SALVE em um arquivo de texto!

Você vai precisar amanhã para submeter:

```
Política de Privacidade: 
https://ferpa2505-art.github.io/levia-policies/PRIVACIDADE.md

Termos de Serviço:
https://ferpa2505-art.github.io/levia-policies/TERMOS_SERVICO.md
```

---

## 🐛 Troubleshooting

### "404 - File not found"
- GitHub Pages leva até 1 minuto para processar
- Aguarde 1 minuto e recarregue (F5)
- Verifique se arquivo está no repo (Settings → Pages deve estar ativo)

### "Repository not found"
- Pode ser privado
- Vá em Settings → Visibility → Change to Public
- Aguarde 30 segundos
- Tentar novamente

### "Markdown não renderiza (aparece código bruto)"
- Normalmente GitHub renderiza automaticamente
- Se não renderizar, não é problema
- Google Play vai ler o conteúdo normalmente
- Pode deixar assim

### "URLs muito compridas"
- GitHub Pages gera URLs assim mesmo
- Não há problema usar URLs compridas
- Não é bloqueador

---

## 📞 Dúvidas?

Encontrou problema? Tente:
1. Recarregar página (F5)
2. Limpar cache (Ctrl+Shift+Delete)
3. Abrir em navegador diferente (Chrome, Firefox, Edge)
4. Esperar 2-3 minutos que GitHub processe

Se ainda não funcionar:
- Use fallback: arquivo local com URLs anotadas
- Amanhã ao submeter, você pode colocar URLs manualmente

---

## 🎯 Próximos Passos

Quando terminar este passo 4, você terá:

✅ Build AAB (já feito)
✅ Screenshots (você fazer Passo 2)
✅ Ícone 512x512 (você fazer Passo 3)
✅ URLs públicas (você fazer Passo 4)

**Amanhã (30/09):**
→ PASSO 5: Submeter no Google Play Console!

---

**⏰ Tempo total esperado: 10 minutos**
**🎯 Próximo passo: Aguardar amanhã para submeter**

Criar repositório e ativar Pages agora! 📄
