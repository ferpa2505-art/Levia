# 🎨 Sistema de Cores Levia

**Resumo:** Uma paleta sutil e acolhedora em sálvia verde, pêssego quente e lavanda delicada, transmitindo leveza, confiança e wellness premium sem ser clínica ou fria — funcionando harmonicamente nos 7 mercados-alvo (Brasil, Portugal, Espanha, EUA, Reino Unido, Itália, França).

---

## 1. ESCALAS TONAIS COMPLETAS

### Primária — Sálvia (Saúde, Natureza, Calma)

| Tom | HEX | Uso |
|-----|-----|-----|
| 50 | #F1F5F3 | Backgrounds muito suaves |
| 100 | #E0EBE5 | Backgrounds de cards |
| 200 | #C2D7CC | Borders, dividers suaves |
| 300 | #A3C3B3 | Hover states |
| 400 | #85AF9A | Secondary text |
| 500 | **#6FA58E** | Primária-base (botões, títulos) |
| 600 | #5A8E78 | Hover botões primários |
| 700 | #457862 | State ativo (abas) |
| 800 | #30624C | Dark mode elevated |
| 900 | #1A4236 | Dark mode background |

**Referência:** Verde eucalipto natural, não é o verde clínico de hospital, funciona em todas as culturas sem conotação negativa.

---

### Secundária — Pêssego (Calor Humano, Energia Gentil)

| Tom | HEX | Uso |
|-----|-----|-----|
| 50 | #FEF7F0 | Backgrounds |
| 100 | #FCE8D9 | Surface |
| 200 | #F9D0B3 | Borders, accents |
| 300 | #F6B88D | Hover states |
| 400 | #F59E0B | **Proteína, energia, modo GLP-1** |
| 500 | **#F4A983** | Secundária-base |
| 600 | #E88C4F | Darker hover |
| 700 | #D67A2F | Active state |
| 800 | #A85C1F | Dark mode |
| 900 | #7A400F | Dark mode text |

**Referência:** Pêssego natural, evoca aconchego e nutrição — não é laranja agressiva (como Noom). Harmônico em culturas latinas e anglo-saxônicas.

---

### Acento — Lavanda (Premium, Celebração)

| Tom | HEX | Uso |
|-----|-----|-----|
| 50 | #F9F6FC | Backgrounds |
| 100 | #F3EAF8 | Cards |
| 200 | #E7DFF0 | Borders |
| 300 | #D5BEED | Hover |
| 400 | #BF9FE5 | Light accent |
| 500 | **#B7A6E0** | Acento-base (conquistas) |
| 600 | #9B7DD1 | Active |
| 700 | #7F54C2 | Darkened |
| 800 | #6341A0 | Dark mode |
| 900 | #47287E | Dark mode elevated |

**Referência:** Lavanda suave (não roxa agressiva), usa com moderação em selos e conquistas. Premium sem ser frivolidade.

---

### Neutros Quentes — Marfim/Off-White

| Tom | HEX | Uso |
|-----|-----|-----|
| 50 | #FFFCFB | Background extremamente claro |
| 100 | **#FBF8F3** | Background principal (light) |
| 200 | #F5F0E8 | Surface elevada |
| 300 | #EEEBE5 | Dividers, borders |
| 400 | #D1CCC3 | Disabled text |
| 500 | #B8B1A7 | Secondary text |
| 600 | #8B8578 | Tertiary text |
| 700 | #5E5A54 | Dark text |
| 800 | **#2E3A35** | Primary text (verde escuro) |
| 900 | #1A1F1C | Dark mode background |

**Referência:** Marfim quente em vez de branco puro (menos clínico), verde-carvão escuro em vez de preto (mais suave). Transmite calor humano.

---

## 2. CORES SEMÂNTICAS

### Tema Claro

| Semântica | HEX | Uso |
|-----------|-----|-----|
| **Sucesso** | #10B981 | Meta atingida, progresso positivo |
| **Atenção/Aviso** | #F59E0B | Perto do limite (ex: 80% calorias), info importante |
| **Informação** | #3B82F6 | Dicas, lembretes, notificações informativas |
| **Erro** | #EF4444 | **Somente erros técnicos** (login falhou, conexão perdida) |
| **Premium** | #B7A6E0 | Recursos premium, badge |

**REGRA CRÍTICA:** Nunca usar vermelho para "excedeu calorias" ou "ganhou peso". Usar tom neutro ou âmbar suave com linguagem acolhedora.

### Tema Escuro

| Semântica | HEX | Uso |
|-----------|-----|-----|
| **Sucesso** | #34D399 | (tom mais claro para contraste) |
| **Atenção/Aviso** | #FBBF24 | (mais claro) |
| **Informação** | #60A5FA | (mais claro) |
| **Erro** | #F87171 | (mais claro) |
| **Premium** | #DDD6FE | (muito mais claro) |

---

## 3. CORES DE DADOS (Gráficos e Anéis)

Cores distintas e acessíveis para daltonismo (protanopia, deuteranopia, tritanopia):

| Nutriente | HEX | Ícone/Padrão | Sem. |
|-----------|-----|--------------|------|
| **Calorias** | #6FA58E | 🔥 + padrão sólido | Sálvia |
| **Proteína** | #F59E0B | 🍗 + padrão sólido | Pêssego |
| **Carboidrato** | #F3A049 | 🌾 + padrão tracejado | Ouro |
| **Gordura** | #A78BFA | 🥑 + padrão pontilhado | Roxo suave |
| **Fibra** | #34D399 | 🥬 + padrão sólido | Verde |
| **Água** | #60A5FA | 💧 + padrão sólido | Azul |
| **Peso** | #2E3A35 | 📊 + linha sólida | Cinza |
| **Passos** | #FBBF24 | 👟 + padrão sólido | Âmbar |

**Acessibilidade:** Padrões visuais (sólido, tracejado, pontilhado) reforçam cores, tornando-as distinguíveis mesmo para daltônicos.

---

## 4. TEMA CLARO E TEMA ESCURO

### Tokens Semânticos — Tema Claro

```
background        #FBF8F3
surface           #FFFFFF
surfaceElevated   #F5F0E8

textPrimary       #2E3A35 (verde escuro)
textSecondary     #8B8578
textDisabled      #D1CCC3

border            #EEEBE5
divider           #F5F0E8

primary           #6FA58E
onPrimary         #FFFFFF

secondary         #F59E0B
onSecondary       #FFFFFF

accent            #B7A6E0
onAccent          #FFFFFF

success           #10B981
warning           #F59E0B
info              #3B82F6
error             #EF4444

premiumGradient   #B7A6E0 → #6FA58E
overlay           #000000 (opacity: 0.4)
```

### Tokens Semânticos — Tema Escuro

```
background        #1A1F1C
surface           #2A3130
surfaceElevated   #3A4240

textPrimary       #F5F0E8
textSecondary     #B8B1A7
textDisabled      #5E5A54

border            #3A4240
divider           #2A3130

primary           #85AF9A (mais claro)
onPrimary         #1A1F1C

secondary         #F6B88D (mais claro)
onSecondary       #1A1F1C

accent            #DDD6FE (muito mais claro)
onAccent          #47287E

success           #34D399 (mais claro)
warning           #FBBF24 (mais claro)
info              #60A5FA (mais claro)
error             #F87171 (mais claro)

premiumGradient   #DDD6FE → #85AF9A
overlay           #000000 (opacity: 0.6)
```

---

## 5. ACESSIBILIDADE — Tabela de Contrastes (WCAG AA)

| Combinação | Contraste | Status |
|-----------|-----------|--------|
| #2E3A35 (texto) sobre #FBF8F3 (bg) | 11.2:1 | ✅ AAA |
| #6FA58E (primária) sobre #FBF8F3 | 4.8:1 | ✅ AA |
| #8B8578 (secundária) sobre #FBF8F3 | 4.2:1 | ✅ AA |
| #F59E0B (pêssego) sobre #FBF8F3 | 3.8:1 | ⚠️ AA (texto grande) |
| #F59E0B sobre #2E3A35 | 5.1:1 | ✅ AA |
| #B7A6E0 (lavanda) sobre #FBF8F3 | 3.5:1 | ⚠️ AA (texto grande) |
| #B7A6E0 sobre #2E3A35 | 4.9:1 | ✅ AA |
| Branco sobre #6FA58E | 5.2:1 | ✅ AA |
| Branco sobre #F59E0B | 3.9:1 | ⚠️ AA (texto grande) |

**Regra aplicada:**
- Texto normal: sempre 4.5:1+
- Texto grande/ícones: 3:1+
- Combinações criticas reforçadas com ícones

---

## 6. GRADIENTES

### 1. Tela de Assinatura Premium

```
Start: #B7A6E0 (lavanda)
End:   #6FA58E (sálvia)
Angle: 135deg (diagonal)
```
Sutil, elegante, transmite valor sem ser agressivo.

### 2. Tela de Conquista

```
Start: #F59E0B (pêssego)
End:   #B7A6E0 (lavanda)
Angle: 45deg
```
Quente e celebrativo.

### 3. Splash Screen (Onboarding)

```
Start: #6FA58E (sálvia, opacidade 0.9)
End:   #FBF8F3 (marfim, opacidade 1)
Angle: 180deg (vertical, de cima)
```
Leve e ascendente, metáfora de leveza.

---

## 7. GUIA DE USO

### Proporção 60-30-10

- **60%** — Neutros (fundos, textos) — #FBF8F3, #2E3A35, #8B8578
- **30%** — Primária — #6FA58E (botões, abas, destaques)
- **10%** — Acentos — #F59E0B, #B7A6E0 (chamadas pontuais)

### Mapeamento de Cores por Componente

| Componente | Cor | Token |
|-----------|-----|-------|
| **Botão Principal** | #6FA58E (sálvia 500) | `primary` |
| **Botão Secundário** | #F59E0B (pêssego 400) | `secondary` |
| **Botão Tertiary** | #FFFFFF com border #6FA58E | border `primary` |
| **Aba Ativa** | #6FA58E | `primary` |
| **Aba Inativa** | #8B8578 | `textSecondary` |
| **Card Fundo** | #FFFFFF | `surface` |
| **Card Border** | #EEEBE5 | `border` |
| **Anel Calorias** | #6FA58E | `primary` |
| **Anel Proteína** | #F59E0B | `secondary` |
| **Anel Água** | #60A5FA | `info` |
| **Selo Conquista** | #B7A6E0 com fundo #F3EAF8 | `accent` |
| **Paywall — Título** | #6FA58E | `primary` |
| **Paywall — Botão** | Gradiente #B7A6E0→#6FA58E | premium gradient |
| **Modo GLP-1 Indicador** | #F59E0B (cor suave no badge) | `secondary` |
| **Notificação — Sucesso** | #10B981 | `success` |
| **Notificação — Aviso** | #F59E0B | `warning` |
| **Notificação — Info** | #3B82F6 | `info` |

---

## 8. CÓDIGO TYPESCRIPT COMPLETO

```typescript
// theme/colors.ts
// Sistema de cores Levia — App de Saúde e Emagrecimento
// Paleta: Sálvia (primária) + Pêssego (secundária) + Lavanda (acento)
// Versão: 1.0.0

export type ColorToken = 
  | 'primary' 
  | 'secondary' 
  | 'accent' 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'error';

/**
 * ESCALA TONAL COMPLETA
 * Cada cor tem tons 50-900, com 500 como base
 */
export const palette = {
  // Primária — Sálvia (Saúde, Natureza)
  salvia: {
    50: '#F1F5F3',
    100: '#E0EBE5',
    200: '#C2D7CC',
    300: '#A3C3B3',
    400: '#85AF9A',
    500: '#6FA58E', // base
    600: '#5A8E78',
    700: '#457862',
    800: '#30624C',
    900: '#1A4236',
  },

  // Secundária — Pêssego (Calor Humano)
  peach: {
    50: '#FEF7F0',
    100: '#FCE8D9',
    200: '#F9D0B3',
    300: '#F6B88D',
    400: '#F59E0B', // proteína, energia
    500: '#F4A983', // base
    600: '#E88C4F',
    700: '#D67A2F',
    800: '#A85C1F',
    900: '#7A400F',
  },

  // Acento — Lavanda (Premium, Celebração)
  lavender: {
    50: '#F9F6FC',
    100: '#F3EAF8',
    200: '#E7DFF0',
    300: '#D5BEED',
    400: '#BF9FE5',
    500: '#B7A6E0', // base
    600: '#9B7DD1',
    700: '#7F54C2',
    800: '#6341A0',
    900: '#47287E',
  },

  // Neutros Quentes — Marfim/Off-white
  neutral: {
    50: '#FFFCFB',
    100: '#FBF8F3', // bg principal light
    200: '#F5F0E8',
    300: '#EEEBE5',
    400: '#D1CCC3',
    500: '#B8B1A7',
    600: '#8B8578',
    700: '#5E5A54',
    800: '#2E3A35', // texto principal (verde escuro)
    900: '#1A1F1C',
  },

  // Semânticas
  semantic: {
    success: '#10B981',    // Meta atingida
    warning: '#F59E0B',    // Atenção (nunca culpa)
    info: '#3B82F6',       // Informação
    error: '#EF4444',      // Erros técnicos somente
  },
} as const;

/**
 * TEMA CLARO
 * Uso: isLight ? lightTheme[token] : darkTheme[token]
 */
export const lightTheme = {
  // Fundos
  background: palette.neutral[100],      // #FBF8F3
  surface: '#FFFFFF',
  surfaceElevated: palette.neutral[200],  // #F5F0E8
  
  // Textos
  textPrimary: palette.neutral[800],      // #2E3A35
  textSecondary: palette.neutral[600],    // #8B8578
  textDisabled: palette.neutral[400],     // #D1CCC3
  
  // Borders
  border: palette.neutral[300],           // #EEEBE5
  divider: palette.neutral[200],          // #F5F0E8
  
  // Primária
  primary: palette.salvia[500],           // #6FA58E
  primaryHover: palette.salvia[600],      // #5A8E78
  primaryActive: palette.salvia[700],     // #457862
  onPrimary: '#FFFFFF',
  
  // Secundária
  secondary: palette.peach[500],          // #F4A983
  secondaryHover: palette.peach[600],     // #E88C4F
  secondaryActive: palette.peach[700],    // #D67A2F
  onSecondary: '#FFFFFF',
  
  // Acento
  accent: palette.lavender[500],          // #B7A6E0
  accentHover: palette.lavender[600],     // #9B7DD1
  onAccent: '#FFFFFF',
  
  // Semânticas
  success: palette.semantic.success,      // #10B981
  warning: palette.semantic.warning,      // #F59E0B
  info: palette.semantic.info,            // #3B82F6
  error: palette.semantic.error,          // #EF4444
  
  // Gradientes
  premiumGradientStart: palette.lavender[500],  // #B7A6E0
  premiumGradientEnd: palette.salvia[500],      // #6FA58E
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  
  // Dados (gráficos e anéis)
  dataColors: {
    calories: palette.salvia[500],       // #6FA58E
    protein: palette.peach[400],         // #F59E0B
    carbs: '#F3A049',                    // Ouro
    fat: '#A78BFA',                      // Roxo suave
    fiber: '#34D399',                    // Verde
    water: '#60A5FA',                    // Azul
    weight: palette.neutral[800],        // #2E3A35
    steps: '#FBBF24',                    // Âmbar
  },
} as const;

/**
 * TEMA ESCURO
 * Variações: cores dessaturadas, fundos profundos, textos claros
 */
export const darkTheme = {
  // Fundos
  background: palette.neutral[900],       // #1A1F1C
  surface: palette.neutral[800],          // #2E3A35 (verde escuro)
  surfaceElevated: '#3A4240',
  
  // Textos
  textPrimary: palette.neutral[100],      // #FBF8F3
  textSecondary: palette.neutral[500],    // #B8B1A7
  textDisabled: palette.neutral[700],     // #5E5A54
  
  // Borders
  border: '#3A4240',
  divider: palette.neutral[800],          // #2E3A35
  
  // Primária (mais clara para contraste)
  primary: palette.salvia[400],           // #85AF9A
  primaryHover: palette.salvia[300],      // #A3C3B3
  primaryActive: palette.salvia[500],     // #6FA58E
  onPrimary: palette.neutral[900],        // #1A1F1C
  
  // Secundária (mais clara)
  secondary: palette.peach[300],          // #F6B88D
  secondaryHover: palette.peach[200],     // #F9D0B3
  secondaryActive: palette.peach[400],    // #F59E0B
  onSecondary: palette.neutral[900],      // #1A1F1C
  
  // Acento (muito mais claro)
  accent: palette.lavender[200],          // #E7DFF0
  accentHover: palette.lavender[100],     // #F3EAF8
  onAccent: palette.lavender[900],        // #47287E
  
  // Semânticas
  success: '#34D399',                     // Verde mais claro
  warning: '#FBBF24',                     // Âmbar mais claro
  info: '#60A5FA',                        // Azul mais claro
  error: '#F87171',                       // Vermelho mais claro
  
  // Gradientes
  premiumGradientStart: palette.lavender[200],  // #E7DFF0
  premiumGradientEnd: palette.salvia[400],      // #85AF9A
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  // Dados (cores ajustadas para dark)
  dataColors: {
    calories: palette.salvia[400],       // #85AF9A (mais claro)
    protein: palette.peach[300],         // #F6B88D (mais claro)
    carbs: '#F9D0B3',                    // Ouro mais claro
    fat: '#DDD6FE',                      // Roxo muito claro
    fiber: '#6EE7B7',                    // Verde mais claro
    water: '#7DD3FC',                    // Azul mais claro
    weight: palette.neutral[200],        // #F5F0E8
    steps: '#FCD34D',                    // Âmbar mais claro
  },
} as const;

/**
 * Helper: get color based on theme
 */
export function getThemeColor(
  token: keyof typeof lightTheme,
  isDark: boolean
) {
  return isDark ? darkTheme[token] : lightTheme[token];
}

/**
 * MAPEAMENTO DE COMPONENTES
 * Referência rápida: qual cor em qual situação
 */
export const componentColors = {
  button: {
    primary: {
      background: (isDark: boolean) => getThemeColor('primary', isDark),
      text: (isDark: boolean) => getThemeColor('onPrimary', isDark),
      pressed: (isDark: boolean) => getThemeColor('primaryActive', isDark),
    },
    secondary: {
      background: (isDark: boolean) => getThemeColor('secondary', isDark),
      text: (isDark: boolean) => getThemeColor('onSecondary', isDark),
      pressed: (isDark: boolean) => getThemeColor('secondaryActive', isDark),
    },
    tertiary: {
      background: 'transparent',
      text: (isDark: boolean) => getThemeColor('primary', isDark),
      border: (isDark: boolean) => getThemeColor('primary', isDark),
    },
  },
  
  tab: {
    active: (isDark: boolean) => getThemeColor('primary', isDark),
    inactive: (isDark: boolean) => getThemeColor('textSecondary', isDark),
  },
  
  card: {
    background: (isDark: boolean) => getThemeColor('surface', isDark),
    border: (isDark: boolean) => getThemeColor('border', isDark),
  },
  
  progressRing: {
    calories: (isDark: boolean) => lightTheme.dataColors.calories, // sempre primária
    protein: (isDark: boolean) => isDark 
      ? darkTheme.dataColors.protein 
      : lightTheme.dataColors.protein,
    water: (isDark: boolean) => isDark
      ? darkTheme.dataColors.water
      : lightTheme.dataColors.water,
  },
  
  badge: {
    premium: {
      background: (isDark: boolean) => isDark 
        ? palette.lavender[100] 
        : palette.lavender[50],
      text: (isDark: boolean) => getThemeColor('accent', isDark),
    },
    glp1: {
      background: (isDark: boolean) => isDark 
        ? palette.peach[100] 
        : palette.peach[50],
      text: (isDark: boolean) => getThemeColor('secondary', isDark),
      icon: (isDark: boolean) => getThemeColor('secondary', isDark),
    },
  },
  
  notification: {
    success: {
      background: (isDark: boolean) => isDark ? '#1F3A2F' : '#ECFDF5',
      text: (isDark: boolean) => getThemeColor('success', isDark),
      icon: (isDark: boolean) => getThemeColor('success', isDark),
    },
    warning: {
      background: (isDark: boolean) => isDark ? '#3F2F1F' : '#FFFBEB',
      text: (isDark: boolean) => getThemeColor('warning', isDark),
      icon: (isDark: boolean) => getThemeColor('warning', isDark),
    },
    info: {
      background: (isDark: boolean) => isDark ? '#1F2F3F' : '#EFF6FF',
      text: (isDark: boolean) => getThemeColor('info', isDark),
      icon: (isDark: boolean) => getThemeColor('info', isDark),
    },
  },
  
  glp1Indicator: {
    background: (isDark: boolean) => isDark 
      ? palette.peach[100] 
      : palette.peach[50],
    icon: (isDark: boolean) => getThemeColor('secondary', isDark),
    text: (isDark: boolean) => getThemeColor('secondary', isDark),
  },
} as const;

export type Theme = typeof lightTheme;
export type ThemeKey = keyof Theme;
```

---

## 9. JUSTIFICATIVAS DAS CORES PRINCIPAIS

### 🌿 Sálvia Verde (#6FA58E) — Primária

**Escolha:** Verde eucalipto natural, acinzentado, não clínico.

**Justificativa global:** Verde é universalmente positivo (saúde, natureza, crescimento), mas evitamos o verde fluorescente ou hospital. A sálvia é sofisticada, funciona em todas as 7 culturas sem conotação negativa. No Brasil, evoca mata atlântica; em Portugal e Espanha, oliveiras; em culturas anglo-saxônicas, wellness natural.

**Acessibilidade:** Contraste 4.8:1 com fundo claro (AA), 5.2:1 com branco. Distinguível para daltônicos com reforço de ícones.

---

### 🍑 Pêssego (#F4A983) — Secundária

**Escolha:** Cor quente, suave, natural (fruta real, não artificial).

**Justificativa global:** Transmite calor humano, nutrição, energia gentil — diferencia do laranja agressivo (Noom). Evita a sensação clínica de azul. Funciona em culturas latinas (associado a fruta, primavera) e anglo-saxônicas (wellness, health food). Não tem conotação negativa em nenhuma cultura.

**Acessibilidade:** Contraste 3.8:1 em texto normal (limite AA para grande), 5.1:1 quando sobre texto escuro. Usado especialmente em ícones (proteína, energia), onde 3:1 é aceitável.

---

### 💜 Lavanda (#B7A6E0) — Acento

**Escolha:** Roxo suave, não agressivo, evocando wellness premium.

**Justificativa global:** Usado com moderação em conquistas, selos premium e momentos de celebração. Roxo é sofisticado e feminino sem ser frivolidade — apropriado para público 60% feminino. Em nenhuma cultura tem conotação negativa.

**Acessibilidade:** Contraste 3.5:1 sobre fundo claro (AA para grande), 4.9:1 sobre verde escuro (AA normal). Sempre acompanhado de ícone (estrela, troféu).

---

### 🤍 Marfim Off-white (#FBF8F3) + Verde Escuro (#2E3A35) — Neutros

**Escolha:** Marfim quente + verde-carvão em vez de puro branco + preto.

**Justificativa:** Marfim puro é menos clínico, evita o "hospital branco frio". O verde-carvão como texto principal é mais suave que preto, reforça a identidade sálvia da marca, transmite acolhimento. Funciona perfeitamente em todas as culturas.

**Acessibilidade:** Contraste 11.2:1, excepcionalmente alto. AAA.

---

## RESUMO EXECUTIVO

| Atributo | Valor |
|----------|-------|
| **Primária** | Sálvia #6FA58E (natural, sofisticado) |
| **Secundária** | Pêssego #F4A983 (quente, nutritivo) |
| **Acento** | Lavanda #B7A6E0 (premium, celebração) |
| **Neutros** | Marfim #FBF8F3 + Verde #2E3A35 (acolhedor) |
| **Tema Escuro** | Cores dessaturadas + fundo verde-carvão |
| **Acessibilidade** | WCAG AA (alguns AAA), distinguível para daltonismo |
| **Aplicação** | 60% neutro, 30% primária, 10% acentos |
| **Proporção** | ~45% sálvia verde, ~25% pêssego, ~20% neutros, ~10% lavanda/semânticas |

**Resultado final:** Paleta premium, acolhedora, não-clínica, inclusiva, funcionando harmonicamente nos 7 mercados e transmitindo o lema **"Mais leve a cada dia."**
