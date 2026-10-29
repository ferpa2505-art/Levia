/**
 * Textos do LEVI nos cinco idiomas do atendimento. A primeira pergunta é o idioma; tudo o que vem
 * depois (consentimento, objetivos, lembretes, comandos) usa o escolhido.
 * Os textos de consentimento e de dados pessoais merecem revisão de quem fala o idioma
 * (idealmente com apoio jurídico) antes de vender no país correspondente.
 */
export const NUMEROS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

/** Os objetivos ficam gravados sempre nestes textos (português), qualquer que seja o idioma da conversa. */
export const OBJETIVOS_GRAVADOS = [
  'Emagrecer',
  'Controlar diabetes',
  'Acompanhar tratamento com GLP-1',
  'Ganhar massa muscular',
  'Organizar minha alimentação',
  'Todos os acima',
];

export const IDIOMAS_ORDEM = ['pt-BR', 'pt-PT', 'en', 'es', 'it'];

export const MENU_IDIOMA =
  `Olá! 👋 Hello! ¡Hola! Ciao!\n` +
  `Eu sou o *LEVI*, assistente virtual do Leviã. · I'm *LEVI*, Leviã's virtual assistant.\n\n` +
  `🌎 Escolha o idioma · Choose your language · Elige el idioma · Scegli la lingua\n\n` +
  `${NUMEROS[0]} 🇧🇷 Português (Brasil)\n` +
  `${NUMEROS[1]} 🇵🇹 Português (Portugal)\n` +
  `${NUMEROS[2]} 🇬🇧 English\n` +
  `${NUMEROS[3]} 🇪🇸 Español\n` +
  `${NUMEROS[4]} 🇮🇹 Italiano\n\n` +
  `Digite o número · Type the number · Escribe el número · Scrivi il numero`;

export const TOQUE_IDIOMA = 'Ainda por aí? · Still there? · ¿Sigues ahí? · Ci sei? 😊\nDigite 1, 2, 3, 4 ou 5 · Type 1-5';

const lista = (itens) => itens.map((o, i) => `${NUMEROS[i]} ${o}`).join('\n');

export const TEXTOS = {
  'pt-BR': {
    objetivos: ['Emagrecer', 'Controlar diabetes', 'Acompanhar tratamento com GLP-1', 'Ganhar massa muscular', 'Organizar minha alimentação', 'Todos os acima'],
    consentimento: (pol) =>
      `Oi! 👋 Eu sou o *LEVI*, assistente virtual do Leviã. Em 1 minuto libero o seu acesso.\n\n` +
      `Antes, preciso da sua autorização para guardar seu *nome, telefone e objetivo* (que pode ser sobre saúde), ` +
      `só para liberar o acesso e dar suporte. Seus registros de saúde do app ficam no seu aparelho.\n` +
      `Política: ${pol}\n\n` +
      `${NUMEROS[0]} DIGITE *1* PARA *SIM, concordo e quero continuar*\n${NUMEROS[1]} DIGITE *2* PARA *NÃO*`,
    consentimentoNegado: 'Tudo bem, sem problema! Nada foi guardado. Se mudar de ideia, é só me chamar. 👋',
    pedirNome: 'Perfeito! Como posso te chamar?',
    nomeSaudacao: 'Esse parece um cumprimento 😊 Qual é o seu nome?',
    nomeInvalido: 'Não consegui entender o nome. Pode escrever só como prefere ser chamado(a)?',
    pedirObjetivo: (nome, opcoes) => `Prazer, ${nome}! 😊 Qual é o seu principal objetivo?\n\n${lista(opcoes)}\n\nResponda só com o número.`,
    leadCriado: (serial, link) =>
      `Pronto! ✅ Guardei seu nome, telefone e objetivo só para liberar seu acesso.\n\n` +
      `Seu serial (é pessoal, não compartilhe):\n*${serial}*\n\n` +
      `Como usar: abra ${link}, toque em "Ativar" e digite o serial. Ele vale para 2 aparelhos e o teste de 7 dias começa na ativação.\n\n` +
      `Perdeu o serial? Digite *SERIAL*. Para apagar seus dados, digite *APAGAR*. Seus registros de saúde ficam só no seu aparelho.`,
    serialNovo: (serial, link) => `Aqui está seu novo serial (o anterior deixou de valer):\n*${serial}*\n\nAtive em ${link}. Os aparelhos que você já ativou continuam funcionando.`,
    serialIndisponivel: 'Seu cadastro foi feito, mas não consegui gerar o serial agora. Digite *SERIAL* em alguns minutos para tentar de novo.',
    serialLimite: 'Você já pediu serial 3 vezes hoje. Tente de novo amanhã.',
    erro: 'Ops, ocorreu um erro. Tente de novo em instantes ou digite *MENU* para recomeçar.',
    jaFinalizado: 'Você já completou o cadastro! 🎉\n\nPara um novo serial, digite *SERIAL*. Para apagar seus dados, digite *APAGAR*.',
    parar: 'Combinado! Não vou mais te escrever. Se quiser voltar, é só mandar um oi. 👋',
    confirmarApagar: `Tem certeza? Vou apagar seu cadastro e seus dados, e o serial e os aparelhos ativados deixam de valer.\n\n${NUMEROS[0]} DIGITE *1* PARA *APAGAR TUDO*\n${NUMEROS[1]} DIGITE *2* PARA *CANCELAR*`,
    apagado: 'Pronto! Apaguei seu cadastro e os dados que eu tinha de você. Se quiser voltar, é só mandar um oi. 👋',
    apagarCancelado: 'Tudo certo, não apaguei nada. 🙂',
    naoEntendi: 'Não entendi 😅 Responda só com o número.',
    toqueConsentimento: 'Ainda por aí? 😊 Digite *1* para continuar ou *2* para não.',
    toqueNome: 'Ainda por aí? 😊 É só me dizer como posso te chamar.',
    toqueObjetivo: 'Ainda por aí? 😊 Responda só com o número, de 1 a 6.',
    toqueSegundo: 'Sem pressa! Quando quiser, é só responder aqui. Se preferir não continuar, responda *PARAR*.',
    toqueDiaSeguinte: 'Oi, aqui é o *LEVI* do Leviã 👋 Ontem você começou seu cadastro. Quer continuar de onde parou? Se preferir que eu não escreva mais, responda *PARAR*.',
  },

  'pt-PT': {
    objetivos: ['Emagrecer', 'Controlar a diabetes', 'Acompanhar o tratamento com GLP-1', 'Ganhar massa muscular', 'Organizar a minha alimentação', 'Todos os anteriores'],
    consentimento: (pol) =>
      `Olá! 👋 Eu sou o *LEVI*, assistente virtual do Leviã. Em 1 minuto liberto o seu acesso.\n\n` +
      `Antes, preciso da sua autorização para guardar o seu *nome, telemóvel e objetivo* (que pode ser sobre saúde), ` +
      `apenas para libertar o acesso e dar apoio. Os seus registos de saúde da app ficam no seu telemóvel.\n` +
      `Política: ${pol}\n\n` +
      `${NUMEROS[0]} ESCREVA *1* PARA *SIM, concordo e quero continuar*\n${NUMEROS[1]} ESCREVA *2* PARA *NÃO*`,
    consentimentoNegado: 'Sem problema! Não foi guardado nada. Se mudar de ideias, é só falar comigo. 👋',
    pedirNome: 'Perfeito! Como posso tratá-lo(a)?',
    nomeSaudacao: 'Isso parece uma saudação 😊 Qual é o seu nome?',
    nomeInvalido: 'Não consegui perceber o nome. Pode escrever apenas como prefere ser tratado(a)?',
    pedirObjetivo: (nome, opcoes) => `Muito gosto, ${nome}! 😊 Qual é o seu principal objetivo?\n\n${lista(opcoes)}\n\nResponda só com o número.`,
    leadCriado: (serial, link) =>
      `Pronto! ✅ Guardei o seu nome, telemóvel e objetivo apenas para libertar o seu acesso.\n\n` +
      `O seu número de série (é pessoal, não o partilhe):\n*${serial}*\n\n` +
      `Como usar: abra ${link}, toque em "Ativar" e escreva o número de série. Vale para 2 dispositivos e o teste de 7 dias começa na ativação.\n\n` +
      `Perdeu o número de série? Escreva *SERIAL*. Para apagar os seus dados, escreva *APAGAR*. Os seus registos de saúde ficam só no seu telemóvel.`,
    serialNovo: (serial, link) => `Aqui está o seu novo número de série (o anterior deixou de valer):\n*${serial}*\n\nAtive em ${link}. Os dispositivos já ativados continuam a funcionar.`,
    serialIndisponivel: 'O seu registo foi feito, mas não consegui gerar o número de série agora. Escreva *SERIAL* daqui a uns minutos para tentar de novo.',
    serialLimite: 'Já pediu número de série 3 vezes hoje. Tente novamente amanhã.',
    erro: 'Ups, ocorreu um erro. Tente de novo daqui a pouco ou escreva *MENU* para recomeçar.',
    jaFinalizado: 'Já concluiu o registo! 🎉\n\nPara um novo número de série, escreva *SERIAL*. Para apagar os seus dados, escreva *APAGAR*.',
    parar: 'Combinado! Não volto a escrever-lhe. Se quiser voltar, basta enviar um olá. 👋',
    confirmarApagar: `Tem a certeza? Vou apagar o seu registo e os seus dados, e o número de série e os dispositivos ativados deixam de valer.\n\n${NUMEROS[0]} ESCREVA *1* PARA *APAGAR TUDO*\n${NUMEROS[1]} ESCREVA *2* PARA *CANCELAR*`,
    apagado: 'Pronto! Apaguei o seu registo e os dados que tinha sobre si. Se quiser voltar, basta enviar um olá. 👋',
    apagarCancelado: 'Tudo certo, não apaguei nada. 🙂',
    naoEntendi: 'Não percebi 😅 Responda só com o número.',
    toqueConsentimento: 'Ainda por aí? 😊 Escreva *1* para continuar ou *2* para não.',
    toqueNome: 'Ainda por aí? 😊 Basta dizer-me como o(a) devo tratar.',
    toqueObjetivo: 'Ainda por aí? 😊 Responda só com o número, de 1 a 6.',
    toqueSegundo: 'Sem pressa! Quando quiser, responda por aqui. Se preferir não continuar, responda *PARAR*.',
    toqueDiaSeguinte: 'Olá, aqui é o *LEVI* do Leviã 👋 Ontem começou o seu registo. Quer continuar de onde parou? Se preferir que eu não escreva mais, responda *PARAR*.',
  },

  en: {
    objetivos: ['Lose weight', 'Manage diabetes', 'Follow GLP-1 treatment', 'Build muscle', 'Organize my eating', 'All of the above'],
    consentimento: (pol) =>
      `Hi! 👋 I'm *LEVI*, Leviã's virtual assistant. I'll set up your access in about a minute.\n\n` +
      `First, I need your permission to store your *name, phone number and goal* (which may relate to health), ` +
      `only to set up your access and give you support. Your health records in the app stay on your device.\n` +
      `Policy: ${pol}\n\n` +
      `${NUMEROS[0]} TYPE *1* FOR *YES, I agree and want to continue*\n${NUMEROS[1]} TYPE *2* FOR *NO*`,
    consentimentoNegado: 'No problem! Nothing was saved. If you change your mind, just message me. 👋',
    pedirNome: 'Great! What should I call you?',
    nomeSaudacao: "That looks like a greeting 😊 What's your name?",
    nomeInvalido: "I couldn't understand the name. Could you write just what you'd like to be called?",
    pedirObjetivo: (nome, opcoes) => `Nice to meet you, ${nome}! 😊 What is your main goal?\n\n${lista(opcoes)}\n\nReply with the number only.`,
    leadCriado: (serial, link) =>
      `Done! ✅ I saved your name, phone number and goal only to set up your access.\n\n` +
      `Your serial code (it's personal, don't share it):\n*${serial}*\n\n` +
      `How to use it: open ${link}, tap "Activate" and type the serial. It works on 2 devices and the 7-day trial starts when you activate.\n\n` +
      `Lost the serial? Type *SERIAL*. To delete your data, type *DELETE*. Your health records stay only on your device.`,
    serialNovo: (serial, link) => `Here is your new serial (the old one no longer works):\n*${serial}*\n\nActivate at ${link}. Devices you already activated keep working.`,
    serialIndisponivel: "Your sign-up is done, but I couldn't generate the serial right now. Type *SERIAL* in a few minutes to try again.",
    serialLimite: "You've already asked for a serial 3 times today. Please try again tomorrow.",
    erro: 'Oops, something went wrong. Try again in a moment or type *MENU* to start over.',
    jaFinalizado: "You've already completed your sign-up! 🎉\n\nFor a new serial, type *SERIAL*. To delete your data, type *DELETE*.",
    parar: "Understood! I won't message you anymore. If you want to come back, just say hi. 👋",
    confirmarApagar: `Are you sure? I'll delete your sign-up and your data, and the serial and activated devices will stop working.\n\n${NUMEROS[0]} TYPE *1* TO *DELETE EVERYTHING*\n${NUMEROS[1]} TYPE *2* TO *CANCEL*`,
    apagado: 'Done! I deleted your sign-up and the data I had about you. If you want to come back, just say hi. 👋',
    apagarCancelado: "All good, I didn't delete anything. 🙂",
    naoEntendi: "I didn't get that 😅 Reply with the number only.",
    toqueConsentimento: 'Still there? 😊 Type *1* to continue or *2* for no.',
    toqueNome: 'Still there? 😊 Just tell me what I should call you.',
    toqueObjetivo: 'Still there? 😊 Reply with the number only, from 1 to 6.',
    toqueSegundo: 'No rush! Whenever you like, just reply here. If you prefer not to continue, reply *STOP*.',
    toqueDiaSeguinte: "Hi, it's *LEVI* from Leviã 👋 Yesterday you started signing up. Want to pick up where you left off? If you'd rather I stop writing, reply *STOP*.",
  },

  es: {
    objetivos: ['Adelgazar', 'Controlar la diabetes', 'Seguir el tratamiento con GLP-1', 'Ganar masa muscular', 'Organizar mi alimentación', 'Todos los anteriores'],
    consentimento: (pol) =>
      `¡Hola! 👋 Soy *LEVI*, el asistente virtual de Leviã. En 1 minuto activo tu acceso.\n\n` +
      `Antes, necesito tu autorización para guardar tu *nombre, teléfono y objetivo* (que puede ser sobre salud), ` +
      `solo para activar tu acceso y darte soporte. Tus registros de salud de la app se quedan en tu dispositivo.\n` +
      `Política: ${pol}\n\n` +
      `${NUMEROS[0]} ESCRIBE *1* PARA *SÍ, estoy de acuerdo y quiero continuar*\n${NUMEROS[1]} ESCRIBE *2* PARA *NO*`,
    consentimentoNegado: '¡Sin problema! No se guardó nada. Si cambias de opinión, escríbeme. 👋',
    pedirNome: '¡Perfecto! ¿Cómo te puedo llamar?',
    nomeSaudacao: 'Eso parece un saludo 😊 ¿Cómo te llamas?',
    nomeInvalido: 'No pude entender el nombre. ¿Puedes escribir solo cómo prefieres que te llame?',
    pedirObjetivo: (nome, opcoes) => `¡Mucho gusto, ${nome}! 😊 ¿Cuál es tu objetivo principal?\n\n${lista(opcoes)}\n\nResponde solo con el número.`,
    leadCriado: (serial, link) =>
      `¡Listo! ✅ Guardé tu nombre, teléfono y objetivo solo para activar tu acceso.\n\n` +
      `Tu serial (es personal, no lo compartas):\n*${serial}*\n\n` +
      `Cómo usarlo: abre ${link}, toca "Activar" y escribe el serial. Vale para 2 dispositivos y la prueba de 7 días empieza al activar.\n\n` +
      `¿Perdiste el serial? Escribe *SERIAL*. Para borrar tus datos, escribe *BORRAR*. Tus registros de salud se quedan solo en tu dispositivo.`,
    serialNovo: (serial, link) => `Aquí tienes tu nuevo serial (el anterior dejó de valer):\n*${serial}*\n\nActívalo en ${link}. Los dispositivos que ya activaste siguen funcionando.`,
    serialIndisponivel: 'Tu registro está hecho, pero no pude generar el serial ahora. Escribe *SERIAL* en unos minutos para intentarlo de nuevo.',
    serialLimite: 'Ya pediste serial 3 veces hoy. Inténtalo de nuevo mañana.',
    erro: 'Ups, ocurrió un error. Inténtalo de nuevo en un momento o escribe *MENU* para empezar otra vez.',
    jaFinalizado: '¡Ya completaste el registro! 🎉\n\nPara un nuevo serial, escribe *SERIAL*. Para borrar tus datos, escribe *BORRAR*.',
    parar: '¡De acuerdo! No te escribiré más. Si quieres volver, solo manda un hola. 👋',
    confirmarApagar: `¿Seguro? Voy a borrar tu registro y tus datos, y el serial y los dispositivos activados dejarán de valer.\n\n${NUMEROS[0]} ESCRIBE *1* PARA *BORRAR TODO*\n${NUMEROS[1]} ESCRIBE *2* PARA *CANCELAR*`,
    apagado: '¡Listo! Borré tu registro y los datos que tenía sobre ti. Si quieres volver, solo manda un hola. 👋',
    apagarCancelado: 'Todo bien, no borré nada. 🙂',
    naoEntendi: 'No entendí 😅 Responde solo con el número.',
    toqueConsentimento: '¿Sigues ahí? 😊 Escribe *1* para continuar o *2* para no.',
    toqueNome: '¿Sigues ahí? 😊 Solo dime cómo te puedo llamar.',
    toqueObjetivo: '¿Sigues ahí? 😊 Responde solo con el número, del 1 al 6.',
    toqueSegundo: '¡Sin prisa! Cuando quieras, responde aquí. Si prefieres no continuar, responde *PARAR*.',
    toqueDiaSeguinte: 'Hola, soy *LEVI* de Leviã 👋 Ayer empezaste tu registro. ¿Quieres continuar donde lo dejaste? Si prefieres que no escriba más, responde *PARAR*.',
  },

  it: {
    objetivos: ['Dimagrire', 'Controllare il diabete', 'Seguire la terapia con GLP-1', 'Aumentare la massa muscolare', 'Organizzare la mia alimentazione', 'Tutte le precedenti'],
    consentimento: (pol) =>
      `Ciao! 👋 Sono *LEVI*, l'assistente virtuale di Leviã. In 1 minuto attivo il tuo accesso.\n\n` +
      `Prima mi serve la tua autorizzazione a conservare il tuo *nome, numero di telefono e obiettivo* (che può riguardare la salute), ` +
      `solo per attivare l'accesso e darti assistenza. I tuoi dati sanitari nell'app restano sul tuo dispositivo.\n` +
      `Informativa: ${pol}\n\n` +
      `${NUMEROS[0]} SCRIVI *1* PER *SÌ, accetto e voglio continuare*\n${NUMEROS[1]} SCRIVI *2* PER *NO*`,
    consentimentoNegado: 'Nessun problema! Non è stato salvato nulla. Se cambi idea, scrivimi. 👋',
    pedirNome: 'Perfetto! Come posso chiamarti?',
    nomeSaudacao: 'Sembra un saluto 😊 Come ti chiami?',
    nomeInvalido: 'Non sono riuscito a capire il nome. Puoi scrivere solo come preferisci essere chiamato/a?',
    pedirObjetivo: (nome, opcoes) => `Piacere, ${nome}! 😊 Qual è il tuo obiettivo principale?\n\n${lista(opcoes)}\n\nRispondi solo con il numero.`,
    leadCriado: (serial, link) =>
      `Fatto! ✅ Ho salvato il tuo nome, numero di telefono e obiettivo solo per attivare il tuo accesso.\n\n` +
      `Il tuo seriale (è personale, non condividerlo):\n*${serial}*\n\n` +
      `Come usarlo: apri ${link}, tocca "Attiva" e scrivi il seriale. Vale per 2 dispositivi e la prova di 7 giorni inizia con l'attivazione.\n\n` +
      `Hai perso il seriale? Scrivi *SERIAL*. Per cancellare i tuoi dati, scrivi *CANCELLA*. I tuoi dati sanitari restano solo sul tuo dispositivo.`,
    serialNovo: (serial, link) => `Ecco il tuo nuovo seriale (quello vecchio non vale più):\n*${serial}*\n\nAttivalo su ${link}. I dispositivi già attivati continuano a funzionare.`,
    serialIndisponivel: 'La tua registrazione è completa, ma ora non riesco a generare il seriale. Scrivi *SERIAL* tra qualche minuto per riprovare.',
    serialLimite: 'Hai già richiesto il seriale 3 volte oggi. Riprova domani.',
    erro: 'Ops, si è verificato un errore. Riprova tra poco o scrivi *MENU* per ricominciare.',
    jaFinalizado: 'Hai già completato la registrazione! 🎉\n\nPer un nuovo seriale, scrivi *SERIAL*. Per cancellare i tuoi dati, scrivi *CANCELLA*.',
    parar: "D'accordo! Non ti scriverò più. Se vuoi tornare, basta un ciao. 👋",
    confirmarApagar: `Sei sicuro/a? Cancellerò la tua registrazione e i tuoi dati, e il seriale e i dispositivi attivati smetteranno di funzionare.\n\n${NUMEROS[0]} SCRIVI *1* PER *CANCELLARE TUTTO*\n${NUMEROS[1]} SCRIVI *2* PER *ANNULLARE*`,
    apagado: 'Fatto! Ho cancellato la tua registrazione e i dati che avevo su di te. Se vuoi tornare, basta un ciao. 👋',
    apagarCancelado: 'Tutto a posto, non ho cancellato nulla. 🙂',
    naoEntendi: 'Non ho capito 😅 Rispondi solo con il numero.',
    toqueConsentimento: 'Ci sei? 😊 Scrivi *1* per continuare o *2* per no.',
    toqueNome: 'Ci sei? 😊 Dimmi solo come posso chiamarti.',
    toqueObjetivo: 'Ci sei? 😊 Rispondi solo con il numero, da 1 a 6.',
    toqueSegundo: 'Nessuna fretta! Quando vuoi, rispondi qui. Se preferisci non continuare, rispondi *STOP*.',
    toqueDiaSeguinte: 'Ciao, sono *LEVI* di Leviã 👋 Ieri hai iniziato la registrazione. Vuoi continuare da dove eri rimasto/a? Se preferisci che non scriva più, rispondi *STOP*.',
  },
};

/** Idioma pelo número digitado ou por uma palavra ("english", "br", "italiano"…). */
export function idiomaEscolhido(texto) {
  const t = String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
  if (/^[1-5]$/.test(t)) return IDIOMAS_ORDEM[Number(t) - 1];
  const palavras = {
    'pt-BR': ['br', 'brasil', 'brazil', 'portugues brasil', 'portugues do brasil'],
    'pt-PT': ['pt', 'portugal', 'portugues portugal', 'portugues de portugal', 'portugues'],
    en: ['en', 'uk', 'english', 'ingles', 'inglese'],
    es: ['es', 'espanol', 'espana', 'spanish', 'spagnolo'],
    it: ['it', 'ita', 'italiano', 'italia', 'italian'],
  };
  for (const [codigo, lista] of Object.entries(palavras)) if (lista.includes(t)) return codigo;
  return null;
}

/** Para quem já está cadastrado (o idioma da conversa não fica guardado): país do número. */
export function idiomaPeloTelefone(digitos) {
  const d = String(digitos).replace(/\D/g, '');
  if (d.startsWith('351')) return 'pt-PT';
  if (d.startsWith('55')) return 'pt-BR';
  if (d.startsWith('34')) return 'es';
  if (d.startsWith('39')) return 'it';
  if (d.startsWith('44') || d.startsWith('353') || d.startsWith('356') || d.startsWith('1')) return 'en';
  return 'pt-BR';
}
