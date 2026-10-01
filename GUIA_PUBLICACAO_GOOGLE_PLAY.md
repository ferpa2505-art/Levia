# 🚀 GUIA COMPLETO: PUBLICAR LEVIÃ NO GOOGLE PLAY CONSOLE

**Data:** 29/09/2026  
**App:** Leviã (Diabetes & Health Manager)  
**Conta:** FP Tech & Art "ferpa2505-Art"  
**Status:** Preparação para publicação  

---

## 📋 CHECKLIST PRÉ-PUBLICAÇÃO

### ✅ 1. VERIFICAÇÕES TÉCNICAS

- [ ] **app.json está correto:**
  - ✅ name: "Leviã"
  - ✅ slug: "levia-app"
  - ✅ package: "com.levia.app"
  - ✅ version: "0.1.0"

- [ ] **Dependências instaladas:**
  ```bash
  npm install  # ✅ Pronto
  ```

- [ ] **TypeScript sem erros:**
  ```bash
  npx tsc --noEmit  # A fazer
  ```

- [ ] **Build local testado:**
  ```bash
  npm start   # ✅ Funcionando
  ```

---

## 📱 PASSO 1: BUILD PARA ANDROID (APK/AAB)

### Opção A: EAS Build (Recomendado - Cloud)
```bash
# 1. Instalar CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Vincular projeto
eas build:configure

# 4. Build para Android (APK)
eas build --platform android --type apk

# 5. Ou build para Android (AAB - recomendado)
eas build --platform android --type app-bundle
```

### Opção B: Build Local (Mais rápido, requer Android SDK)
```bash
# Build APK
npx expo prebuild --clean --platform android
cd android && ./gradlew assembleRelease
```

### Status Atual:
- [ ] EAS CLI instalado
- [ ] Projeto vinculado ao EAS
- [ ] Build gerado (APK ou AAB)

---

## 🔑 PASSO 2: CONFIGURAR CHAVE DE ASSINATURA

### Importante para Google Play:
Google Play requer que todos os APKs sejam assinados com a **mesma chave privada**.

```bash
# Se usar EAS:
# EAS gerencia automaticamente a chave
eas build:configure --platform android

# Se usar local:
# Você precisa gerar ou reutilizar uma chave
keytool -genkey -v -keystore levia-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias levia-key
```

### No Google Play Console:
1. Você **NÃO** precisa fazer nada aqui no início
2. Google Play registrará seu certificado automaticamente
3. Nunca perca sua chave privada!

---

## 📝 PASSO 3: INFORMAÇÕES DO APP (Google Play Console)

### 3.1 Criar novo app

1. Clique em **"Criar app"** (como mostra sua screenshot)
2. Preencha:
   - **Nome do app:** Leviã
   - **Idioma padrão:** Português (Brasil)
   - **Tipo:** Aplicativo
   - **Categoria:** Saúde e bem-estar / Médico
   - **Contato de emergência:** Seu email

### 3.2 Informações Básicas

**Nome do app:**
- Leviã (ou "LEVIA - Health Manager")

**Descrição curta (80 caracteres):**
```
Gerencie seu diabetes com facilidade
```

**Descrição completa (4.000 caracteres):**
```
Leviã é o seu assistente pessoal de saúde, especialmente 
projetado para gerenciar diabetes com facilidade.

FUNCIONALIDADES:
✓ Rastreamento de glicemia em tempo real
✓ Registro de medicações e dosagens
✓ Controle de refeições e carboidratos
✓ Notas e observações pessoais
✓ Interface intuitiva e responsiva
✓ Suporte a múltiplos idiomas
✓ Sincronização automática de dados

Por que escolher Leviã?
- Simples e direto: sem complicações
- Rápido: adicione dados em poucos segundos
- Seguro: seus dados permanecem no seu dispositivo
- Aberto: pronto para feedback e melhorias

Nota: Leviã é uma ferramenta de assistência, não substitui 
consulta médica profissional.
```

---

## 🖼️ PASSO 4: IMAGENS E SCREENSHOTS

### Requisitos de imagem:
```
Tamanho: 1080x1920 px (9:16 aspect ratio)
Formato: PNG ou JPEG
Quantidade: Mínimo 2, máximo 8 screenshots
```

### Sugestão de screenshots:
1. **Tela inicial (Home)** - mostrando card Diabetes
2. **Tela Diabetes** - visão geral com 4 seções
3. **Adicionar glicemia** - exemplo com dados
4. **Histórico de medicações** - mostrando funcionalidade
5. **Refeições registradas** - demonstrando controle
6. **Notas pessoais** - feature de observações

### Ícone do app:
```
Tamanho: 512x512 px
Formato: PNG ou JPEG
Descrição: Logo/ícone representando saúde/diabetes
```

**Status:** Você precisa gerar screenshots do app (vou criar script depois)

---

## ⚖️ PASSO 5: CONFORMIDADE E POLÍTICAS

### 5.1 Política de Privacidade (OBRIGATÓRIO)

Você DEVE ter uma política de privacidade porque:
- ✅ App trata dados de saúde (sensível)
- ✅ Coleta dados pessoais
- ✅ Google Play exige

**Modelo básico:**

```markdown
# Política de Privacidade - Leviã

Última atualização: 29/09/2026

## 1. Coleta de Dados
Leviã coleta os seguintes dados:
- Leituras de glicemia
- Medicações e dosagens
- Histórico de refeições
- Notas pessoais

## 2. Como Usamos os Dados
Usamos esses dados apenas para:
- Exibir seu histórico
- Sincronizar entre dispositivos
- Melhorar a interface

## 3. Armazenamento
- Dados armazenados localmente no seu dispositivo
- Opcional: sincronização via nuvem (quando implementado)
- Nunca vendemos dados a terceiros

## 4. Segurança
- Dados criptografados em trânsito
- Sem compartilhamento com terceiros

## 5. Contato
Para questões de privacidade: [seu email]
```

**Publicar em:** seu website ou criar página simples

### 5.2 Termos de Serviço

```markdown
# Termos de Serviço - Leviã

## Isenção de Responsabilidade
Leviã é uma ferramenta de ASSISTÊNCIA, não substitui:
- Consulta médica profissional
- Diagnóstico de um médico
- Tratamento prescrito

## Limitações
- O usuário é responsável pela precisão dos dados
- Leviã não garante precisão médica
- Use como complemento ao acompanhamento profissional

## Licença
O software é fornecido "como está" sem garantias
```

### 5.3 Classificação de Conteúdo

No Google Play Console, você responderá:
- **Dados pessoais coletados?** SIM (saúde)
- **Publicidade?** NÃO
- **Conteúdo sensível?** SIM (dados de saúde)
- **Permissões?** Câmera (opcional), armazenamento

---

## 🔐 PASSO 6: PERMISSÕES NECESSÁRIAS

No `app.json`, você precisa declarar:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-notifications",
      [
        "expo-permissions",
        {
          "permissions": [
            "CAMERA",
            "CAMERA_ROLL"
          ]
        }
      ]
    ]
  }
}
```

**Permissões do Android (automático via Expo):**
- INTERNET ✅
- READ_EXTERNAL_STORAGE (se sincronizar)
- WRITE_EXTERNAL_STORAGE (se sincronizar)

---

## 🧪 PASSO 7: TESTES PRÉ-SUBMISSÃO

### Testes obrigatórios:
```bash
# 1. Compilação
npm run build  # ou eas build

# 2. TypeScript
npx tsc --noEmit

# 3. Testes
npm test

# 4. Lint
npm run lint  # se existir
```

### Testes manuais no Android:
- [ ] App inicia sem crashes
- [ ] Diabetes module aparece (Passo 2-13 do guia anterior)
- [ ] Todos os dados salvam corretamente
- [ ] Navegação funciona
- [ ] Idiomas português/inglês funcionam
- [ ] Design responsivo em diferentes tamanhos

---

## 📊 PASSO 8: PREÇO E DISTRIBUIÇÃO

### Monetização:
```
☑️ Grátis (recomendado para MVP/feedback)
☐ Pago (ex: R$ 9,99)
☐ In-App Purchases (premium features)
```

### Distribuição:
```
☑️ Disponível globalmente
☑️ Seleção de países (opcional)
```

### Recomendação para você:
**GRÁTIS** - Seu objetivo é feedback, não lucro neste momento

---

## 📤 PASSO 9: SUBMETER PARA ANÁLISE

### Na página do app no Google Play Console:

1. **Produção** → **Versões** → **Criar versão**
2. Upload do APK/AAB gerado
3. Preencher:
   - Notas de versão (ex: "Versão inicial com módulo Diabetes")
   - Informações de privacidade
   - Classificação etária
4. **Revisar** (Google analisa em 1-4 horas geralmente)
5. **Publicar**

### Tempo de análise:
- Primeira submissão: 24-48 horas (mais rigorosa)
- Atualizações: 1-4 horas
- Razões comuns de rejeição: Política de privacidade faltando, permissões não justificadas

---

## ✅ CHECKLIST DE SUBMISSÃO FINAL

Antes de clicar "Publicar":

- [ ] APK/AAB compilado e testado
- [ ] Nome do app: Leviã ✅
- [ ] Descrição preenchida ✅
- [ ] 2-8 screenshots enviados
- [ ] Ícone 512x512 enviado
- [ ] Política de privacidade link fornecido
- [ ] Termos de serviço preenchidos
- [ ] Classificação de conteúdo respondida
- [ ] Categoria: Saúde/Médico ✅
- [ ] Preço: Grátis ✅
- [ ] Testes finais passaram
- [ ] Nenhuma biblioteca proibida
- [ ] Sem hardcoded URLs sensíveis

---

## ⚠️ AVISOS IMPORTANTES

### 1. HIPAA/PRIVACIDADE (USA)
Se você trata dados de saúde de usuários USA:
- Pode precisar de conformidade HIPAA
- Recomendado: consultar advogado especializado
- Para MVP: adicione aviso de não-conformidade

### 2. GDPR (Europa)
Se europeus usarem:
- Precisa de consentimento explícito
- Direito de deletar dados
- Política de privacidade clara em várias línguas

### 3. BRASIL
- Compliance com Lei Geral de Proteção de Dados (LGPD)
- Consentimento do usuário necessário
- Dados sensíveis (saúde) precisam proteção extra

### Recomendação:
Adicione avisos claros no app:
```
"Leviã é uma ferramenta de ASSISTÊNCIA.
Não substitui consulta médica profissional.
Sempre consulte um médico para decisões de saúde."
```

---

## 🔄 PRÓXIMAS ATUALIZAÇÕES

Após publicação inicial (v0.1.0):

```
v0.2.0 (Semana 1-2)
- [ ] Feedback dos usuários
- [ ] Correções de bugs
- [ ] Melhorias de UI

v0.3.0 (Semana 3-4)
- [ ] Gráficos de tendência
- [ ] Notificações/Lembretes
- [ ] Exportar dados (CSV/PDF)

v0.4.0 (Mês 2)
- [ ] AsyncStorage persistence
- [ ] Backup na nuvem
- [ ] Integração com Wearables
```

---

## 📞 SUPORTE E CONTATO

### Configurar email de suporte:

1. Google Play Console → Configurações
2. Adicionar email de suporte (seu email)
3. Responder usuários rapidamente (aumenta rating)

### Monitorar:
- ⭐ Reviews (importante para feedback)
- 📊 Estatísticas (downloads, crashes)
- 🐛 Relatórios de bugs

---

## 🎯 RESUMO DOS PRÓXIMOS PASSOS

```
HOJE (29/09):
1. ✅ Preparar arquivos de build
2. ✅ Criar screenshots
3. ✅ Escrever Política de Privacidade
4. ✅ Escrever Termos de Serviço

AMANHÃ (30/09):
5. ✅ Gerar APK/AAB
6. ✅ Testar no device
7. ✅ Submeter no Google Play

APÓS PUBLICAÇÃO:
8. ✅ Monitorar reviews
9. ✅ Corrigir bugs reportados
10. ✅ Publicar atualizações
```

---

**Pronto para começar? Vamos iniciar pelo Passo 1! 🚀**

Próximas ações:
1. Gerar build Android
2. Criar screenshots
3. Escrever política de privacidade
4. Submeter no console
