# 🎬 PASSO 2: CRIAR SCREENSHOTS

**Data:** 29/09/2026
**Status:** 🚀 READY TO EXECUTE
**Build Status:** ✅ CONCLUÍDO (145ef9b9-4893-4a46-a74a-2ed23c09f836)
**AAB Download:** https://expo.dev/artifacts/eas/mZDMWKKifACT6FhEKOw6p0GPWLGTtx1Qt72eANmLo4I.aab

---

## 📋 Resumo Rápido

| Item | Valor |
|------|-------|
| **O que fazer** | Capturar 6-8 screenshots do app |
| **Tamanho** | 1080x1920 pixels (Google Play exige!) |
| **Tempo** | ~20 minutos |
| **Onde salvar** | `screenshots/` pasta |
| **Próximo passo** | Converter ícone SVG → PNG |

---

## 🎯 Screenshots Necessários

**Você precisa capturar 6-8 imagens na seguinte sequência:**

### Screenshot 1: **TELA HOME**
- Clique em "Home" na navegação
- Mostra cards do app
- Tempo: 5 segundos

### Screenshot 2: **DIABETES OVERVIEW**
- Clique em "Diabetes" na navegação
- Mostra resumo geral de glicemia, medicações, refeições
- Tempo: 5 segundos

### Screenshot 3: **GLICEMIA (Glucose)**
- Dentro de Diabetes, clique em "Glicemia"
- Mostra gráfico + histórico de leituras
- Tempo: 5 segundos

### Screenshot 4: **MEDICAÇÕES**
- Dentro de Diabetes, clique em "Medicações"
- Mostra lista de medicamentos
- Tempo: 5 segundos

### Screenshot 5: **REFEIÇÕES**
- Dentro de Diabetes, clique em "Refeições"
- Mostra lista de refeições registradas
- Tempo: 5 segundos

### Screenshot 6: **NOTAS**
- Dentro de Diabetes, clique em "Notas"
- Mostra notas do usuário
- Tempo: 5 segundos

### Screenshot 7: **ADICIONAR GLICEMIA** (Modal)
- Na tela de Glicemia, clique no botão "+"
- Mostra formulário para adicionar nova leitura
- Tempo: 5 segundos

### Screenshot 8: **ÍCONE DO APP** (Home Screen)
- Volte à tela home do Android
- Mostre o ícone do app na home
- Tempo: 5 segundos

---

## 🎮 Como Capturar Screenshots

### Opção A: EMULADOR ANDROID (Recomendado)

#### Usando Android Studio Emulator

**1. Abrir Emulador:**
```bash
# No terminal do seu PC
# (Se tem Android SDK instalado)
emulator -avd Pixel_4_API_30   # ou seu AVD
```

**2. Rodar app no emulador:**
```bash
cd C:\Users\ferpa\.copilot\repos\copilot-worktrees\levia\ferpa2505-art-fluffy-fishstick
npm start
# Escolha 'a' para abrir no emulador Android
```

**3. Capturar screenshot:**
- **Método A - Atalho Windows:**
  ```
  Ctrl + Print Screen  →  Colar no Paint
  ```

- **Método B - ADB (Android Debug Bridge):**
  ```bash
  adb shell screencap -p /sdcard/screenshot_1.png
  adb pull /sdcard/screenshot_1.png ./screenshots/
  ```

- **Método C - Extended Controls do Emulador:**
  - Clique no ícone de "..." (mais opções) no emulador
  - Escolha "Extended Controls"
  - Clique em "Screenshot"

#### Usando Expo Go (Mais Fácil!)

**1. No seu Android físico ou emulador:**
```
1. Instale Expo Go (Play Store)
2. Abra o app
3. Escaneie o QR code da sessão do npm start
```

**2. Capturar screenshots:**
- Pressione o volume down + power (Android nativo)
- OU use ADB: adb shell screencap -p /sdcard/ss.png

---

### Opção B: DISPOSITIVO ANDROID FÍSICO

**1. Conectar ao PC:**
```bash
# USB conectado
adb devices
# Deve mostrar seu device
```

**2. Instalar app:**
```bash
# Build e install
npx eas build --platform android --profile preview --local
# OU por OTA via Expo Go
```

**3. Capturar:**
- Botão power + volume down (segurar 1 segundo)
- Screenshot vai para galeria do device

---

### Opção C: APPETIZE.IO (Online - Sem Emulador)

Se NÃO tem emulador/device:

1. Acesse: https://appetize.io/
2. Upload: `app-v0.1.0.aab` (seu AAB downloadado)
3. Clique Play
4. Navegar e screenshot (function Print Screen)
5. Salvar imagens

---

## 📸 Validar Screenshots

Antes de salvar, verifique:

```
✅ Cada imagem é 1080x1920 pixels exatamente
   (Google Play rejeita outras dimensões!)

✅ Sem barra de sistema (Android status bar)
   (Se tiver, use adb: adb shell settings put global policy_control immersive.full=*

✅ App em português (pt-BR)
   (Verificar no código - app já está em pt-BR)

✅ Dados mockados aparecem:
   - Glicemia: 110-180 mg/dL
   - Medicações: Metformina, Insulina, etc
   - Refeições: Café da manhã, Almoço, etc
   - Notas: "Teste de nota"

✅ Qualidade legível
   (Google Play quer screenshots bonitos!)
```

---

## 📁 Estrutura de Pastas

Depois de capturar, organize assim:

```
project-root/
├── screenshots/
│   ├── 01-home.png
│   ├── 02-diabetes-overview.png
│   ├── 03-glicemia.png
│   ├── 04-medicacoes.png
│   ├── 05-refeicoes.png
│   ├── 06-notas.png
│   ├── 07-adicionar-glicemia.png
│   └── 08-app-icon.png
├── assets/
│   ├── icon.svg
│   └── icon-512.png  (próximo passo)
```

---

## ⚡ Dicas Rápidas

### Se Screenshots ficarem com barra de status visível:
```bash
# Isso esconde a barra de status
adb shell settings put global policy_control immersive.full=*

# Voltar ao normal:
adb shell settings put global policy_control null
```

### Se o app não abrir no emulador:
```bash
# Limpar cache
npm start
# Selecione 'w' para limpar cache + start Webpack

# Ou
npx expo start --clear
```

### Se as imagens ficarem pequenas (não 1080x1920):
```bash
# Verificar resolução do emulador
adb shell dumpsys window displays
# Deve mostrar 1080x1920 ou similar

# Se não, ajustar no AVD Manager do Android Studio
```

---

## ✅ Checklist de Conclusão

Quando terminar, marque:

- [ ] Screenshot 1 (Home) - salvo em `screenshots/01-home.png`
- [ ] Screenshot 2 (Diabetes Overview) - salvo em `screenshots/02-diabetes-overview.png`
- [ ] Screenshot 3 (Glicemia) - salvo em `screenshots/03-glicemia.png`
- [ ] Screenshot 4 (Medicações) - salvo em `screenshots/04-medicacoes.png`
- [ ] Screenshot 5 (Refeições) - salvo em `screenshots/05-refeicoes.png`
- [ ] Screenshot 6 (Notas) - salvo em `screenshots/06-notas.png`
- [ ] Screenshot 7 (Modal Adicionar) - salvo em `screenshots/07-adicionar-glicemia.png`
- [ ] Screenshot 8 (Ícone App) - salvo em `screenshots/08-app-icon.png`
- [ ] Todas imagens são 1080x1920 pixels
- [ ] Sem barras de sistema visíveis
- [ ] Dados mockados aparecem corretamente

Quando tudo pronto → **PASSO 3: CONVERTER ÍCONE**

---

## 📞 Precisa de Ajuda?

Se ficar preso em algum passo:

1. **Emulador não abre?**
   → Use Android Studio AVD Manager
   → Criar novo Pixel 4 API 30

2. **ADB não encontrado?**
   → Instalar Android SDK
   → Ou use Expo Go no device físico

3. **Screenshots com barra de status?**
   → Execute comando de fullscreen acima
   → Ou capture manualmente

4. **App não aparece português?**
   → App já está em pt-BR
   → Se não mudar, locale pode estar em inglês
   → Verificar settings do device/emulador

---

**⏰ Tempo total esperado: 20 minutos**
**🎯 Próximo passo após screenshots: CONVERTER ÍCONE SVG → PNG**

Começar a capturar! 🎬
