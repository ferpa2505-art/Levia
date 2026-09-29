# 🎯 PASSO 5: SUBMETER NO GOOGLE PLAY CONSOLE

**Data:** 30/09/2026 (AMANHÃ)
**Status:** 📋 READY WHEN YOU COME BACK
**Tempo:** ~1-1.5 horas
**Resultado:** App submetido para análise (24-48h)

---

## 📋 ANTES DE COMEÇAR

### Tenha em mãos:

```
✅ Build AAB:
   - Arquivo: levia-app-v0.1.0.aab
   - Download: https://expo.dev/artifacts/eas/mZDMWKKifACT6FhEKOw6p0GPWLGTtx1Qt72eANmLo4I.aab
   - Tamanho: ~60-80 MB

✅ Screenshots (8 imagens):
   - screenshots/01-home.png
   - screenshots/02-diabetes-overview.png
   - screenshots/03-glicemia.png
   - screenshots/04-medicacoes.png
   - screenshots/05-refeicoes.png
   - screenshots/06-notas.png
   - screenshots/07-adicionar-glicemia.png
   - screenshots/08-app-icon.png
   - Tamanho cada: 1080x1920 pixels

✅ Ícone:
   - Arquivo: assets/icon-512.png
   - Tamanho: 512x512 pixels

✅ URLs legais:
   - Privacidade: https://seu-username.github.io/levia-policies/PRIVACIDADE.md
   - Termos: https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md

✅ Informações do App:
   - Nome: Leviã
   - Package: com.levia.app
   - Versão: 0.1.0
```

---

## 🚀 PASSO A PASSO: GOOGLE PLAY CONSOLE

### PASSO 1: Acessar Google Play Console

1. **Abra navegador**
2. **Vá para:** https://play.google.com/console
3. **Faça login** com conta "FP Tech & Art"
4. **Você verá dashboard** com opção "Create app"

---

### PASSO 2: Criar Novo App

1. **Clique:** "Create app"

2. **Preencha informações básicas:**
   ```
   App name: Leviã
   Default language: Portuguese (Brazil) - Português (Brasil)
   App category: Health & Fitness (Saúde e Aptidão)
   App type: Free
   ```

3. **Declara:** "The app does not target children" (se aplicável)

4. **Clique:** "Create app"

5. **Aguarde** redirecionamento

---

### PASSO 3: Preencher Informações de Loja (Store Listing)

#### 3.1 Descrição Breve
```
Tamanho: até 50 caracteres
Sugestão: Gerencie seu diabetes com facilidade
```

#### 3.2 Descrição Completa
```
Tamanho: até 4.000 caracteres
Usar: Conteúdo de GUIA_PUBLICACAO_GOOGLE_PLAY.md (Seção: Descrição Completa)

Copie texto que já está pronto naquele arquivo!
```

#### 3.3 Gráficos

**Screenshots (6-8 imagens):**
1. Clique em "Screenshots"
2. Upload das 8 imagens:
   - 01-home.png
   - 02-diabetes-overview.png
   - 03-glicemia.png
   - 04-medicacoes.png
   - 05-refeicoes.png
   - 06-notas.png
   - 07-adicionar-glicemia.png
   - 08-app-icon.png
3. Google vai validar que são 1080x1920
4. Salvar

**Ícone:**
1. Clique em "Feature graphic" ou "App icon"
2. Upload: `assets/icon-512.png`
3. Google redimensiona automaticamente
4. Salvar

**Preview video (opcional):**
- Você pode pular (não obrigatório)
- Se tiver, pode adicionar

---

### PASSO 4: Conteúdo e Classificação

#### 4.1 Descrição de Teste
```
Tamanho: até 300 caracteres
Sugestão: 
"Um app de gerenciamento de diabetes com recursos para 
rastrear glicemia, medicações, refeições e notas. 
Teste a navegação entre as abas principais."
```

#### 4.2 Classificação Indicativa
1. Você pode pular ou preencher
2. Se preencher:
   - Classificação: "Livre" (PEGI 3) ou similar
   - Nenhum conteúdo violento/adulto

---

### PASSO 5: Configuração de Privacidade

#### 5.1 Privacy Policy URL
1. Campo: "Privacy policy"
2. Cole URL: https://seu-username.github.io/levia-policies/PRIVACIDADE.md
3. Valide URL (Google testa)

#### 5.2 Terms & Conditions
1. Campo: "Terms of service" (se tiver campo)
2. Cole URL: https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md
3. Valide URL

---

### PASSO 6: App Signing

Esta seção já vai estar pré-preenchida pelo EAS Build.

```
✅ Google Play App Signing: Habilitado (automático)
✅ Upload key: Gerenciado pelo Google
```

Não precisa mexer aqui!

---

### PASSO 7: Upload do AAB (Android App Bundle)

#### 7.1 Acessar Versões do App
1. Left menu → "Releases"
2. Clique em "Create new release"
3. Ambiente: "Production" (padrão)

#### 7.2 Upload AAB
1. Clique em "Upload AAB"
2. Selecione arquivo: `levia-app-v0.1.0.aab`
   - Pode fazer download de: https://expo.dev/artifacts/eas/mZDMWKKifACT6FhEKOw6p0GPWLGTtx1Qt72eANmLo4I.aab
   - Salve em local fácil (Desktop, Downloads, etc)
3. Google vai processar e validar
4. Vai aparecer:
   ```
   Version code: 1
   Version name: 0.1.0
   ```

#### 7.3 Aguarde Processamento
- Pode levar 1-2 minutos
- Google testa compatibilidade
- Se tudo OK: Status "Ready"

---

### PASSO 8: Release Notes (Notas de Lançamento)

```
Campo: "Release notes"
Tamanho: até 500 caracteres
Sugestão em português:

"Primeira versão do Leviã - App de gerenciamento de diabetes

Funcionalidades:
- Rastreamento de glicemia
- Registro de medicações
- Acompanhamento de refeições
- Notas e observações

Versão beta para testes. Seu feedback é valioso!"
```

---

### PASSO 9: Revisar e Submeter

#### 9.1 Checklist Final
- [ ] Versão AAB: ✅ Upload completo
- [ ] Screenshots: ✅ 6-8 imagens (1080x1920)
- [ ] Ícone: ✅ 512x512
- [ ] Descrição: ✅ Preenchida
- [ ] URL Privacidade: ✅ Válida
- [ ] URL Termos: ✅ Válida
- [ ] Classificação: ✅ Selecionada
- [ ] Release notes: ✅ Preenchidas

#### 9.2 Avisos Comuns (Você pode ignorar)
```
⚠️ "App uses permission X"
  → Aviso padrão, OK para saúde/medical apps

⚠️ "Consider adding video preview"
  → Opcional, não é bloqueador

⚠️ "Some countries require..."
  → Leia, mas provavelmente OK para você
```

#### 9.3 Submeter para Análise
1. **Clique:** "Submit for review" ou "Rollout"
2. **Confirmação:** "Are you sure?"
3. **Clique:** "Confirm"
4. **Status:** "Pending review"

---

### PASSO 10: Confirmar Submissão

Você deve ver:
```
Status: Pending review (Aguardando análise)
Submitted: [data/hora]
Estimated review time: 24-48 hours
```

**E-mail:** Google vai enviar email confirmando submissão

---

## ⏰ TIMELINE APÓS SUBMISSÃO

```
Tempo         Evento
─────────────────────────────────────────────
Agora         ✅ Submetido ao Google
+0-6h         📊 Google inicia análise
+6-24h        🔍 Validação automática
+24-48h       📧 Email: Aprovado! (esperado)
+48-72h       🚀 APP LIVE na Play Store!
─────────────────────────────────────────────
```

---

## ✅ O QUE VOCÊ VAI RECEBER

### Email do Google Play Console

```
Assunto: "[AppName] [Leviã] foi aprovado"

Conteúdo:
Your app Leviã has been approved and is now available 
on Google Play for users in most countries.

It may take a few hours for the app to appear in search 
results on Google Play Store.

View your app at: https://play.google.com/store/apps/details?id=com.levia.app
```

---

## 🐛 Se for REJEITADO (improvável, mas possível)

Google pode rejeitar se:

```
❌ APP CONTAINS MEDICAL CLAIMS
   → Solução: Garantir isenção de responsabilidade (já temos em TERMOS)

❌ INAPPROPRIATE CONTENT
   → Solução: Revisar descrição/screenshots

❌ BILLING/PAYMENT ISSUES
   → Solução: N/A (app é grátis)

❌ POLICY VIOLATION
   → Solução: Ver email com detalhes, corrigir, resubmeter
```

Se rejeitado:
1. **Email explicará por que**
2. **Você tenta novamente:** Corrige → Re-upload AAB → Resubmeter
3. **Normalmente segunda submissão é aprovada**

---

## 🎉 QUANDO APROVADO

### 1. Verificar na Play Store
```
1. Abra: https://play.google.com/store/apps/details?id=com.levia.app
2. Você deve ver seu app!
3. Pode instalar em device Android
```

### 2. Validar no Console
```
1. Google Play Console
2. Seu app
3. Status deve mudar para: "Active"
4. Pode ver estatísticas de downloads
```

### 3. Compartilhar Link
```
Seu app está em:
https://play.google.com/store/apps/details?id=com.levia.app

Pode compartilhar com amigos, família, beta testers!
```

---

## 📞 DÚVIDAS DURANTE SUBMISSÃO?

Verifique:
1. [GUIA_PUBLICACAO_GOOGLE_PLAY.md](./GUIA_PUBLICACAO_GOOGLE_PLAY.md) - Guia completo original
2. [ROTEIRO_COMPLETO_PUBLICACAO.md](./ROTEIRO_COMPLETO_PUBLICACAO.md) - Timeline e overview
3. Documentação oficial: https://support.google.com/googleplay/android-developer/

---

## 🎯 Checkpoint: Quando Voltar Amanhã

```
Morning (30/09):
  ☑️ Verificar que Passos 2-4 estão 100%
  ☑️ Validar com: node validate-publication-assets.js
  ☑️ Se validação = 100%, começar Passo 5

During Passo 5:
  ☑️ Acompanhar console status
  ☑️ Tirar screenshots de progresso
  ☑️ Documentar qualquer problema

After Submission:
  ☑️ Confirmar email de submissão
  ☑️ Aguardar 24-48h
  ☑️ Celebrar quando aprovar! 🎉
```

---

## 🚀 VOCÊ ESTÁ QUASE LÁ!

```
✅ Passo 1: Build        → CONCLUÍDO
⏳ Passo 2: Screenshots  → VOCÊ FAZ HOJE
⏳ Passo 3: Ícone        → VOCÊ FAZ HOJE
⏳ Passo 4: Docs         → VOCÊ FAZ HOJE
⏳ Passo 5: Console      → VOCÊ FAZ AMANHÃ
📊 Passo 6: Análise      → GOOGLE FAZ (24-48h)
🚀 Passo 7: LIVE!        → DIA 3!
```

Você consegue! 💪

---

**Volte aqui amanhã para Passo 5!** 📅
