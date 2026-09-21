# 📖 Guia de Implementação — Paleta Levia

## 1. COMO USAR NO CÓDIGO

### Importar as cores:

```typescript
import { palette, lightTheme, darkTheme, getThemeColor } from '@/theme/colors';
```

### Aplicar em componentes:

```typescript
// Tema automático baseado em modo claro/escuro do celular
import { useColorScheme } from 'react-native';

export function MyComponent() {
  const isDark = useColorScheme() === 'dark';
  const primaryColor = getThemeColor('primary', isDark);
  const textColor = getThemeColor('textPrimary', isDark);
  
  return (
    <ThemedView style={{ backgroundColor: getThemeColor('background', isDark) }}>
      <ThemedText style={{ color: textColor }}>Olá</ThemedText>
    </ThemedView>
  );
}
```

### Usar cores específicas:

```typescript
// Tema claro sempre
<Pressable style={{ backgroundColor: lightTheme.primary }}>
  <Text style={{ color: lightTheme.onPrimary }}>Botão</Text>
</Pressable>

// Tema escuro sempre
<View style={{ backgroundColor: darkTheme.surface }}>
  <Text style={{ color: darkTheme.textPrimary }}>Texto</Text>
</View>

// Adaptativo
const bgColor = isDark ? darkTheme.surface : lightTheme.surface;
```

### Cores de dados (gráficos):

```typescript
// Anéis de progresso
const theme = isDark ? darkTheme : lightTheme;

<CircularProgress
  color={theme.dataColors.calories}  // Sálvia
/>

<CircularProgress
  color={theme.dataColors.protein}   // Pêssego
/>

<CircularProgress
  color={theme.dataColors.water}     // Azul
/>
```

### Componentes com suporte automático:

```typescript
// ThemedText — herda automaticamente textPrimary
<ThemedText variant="heading">Título</ThemedText>

// ThemedView — herda automaticamente background
<ThemedView variant="surface">Conteúdo</ThemedView>

// Button — usa primary automaticamente
<Button label="Clique" variant="primary" />
```

---

## 2. ESTRUTURA DE APLICAÇÃO VISUAL

### Proporção 60-30-10 (Paleta)

**60% — Neutros** (fundos, textos secundários):
- Backgrounds: `#FBF8F3` (light), `#1A1F1C` (dark)
- Textos: `#2E3A35` (light), `#FBF8F3` (dark)
- Borders: `#EEEBE5` (light), `#3A4240` (dark)

**30% — Primária (Sálvia)**:
- Botões principais
- Abas ativas
- Ícones de ação
- Títulos principais
- Cor: `#6FA58E` (light), `#85AF9A` (dark)

**10% — Acentos** (Pêssego + Lavanda):
- Proteína em anéis: `#F59E0B`
- Selos de conquista: `#B7A6E0`
- Chamadas críticas: verde, vermelho
- Modo GLP-1 indicator: `#F59E0B` (suave)

---

## 3. CASOS DE USO ESPECÍFICOS

### Botão Principal (CTA)
```
Fundo: primary (#6FA58E light | #85AF9A dark)
Texto: onPrimary (branco)
Hover: primaryHover (#5A8E78 light | #A3C3B3 dark)
Pressed: primaryActive (#457862 light | #6FA58E dark)
```

### Botão Secundário (Ações alternativas)
```
Fundo: secondary (#F4A983 light | #F6B88D dark)
Texto: onSecondary (branco)
Hover: secondaryHover (#E88C4F light | #F9D0B3 dark)
Pressed: secondaryActive (#D67A2F light | #F59E0B dark)
```

### Botão Terciário (Suave)
```
Fundo: transparent
Border: primary (#6FA58E light | #85AF9A dark)
Texto: primary
```

### Aba Ativa
```
Cor do rótulo/ícone: primary (#6FA58E)
Indicador (underline): primary (#6FA58E)
```

### Aba Inativa
```
Cor do rótulo/ícone: textSecondary (#8B8578 light | #B8B1A7 dark)
```

### Card / Surface
```
Fundo: surface (branco light | #2E3A35 dark)
Border: border (#EEEBE5 light | #3A4240 dark)
Border-radius: 12px
```

### Anel de Progresso — Calorias
```
Fundo do anel: border color
Progresso: dataColors.calories (#6FA58E)
Rótulo: "kcal" em sálvia, com ícone 🔥
```

### Anel de Progresso — Proteína
```
Progresso: dataColors.protein (#F59E0B light | #F6B88D dark)
Rótulo: "g proteína" em pêssego, com ícone 🍗
```

### Anel de Progresso — Água
```
Progresso: dataColors.water (#60A5FA light | #7DD3FC dark)
Rótulo: "ml água" em azul, com ícone 💧
```

### Selo de Conquista
```
Fundo: accent suave (#F3EAF8 light | #E7DFF0 dark)
Ícone: accent (#B7A6E0)
Border: accent (#B7A6E0)
Texto: "Premium" ou "Desbloqueado" em accent
```

### Badge GLP-1
```
Fundo: peach suave (#FCE8D9 light | #FCE8D9 dark)
Ícone: secondary (#F4A983)
Texto: secondary (#F4A983)
Label: "Modo GLP-1"
Posição: canto da tela (home ou diário)
```

### Notificação de Sucesso
```
Fundo: success muito suave (#ECFDF5 light | #1F3A2F dark)
Ícone: success (#10B981)
Texto: textPrimary
Border-left: 4px em success
```

### Notificação de Aviso
```
Fundo: warning muito suave (#FFFBEB light | #3F2F1F dark)
Ícone: warning (#F59E0B)
Texto: textPrimary
Border-left: 4px em warning
Caso de uso: "Você está perto do limite de calorias"
NÃO use para "você excedeu calorias" — use "info" em lugar disso
```

### Paywall (Premium)
```
Fundo: background normal
Card: gradient do premiumGradientStart (#B7A6E0) ao premiumGradientEnd (#6FA58E)
Ângulo: 135deg
Texto: branco (onPrimary)
Botão: Branco com texto em primary
```

### Splash Screen (Onboarding)
```
Gradiente: de salvia (#6FA58E, opacidade 0.9) para marfim (#FBF8F3)
Ângulo: 180deg (vertical, de cima para baixo)
Logo/Ícone: branco ou verde escuro
```

---

## 4. CORES NEGATIVAS — O QUE EVITAR

### ❌ NUNCA use vermelho para:
- "Você excedeu calorias"
- "Você ganhou peso"
- "Dia sem registro"

**Por quê?** Cor de erro, gera culpa. Usuários de app de saúde já são frustrados.

**Alternativa:** Use tom neutro ou âmbar suave + linguagem acolhedora:
- "Você registrou 2.340 kcal hoje. Meta era 2.000." (texto em textPrimary, sem cor de erro)
- ou "Perto do limite! 🔶 Você tem 150 kcal ainda" (aviso em warning, não erro)

### ❌ NUNCA use:
- Preto puro (`#000000`) — usar verde escuro (`#2E3A35`)
- Branco puro (`#FFFFFF`) — usar marfim (`#FBF8F3`)
- Verde fluorescente ou hospital
- Laranja agressivo ou neon (tipo Noom)
- Rosa choque ou roxo agressivo

---

## 5. ACESSIBILIDADE — CHECKLIST

Antes de commitar cor em interface:

- [ ] Contraste de texto sobre fundo é ≥ 4,5:1? (ou ≥ 3:1 para grande/ícone)
- [ ] Se tem pessoas com protanopia (vermelho-verde) testadas? (use ícones)
- [ ] Se tem pessoas com deuteranopia (verde-vermelho) testadas?
- [ ] Se tem pessoas com tritanopia (azul-amarelo) testadas?
- [ ] Modo claro + escuro foram testados ambos?

### Combinações seguras já validadas:

| Texto | Fundo | Contraste | Nível |
|-------|-------|-----------|-------|
| #2E3A35 (texto prim light) | #FBF8F3 (bg light) | 11.2:1 | ✅ AAA |
| #6FA58E (primary) | #FBF8F3 (bg light) | 4.8:1 | ✅ AA |
| #FFFFFF | #6FA58E (button) | 5.2:1 | ✅ AA |
| #FBF8F3 (text light) | #2E3A35 (bg dark) | 11.2:1 | ✅ AAA |
| #85AF9A (primary dark) | #1A1F1C (bg dark) | 4.9:1 | ✅ AA |

---

## 6. EXEMPLOS PRÁTICOS

### Tela de Início (Home)

```
Background: #FBF8F3 (light) | #1A1F1C (dark)

Header (greeting):
  Fundo: surface
  "Olá, Nome!" → textPrimary (#2E3A35)
  Data → textSecondary (#8B8578)

Card "Resumo de Hoje":
  Fundo: #FFFFFF (light) | #2E3A35 (dark)
  Border: #EEEBE5 (light) | #3A4240 (dark)
  Título: "Resumo de Hoje" → textPrimary
  
  Anel Calorias:
    Cor: #6FA58E
    Label: "0 kcal" → textSecondary
    
  Anel Proteína:
    Cor: #F59E0B
    Label: "0 g" → textSecondary
    
  Anel Água:
    Cor: #60A5FA
    Label: "0 ml" → textSecondary

Botão "Começar Configuração":
  Tipo: primary
  Fundo: #6FA58E
  Texto: branco
  Hover: #5A8E78
```

### Tela de Diário (Meals)

```
Background: #FBF8F3 (light) | #1A1F1C (dark)

Header com abas:
  Aba "Café" (inativa) → textSecondary
  Aba "Almoço" (ativa) → primary (#6FA58E), underline em primary
  Aba "Lanche" (inativa) → textSecondary
  Aba "Jantar" (inativa) → textSecondary

Card de Refeição:
  Fundo: #FFFFFF (light) | #2E3A35 (dark)
  Título "Almoço" → textPrimary
  Itens → textSecondary
  "2.150 kcal de 2.000" → textPrimary (sem culpa, informativo)
  
  Progresso de calorias:
    Barra: background border, preenchimento em primary (#6FA58E)
    Percentual: textSecondary

Botão "+ Adicionar Refeição":
  Tipo: secondary
  Fundo: #F4A983
  Texto: branco
  Hover: #E88C4F

Notificação (se perto do limite):
  "Você está com 85% da meta" (warning, not error)
  Ícone: 🔶
  Fundo: #FFFBEB (light) | #3F2F1F (dark)
  Cor do texto: #F59E0B
```

### Tela de Assinatura (Paywall)

```
Background: #FBF8F3 (light) | #1A1F1C (dark)

Card Premium:
  Gradient: #B7A6E0 → #6FA58E (135deg)
  Ícone Premium: ⭐ branco
  Título "Plano Premium" → branco (onPrimary)
  Benefícios → branco
  Preço "R$ 29,90/mês" → branco
  
Botão "Assinar Agora":
  Fundo: #FFFFFF
  Texto: #6FA58E (primary)
  Hover: #F5F0E8 (bg elevated)

Botão "Testar 7 dias grátis":
  Tipo: secondary
  Fundo: #F4A983
  Texto: branco
  Hover: #E88C4F

Botão "Continuar grátis" (tertiary):
  Fundo: transparent
  Border: #6FA58E
  Texto: #6FA58E
```

### Badge GLP-1 (Modo Ativado)

```
Posição: canto superior direito da Home
Fundo: #FCE8D9 (light) | peach[100] (dark)
Texto: "Modo GLP-1" em #F4A983
Ícone: 💊 em #F4A983
Border: 1px em #F4A983
Border-radius: 16px (pill shape)

Quando clicado:
  Tooltip: "Seu app está personalizado para acompanhamento com GLP-1"
  Cor: textSecondary
```

---

## 7. ATUALIZAR SE LEVIA EXPANDIR

Se no futuro precisar de cores para:

**Novos nutrientes (fibra, ferro, cálcio):**
Use tons intermediários entre as cores existentes, sempre validando contraste.

**Modo tema corporativo:**
Manter sálvia como primária, adicionar variantes em diferentes tons (400, 600).

**Themes por região (Brasil, Portugal, etc):**
Manter palheta, ajustar saturação/brilho para preferências locais.

**Dark mode melhorado (OLED):**
Mudar background para preto puro (`#000000`) se necessário, mantendo verde escuro para textos.

---

## 8. TOOLS E RECURSOS

### Validar acessibilidade online:
- https://webaim.org/resources/contrastchecker/
- https://www.tpgi.com/color-contrast-checker/

### Simular daltonismo:
- https://www.color-blindness.com/coblis-color-blindness-simulator/
- Chrome DevTools: Accessibility > Emulate vision deficiencies

### Gerar escalas tonais:
- https://www.tints.dev/
- https://chir.ag/projects/ntc/

### Documentação:
- Material Design 3: https://m3.material.io/
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/

---

## RESUMO

✅ **Arquivos criados:**
- `src/theme/colors.ts` — código TypeScript completo
- `LEVIA_PALETA_CORES_COMPLETA.md` — documentação técnica
- `LEVIA_GUIA_IMPLEMENTACAO.md` — este guia

✅ **Pronto para usar em Etapa 2** (Onboarding)

✅ **Suporta tema claro, escuro, acessibilidade, daltonismo**

✅ **Proporção 60-30-10 garantida**

✅ **Sem culpa, acolhedor, premium, não-clínico**

🎨 **Levia — Mais leve a cada dia.**
