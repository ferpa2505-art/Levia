# Levia 🍃 — App de Emagrecimento Ético

**"Mais leve a cada dia"** — App iOS/Android de emagrecimento e hábitos saudáveis, acolhedor e sem culpa.

Para adultos de 25–55 anos em tratamento com GLP-1 ou fazendo dieta tradicional.

## 📊 Status: Etapas 1–2 ✅ Completas

```
✅ Etapa 1 — Esqueleto do app
✅ Etapa 2 — Ícone + Splash + Quiz scaffold
⏳ Etapa 3 — Supabase (próxima)
```

---

## 🚀 Começo Rápido

### 1. Instale dependências:
```bash
npm install
```

### 2. Inicie o Expo Go:
```bash
npm start
```

### 3. Teste no celular:
- **iOS:** Escaneie com câmera nativa
- **Android:** Abra Expo Go e escaneie
- Verá splash screen animada → quiz estruturado

---

## 🎨 O que foi Entregue

### Etapa 1 — Esqueleto do App ✅

- **Projeto Expo + React Native + TypeScript**
- **3 Abas Navegáveis:**
  - Início (home com resumo)
  - Diário (registro de refeições)
  - Perfil (configurações)
- **Sistema de Design centralizado:**
  - Cores (sálvia, pêssego, lavanda, neutros)
  - Tipografia (6 variantes)
  - Espaçamento (escala consistente)
- **Componentes base:**
  - `Button` (3 variantes)
  - `ThemedText` (6 variantes)
  - `ThemedView` (2 variantes)
- **Suporte a tema claro/escuro** (automático)

### Etapa 2 — Ícone + Splash + Onboarding ✅

#### **Ícone Levia (Pena + Ponto)**
```
3 versões SVG:
├── LeviaBrand.svg (colorido)
├── LeviaBrandMonochrome.svg (branco)
└── LeviaBrandOutline.svg (outline)

Componente React Native: LeviaLogo.tsx
```

#### **Paleta de Cores Profissional**

| Cor | HEX | Uso |
|-----|-----|-----|
| **Sálvia** | #6FA58E | Primária (saúde, natureza, calma) |
| **Pêssego** | #F4A983 | Secundária (calor, nutrição) |
| **Lavanda** | #B7A6E0 | Acento (premium, celebrações) |
| **Marfim** | #FBF8F3 | Fundo (acolhedor) |
| **Verde Escuro** | #2E3A35 | Texto (em vez de preto puro) |

**Características:**
- ✅ Escalas tonais completas (50–900)
- ✅ WCAG AA acessibilidade (contraste 4,5:1)
- ✅ Daltonismo-friendly (padrões + cores)
- ✅ 8 cores de dados (calorias, proteína, carbs, gordura, fibra, água, peso, passos)
- ✅ Nunca usa vermelho para "excesso de calorias" (evita culpa)

#### **Splash Screen Animada**

```
[Pena em marfim + ponto pêssego]
Bem-vindo à Levia
Mais leve a cada dia

→ Auto-transição em 3 segundos
→ Animações: fade + scale + slide
```

#### **Quiz com 8 Passos**

Fluxo completo de onboarding:

1. **Objetivo** → emagrecer / ganhar / manter
2. **Gênero** → feminino / masculino / outro
3. **Idade** → ≥18 anos
4. **Altura** → cm
5. **Peso** → kg
6. **Meta de Peso** → kg (com validação IMC)
7. **Atividade** → 5 níveis (sedentário a muito ativo)
8. **GLP-1?** → sim / não / não tenho certeza

#### **Cálculo Automático de Metas**

Usa **Mifflin-St Jeor** (fórmula padrão):

```
1. BMR (Basal Metabolic Rate)
2. TDEE = BMR × Fator Atividade
3. Calorias = TDEE × 0.85 (15% deficit)
4. Proteína = Peso × 1.6g
5. Água = Peso × 35ml

Segurança:
- Mínimo: 1.200 kcal (mulheres) / 1.500 kcal (homens)
- IMC ≥ 18.5 (meta não muito baixa)
```

#### **Result Screen**

Mostra metas personalizadas:
```
✓ Suas Metas Calculadas!

🔥 2.000 kcal/dia
🍗 120 g proteína/dia
💧 2,8 L água/dia

[Vamos começar! 🚀]
```

---

## 📁 Estrutura de Pasta

```
Levia-app/
├── app/                          # Expo Router
│   ├── (tabs)/
│   │   ├── index.tsx            # Home (Início)
│   │   ├── journal.tsx          # Diário
│   │   ├── profile.tsx          # Perfil
│   │   └── _layout.tsx          # Abas
│   └── _layout.tsx              # Layout raiz
│
├── src/
│   ├── components/
│   │   ├── Button.tsx           # Botão (3 variantes)
│   │   ├── ThemedText.tsx       # Texto (6 variantes)
│   │   ├── ThemedView.tsx       # View (2 variantes)
│   │   └── LeviaLogo.tsx        # Ícone (4 variantes)
│   │
│   ├── screens/
│   │   ├── OnboardingStack.tsx  # Navegação onboarding
│   │   └── onboarding/
│   │       ├── SplashScreen.tsx # Splash animada
│   │       ├── QuizScreen.tsx   # Quiz (8 passos)
│   │       └── ResultScreen.tsx # Metas calculadas
│   │
│   ├── theme/
│   │   └── colors.ts            # Paleta completa
│   │
│   ├── assets/
│   │   └── icons/
│   │       ├── LeviaBrand.svg
│   │       ├── LeviaBrandMonochrome.svg
│   │       └── LeviaBrandOutline.svg
│   │
│   ├── constants/
│   │   └── colors.ts            # Backup (Etapa 1)
│   │
│   └── hooks/
│       └── useColorScheme.ts     # Dark mode
│
├── docs/                         # Documentação profissional
│   ├── RESUMO_ETAPAS_1_2.md      # Overview completo
│   ├── LEVIA_PALETA_CORES_COMPLETA.md
│   ├── LEVIA_GUIA_IMPLEMENTACAO.md
│   ├── LEVIA_BRAND_ASSETS.md
│   ├── ETAPA_2_CHECKLIST.md
│   ├── TESTE_ETAPA_1.md
│   └── LEVIA_PALETA_VISUAL.txt
│
├── app.json                     # Config Expo
├── tsconfig.json                # TypeScript
├── babel.config.js              # Babel
├── package.json                 # Dependências
└── README.md                    # Este arquivo
```

---

## 📦 Stack Técnico

| Tecnologia | Versão | Motivo |
|------------|--------|--------|
| Expo | 51 | Setup rápido iOS/Android |
| React Native | 0.74 | Nativo em ambas plataformas |
| TypeScript | 5.3 | Type safety |
| Expo Router | latest | Navegação type-safe |
| React Navigation | native-stack | Onboarding stack |
| react-native-svg | latest | Renderizar SVGs |

---

## 🎯 Próxima Etapa (3) — Supabase

**Quando:** Após inputs do Quiz completados

**O que será feito:**
- [ ] PostgreSQL + Auth (Supabase)
- [ ] Tabelas: `profiles`, `weights`, `meals`, `water_logs`
- [ ] Autenticação: Apple, Google, E-mail
- [ ] Row Level Security (RLS)
- [ ] Salvar quiz data no banco
- [ ] Sincronização em tempo real

**Tempo estimado:** 2–3 horas

---

## 📚 Documentação

**Todos os documentos estão em `docs/`:**

1. **RESUMO_ETAPAS_1_2.md** — Overview completo (comece aqui!)
2. **LEVIA_PALETA_CORES_COMPLETA.md** — Sistema de cores em detalhe
3. **LEVIA_GUIA_IMPLEMENTACAO.md** — Exemplos de código
4. **LEVIA_BRAND_ASSETS.md** — Como usar o ícone Levia
5. **ETAPA_2_CHECKLIST.md** — Status de implementação
6. **TESTE_ETAPA_1.md** — Instruções de teste no Expo Go
7. **LEVIA_PALETA_VISUAL.txt** — Resumo ASCII de cores

---

## ✅ Validação

Antes de continuar, execute:

```bash
# Instale dependências
npm install

# Inicie Expo Go
npm start

# Escaneie QR code no celular

# Você deve ver:
✅ Splash screen animada (3s)
✅ Quiz com barra de progresso
✅ Navegação entre passos
✅ Cores sálvia/pêssego corretas
✅ Dark mode automático
```

---

## 🤝 Contribuir

Este é um projeto pessoal de @ferpa2505-art.

**Branch principal:** `main`

**Workflow:**
1. Crie branch feature (`git checkout -b feature/nome`)
2. Commite mudanças (`git commit -am "descrição"`)
3. Push (`git push origin feature/nome`)
4. Abra PR com descrição detalhada

---

## 📄 Licença

Privado. Uso pessoal apenas.

---

## 💬 Perguntas?

Consulte a documentação em `docs/` ou veja os comentários no código.

---

**"Mais leve a cada dia" 🍃**

Última atualização: 20/10/2026
