# ✅ ETAPA 2 — Ícone Levia + Splash Screen + Onboarding Scaffold

## Status: ✅ Estrutura Criada (Em Desenvolvimento)

---

## O que foi criado:

### 1. ✅ Ícone Levia (3 Versões)

**Arquivos:**
- `src/assets/icons/LeviaBrand.svg` — Versão original (colorida, com pêssego)
- `src/assets/icons/LeviaBrandMonochrome.svg` — Versão branca (dark mode)
- `src/assets/icons/LeviaBrandOutline.svg` — Versão outline (tab bar)

**Componente React Native:**
- `src/components/LeviaLogo.tsx` — Renderiza SVG com variantes

**Documentação:**
- `LEVIA_BRAND_ASSETS.md` — Guia completo de uso

---

### 2. ✅ Splash Screen Animada

**Arquivo:** `src/screens/onboarding/SplashScreen.tsx`

**Características:**
- Logo Levia animada (fade + scale + slide)
- Texto "Bem-vindo à Levia" + tagline
- Fundo em sálvia (#6FA58E)
- Transição automática para Quiz em 3 segundos
- Suporta dark mode (via `isDark` prop)

**Como testar:**
```bash
npm start
# Vai aparecer a splash screen por 3 segundos
```

**O que você verá:**
```
┌────────────────────────────────┐
│                                │
│         🎨 Logo 🎨            │
│    (Pena em marfim + ponto)    │
│                                │
│   Bem-vindo à Levia           │
│   Mais leve a cada dia        │
│                                │
│      Carregando...             │
└────────────────────────────────┘
```

---

### 3. ✅ Estrutura do Onboarding

**Arquivos criados:**

```
src/screens/
├── OnboardingStack.tsx         (Navegação principal do onboarding)
└── onboarding/
    ├── SplashScreen.tsx        (1. Splash com logo)
    ├── QuizScreen.tsx          (2. Quiz com 8 passos)
    └── ResultScreen.tsx        (3. Resumo de metas calculadas)
```

**Fluxo:**
```
Splash (3s) → Quiz (8 telas) → Result (metas) → Home/Paywall
```

---

### 4. ✅ Quiz com Cálculo de Metas (Scaffold)

**Arquivo:** `src/screens/onboarding/QuizScreen.tsx`

**Estrutura (8 passos):**
1. Objetivo (emagrecer/ganhar/manter)
2. Gênero (feminino/masculino/outro)
3. Idade (≥18)
4. Altura (cm)
5. Peso (kg)
6. Meta de Peso (kg)
7. Nível de Atividade (sedentário a muito ativo)
8. Tratamento GLP-1? (sim/não)

**Componentes visuais:**
- Barra de progresso (0-100%)
- Botões "Voltar" e "Próximo"
- Validação por step
- Cálculo de metas (Mifflin-St Jeor)

**Metas calculadas:**
- **Calorias:** BMR × Atividade (85% deficit se emagrecer)
- **Proteína:** Peso × 1.6g (recomendado)
- **Água:** Peso × 35ml

**Status:** ✅ Estrutura criada, inputs ainda precisam ser implementados

---

### 5. ✅ Tela de Resultado

**Arquivo:** `src/screens/onboarding/ResultScreen.tsx`

**O que mostra:**
```
┌─────────────────────────────────┐
│ ✓ Suas Metas Calculadas!       │
│ Com base em seu perfil...      │
├─────────────────────────────────┤
│ 🔥 2.000 kcal/dia               │
│ 🍗 120 g/dia                    │
│ 💧 2,8 L/dia                    │
├─────────────────────────────────┤
│ ℹ️ Sobre suas metas             │
│ Calculadas por Mifflin-St Jeor │
├─────────────────────────────────┤
│ [Vamos começar! 🚀]             │
└─────────────────────────────────┘
```

---

## 📦 Dependências Instaladas

✅ `react-native-svg` — Renderizar SVG em React Native

```bash
npm install react-native-svg --save
```

---

## 🎯 Próximos Passos (Etapa 2 Cont.)

### Pendente: Implementar inputs do Quiz

Para cada passo do quiz, criar componentes de input:

**Passo 0 — Objetivo:**
```typescript
// 3 botões/cards
- "Emagrecer 💪" → objective = 'lose'
- "Ganhar Massa" → objective = 'gain'
- "Manter Peso" → objective = 'maintain'
```

**Passo 1 — Gênero:**
```typescript
// 3 botões + "Prefiro não informar"
- "Feminino ♀️"
- "Masculino ♂️"
- "Outro/Prefiro não dizer"
```

**Passo 2 — Idade:**
```typescript
// Text input numérico (≥18)
- Validação: age >= 18
- Placeholder: "ex: 28"
```

**Passo 3 — Altura:**
```typescript
// Slider ou input numérico (cm)
- Range: 140-220cm
- Mostrar visual feedback
```

**Passo 4 — Peso:**
```typescript
// Slider ou input (kg)
- Range: 30-200kg
```

**Passo 5 — Meta de Peso:**
```typescript
// Slider ou input (kg)
- Validação: não abaixo de IMC 18.5
- Avisos se meta < peso atual (emagrecer esperado)
```

**Passo 6 — Atividade:**
```typescript
// 5 cards com descrição
- "Sedentária" (pouco exercício)
- "Leve" (1-3x/sem)
- "Moderada" (3-5x/sem)
- "Ativa" (6-7x/sem)
- "Muito ativa" (diária intenso)
```

**Passo 7 — GLP-1:**
```typescript
// Toggle + explicação
- Sim → Ativa modo GLP-1 (opções extras)
- Não
- Não tenho certeza
```

---

## 📝 Como Usar o Ícone Levia no Código

```typescript
import { LeviaLogo } from '@components/LeviaLogo';

// Splash Screen
<LeviaLogo size={240} variant="colored" />

// Tab Bar (ativo)
<LeviaLogo size={32} variant="outline" colorOverride="#6FA58E" />

// Header dark mode
<LeviaLogo size={40} variant="monochrome" />

// Ícone isolado (sem background)
import { LeviaLogoIconOnly } from '@components/LeviaLogo';
<LeviaLogoIconOnly size={100} />
```

---

## ✅ Teste Imediato

1. **Instale dependências:**
   ```bash
   npm install
   ```

2. **Inicie o app:**
   ```bash
   npm start
   ```

3. **No Expo Go:**
   - Você verá a **Splash Screen** com o logo animado
   - Após 3 segundos, avança para **Quiz** (ainda em desenvolvimento)
   - Clique em "Próximo" para navegar pelos passos

4. **O que você deve ver:**
   - [ ] Logo da pena em sálvia (cores corretas)
   - [ ] Animação de entrada suave (fade + scale)
   - [ ] Transição automática em 3s
   - [ ] Barra de progresso atualizando
   - [ ] Quiz com 8 passos (ainda sem inputs finais)

---

## 📊 Status Resumido

| Item | Status | Notas |
|------|--------|-------|
| Ícone SVG | ✅ 3 versões | LeviaBrand, Monochrome, Outline |
| Componente LeviaLogo | ✅ Pronto | Renderiza SVGs corretamente |
| Splash Screen | ✅ Animada | Transição automática em 3s |
| Quiz Estrutura | ✅ Scaffold | 8 passos navegáveis |
| Quiz Inputs | ⏳ TODO | Falta implementar cada passo |
| Result Screen | ✅ Layout | Mostra metas calculadas |
| Cálculo Metas | ✅ Lógica | Mifflin-St Jeor implementado |
| Dark Mode | ⏳ TODO | Suporte parcial (falta tema escuro) |

---

## 🚀 Próxima Etapa (2 cont.)

Implementar os **inputs do Quiz** (objetivo, gênero, idade, altura, peso, atividade, GLP-1).

**Tempo estimado:** 30-45 min para completar todos os 8 passos com validações e estilos.

---

## 📚 Documentação Criada

- ✅ `LEVIA_PALETA_CORES_COMPLETA.md` — Sistema de cores
- ✅ `LEVIA_GUIA_IMPLEMENTACAO.md` — Como usar cores
- ✅ `LEVIA_PALETA_VISUAL.txt` — Resumo visual
- ✅ `LEVIA_BRAND_ASSETS.md` — Guia de ícone
- ✅ `ETAPA_2_CHECKLIST.md` — Este documento

---

**Status geral:** 60% completo (estrutura pronta, inputs em desenvolvimento)

🎨 + 🚀 **Pronto para continuar!**
