# 🚀 Como Testar a Etapa 1

## Status: ✅ Pronto para rodar

As dependências foram instaladas com sucesso!

---

## 📱 Passo 1: Instale o Expo Go no seu celular

### iOS:
1. Abra a **App Store**
2. Procure por "Expo Go"
3. Instale (da Expo, Inc.)

### Android:
1. Abra o **Google Play**
2. Procure por "Expo Go"
3. Instale (da Expo, Inc.)

---

## 💻 Passo 2: Inicie o servidor de desenvolvimento

Abra um terminal na pasta do projeto e rode:

```bash
npm start
```

Vai aparecer um menu assim:

```
› Press a │ open Android
› Press i │ open iOS
› Press w │ open web
› Press j │ open debugger
› Press r │ reload app
› Press s │ toggle slow animations
› Press shift+m │ toggle menu
› Press ? │ show all commands
```

---

## 📲 Passo 3: Abra no seu celular

### Se você tem um iPhone:
- Pressione `i` (no terminal)
- Ele vai pedir para ler um QR code
- Leia com a câmera nativa do iOS
- Abre automaticamente no Expo Go

### Se você tem Android:
- Pressione `a` (no terminal)
- Abre o Expo Go automaticamente
- Procura pelos apps em desenvolvimento
- Ou leia o QR code que apareceu no terminal

---

## ✅ O que você deve ver na tela

1. **Saudação grande em verde:**
   - "Olá! 👋"
   - "Bem-vindo ao seu acompanhamento de saúde"

2. **Card com resumo:**
   - "Resumo de Hoje"
   - 3 números: 0 kcal | 0 g proteína | 0 ml água

3. **Card com peso:**
   - "Seu Peso"
   - "-- kg"
   - "Última pesagem: --"

4. **Botão verde grande:**
   - "Começar Configuração"

5. **3 abas na base (toque para navegar):**
   - 🏠 Início (ativa agora)
   - 📔 Diário
   - 👤 Perfil

6. **Versão no rodapé:**
   - "v0.1.0 • Fase 1 de Desenvolvimento"

---

## 🎨 O que você verá sobre cores:

- **Verde suave** (#10B981): títulos, estatísticas principais, botões, abas ativas
- **Pêssego/Laranja** (#F59E0B): proteína e acentos
- **Rosa** (#EC4899): água
- **Cinza claro**: textos secundários
- **Fundo branco**: toda a interface

Se o seu celular tiver **modo escuro ativado**, vai ficar:
- Fundo escuro (#111827)
- Textos claros (#F9FAFB)
- Cores mantêm a harmonia

---

## 🔄 Se algo der errado:

### "Não carrega nada"
```bash
npm start
```
Pressione `r` (no terminal) para recarregar o app

### "Erro de módulo"
```bash
npm install
```
Depois `npm start` de novo

### "Não consegue conectar"
- Confirme que celular e computador estão na mesma rede Wi-Fi
- Escaneie o QR code de novo

---

## 🧪 Teste as abas:

1. Toque em "📔 Diário" → deve aparecer texto "Em breve..."
2. Toque em "👤 Perfil" → deve aparecer texto "Em breve..."
3. Toque em "🏠 Início" → volta para a tela principal

---

## 📝 Próxima etapa:

Quando você confirmar que tudo tá funcionando, começamos a **Etapa 2: Onboarding em Quiz**

Vai ser:
- 8-10 telas de formulário
- Pergunta objetivo, sexo, idade, altura, peso, meta
- Calcula sua meta calórica com as regras de segurança
- Mostra um paywall (pré-configurado para teste)

---

## ❓ Dúvidas?

Se tiver problema:
1. Confirme que tem Node.js instalado: `node --version` (precisa ser 18+)
2. Confirme que tem npm: `npm --version`
3. Tente limpar e reinstalar:
   ```bash
   rm -r node_modules package-lock.json
   npm install
   npm start
   ```
