# 📱 FLUXO VISUAL: PUBLICAR LEVIÃ NO GOOGLE PLAY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         JORNADA DE PUBLICAÇÃO                                 ║
║                    Google Play Console - LEVIÃ v0.1.0                         ║
║                  Status: 🔄 PREPARAÇÃO (18% completo)                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 VISÃO GERAL DO PROCESSO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  HOJE (29/09)                  AMANHÃ (30/09)          DIAS 1-3          │
│  ────────────                  ──────────────          ────────          │
│                                                                           │
│  📦 BUILD ANDROID    →    📋 DOCUMENTAÇÃO      →   🚀 PUBLICADO         │
│  📸 SCREENSHOTS           📝 PREENCHIMENTO             ✅ LIVE          │
│  🎨 ÍCONE DO APP          ⬆️ UPLOAD AAB               📊 ANALYTICS     │
│                                                                           │
│  ⏱️  20-30 min       ⏱️  30-45 min              ⏱️  24-48h análise     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DETALHAMENTO POR FASE

### **FASE 1️⃣ : BUILD ANDROID** (29/09 - HOJE)

```
        ┌─────────────────────────────────┐
        │    GERAR BUILD ANDROID          │
        └─────────────────────────────────┘
                        ↓
        ┌─────────────────────────────────┐
        │  Option A: EAS Build (Cloud)   │
        │  ✅ Recomendado (sem Android SDK)│
        │  Tempo: 20-30 minutos            │
        │                                   │
        │  $ eas build --platform android  │
        │    --type app-bundle             │
        └─────────────────────────────────┘
                        ↓
        ┌─────────────────────────────────┐
        │  Output: levia-v0.1.0.aab       │
        │  Tamanho: ~60-80 MB             │
        │  Pronto: ✅ Para upload         │
        └─────────────────────────────────┘
```

**O QUE FAZER AGORA:**
```bash
# Passo 1: Vincular projeto ao EAS (se necessário)
eas build:configure --platform android

# Passo 2: Gerar build para Android
eas build --platform android --type app-bundle

# Passo 3: Aguardar conclusão (você receberá email)
# Verifique: https://eas.expo.dev/ (seu console EAS)
```

**Paralelo: Preparar SCREENSHOTS** (durante o build)

```
1. Abrir app em emulador Android
   $ npx expo prebuild --clean --platform android
   (OU)
   Usar seu device Android + USB debugging

2. Navegar para cada tela:
   ✓ Home (mostrando card Diabetes)
   ✓ Diabetes overview
   ✓ Adicionar glicemia
   ✓ Histórico medicações
   ✓ Refeições
   ✓ Notas

3. Tirar screenshot de cada (Print Screen)
   - Mínimo 2, Máximo 8
   - Tamanho: 1080x1920 px
   - Formato: PNG ou JPEG
   - Salvar em: screenshots/

4. Criar/Usar ícone do app
   - Tamanho: 512x512 px
   - Design: Logo/mascote saúde
   - Se não tiver: Usar Lucide icon
```

---

### **FASE 2️⃣ : DOCUMENTAÇÃO** (29/09 - HOJE/AMANHÃ)

```
        ┌─────────────────────────────────┐
        │  DOCUMENTOS JÁ PREPARADOS ✅    │
        │                                  │
        │  ✅ PRIVACIDADE.md              │
        │  ✅ TERMOS_SERVICO.md           │
        │  ✅ GUIA_PUBLICACAO...md        │
        │  ✅ CHECKLIST_PUBLICACAO.txt    │
        └─────────────────────────────────┘
                        ↓
        ┌─────────────────────────────────┐
        │  PRÓXIMO PASSO:                  │
        │  HOSPEDAR ONLINE                │
        │                                  │
        │  Local sugerido:                │
        │  seu-site.com/privacidade       │
        │  seu-site.com/termos            │
        │                                  │
        │  Tempo: 10-15 minutos           │
        └─────────────────────────────────┘
                        ↓
        ┌─────────────────────────────────┐
        │  URL's para copiar no console:  │
        │                                  │
        │  https://seu-site.com/          │
        │           privacidade           │
        │  https://seu-site.com/          │
        │           termos                │
        └─────────────────────────────────┘
```

**Onde Hospedar (Opções):**

```
┌──────────────────────────────────────────────────────────────┐
│ OPÇÃO 1: GitHub Pages (GRÁTIS, Recomendado)                 │
├──────────────────────────────────────────────────────────────┤
│ 1. Criar repo público: seu-usuario/privacy-docs             │
│ 2. Copiar PRIVACIDADE.md para README.md                      │
│ 3. Habilitar GitHub Pages (Settings → Pages)               │
│ 4. URL: https://seu-usuario.github.io/privacy-docs/        │
│ 5. Tempo: 5 minutos                                         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ OPÇÃO 2: Seu Website Pessoal (se tiver)                     │
├──────────────────────────────────────────────────────────────┤
│ 1. Criar página /privacidade e /termos                     │
│ 2. Copiar conteúdo dos .md                                  │
│ 3. URL: seu-site.com/privacidade                           │
│ 4. Tempo: 5-10 minutos                                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ OPÇÃO 3: Notion, Medium ou similar (RÁPIDO)                │
├──────────────────────────────────────────────────────────────┤
│ 1. Criar página pública em Notion/Medium                    │
│ 2. Copiar conteúdo                                         │
│ 3. Gerar URL pública compartilhável                         │
│ 4. Tempo: 3-5 minutos                                      │
└──────────────────────────────────────────────────────────────┘
```

---

### **FASE 3️⃣ : GOOGLE PLAY CONSOLE** (30/09 - AMANHÃ)

```
        ┌──────────────────────────────────┐
        │  ACESSAR CONSOLE                 │
        │  https://play.google.com/console │
        │  (Conta: ferpa2505-Art)          │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  1. CRIAR APP                    │
        │     └─ Nome: Leviã               │
        │     └─ Tipo: Aplicativo          │
        │     └─ Idioma: Português Brasil  │
        │     └─ Categoria: Saúde/Médico   │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  2. PREENCHER INFORMAÇÕES        │
        │     └─ Descrição curta (80 chars)│
        │     └─ Descrição longa (4000)    │
        │     └─ Ícone 512x512            │
        │     └─ Screenshots (2-8)         │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  3. POLÍTICAS & PRIVACIDADE      │
        │     └─ Link privacidade         │
        │     └─ Link termos              │
        │     └─ Classificação conteúdo   │
        │     └─ Faixa etária             │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  4. PREÇO & DISTRIBUIÇÃO         │
        │     └─ GRÁTIS                   │
        │     └─ Disponível globalmente    │
        └──────────────────────────────────┘
```

**Descrição Sugerida para Console:**

```
TÍTULO: Leviã - Diabetes Manager

DESCRIÇÃO CURTA (80 chars):
"Gerencie seu diabetes com facilidade"

DESCRIÇÃO LONGA (4000 chars):
"Leviã é seu assistente pessoal de saúde para gerenciar diabetes.

✓ Rastreamento de glicemia em tempo real
✓ Registro de medicações e dosagens
✓ Controle de refeições e carboidratos
✓ Notas pessoais e observações
✓ Interface simples e intuitiva
✓ Múltiplos idiomas suportados
✓ Dados privados - armazenados localmente

Por que Leviã?
- Simples: sem complicações desnecessárias
- Rápido: adicione dados em segundos
- Seguro: seus dados são seus
- Aberto: feedback é bem-vindo

⚠️ IMPORTANTE: Leviã é uma ferramenta de ASSISTÊNCIA.
Não substitui consulta médica profissional. Sempre
consulte seu médico para decisões de saúde."
```

---

### **FASE 4️⃣ : UPLOAD & SUBMISSÃO** (30/09)

```
        ┌──────────────────────────────────┐
        │  Produção → Versões              │
        │  → Criar versão                  │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  Upload do arquivo:              │
        │  levia-v0.1.0.aab                │
        │                                   │
        │  (arquivo gerado pelo EAS build)  │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  Preencher notas de versão:      │
        │  "Versão inicial com módulo     │
        │   Diabetes completo"             │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  REVISAR TUDO (checklist final)  │
        │                                   │
        │  ✓ Nome correto                 │
        │  ✓ Descrição completa            │
        │  ✓ Screenshots em ordem          │
        │  ✓ Ícone aprovado               │
        │  ✓ Privacidade linkada          │
        │  ✓ Termos linkados              │
        │  ✓ Sem permissões desnecessárias│
        │  ✓ AAB valido                   │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  🎯 PUBLICAR                     │
        │                                   │
        │  Clique: "Submeter para análise" │
        └──────────────────────────────────┘
```

---

### **FASE 5️⃣ : ANÁLISE DO GOOGLE** (1-4 dias)

```
        ┌──────────────────────────────────┐
        │  Google analisa sua submissão    │
        │                                   │
        │  Verifica:                       │
        │  ✓ Código malicioso              │
        │  ✓ Permissões apropriadas        │
        │  ✓ Política de privacidade       │
        │  ✓ Sem publicidade enganosa      │
        │  ✓ Conformidade com leis         │
        │  ✓ Isenção médica clara          │
        │                                   │
        │  Tempo: 24-48h (primeira vez)    │
        │         1-4h (atualizações)      │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  RESULTADO:                      │
        │                                   │
        │  ✅ APROVADO                     │
        │     └─ Publicar automático       │
        │     └─ URL gerada               │
        │                                   │
        │  ❌ REJEITADO                    │
        │     └─ Google envia feedback     │
        │     └─ Corrigir e reenviar      │
        │     └─ Reanalisar (rápido)     │
        └──────────────────────────────────┘
```

**Motivos Comuns de Rejeição:**

```
🔴 CRÍTICOS (Impedem publicação):
   - Política de privacidade faltando/vaga
   - Permissões sem justificativa
   - Código malicioso detectado
   - Violação de política Google Play

🟠 COMUNS (Fáceis de corrigir):
   - Isenção médica não clara
   - Screenshots inadequadas
   - Descrição incompleta
   - Ícone muito pequeno/baixa qualidade

🟡 RAROS (Se houver):
   - Usar dados pessoais sem consentimento
   - Publicidade enganosa
   - Violação de direitos autorais
```

**Se Rejeitado: Fluxo de Correção**

```
Reject Email recebido
         ↓
Ler feedback Google com atenção
         ↓
Corrigir problema identificado
         ↓
Incrementar versão (0.1.1)
         ↓
Upload novo AAB
         ↓
Reenviar para análise
         ↓
Análise (1-4 horas)
         ↓
✅ Aprovado → Publicar
```

---

### **FASE 6️⃣ : 🚀 PUBLICADO NO PLAY STORE**

```
        ┌──────────────────────────────────┐
        │  ✅ APP PUBLICADO!               │
        │                                   │
        │  URL:                            │
        │  play.google.com/store/apps/     │
        │    details?id=com.levia.app      │
        │                                   │
        │  Status: LIVE                    │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  COMPARTILHAR:                   │
        │                                   │
        │  📱 Link para amigos              │
        │  📝 Post redes sociais           │
        │  📧 Email para lista contatos    │
        │  💬 Fóruns/comunidades diabetes  │
        └──────────────────────────────────┘
                        ↓
        ┌──────────────────────────────────┐
        │  MONITORAR:                      │
        │                                   │
        │  📊 Downloads                    │
        │  ⭐ Ratings & Reviews            │
        │  🐛 Crash Reports                │
        │  💬 Feedback usuários            │
        │  📈 Analytics                    │
        └──────────────────────────────────┘
```

---

## ⏱️ TIMELINE CONSOLIDADA

```
═════════════════════════════════════════════════════════════════════════

DATA          ATIVIDADE                              TEMPO    STATUS
────────────────────────────────────────────────────────────────────────

29/09 HOJE

13:30-14:00   Preparação de documentação             30 min   ✅ FEITO
              - Política privacidade
              - Termos de serviço
              - Guia publicação

14:00-14:30   Build Android (EAS)                    30 min   ⏳ PRÓXIMO
              - eas build --platform android
              - Aguardar conclusão

14:30-15:15   Preparar Screenshots                   45 min   ⏳ PRÓXIMO
              - 6-8 imagens 1080x1920
              - Ícone 512x512

15:15-15:30   Hospedar documentação online           15 min   ⏳ PRÓXIMO
              - GitHub Pages ou website
              - Obter URLs

────────────────────────────────────────────────────────────────────────

30/09 AMANHÃ

09:00-09:45   Preencher Google Play Console          45 min   ⏳ PENDENTE
              - Nome, descrição
              - Screenshots, ícone
              - Políticas

09:45-10:00   Classificação & permissões             15 min   ⏳ PENDENTE
              - Grupo etário
              - Conformidade

10:00-10:10   Upload AAB gerado                      10 min   ⏳ PENDENTE
              - Validação automática

10:10-10:15   SUBMETER PARA ANÁLISE                  5 min    ⏳ PENDENTE
              - Clique: "Publicar"

────────────────────────────────────────────────────────────────────────

01-03/10

24-48h        Análise automática Google Play         [espera] ⏳ PENDENTE
              - Segurança
              - Política
              - Conformidade

[+48h]-[+96h] Se aprovado: PUBLICADO! 🚀            [espera] ⏳ PENDENTE
              Se rejeitado: Corrigir & reenviar

────────────────────────────────────────────────────────────────────────

TOTAL:        Trabalho manual: ~2-3 horas
              Com análise: ~2-3 dias

═════════════════════════════════════════════════════════════════════════
```

---

## 🎯 COMANDO PARA COMEÇAR AGORA

```bash
# PASSO 1: Vincular projeto ao EAS (se necessário)
eas build:configure --platform android

# PASSO 2: Iniciar build Android
eas build --platform android --type app-bundle

# PASSO 3: Monitorar progresso
# Acesse: https://eas.expo.dev/
# Ou espere email com link para download

# PASSO 4: Enquanto aguarda, prepare screenshots
# Abra app em emulador/device
# Tire screenshots das 6-8 telas principais
```

---

## 📋 CHECKLIST DE HOJE

```
[ ] Executar: eas build --platform android --type app-bundle
[ ] Capturar 6-8 screenshots (1080x1920)
[ ] Criar/preparar ícone (512x512)
[ ] Hostear PRIVACIDADE.md em URL pública
[ ] Hostear TERMOS_SERVICO.md em URL pública

TEMPO ESTIMADO: 1,5-2 horas total
```

---

## 📞 SUPORTE DURANTE PROCESSO

Se encontrar problemas:

```
1. Build falha:
   └─ Ver logs em: https://eas.expo.dev/
   └─ Comum: Android SDK versão
   └─ Solução: Verificar app.json minSdkVersion

2. Rejeição Google Play:
   └─ Ler email com motivo específico
   └─ Corrigir conforme feedback
   └─ Reenviar (processo rápido)

3. Screenshots inadequadas:
   └─ Reenviar novas imagens
   └─ Não precisa reenviar todo o AAB

4. Dúvidas legais:
   └─ Política privacidade já cobre 99%
   └─ Isenção médica está clara
   └─ Consultar advogado se tiver dúvida
```

---

**Pronto? Vamos começar o build!** 🚀

Próximo comando:
```bash
eas build --platform android --type app-bundle
```

*Atualizado: 29/09/2026 - Status: 18% completo (documentação), aguardando build*
