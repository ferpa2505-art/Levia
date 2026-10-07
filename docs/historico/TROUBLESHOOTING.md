# 🔧 Troubleshooting - LEVIA App

Soluções para problemas comuns durante desenvolvimento e testes.

---

## 📱 Problemas com Expo Go

### Problema: "Cannot connect to Metro Bundler"
**Causa**: Metro bundler não está rodando ou em porta diferente

**Solução**:
```bash
# No terminal, verificar se Metro está rodando
# Você deve ver: "Waiting for a connection from Expo..."

# Se não estiver rodando:
npm start --clear

# Esperar até aparecer o QR code
# Escanear QR code com Expo Go
```

### Problema: "Module not found: @services/googleVisionService"
**Causa**: Path alias não está funcionando

**Solução**:
1. Verificar `tsconfig.json` tem `"@services/*": ["src/services/*"]`
2. Reiniciar Metro:
   ```bash
   npm start --clear
   ```

### Problema: Hot-reload não funciona
**Causa**: Arquivo com erro de sintaxe está bloqueando reload

**Solução**:
1. Verificar o erro no terminal
2. Corrigir o arquivo
3. Se não melhorar, reiniciar:
   ```bash
   npm start --clear
   ```

---

## 🎥 Problemas com Câmera

### Problema: Câmera não abre, fica em branco
**Causa**: Permissão de câmera não foi concedida

**Solução**:
```
iOS:
1. Settings → Expo Go → Camera → Allow

Android:
1. Settings → Apps → Expo Go → Permissions → Camera → Allow
2. Reiniciar Expo Go
```

### Problema: "Cannot find native ExpoCamera module"
**Causa**: Módulo nativo não foi compilado

**Solução**:
```bash
# Limpar cache e reconstruir
npm install
npm start --clear

# Se estiver em device real:
# - Android: Usar APK ou AAB (não Expo Go)
# - iOS: Usar TestFlight (não Expo Go)
```

### Problema: Foto fica de cabeça para baixo
**Esperado** - Alguns dispositivos Android têm esse comportamento em Expo Go
- Será corrigido no build final (APK/AAB)

---

## 📸 Problemas com Food Recognition

### Problema: Análise sempre mostra "Alimento Desconhecido"
**Esperado** - Sistema está usando mock database
- Isso é normal no MVP
- Google Vision API real será ativado com API key

### Problema: "Cannot analyze image - failed to load"
**Causa**: Google Vision API retornou erro

**Solução**:
1. Verificar conexão WiFi
2. Verificar Google Vision API key está válida (se configurada)
3. App faz fallback automático para mock database

### Problema: Imagem não aparece após captura
**Causa**: Arquivo de foto não foi salvo corretamente

**Solução**:
1. Verificar permissão de armazenamento
2. Tentar tirar foto novamente
3. Reiniciar app

---

## 💳 Problemas com Payment System

### Problema: Paywall não abre ao clicar Premium
**Causa**: SubscriptionProvider não está nas props corretas

**Solução**:
1. Verificar `app/_layout.tsx` tem `<SubscriptionProvider>` wrappando o app
2. Reiniciar app: `npm start --clear`

### Problema: "RevenueCat SDK initialization failed"
**Esperado** - Placeholder API key não é válida
- Sistema faz fallback para mock purchase flow
- Será corrigido quando API key real for adicionada

### Problema: Botão de "Assinar" não responde
**Causa**: Promise da compra está pendendo

**Solução**:
1. Esperar 3-5 segundos (mock flow tem delay)
2. Se não funcionar, reiniciar app

---

## 🔔 Problemas com Alarmes

### Problema: Notificações não aparecem
**Causa**: Notificações desativadas no telefone ou app

**Solução**:
```
1. Verificar permissão no telefone:
   iOS: Settings → Notifications → Expo Go
   Android: Settings → Apps → Expo Go → Notifications

2. Verificar na tela de alarme se "Notificações" está ativado

3. Reiniciar app
```

### Problema: "Cannot schedule notification - invalid trigger"
**Causa**: Configuração de alarme está inválida

**Solução**:
1. Verificar que frequência foi selecionada
2. Verificar que pelo menos um horário existe
3. Tentar novamente

---

## 🌍 Problemas com Tradução

### Problema: Textos aparecem como "abas.diabetes" ao invés de "Diabetes"
**Causa**: Chave de tradução não foi encontrada

**Solução**:
1. Verificar arquivo `src/i18n/traducoes/pt-BR.ts` tem `"abas.diabetes": "Diabetes"`
2. Verificar useT() está importado corretamente
3. Reiniciar app: `npm start --clear`

### Problema: Idioma não muda ao selecionar no menu
**Causa**: PreferencesContext não está rodando

**Solução**:
1. Verificar `app/_layout.tsx` tem `<PreferencesProvider>`
2. Reiniciar app

### Problema: Um idioma está vazio/com chaves de other language
**Causa**: Arquivo de tradução corrompido ou incompleto

**Solução**:
1. Verificar arquivo `src/i18n/traducoes/[idioma].ts`
2. Comparar com `pt-BR.ts` para garantir mesmas chaves
3. Se arquivo está muito diferente, regenerar com script

---

## 🐛 Problemas TypeScript

### Problema: "Cannot find module '@services/googleVisionService'"
**Causa**: Path alias não configurado

**Solução**:
1. Verificar `tsconfig.json`:
   ```json
   "paths": {
     "@services/*": ["src/services/*"]
   }
   ```
2. Verificar arquivo existe em `src/services/googleVisionService.ts`
3. Reiniciar Metro: `npm start --clear`

### Problema: "Type 'Promise<...>' is not assignable"
**Não bloqueia app** - Apenas warning de TypeScript
- Não impede que app rode
- Pode ser ignorado para MVP

### Problema: "'analysis.confianca' is possibly 'undefined'"
**Solução já aplicada** - Usar nullish coalescing: `analysis.confianca ?? 0.75`

---

## 🏗️ Problemas de Build

### Problema: "eas build failed"
**Causa**: Dependências faltando ou conflitando

**Solução**:
```bash
# Limpar e reinstalar
rm -rf node_modules
npm install

# Tentar build novamente
eas build --platform android --type app-bundle
```

### Problema: "Expo SDK 50+ required"
**Causa**: Versão do Expo desatualizada

**Solução**:
```bash
npm install expo@latest
npm install expo-camera expo-notifications expo-file-system --latest
npm start --clear
```

---

## 📊 Problemas com Dados/Contexto

### Problema: Dados de diabetes não persistem após fechar app
**Esperado** - MVP usa mock data (não persiste para verdade)
- Implementar AsyncStorage em v0.2

### Problema: RegistroMedicacao.tipo mostra erro TypeScript
**Solução**:
```typescript
// Certifique que está usando:
import { RegistroMedicacao } from '@types/diabetes';

// E preenchendo tipo corretamente:
tipo: 'insulina' | 'diabetes-tratamento' | 'outro'
```

---

## 🚨 Problemas Críticos

### Problema: "App keeps crashing on startup"
**Diagnóstico**:
1. Verificar erro no terminal do Metro
2. Procurar por "Cannot find module" ou "TypeError"
3. Procurar em qual arquivo ocorre

**Solução genérica**:
```bash
# Reset completo
npm start --clear

# Se não funcionar:
rm -rf node_modules package-lock.json
npm install
npm start --clear
```

### Problema: "Cannot read property of undefined at startup"
**Causa comum**: DiabetesContext não está inicializado

**Solução**:
1. Verificar `app/_layout.tsx` tem `<DiabetesProvider>`
2. Verificar `useDiabetes()` é chamado apenas dentro de componentes envolvidos por provider
3. Adicionar null checks: `const { glicemias } = useDiabetes() ?? {}`

---

## 📞 Contato e Recursos

**Documentação**:
- `ROTEIRO_VALIDACAO_FINAL.md` - Guia de testes
- `PRONTO_PARA_PUBLICACAO.md` - Status do MVP
- `CHECKLIST_VALIDACAO_RAPIDA.md` - Checklist interativo

**Logs Úteis**:
```bash
# Ver logs em tempo real
npm start

# Com mais verbosidade
npm start -- --verbose

# Limpar logs e reiniciar
npm start --clear
```

**Debug via VS Code**:
1. Instalar "Expo Tools" extension
2. Abrir VS Code
3. Conectar app com Metro
4. Pode usar breakpoints e inspecionar estado

---

**Última atualização**: 29/09/2026  
**Versão**: 0.1.0 (MVP)  
**Status**: Aguardando testes em device real
