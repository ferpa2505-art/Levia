# 🧪 GUIA DE TESTES - MÓDULO DIABETES

**Objetivo**: Validar todas as features do módulo Diabetes  
**Tempo Estimado**: 15-20 minutos  
**Dispositivo**: Qualquer Android/iOS com Expo Go

---

## 📱 PREPARAÇÃO

### Passo 1: Iniciar Expo
```bash
# Terminal no diretório do projeto
npm start

# Aguarde até ver:
# "QR code loaded, press q to toggle"
```

### Passo 2: Abrir no Expo Go
**Android/iOS**:
1. Abra o app **Expo Go**
2. Escanear o **QR code** que aparecer no terminal
3. Aguarde carregamento (30-60 segundos primeira vez)

---

## ✅ CHECKLIST DE TESTES

### 🔴 TESTE 1: Aba Diabetes Carregada
**Objetivo**: Verificar que a aba existe e carrega corretamente

```
[ ] 1.1 - App abre sem erros
[ ] 1.2 - Na navegação inferior (tabs), procure por "Diabetes" 
        (deve estar entre "Diário" e "Exercícios")
[ ] 1.3 - Clique em "Diabetes"
[ ] 1.4 - Tela carrega mostrando 4 seções:
        - Glicemia
        - Medicações
        - Refeições
        - Notas
[ ] 1.5 - Tela não mostra erros ou "undefined"
```

**Esperado**: ✅ Aba Diabetes funciona perfeitamente

---

### 🔴 TESTE 2: Adicionar Glicemia

```
[ ] 2.1 - Na aba Diabetes, seção "Glicemia", clique em "Adicionar"
[ ] 2.2 - Modal abre com campos:
        - Valor (número)
        - Hora (automática, pode editar)
        - Notas (opcional)
[ ] 2.3 - Digite um valor (ex: 145)
[ ] 2.4 - Clique "Salvar"
[ ] 2.5 - Registro aparece na lista acima
[ ] 2.6 - Mostra: "145 mg/dL às 14:30" (ou hora atual)
[ ] 2.7 - Clique no ícone de lixo para deletar
[ ] 2.8 - Registro desaparece
```

**Esperado**: ✅ Glicemia pode ser adicionada e removida

---

### 🔴 TESTE 3: Adicionar Medicação SEM Alarme Obrigatório

```
[ ] 3.1 - Seção "Medicações", clique "Adicionar"
[ ] 3.2 - Modal abre com seleção de medicação
[ ] 3.3 - Selecione "Losartana" (NÃO é insulina)
[ ] 3.4 - Campo "Uso Contínuo" aparece - DESMARQUE
[ ] 3.5 - Clique "Continuar"
[ ] 3.6 - Configurador de Alarme abre MAS é OPCIONAL
         (não pode avançar se deixar em branco? Verificar!)
[ ] 3.7 - Clique "Salvar sem Alarme" (ou similar)
[ ] 3.8 - Medicação aparece na lista
[ ] 3.9 - Mostra: "Losartana" sem indicator de alarme
```

**Esperado**: ✅ Medicação sem obrigação de alarme funciona

---

### 🔴 TESTE 4: Adicionar Medicação COM Alarme Obrigatório (Insulina)

```
[ ] 4.1 - Clique "Adicionar" novamente
[ ] 4.2 - Selecione "Insulina Rápida"
[ ] 4.3 - Aparece aviso: "Alarme obrigatório para insulina"
[ ] 4.4 - Clique "Continuar"
[ ] 4.5 - Tela de Configurador de Alarme abre
        (OBRIGATÓRIA, não pode pular)
[ ] 4.6 - Dropdown de frequência aparece com opções:
        - A cada 1h, 2h, 3h, 4h, 6h, 8h, 12h
        - Diário, Semanal, Quinzenal, Mensal
[ ] 4.7 - Selecione "A cada 12 horas"
[ ] 4.8 - Toggle "Ativar Notificação" aparece - MARQUE
[ ] 4.9 - Clique "Confirmar Alarme"
[ ] 4.10 - Medicação aparece na lista com:
         - Ícone de sino (alarme ativo)
         - Texto: "Insulina Rápida - Próxima dose: 14:30 (12h)"
```

**Esperado**: ✅ Insulina com alarme obrigatório funciona

---

### 🔴 TESTE 5: Medicação com Uso Contínuo

```
[ ] 5.1 - Clique "Adicionar Medicação"
[ ] 5.2 - Selecione "Metformina" (normal)
[ ] 5.3 - Campo "Uso Contínuo" aparece - MARQUE
[ ] 5.4 - Aviso aparece: "Frequência e notificação obrigatórias"
[ ] 5.5 - Clique "Continuar"
[ ] 5.6 - Configurador abre e campos estão OBRIGATÓRIOS
         (botão Salvar está desativado até preencher)
[ ] 5.7 - Selecione frequência "Diário"
[ ] 5.8 - Ative notificação
[ ] 5.9 - Clique "Confirmar"
[ ] 5.10 - Medicação aparece com alarme ativo
```

**Esperado**: ✅ Uso contínuo força alarme obrigatório

---

### 🔴 TESTE 6: Adicionar Refeição

```
[ ] 6.1 - Seção "Refeições", clique "Adicionar"
[ ] 6.2 - Modal abre com:
        - Tipo de refeição (dropdown): Café, Almoço, Lanche, Jantar
        - Alimento (campo texto)
        - Quantidade (número)
        - Hora (automática)
[ ] 6.3 - Selecione "Almoço"
[ ] 6.4 - Digite: "Arroz com feijão"
[ ] 6.5 - Quantidade: 200g
[ ] 6.6 - Clique "Salvar"
[ ] 6.7 - Refeição aparece: "Almoço - Arroz com feijão (200g)"
[ ] 6.8 - Clique lixo para deletar
```

**Esperado**: ✅ Refeição adicionada e removida

---

### 🔴 TESTE 7: Adicionar Nota

```
[ ] 7.1 - Seção "Notas", clique "Adicionar"
[ ] 7.2 - Modal abre com campo de texto
[ ] 7.3 - Digite: "Senti tonteira após refeição rica em carboidratos"
[ ] 7.4 - Clique "Salvar"
[ ] 7.5 - Nota aparece na lista
[ ] 7.6 - Clique lixo para deletar
```

**Esperado**: ✅ Nota adicionada e removida

---

### 🔴 TESTE 8: Onboarding de Diabetes (Primeira Execução)

```
[ ] 8.1 - Se PRIMEIRA VEZ no app, irá para onboarding
[ ] 8.2 - Procure pergunta: "Você tem diabetes tipo 1 ou tipo 2?"
[ ] 8.3 - Opções aparecem:
        - Diabetes Tipo 1 (Autoimune)
        - Diabetes Tipo 2 (Resistência à insulina)
        - Pré-Diabetes
[ ] 8.4 - Clique em uma opção
[ ] 8.5 - Descrição detalhada aparece
[ ] 8.6 - Botão "Confirmar tipo" fica disponível
[ ] 8.7 - Clique "Confirmar"
[ ] 8.8 - Onboarding continua (deve avançar)
[ ] 8.9 - Tipo escolhido é persistido no perfil
         (pode verificar depois em Perfil > Meus Dados)
```

**Esperado**: ✅ Onboarding diabetes funciona

---

### 🔴 TESTE 9: Food Recognition (Câmera)

```
[ ] 9.1 - Vá para aba "Início" (tab Home)
[ ] 9.2 - Procure botão 📷 (câmera) na seção superior
[ ] 9.3 - Clique no botão
[ ] 9.4 - Permissão de câmera é pedida - ACEITE
[ ] 9.5 - App abre câmera
[ ] 9.6 - Tire foto de um alimento (pode ser qualquer coisa)
[ ] 9.7 - Foto é capturada
[ ] 9.8 - Tela de análise carrega
[ ] 9.9 - Mostra:
        - Alimento detectado (ex: "Maçã")
        - Calorias
        - Carboidratos
        - Proteína
        - Gordura
        - Fibra
        - Índice Glicêmico (importante para diabéticos)
[ ] 9.10 - Botão "Adicionar à Refeição" funciona
[ ] 9.11 - Refeição aparece na aba Diabetes
```

**Esperado**: ✅ Câmera e análise funcionam

---

### 🔴 TESTE 10: Payment System (Premium)

```
[ ] 10.1 - Vá para aba "Perfil"
[ ] 10.2 - Procure card: "Versão Premium 👑"
[ ] 10.3 - Clique no card
[ ] 10.4 - Tela de preços abre com 2 planos:
         - Mensal: R$ 19,90/mês
         - Anual: R$ 155,76/ano (20% desconto)
[ ] 10.5 - Clique em um plano
[ ] 10.6 - Modal de compra aparece
[ ] 10.7 - Botão "Comprar Agora" (ou similar)
[ ] 10.8 - Clique em "Comprar"
[ ] 10.9 - Simulação de compra roda (pode ser mock)
[ ] 10.10 - Status muda para "Premium Ativo ✅"
[ ] 10.11 - Card no perfil agora mostra "Premium ✅"
```

**Esperado**: ✅ Payment system funciona

---

### 🔴 TESTE 11: Idiomas (Verificar 3 idiomas)

```
[ ] 11.1 - Vá para Perfil > Menu ⋮
[ ] 11.2 - Clique "Idioma"
[ ] 11.3 - Mude para "English (USA)"
[ ] 11.4 - App muda para inglês imediatamente
[ ] 11.5 - Diabetes tab aparece como "Diabetes" (não muda)
[ ] 11.6 - Outros textos: "Glucose", "Medications", etc em inglês
[ ] 11.7 - Vá para Diabetes tab - textos em inglês
[ ] 11.8 - Volte para Perfil > Idioma
[ ] 11.9 - Mude para "Español"
[ ] 11.10 - App muda para espanhol
[ ] 11.11 - Diabetes: "Diabetes"
[ ] 11.12 - Volta para "Português (Brasil)"
[ ] 11.13 - Textos em português
```

**Esperado**: ✅ Idiomas funcionam corretamente

---

## 🚨 PROBLEMAS CONHECIDOS

### Se Diabetes Tab NÃO aparecer
1. Limpe cache do Expo Go:
   - Android: Configurações > Apps > Expo Go > Armazenamento > Limpar Cache
   - iOS: Desinstale e reinstale Expo Go

2. Reinicie o Expo:
   ```bash
   npm start
   ```

3. Escanear QR code novamente

### Se Alarme não funciona
1. Verifique se notificações estão ativadas no dispositivo
2. Permissão de notificação foi dada ao Expo Go?

### Se Food Recognition falha
1. É normal se dispositivo não tem conexão (usa mock database)
2. Câmera funciona? Teste em outro app

### Se Payment não funciona
1. Mock purchase - pode clicar "Skip" se falhar
2. Antes de publicar, adicionar API Key real do RevenueCat

---

## ✅ RESULTADO ESPERADO

Ao final de TODOS os testes acima, você deverá ter:

- ✅ Aba Diabetes visível e funcional
- ✅ 3+ registros de glicemia
- ✅ 2+ medicações (uma com alarme, uma sem)
- ✅ 2+ refeições
- ✅ 1+ nota
- ✅ Onboarding Diabetes completo
- ✅ Food Recognition funcionando
- ✅ Payment System ativo (premium)
- ✅ Idiomas alternados funcionando

---

## 📊 RELATÓRIO FINAL

Ao terminar os testes, reporte:

```
DIABETES MODULE - TEST REPORT
==============================

Data: [hoje]
Dispositivo: [Android/iOS]
Versão Expo: [x.x.x]

Testes Passados: __/11
Testes Falhados: __/11
Bugs Encontrados: 0

Observações:
[Aqui coloque qualquer feedback]

Pronto para publicação: [ ] SIM  [ ] NÃO
```

---

## 🎯 CONCLUSÃO

Se TODOS os 11 testes passarem, o módulo Diabetes está pronto para:
1. ✅ Produção
2. ✅ Google Play Store
3. ✅ Apple App Store

**Parabéns! LEVIA está pronto para publicação! 🎉**
