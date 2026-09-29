# 📋 Ações Para Fazer Agora (Enquanto Build Roda)

**Build ID:** `145ef9b9-4893-4a46-a74a-2ed23c09f836`
**Tempo restante estimado:** 15-25 minutos
**Link para monitorar:** https://expo.dev/accounts/ferpa2505-art/projects/levia-app/builds

---

## 🎯 TAREFA 1: Capturar Screenshots (20 minutos)

### Pré-requisitos
- [ ] Android Emulator aberto OU dispositivo Android conectado
- [ ] App LEVIÃ rodando no dispositivo
- [ ] Câmera de tela pronta (Print Screen ou ferramenta nativa)

### Screenshots Necessários (6-8 total, 1080x1920 pixels)

| # | Tela | Descrição | Comando |
|----|------|-----------|---------|
| 1 | **Home** | Tela inicial com cards | Navegar para Home |
| 2 | **Diabetes Overview** | Resumo geral diabetes | Clique em "Diabetes" |
| 3 | **Glicemia** | Gráfico + histórico glucose | Clique em "Glicemia" |
| 4 | **Medicações** | Lista de medicamentos | Clique em "Medicações" |
| 5 | **Refeições** | Registro de refeições | Clique em "Refeições" |
| 6 | **Notas** | Notas do usuário | Clique em "Notas" |
| 7 | **Adicionar Glicemia** | Modal para nova leitura | Clique no + em Glicemia |
| 8 | **Ícone do App** | Print do home screen | Mostrar ícone do app |

### Como Capturar no Emulador Android

**Opção A - Print Screen Nativo**
```bash
# No emulador, use o atalho nativo
Alt + Print Screen   # Copia para clipboard
# Ou clique em: Extended Controls → Screenshot
```

**Opção B - Usando `adb` (se tem Android SDK)**
```bash
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ./screenshots/
```

### Onde Salvar
```
screenshots/
├── 01-home.png
├── 02-diabetes-overview.png
├── 03-glicemia.png
├── 04-medicacoes.png
├── 05-refeicoes.png
├── 06-notas.png
├── 07-adicionar-glicemia.png
└── 08-app-icon.png
```

### ✅ Validação de Screenshots
- [ ] Cada imagem é 1080x1920 pixels (Google Play exige isso!)
- [ ] Nenhuma barra de sistema visível (limpo)
- [ ] App em português (pt-BR)
- [ ] Dados mockados aparecem corretamente

---

## 🎨 TAREFA 2: Converter Ícone SVG → PNG (5 minutos)

### O Que Fazer
Converter `assets/icon.svg` para PNG 512x512

### Opção A: Converter Online (Recomendado - Sem instalar nada)

1. Acesse: **https://cloudconvert.com/**
2. Clique em "Select File" e escolha `assets/icon.svg`
3. Na seção de output, escolha "PNG"
4. Clique em "Convert"
5. Clique em "Download"
6. Salve como `assets/icon-512.png`

### Opção B: Usar ImageMagick (Se instalado)

```bash
# No terminal/PowerShell
convert assets/icon.svg -resize 512x512 assets/icon-512.png

# Validar tamanho
identify assets/icon-512.png
# Esperado: icon-512.png PNG 512x512 ...
```

### Opção C: Python PIL (Se tem Python + Pillow)

```python
from PIL import Image
import cairosvg
import io

# Render SVG to PNG
cairosvg.svg2png(url="assets/icon.svg", write_to="assets/icon-512.png", output_width=512, output_height=512)
```

### ✅ Validação
- [ ] Arquivo criado: `assets/icon-512.png`
- [ ] Tamanho: Exatamente 512x512 pixels
- [ ] Formato: PNG (não SVG!)
- [ ] Tamanho do arquivo: 50-200 KB (reasonable)

---

## 📄 TAREFA 3: Hostear Documentos Legais (10 minutos)

### O Que Fazer
Colocar `PRIVACIDADE.md` e `TERMOS_SERVICO.md` em URL pública (Google Play exige!)

### Opção A: GitHub Pages (Recomendado - Grátis + Fácil)

#### Passo 1: Criar novo repositório
1. Acesse https://github.com/new
2. Nome: `levia-policies`
3. Descrição: "Privacy Policy and Terms of Service for Leviã App"
4. Visibilidade: **Public** (IMPORTANTE!)
5. Clique em "Create repository"

#### Passo 2: Upload dos arquivos
```bash
# No seu terminal, dentro do repo
cd levia-policies

# Copiar arquivos
cp ../ferpa2505-art-levia/PRIVACIDADE.md .
cp ../ferpa2505-art-levia/TERMOS_SERVICO.md .

# Commit
git add PRIVACIDADE.md TERMOS_SERVICO.md
git commit -m "Add legal documents for Leviã app"
git push
```

#### Passo 3: Ativar GitHub Pages
1. Acesse Settings do repo
2. Clique em "Pages" (esquerda)
3. Em "Branch", selecione "main"
4. Clique em "Save"
5. Aguarde alguns segundos

#### Passo 4: Copiar URLs
As URLs serão (troque `seu-username`):
- 🔗 **Privacidade:** `https://seu-username.github.io/levia-policies/PRIVACIDADE.md`
- 🔗 **Termos:** `https://seu-username.github.io/levia-policies/TERMOS_SERVICO.md`

**IMPORTANTE:** Anote essas URLs - você vai precisar ao submeter no Google Play Console!

### Opção B: Usar Site Hospedado (Se tem servidor)

Se tiver servidor próprio ou domínio, pode fazer upload direto:
```bash
scp PRIVACIDADE.md user@seu-servidor:/var/www/policies/
scp TERMOS_SERVICO.md user@seu-servidor:/var/www/policies/
```

Então as URLs seriam:
- `https://seu-dominio.com/policies/PRIVACIDADE.md`
- `https://seu-dominio.com/policies/TERMOS_SERVICO.md`

### ✅ Validação
- [ ] Repo `levia-policies` criado e público
- [ ] Ambos arquivos visíveis no repositório
- [ ] GitHub Pages ativado
- [ ] URLs funcionam (teste no navegador)
- [ ] Conteúdo apareça corretamente
- [ ] URLs anotadas e salvas

---

## 📊 Checklist de Conclusão

Quando o build terminar (vai receber email do EAS):

- [ ] **Screenshots:** 6-8 imagens em `screenshots/`
- [ ] **Ícone:** `assets/icon-512.png` (512x512)
- [ ] **URLs Legais:** Privacidade e Termos hospedados online
- [ ] **AAB Download:** Arquivo `.aab` baixado (do email/EAS console)
- [ ] **app.json:** Ainda válido com package `com.levia.app`

Quando tudo acima estiver pronto → Você pode submeter ao Google Play Console!

---

## ⏰ Timeline Esperada

| Tempo | Ação | Status |
|-------|------|--------|
| **Agora** | 🔨 Build Android em progresso | ⏳ |
| **+5 min** | 🎨 Converter ícone | 📋 |
| **+15 min** | 📸 Capturar screenshots | 📋 |
| **+25 min** | 📄 Hostear documentos | 📋 |
| **+30 min** | ✅ Build completo (email) | 📋 |
| **+35 min** | 📥 Download AAB | 📋 |
| **+40 min** | ✅ Tudo pronto para submissão | ✅ |

---

## Se Precisar de Ajuda

### Ferramenta Online para Screenshots (Alternativa)
Sem emulador? Use: https://appetize.io/ (executa seu app na nuvem)

### Se não conseguir converter ícone
Tem um ícone padrão que Google Play aceitará - não é bloqueador!

### Se GitHub Pages não funcionar
Use alternativa: Criar pasta `/docs` em repo existente

---

**Build Status:** https://expo.dev/accounts/ferpa2505-art/projects/levia-app/builds/145ef9b9-4893-4a46-a74a-2ed23c09f836
