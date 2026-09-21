# 🎨 Levia — Guia de Brand Assets

## 1. ÍCONE PRINCIPAL — Pena + Ponto

### Arquivo: `src/assets/icons/LeviaBrand.svg`

**Descrição:** Pena em marfim (#FBF8F3) com ponto em pêssego (#F59E0B) sobre fundo sálvia (#6FA58E)

**Dimensões recomendadas:**
- App Icon (Home Screen): 180x180px (ou 256x256px)
- Splash Screen: 200x200px
- Tab Bar: 48x48px (versão outline)
- Header: 40x40px (versão monochrome)

**Cores:**
- Pena: Marfim #FBF8F3
- Detalhe/Raque: Sálvia #6FA58E
- Ponto: Pêssego #F59E0B
- Background: Sálvia #6FA58E

---

## 2. VERSÕES DO ÍCONE

### A) Versão Colorida (Padrão)

**Arquivo:** `src/assets/icons/LeviaBrand.svg`

**Uso:**
- Splash screen (grande, destaque)
- Home screen icon (iOS/Android)
- Perfil do usuário
- Certificados/conquistas
- Paywall premium

**Como usar em React Native:**

```typescript
import { LeviaLogo } from '@components/LeviaLogo';

<LeviaLogo size={200} variant="colored" />
```

---

### B) Versão Monocromática (Branco)

**Arquivo:** `src/assets/icons/LeviaBrandMonochrome.svg`

**Uso:**
- Backgrounds escuros (paywall, dark mode)
- Header (dark mode)
- Overlay/modal
- Badge premium
- Notificações

**Como usar:**

```typescript
<LeviaLogo size={80} variant="monochrome" />
```

---

### C) Versão Outline (Apenas Contorno)

**Arquivo:** `src/assets/icons/LeviaBrandOutline.svg`

**Uso:**
- Tab bar ativo/inativo
- Header de página
- Botões com ícone
- Favicon (web future)
- Status bar

**Como usar:**

```typescript
<LeviaLogo 
  size={48} 
  variant="outline" 
  colorOverride={colors.primary}
/>
```

---

### D) Versão Ícone Apenas (Sem Background)

**Uso:** Quando você já tem background personalizado

```typescript
import { LeviaLogoIconOnly } from '@components/LeviaLogo';

<LeviaLogoIconOnly size={100} />
```

---

## 3. TAMANHOS E ESPAÇAMENTOS

### Aplicação em diferentes contextos:

| Contexto | Tamanho | Variante | Cor de Fundo | Exemplos |
|----------|---------|----------|-------------|----------|
| **Splash Screen** | 200-240px | colorida | sálvia #6FA58E | Onboarding |
| **App Icon** | 180px | colorida | — | Home Screen |
| **Header** | 40-48px | monochrome | escuro | Dark mode nav |
| **Tab Bar** | 24-32px | outline | transparente | Ativo/inativo |
| **Card Badge** | 60-80px | colorida | transparente | Conquistas |
| **Botão com ícone** | 20-24px | outline | — | CTA |
| **Perfil Avatar** | 80-120px | colorida | sálvia | User profile |
| **Notificação** | 32px | monochrome | branco | Toast/alert |

---

## 4. ESPAÇAMENTO MÍNIMO

Sempre deixar **mínimo 16px** de espaço vazio ao redor do ícone.

```
┌──────────────────────────────────┐
│                                  │
│      ┌──────────────────┐       │
│      │                  │       │
│      │     LEVIA        │       │
│      │                  │       │
│      └──────────────────┘       │
│                                  │
└──────────────────────────────────┘
      16px mínimo em todos os lados
```

---

## 5. CORES COMPLEMENTARES

Quando usar o ícone, sempre seguir a proporção 60-30-10:

### Composição Visual:

```
Background: Marfim #FBF8F3 (60%)
Ícone: Sálvia #6FA58E (30%) — ou monochrome em escuro
Destaque: Pêssego #F59E0B (10%) — no ponto do ícone
```

### Exemplos:

**Splash Screen:**
```
┌─────────────────────────────────┐
│  Fundo: Sálvia degradê         │
│    (do sálvia opaco ao marfim)  │
│                                 │
│         🎨 LEVIA 🎨            │
│      [Ícone branco/marfim]      │
│                                 │
│   "Mais leve a cada dia"        │
│                                 │
└─────────────────────────────────┘
```

**Card Premium:**
```
┌─────────────────────────────────┐
│ Gradiente: Lavanda → Sálvia    │
│                                 │
│         ⭐ LEVIA ⭐            │
│      [Ícone branco]             │
│                                 │
│  Plano Premium - R$ 29,90/mês  │
│                                 │
│    [Botão Branco]              │
│                                 │
└─────────────────────────────────┘
```

**Tab Bar:**
```
┌─────────────────────────────────┐
│ 🏠 Início  📔 Diário  👤 Perfil│
│  ↑ Ativo (sálvia)             │
│       Inativos (cinza)          │
│                                 │
│ [Ícone outline em sálvia]      │
│ [Ícone outline em cinza]       │
│                                 │
└─────────────────────────────────┘
```

---

## 6. ANIMAÇÕES (Futuro)

Ideias para animar o ícone:

### A) Pena Flutuando (Splash Screen)
```
Animação: Vertical, suave, contínua
Duração: 2-3 segundos
Movimento: ↑ 20px ↓ (loop)
Sensação: Leveza
```

### B) Ponto Piscando (GLP-1 Ativo)
```
Animação: Opacidade
Duração: 1.5 segundos
Padrão: Opaco → 50% → Opaco
Sensação: "Modo ativado"
```

### C) Pena Girando (Loading)
```
Animação: Rotação
Duração: 2 segundos
Ângulo: 360°
Sensação: "Carregando..."
```

---

## 7. COMO USAR NO CÓDIGO

### Importar:

```typescript
import { LeviaLogo, LeviaLogoIconOnly } from '@components/LeviaLogo';
import { colors } from '@theme/colors';
```

### Splash Screen (Onboarding):

```typescript
<View style={{ flex: 1, backgroundColor: colors.primary }}>
  <LeviaLogo 
    size={240} 
    variant="colored"
    style={{ marginBottom: 20 }}
  />
  <Text style={{ fontSize: 24, color: colors.onPrimary }}>
    Bem-vindo à Levia
  </Text>
</View>
```

### Tab Bar Ativo:

```typescript
<LeviaLogo 
  size={32} 
  variant="outline" 
  colorOverride={colors.primary}
/>
```

### Tab Bar Inativo:

```typescript
<LeviaLogo 
  size={32} 
  variant="outline" 
  colorOverride={colors.textSecondary}
/>
```

### Header Dark Mode:

```typescript
<LeviaLogo 
  size={40} 
  variant="monochrome"
  isDark={true}
/>
```

### Card Badge (Conquista):

```typescript
<View style={{
  backgroundColor: colors.lightTheme.accent,
  borderRadius: 12,
  padding: 16,
  alignItems: 'center'
}}>
  <LeviaLogoIconOnly size={80} />
  <Text style={{ color: colors.accent, marginTop: 12 }}>
    Desbloqueado!
  </Text>
</View>
```

---

## 8. EXPORT PARA OUTRAS PLATAFORMAS (Futuro)

### iOS App Icon (Diferentes tamanhos):

```
- 120x120px (iPhone app icon 2x)
- 180x180px (iPhone app icon 3x)
- 1024x1024px (App Store)
```

### Android:

```
- hdpi: 72x72px
- xhdpi: 96x96px
- xxhdpi: 144x144px
- xxxhdpi: 192x192px
- Web: 512x512px
```

### Web (Favicon):

```
- 16x16px (ICO)
- 32x32px (PNG)
- 192x192px (PWA)
- 512x512px (PWA)
```

---

## 9. VARAÇÕES TEMÁTICAS

Se expandir para outros mercados (Portugal, Espanha, etc.), manter o ícone igual, mas variar paleta:

### Variação Portugal (Azul + Dourado):
```
Pena: Branco
Detalhe: Azul #1E40AF
Ponto: Dourado #D97706
Background: Azul
```

### Variação Espanha (Vermelho + Ouro):
```
Pena: Branco
Detalhe: Vermelho #DC2626
Ponto: Ouro #FBBF24
Background: Vermelho
```

**Recomendação:** Começar apenas com Brasil (sálvia/pêssego/lavanda). Expandir après validação.

---

## 10. CHECKLIST BEFORE USE

- [ ] Versão escolhida (colorida/monochrome/outline)?
- [ ] Tamanho apropriado para contexto?
- [ ] Espaçamento mínimo de 16px?
- [ ] Contraste de texto sobre ícone ≥ 4.5:1?
- [ ] Testado em tema claro E escuro?
- [ ] Ícone escalonável (SVG mantém qualidade)?
- [ ] Alinhamento vertical/horizontal OK?

---

## RESUMO RÁPIDO

| Você quer... | Use isto | Tamanho |
|-------------|----------|---------|
| Tela inicial (splash) | Colorida | 240px |
| Header app | Monochrome | 40px |
| Tab bar | Outline | 32px |
| Card/Badge | Colorida | 80px |
| Dark mode | Monochrome | 60px |
| Botão pequeno | Outline | 20px |

---

**Status:** ✅ Pronto para integrar na **Etapa 2 — Onboarding**

**Próximo passo:** Criar splash screen com logo + começar quiz de cadastro
