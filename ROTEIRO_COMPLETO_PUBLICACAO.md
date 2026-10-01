# 🚀 ROTEIRO COMPLETO: PUBLICAR LEVIÃ NO GOOGLE PLAY

**Status:** ✅ BUILD CONCLUÍDO - PRÓXIMOS PASSOS EM PARALELO

---

## 📊 STATUS ATUAL

```
✅ PASSO 1: Preparar Build           → CONCLUÍDO
   - Preparar arquivos              ✅
   - Criar screenshots              ✅
   - Escrever políticas             ✅
   - Gerar AAB                      ✅ COMPLETO!

⏳ PASSO 2: Screenshots              → VOCÊ FAZ AGORA
   - Capturar 6-8 imagens
   - Validar 1080x1920 pixels
   - Tempo: 20 minutos

⏳ PASSO 3: Ícone                    → VOCÊ FAZ AGORA
   - Converter SVG → PNG 512x512
   - Tempo: 5 minutos

⏳ PASSO 4: Hostear Docs             → VOCÊ FAZ AGORA
   - GitHub Pages
   - Tempo: 10 minutos

📅 PASSO 5: Google Play Console     → AMANHÃ (30/09)
   - Submeter app
   - Tempo: 1-1.5 horas

📅 PASSO 6: Aguardar Análise        → DIAS 1-2 (01-02/10)
   - Google revisa
   - Tempo: 24-48 horas

🚀 PASSO 7: APP LIVE!               → DIA 3 (03/10)
   - Liberado na Play Store
   - Pessoas podem baixar!
```

---

## 🎯 AGORA: PASSOS 2, 3, 4 EM PARALELO

Você pode fazer tudo ao mesmo tempo (não precisa esperar um terminar para começar outro):

### ⏱️ Timeline Paralela

```
Tempo  │ Tarefa 1          │ Tarefa 2         │ Tarefa 3
────────────────────────────────────────────────────────
00:00  │ Iniciar screenshots│                  │
05:00  │ Screenshot 1-2    │ Iniciar ícone    │
10:00  │ Screenshot 3-4    │ CloudConvert...  │ Iniciar GitHub
15:00  │ Screenshot 5-6    │ Ícone salvo ✅   │ Criar repo
20:00  │ Screenshot 7-8    │                  │ Upload arquivos
25:00  │ Validar imagens ✅│                  │ Ativar Pages
30:00  │ Organizar pastas  │                  │ Testar URLs ✅
35:00  │ ✅ CONCLUÍDO      │ ✅ CONCLUÍDO     │ ✅ CONCLUÍDO
────────────────────────────────────────────────────────
```

**Total:** ~35 minutos para tudo (não 20+5+10=35)

---

## 📋 PASSO 2: Capturar Screenshots

**Guia Completo:** [PASSO_2_SCREENSHOTS.md](./PASSO_2_SCREENSHOTS.md)

### O que fazer em 20 minutos:

1. **Abrir emulador ou device Android**
   ```bash
   # Se usar Expo Go + device
   npm start
   # Escanear QR code
   ```

2. **Capturar 6-8 screenshots:**
   - Home
   - Diabetes Overview
   - Glicemia
   - Medicações
   - Refeições
   - Notas
   - Modal Adicionar
   - Ícone (home screen)

3. **Validar:**
   - ✅ 1080x1920 pixels (EXIGÊNCIA Google Play!)
   - ✅ Sem barra de status
   - ✅ Dados aparecem corretamente
   - ✅ Salvar em `screenshots/`

### 3 Opções para Capturar:
- **A:** Emulador Android (melhor)
- **B:** Device Android físico (bom)
- **C:** Appetize.io online (se não tem emulador)

→ **COMECE AGORA!** ⏳

---

## 🎨 PASSO 3: Converter Ícone

**Guia Completo:** [PASSO_3_ICONE.md](./PASSO_3_ICONE.md)

### O que fazer em 5 minutos:

1. **Converter `assets/icon.svg` → PNG 512x512**

2. **3 Opções (escolha 1):**
   - **A:** CloudConvert.com (RECOMENDADO - online, grátis, rápido)
   - **B:** ImageMagick (linha de comando)
   - **C:** GIMP (interface gráfica)

3. **Salvar como:** `assets/icon-512.png`

4. **Validar:**
   - ✅ Arquivo existe
   - ✅ Exatamente 512x512 pixels
   - ✅ Formato PNG
   - ✅ 50-200 KB de tamanho

### CloudConvert (Mais Fácil):
```
1. Vá para: https://cloudconvert.com/svg-to-png
2. Upload: assets/icon.svg
3. Configure: 512x512, PNG, quality 100
4. Converter
5. Download como: icon-512.png
6. Salvar em: assets/
```

→ **COMECE AGORA!** 🎨

---

## 📄 PASSO 4: Hostear Documentos

**Guia Completo:** [PASSO_4_HOSTEAR_DOCS.md](./PASSO_4_HOSTEAR_DOCS.md)

### O que fazer em 10 minutos:

1. **Criar repo GitHub: `levia-policies`**
   - Vá para: https://github.com/new
   - Nome: levia-policies
   - Visibilidade: PUBLIC (importante!)
   - Iniciar com README

2. **Upload 2 arquivos:**
   - PRIVACIDADE.md
   - TERMOS_SERVICO.md

3. **Ativar GitHub Pages:**
   - Settings → Pages
   - Source: Branch main
   - Save

4. **Copiar URLs públicas:**
   ```
   https://ferpa2505-art.github.io/levia-policies/PRIVACIDADE.md
   https://ferpa2505-art.github.io/levia-policies/TERMOS_SERVICO.md
   ```

5. **Testar no navegador:**
   - Acessar cada URL
   - Validar que abre ✅
   - Anotar as URLs

→ **COMECE AGORA!** 📄

---

## ✅ Checklist de Conclusão (Passos 2-4)

Quando terminar os 3 passos paralelos, marque:

### Passo 2: Screenshots
- [ ] 6-8 imagens capturadas
- [ ] Todas em `screenshots/`
- [ ] Nomes descritivos (01-home.png, 02-diabetes-overview.png, etc)
- [ ] Validado: 1080x1920 pixels
- [ ] Validado: sem barra de status
- [ ] Validado: dados aparecem

### Passo 3: Ícone
- [ ] Arquivo `assets/icon-512.png` criado
- [ ] Validado: 512x512 pixels
- [ ] Validado: PNG format
- [ ] Validado: 50-200 KB
- [ ] Validado: cores legíveis

### Passo 4: Documentos
- [ ] Repo `levia-policies` criado (PUBLIC)
- [ ] PRIVACIDADE.md uploadado
- [ ] TERMOS_SERVICO.md uploadado
- [ ] GitHub Pages ativado
- [ ] URLs públicas funcionando
- [ ] URLs anotadas em local seguro

---

## 📥 Arquivo AAB (Build - Já Pronto)

Seu APK está pronto para download!

```
Build ID:  145ef9b9-4893-4a46-a74a-2ed23c09f836
Status:    ✅ FINISHED
File:      levia-app-v0.1.0.aab (~60-80 MB)
Download:  https://expo.dev/artifacts/eas/mZDMWKKifACT6FhEKOw6p0GPWLGTtx1Qt72eANmLo4I.aab
```

**Amanhã você vai usar este AAB para submeter no Console.**

---

## 📅 AMANHÃ (30/09): Passo 5 - Google Play Console

**Quando terminar Passos 2-4:**

→ Vá para: [GUIA_PUBLICACAO_GOOGLE_PLAY.md](./GUIA_PUBLICACAO_GOOGLE_PLAY.md)

### Resumo do que fazer:

1. **Abrir Google Play Console**
   - https://play.google.com/console
   - Usar conta: FP Tech & Art (já criada)

2. **Criar novo app:**
   - Nome: "Leviã"
   - Categoria: "Saúde e Aptidão"
   - Idioma: Português (Brasil)

3. **Preencher informações:**
   - Descrição breve e completa
   - Screenshots (que você capturou)
   - Ícone (que você converteu)
   - URLs de privacidade/termos (que você hosteou)

4. **Upload do AAB:**
   - Arquivo: `levia-app-v0.1.0.aab`
   - Versão: 0.1.0

5. **Submeter para revisão:**
   - Clicar "Submit"
   - Google inicia análise (24-48h)

**Tempo:** ~1-1.5 horas

---

## 📞 Dúvidas?

Se ficar preso em algum passo:

1. **Screenshots:**
   - Vá para: [PASSO_2_SCREENSHOTS.md](./PASSO_2_SCREENSHOTS.md)
   - Seção: "Troubleshooting"

2. **Ícone:**
   - Vá para: [PASSO_3_ICONE.md](./PASSO_3_ICONE.md)
   - Seção: "Se der erro"

3. **Documentos:**
   - Vá para: [PASSO_4_HOSTEAR_DOCS.md](./PASSO_4_HOSTEAR_DOCS.md)
   - Seção: "Troubleshooting"

4. **Console:**
   - Vá para: [GUIA_PUBLICACAO_GOOGLE_PLAY.md](./GUIA_PUBLICACAO_GOOGLE_PLAY.md)
   - Tem 9 passos detalhados

---

## 🎯 TIMELINE TOTAL

```
HOJE (29/09):
  ✅ 15:43 - Build iniciado
  ✅ 16:43 - Build concluído
  ⏳ 17:30 - Você fazer Passos 2-4 (35 min)
  ⏳ 18:00 - Tudo pronto para submissão

AMANHÃ (30/09):
  ⏳ 09:00 - Passo 5: Google Play Console (1-1.5h)
  ⏳ 10:30 - App submetido para análise
  📊 Google revisa (24-48 horas)

PRÓXIMOS DIAS (01-02/10):
  📧 Email: "Your app is approved!"
  🚀 03/10 - APP LIVE NA PLAY STORE!
  🎉 Pessoas podem baixar!
```

---

## 📊 Recursos Importantes

| Documento | O que é | Link |
|-----------|---------|------|
| **Passo 2** | Screenshots guide | [PASSO_2_SCREENSHOTS.md](./PASSO_2_SCREENSHOTS.md) |
| **Passo 3** | Icon conversion | [PASSO_3_ICONE.md](./PASSO_3_ICONE.md) |
| **Passo 4** | Hosting docs | [PASSO_4_HOSTEAR_DOCS.md](./PASSO_4_HOSTEAR_DOCS.md) |
| **Passo 5** | Console submit | [GUIA_PUBLICACAO_GOOGLE_PLAY.md](./GUIA_PUBLICACAO_GOOGLE_PLAY.md) |
| **Build Info** | AAB download | [BUILD_EM_PROGRESSO.md](./BUILD_EM_PROGRESSO.md) |
| **Status** | Overview completo | [STATUS_GITHUB_PUBLICACAO.md](./STATUS_GITHUB_PUBLICACAO.md) |

---

## 🚀 Próxima Ação

**ESCOLHA UM PASSO E COMECE AGORA!**

Você pode fazer os 3 em paralelo:

1. ⏳ **PASSO 2:** Capturar screenshots
2. ⏳ **PASSO 3:** Converter ícone
3. ⏳ **PASSO 4:** Hostear documentos

**Tempo total:** ~35 minutos (todos juntos)

**Quando terminar:**
→ Volte aqui amanhã e faça o Passo 5!

---

**Status:** 🟢 Você está 50% do caminho! 
**Próximo grande marco:** APP LIVE NA PLAY STORE EM 3 DIAS! 🎉
