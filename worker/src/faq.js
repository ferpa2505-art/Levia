/**
 * FAQ data for LEVI WhatsApp bot
 * Covers: how it works, pricing, privacy/LGPD, serial activation, cancellation, technical details, support, commands, common issues
 * Available in 5 languages: pt-BR, pt-PT, en, es, it
 */

const FAQ = {
  'pt-BR': {
    'como_funciona': {
      pergunta: 'Como funciona o Leviã?',
      resposta: `O Leviã é um aplicativo que ajuda você a registrar suas refeições, acompanhar peso, medicação e glicemia. Ele funciona em 3 etapas:

1. Cadastro: Você se cadastra via WhatsApp e recebe um serial único
2. Uso: Registra suas refeições, peso e dados de saúde no app
3. Análise: O app gera relatórios e sugestões personalizadas

O teste de 7 dias é gratuito e não requer cartão de crédito.`,
    },
    'preco': {
      pergunta: 'Quanto custa o Leviã?',
      resposta: `O Leviã tem um plano gratuito com teste de 7 dias e um plano premium mensal de R$ 29,90. O plano premium oferece:

- Acesso ilimitado
- Relatórios avançados
- Suporte prioritário
- Dados sincronizados em múltiplos dispositivos

O serial é válido para 2 aparelhos e não pode ser transferido.`,
    },
    'privacidade': {
      pergunta: 'Como é a política de privacidade do Leviã?',
      resposta: `O Leviã respeita a LGPD e a GDPR. Nós:

1. Não compartilhamos seus dados pessoais
2. Criptografamos seus dados de saúde
3. Permitimos que você exclua seus dados a qualquer momento
4. Não usamos seus dados para publicidade direcionada

Sua chave de criptografia pessoal é gerada no seu dispositivo e nunca é armazenada em nossos servidores.`,
    },
    'ativacao_serial': {
      pergunta: 'Como ativar o serial?',
      resposta: `Para ativar seu serial:

1. Abra o app Leviã no seu celular
2. Toque em "Ativar"
3. Cole o serial que você recebeu via WhatsApp
4. Siga as instruções na tela

O serial é válido para 2 aparelhos e não pode ser transferido. Se você perder o serial, digite "SERIAL" no chat do WhatsApp com o LEVI para receber um novo.`,
    },
    'cancelamento': {
      pergunta: 'Como cancelar a assinatura?',
      resposta: `Para cancelar sua assinatura premium:

1. Abra o app Leviã
2. Vá para Configurações > Assinatura
3. Toque em "Cancelar"
4. Confirme o cancelamento

Após o cancelamento, você terá acesso ao plano gratuito por mais 7 dias. Se você quiser reativar, basta renovar antes do final do período gratuito.`,
    },
    'tecnico': {
      pergunta: 'Quais são os requisitos técnicos?',
      resposta: `Requisitos técnicos para usar o Leviã:

- Celular com iOS 14+ ou Android 8.0+
- Conexão com a internet
- Espaço livre de 100MB no aparelho
- Versão mais recente do app Leviã

O app funciona offline para registrar refeições, mas precisa de conexão para sincronizar dados e receber relatórios.`,
    },
    'suporte': {
      pergunta: 'Como obter suporte?',
      resposta: `Você pode obter suporte de várias maneiras:

1. Chat com o LEVI no WhatsApp
2. E-mail para suporte@leviapp.org
3. Atendimento por telefone: (11) 99999-9999
4. Fórum da comunidade no site do Leviã

Horário de atendimento: segunda a sexta, das 9h às 18h.`,
    },
    'comandos': {
      pergunta: 'Quais são os comandos disponíveis?',
      resposta: `Comandos disponíveis no chat com o LEVI:

- PARAR: Para de receber mensagens
- APAGAR: Exclui todos os seus dados
- SERIAL: Reenvia seu serial
- MENU: Reinicia o cadastro

Você pode usar esses comandos a qualquer momento durante o atendimento.`,
    },
    'problemas_comuns': {
      pergunta: 'Quais são os problemas mais comuns?',
      resposta: `Problemas comuns e soluções:

1. Problema: App não abre
   Solução: Verifique sua conexão com a internet e reinstale o app

2. Problema: Dados não sincronizam
   Solução: Verifique sua conexão e tente novamente mais tarde

3. Problema: Perdi o serial
   Solução: Digite "SERIAL" no chat com o LEVI para receber um novo

4. Problema: Recebi mensagens duplicadas
   Solução: Digite "PARAR" para interromper o atendimento

Se você está enfrentando um problema que não está listado aqui, por favor entre em contato com nosso suporte.`,
    },
  },
  'pt-PT': {
    'como_funciona': {
      pergunta: 'Como funciona o Leviã?',
      resposta: `O Leviã é uma aplicação que ajuda-o a registar as suas refeições, acompanhar peso, medicação e glicemia. Funciona em 3 etapas:

1. Registo: Regista-se via WhatsApp e recebe um número de série único
2. Uso: Regista as suas refeições, peso e dados de saúde na app
3. Análise: A app gera relatórios e sugestões personalizadas

O teste de 7 dias é gratuito e não requer cartão de crédito.`,
    },
    'preco': {
      pergunta: 'Quanto custa o Leviã?',
      resposta: `O Leviã tem um plano gratuito com teste de 7 dias e um plano premium mensal de €29,90. O plano premium oferece:

- Acesso ilimitado
- Relatórios avançados
- Suporte prioritário
- Dados sincronizados em múltiplos dispositivos

O número de série é válido para 2 dispositivos e não pode ser transferido.`,
    },
    'privacidade': {
      pergunta: 'Como é a política de privacidade do Leviã?',
      resposta: `O Leviã respeita a LGPD e a GDPR. Nós:

1. Não partilhamos os seus dados pessoais
2. Criptografamos os seus dados de saúde
3. Permitimos que exclua os seus dados a qualquer momento
4. Não usamos os seus dados para publicidade direcionada

A sua chave de criptografia pessoal é gerada no seu dispositivo e nunca é armazenada nos nossos servidores.`,
    },
    'ativacao_serial': {
      pergunta: 'Como ativar o número de série?',
      resposta: `Para ativar o seu número de série:

1. Abra a app Leviã no seu telemóvel
2. Toque em "Ativar"
3. Cole o número de série que recebeu via WhatsApp
4. Siga as instruções no ecrã

O número de série é válido para 2 dispositivos e não pode ser transferido. Se perder o número de série, escreva "SERIAL" no chat do WhatsApp com o LEVI para receber um novo.`,
    },
    'cancelamento': {
      pergunta: 'Como cancelar a subscrição?',
      resposta: `Para cancelar a sua subscrição premium:

1. Abra a app Leviã
2. Vá para Configurações > Subscrição
3. Toque em "Cancelar"
4. Confirme o cancelamento

Após o cancelamento, terá acesso ao plano gratuito por mais 7 dias. Se quiser reativar, basta renovar antes do final do período gratuito.`,
    },
    'tecnico': {
      pergunta: 'Quais são os requisitos técnicos?',
      resposta: `Requisitos técnicos para usar o Leviã:

- Telemóvel com iOS 14+ ou Android 8.0+
- Conexão com a internet
- Espaço livre de 100MB no dispositivo
- Versão mais recente da app Leviã

A app funciona offline para registar refeições, mas precisa de conexão para sincronizar dados e receber relatórios.`,
    },
    'suporte': {
      pergunta: 'Como obter suporte?',
      resposta: `Pode obter suporte de várias maneiras:

1. Chat com o LEVI no WhatsApp
2. E-mail para suporte@leviapp.org
3. Atendimento por telefone: (351) 99999-9999
4. Fórum da comunidade no site do Leviã

Horário de atendimento: segunda a sexta, das 9h às 18h.`,
    },
    'comandos': {
      pergunta: 'Quais são os comandos disponíveis?',
      resposta: `Comandos disponíveis no chat com o LEVI:

- PARAR: Para de receber mensagens
- APAGAR: Exclui todos os seus dados
- SERIAL: Reenvia seu número de série
- MENU: Reinicia o registo

Pode usar esses comandos a qualquer momento durante o atendimento.`,
    },
    'problemas_comuns': {
      pergunta: 'Quais são os problemas mais comuns?',
      resposta: `Problemas comuns e soluções:

1. Problema: App não abre
   Solução: Verifique a sua conexão com a internet e reinstale a app

2. Problema: Dados não sincronizam
   Solução: Verifique a sua conexão e tente novamente mais tarde

3. Problema: Perdi o número de série
   Solução: Escreva "SERIAL" no chat com o LEVI para receber um novo

4. Problema: Recebi mensagens duplicadas
   Solução: Escreva "PARAR" para interromper o atendimento

Se estiver a enfrentar um problema que não está listado aqui, por favor entre em contato com o nosso suporte.`,
    },
  },
  'en': {
    'como_funciona': {
      pergunta: 'How does Leviã work?',
      resposta: `Leviã is an app that helps you track your meals, weight, medication, and glucose levels. It works in 3 steps:

1. Sign-up: You sign up via WhatsApp and receive a unique serial code
2. Use: Log your meals, weight, and health data in the app
3. Analysis: The app generates personalized reports and suggestions

The 7-day trial is free and doesn't require a credit card.`,
    },
    'preco': {
      pergunta: 'How much does Leviã cost?',
      resposta: `Leviã has a free plan with a 7-day trial and a monthly premium plan of $29.90. The premium plan offers:

- Unlimited access
- Advanced reports
- Priority support
- Data sync across multiple devices

The serial code is valid for 2 devices and cannot be transferred.`,
    },
    'privacidade': {
      pergunta: 'What is Leviã\'s privacy policy?',
      resposta: `Leviã respects LGPD and GDPR. We:

1. Do not share your personal data
2. Encrypt your health data
3. Allow you to delete your data at any time
4. Do not use your data for targeted advertising

Your personal encryption key is generated on your device and never stored on our servers.`,
    },
    'ativacao_serial': {
      pergunta: 'How to activate the serial code?',
      resposta: `To activate your serial code:

1. Open the Leviã app on your phone
2. Tap "Activate"
3. Paste the serial code you received via WhatsApp
4. Follow the on-screen instructions

The serial code is valid for 2 devices and cannot be transferred. If you lose the serial code, type "SERIAL" in the WhatsApp chat with LEVI to receive a new one.`,
    },
    'cancelamento': {
      pergunta: 'How to cancel the subscription?',
      resposta: `To cancel your premium subscription:

1. Open the Leviã app
2. Go to Settings > Subscription
3. Tap "Cancel"
4. Confirm the cancellation

After cancellation, you'll have access to the free plan for another 7 days. If you want to reactivate, just renew before the end of the free period.`,
    },
    'tecnico': {
      pergunta: 'What are the technical requirements?',
      resposta: `Technical requirements to use Leviã:

- Phone with iOS 14+ or Android 8.0+
- Internet connection
- 100MB free space on the device
- Latest version of the Leviã app

The app works offline to log meals, but needs a connection to sync data and receive reports.`,
    },
    'suporte': {
      pergunta: 'How to get support?',
      resposta: `You can get support in several ways:

1. Chat with LEVI on WhatsApp
2. Email support@leviapp.org
3. Phone support: (1) 999-999-9999
4. Community forum on the Leviã website

Support hours: Monday to Friday, 9am to 6pm.`,
    },
    'comandos': {
      pergunta: 'What commands are available?',
      resposta: `Commands available in the LEVI WhatsApp chat:

- STOP: Stop receiving messages
- DELETE: Delete all your data
- SERIAL: Resend your serial code
- MENU: Restart the sign-up

You can use these commands at any time during the chat.`,
    },
    'problemas_comuns': {
      pergunta: 'What are the most common issues?',
      resposta: `Common issues and solutions:

1. Issue: App won't open
   Solution: Check your internet connection and reinstall the app

2. Issue: Data not syncing
   Solution: Check your connection and try again later

3. Issue: Lost the serial code
   Solution: Type "SERIAL" in the LEVI WhatsApp chat to receive a new one

4. Issue: Receiving duplicate messages
   Solution: Type "STOP" to end the chat

If you're experiencing an issue not listed here, please contact our support.`,
    },
  },
  'es': {
    'como_funciona': {
      pergunta: '¿Cómo funciona Leviã?',
      resposta: `Leviã es una aplicación que te ayuda a registrar tus comidas, peso, medicación y niveles de glucosa. Funciona en 3 pasos:

1. Registro: Te registras por WhatsApp y recibes un código de serie único
2. Uso: Registra tus comidas, peso y datos de salud en la app
3. Análisis: La app genera informes y sugerencias personalizadas

La prueba de 7 días es gratuita y no requiere tarjeta de crédito.`,
    },
    'preco': {
      pergunta: '¿Cuánto cuesta Leviã?',
      resposta: `Leviã tiene un plan gratuito con prueba de 7 días y un plan premium mensual de €29,90. El plan premium ofrece:

- Acceso ilimitado
- Informes avanzados
- Soporte prioritario
- Sincronización de datos en múltiples dispositivos

El código de serie es válido para 2 dispositivos y no se puede transferir.`,
    },
    'privacidade': {
      pergunta: '¿Cuál es la política de privacidad de Leviã?',
      resposta: `Leviã respeta LGPD y GDPR. Nosotros:

1. No compartimos tus datos personales
2. Ciframos tus datos de salud
3. Te permitimos eliminar tus datos en cualquier momento
4. No usamos tus datos para publicidad dirigida

Tu clave de cifrado personal se genera en tu dispositivo y nunca se almacena en nuestros servidores.`,
    },
    'ativacao_serial': {
      pergunta: '¿Cómo activar el código de serie?',
      resposta: `Para activar tu código de serie:

1. Abre la app Leviã en tu teléfono
2. Toca "Activar"
3. Pega el código de serie que recibiste por WhatsApp
4. Sigue las instrucciones en pantalla

El código de serie es válido para 2 dispositivos y no se puede transferir. Si pierdes el código de serie, escribe "SERIAL" en el chat de WhatsApp con LEVI para recibir uno nuevo.`,
    },
    'cancelamento': {
      pergunta: '¿Cómo cancelar la suscripción?',
      resposta: `Para cancelar tu suscripción premium:

1. Abre la app Leviã
2. Ve a Configuración > Suscripción
3. Toca "Cancelar"
4. Confirma la cancelación

Después de la cancelación, tendrás acceso al plan gratuito durante otros 7 días. Si quieres reactivar, solo renuévalo antes del final del período gratuito.`,
    },
    'tecnico': {
      pergunta: '¿Cuáles son los requisitos técnicos?',
      resposta: `Requisitos técnicos para usar Leviã:

- Teléfono con iOS 14+ o Android 8.0+
- Conexión a internet
- 100MB de espacio libre en el dispositivo
- Última versión de la app Leviã

La app funciona sin conexión para registrar comidas, pero necesita conexión para sincronizar datos y recibir informes.`,
    },
    'suporte': {
      pergunta: '¿Cómo obtener soporte?',
      resposta: `Puedes obtener soporte de varias formas:

1. Chat con LEVI en WhatsApp
2. Correo electrónico a soporte@leviapp.org
3. Atención por teléfono: (34) 99999-9999
4. Foro de la comunidad en el sitio web de Leviã

Horario de atención: lunes a viernes, de 9am a 6pm.`,
    },
    'comandos': {
      pergunta: '¿Qué comandos están disponibles?',
      resposta: `Comandos disponibles en el chat con LEVI:

- PARAR: Dejar de recibir mensajes
- BORRAR: Eliminar todos tus datos
- SERIAL: Reenviar tu código de serie
- MENU: Reiniciar el registro

Puedes usar estos comandos en cualquier momento durante el chat.`,
    },
    'problemas_comuns': {
      pergunta: '¿Cuáles son los problemas más comunes?',
      resposta: `Problemas comunes y soluciones:

1. Problema: La app no se abre
   Solución: Verifica tu conexión a internet y reinstala la app

2. Problema: Los datos no se sincronizan
   Solución: Verifica tu conexión y vuelve a intentarlo más tarde

3. Problema: Perdí el código de serie
   Solución: Escribe "SERIAL" en el chat con LEVI para recibir uno nuevo

4. Problema: Recibo mensajes duplicados
   Solución: Escribe "PARAR" para finalizar el chat

Si estás experimentando un problema que no está en esta lista, por favor contacta con nuestro soporte.`,
    },
  },
  'it': {
    'como_funciona': {
      pergunta: 'Come funziona Leviã?',
      resposta: `Leviã è un'app che ti aiuta a registrare i tuoi pasti, il peso, la medicazione e i livelli di glicemia. Funziona in 3 fasi:

1. Registrazione: Ti registri tramite WhatsApp e ricevi un codice seriale univoco
2. Uso: Registra i tuoi pasti, il peso e i dati sanitari nell'app
3. Analisi: L'app genera report e suggerimenti personalizzati

La prova di 7 giorni è gratuita e non richiede una carta di credito.`,
    },
    'preco': {
      pergunta: 'Quanto costa Leviã?',
      resposta: `Leviã ha un piano gratuito con prova di 7 giorni e un piano premium mensile di €29,90. Il piano premium offre:

- Accesso illimitato
- Report avanzati
- Supporto prioritario
- Sincronizzazione dati su più dispositivi

Il codice seriale è valido per 2 dispositivi e non può essere trasferito.`,
    },
    'privacidade': {
      pergunta: 'Qual è la politica sulla privacy di Leviã?',
      resposta: `Leviã rispetta LGPD e GDPR. Noi:

1. Non condividiamo i tuoi dati personali
2. Criptiamo i tuoi dati sanitari
3. Ti permettiamo di eliminare i tuoi dati in qualsiasi momento
4. Non usiamo i tuoi dati per pubblicità mirata

La tua chiave di crittografia personale è generata sul tuo dispositivo e non viene mai memorizzata sui nostri server.`,
    },
    'ativacao_serial': {
      pergunta: 'Come attivare il codice seriale?',
      resposta: `Per attivare il tuo codice seriale:

1. Apri l'app Leviã sul tuo telefono
2. Tocca "Attiva"
3. Incolla il codice seriale che hai ricevuto tramite WhatsApp
4. Segui le istruzioni sullo schermo

Il codice seriale è valido per 2 dispositivi e non può essere trasferito. Se perdi il codice seriale, scrivi "SERIAL" nella chat WhatsApp con LEVI per riceverne uno nuovo.`,
    },
    'cancelamento': {
      pergunta: 'Come annullare l\'abbonamento?',
      resposta: `Per annullare il tuo abbonamento premium:

1. Apri l'app Leviã
2. Vai su Impostazioni > Abbonamento
3. Tocca "Annulla"
4. Conferma l'annullamento

Dopo l'annullamento, avrai accesso al piano gratuito per altri 7 giorni. Se vuoi riattivare, basta rinnovare prima della fine del periodo gratuito.`,
    },
    'tecnico': {
      pergunta: 'Quali sono i requisiti tecnici?',
      resposta: `Requisiti tecnici per usare Leviã:

- Telefono con iOS 14+ o Android 8.0+
- Connessione a internet
- 100MB di spazio libero sul dispositivo
- Ultima versione dell'app Leviã

L'app funziona offline per registrare i pasti, ma ha bisogno di una connessione per sincronizzare i dati e ricevere i report.`,
    },
    'suporte': {
      pergunta: 'Come ottenere supporto?',
      resposta: `Puoi ottenere supporto in diversi modi:

1. Chat con LEVI su WhatsApp
2. Email a supporto@leviapp.org
3. Supporto telefonico: (39) 99999-9999
4. Forum della comunità sul sito di Leviã

Orario di supporto: lunedì a venerdì, dalle 9:00 alle 18:00.`,
    },
    'comandos': {
      pergunta: 'Quali comandi sono disponibili?',
      resposta: `Comandi disponibili nella chat con LEVI:

- STOP: Smetti di ricevere messaggi
- CANCELLA: Elimina tutti i tuoi dati
- SERIAL: Rinvia il tuo codice seriale
- MENU: Riavvia la registrazione

Puoi usare questi comandi in qualsiasi momento durante la chat.`,
    },
    'problemas_comuns': {
      pergunta: 'Quali sono i problemi più comuni?',
      resposta: `Problemi comuni e soluzioni:

1. Problema: L'app non si apre
   Soluzione: Controlla la tua connessione a internet e reinstalla l'app

2. Problema: I dati non si sincronizzano
   Soluzione: Controlla la tua connessione e riprova più tardi

3. Problema: Ho perso il codice seriale
   Soluzione: Scrivi "SERIAL" nella chat con LEVI per riceverne uno nuovo

4. Problema: Ricevo messaggi duplicati
   Soluzione: Scrivi "STOP" per terminare la chat

Se stai riscontrando un problema non elencato qui, per favore contatta il nostro supporto.`,
    },
  },
};

/**
 * Busca uma resposta no FAQ para a pergunta fornecida
 * @param {string} pergunta - A pergunta do usuário
 * @param {string} idioma - O idioma da resposta (pt-BR, pt-PT, en, es, it)
 * @returns {string|null} A resposta correspondente ou null se não encontrada
 */
function buscarResposta(pergunta, idioma) {
  const idiomaFAQ = FAQ[idioma] || FAQ['pt-BR'];
  const perguntaNormalizada = pergunta.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  for (const [chave, item] of Object.entries(idiomaFAQ)) {
    const perguntaFAQ = item.pergunta.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    if (perguntaFAQ.includes(perguntaNormalizada) || perguntaNormalizada.includes(perguntaFAQ)) {
      return item.resposta;
    }
  }

  return null;
}

module.exports = {
  FAQ,
  buscarResposta,
};