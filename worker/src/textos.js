/**
 * Textos do LEVI nos cinco idiomas do atendimento. A primeira pergunta é o idioma; tudo o que vem
 * depois (consentimento, e-mail, objetivos, serial, lembretes, comandos) usa o escolhido.
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
/** "Renata, " quando o nome é conhecido; vazio quando ainda não. */
const chamar = (nome) => (nome ? `${nome}, ` : '');

export const TEXTOS = {
  'pt-BR': {
    objetivos: ['Emagrecer', 'Controlar diabetes', 'Acompanhar tratamento com GLP-1', 'Ganhar massa muscular', 'Organizar minha alimentação', 'Todos os acima'],
    consentimento: (pol) =>
      `Oi! 👋 Eu sou o *LEVI*, assistente virtual do Leviã. Em 1 minuto libero o seu acesso.\n\n` +
      `Antes, preciso da sua autorização para guardar seu *nome, telefone, e-mail (se você informar) e objetivo* (que pode ser sobre saúde), ` +
      `só para liberar o acesso e dar suporte. Seus registros de saúde do app ficam no seu aparelho.\n` +
      `Política: ${pol}\n\n` +
      `${NUMEROS[0]} DIGITE *1* PARA *SIM, concordo e quero continuar*\n${NUMEROS[1]} DIGITE *2* PARA *NÃO*`,
    consentimentoNegado: 'Tudo bem, sem problema! Nada foi guardado. Se mudar de ideia, é só me chamar. 👋',
    pedirNome: 'Perfeito! Como posso te chamar?',
    nomeSaudacao: 'Esse parece um cumprimento 😊 Qual é o seu nome?',
    nomeInvalido: 'Não consegui entender o nome. Pode escrever só como prefere ser chamado(a)?',
    pedirEmail: (nome) => `Prazer, ${nome}! 😊 Qual é o seu e-mail? É só para recuperar seu acesso e te avisar de algo importante.\n\nSe preferir não informar, digite *2*.`,
    emailInvalido: 'Esse e-mail não parece válido 🤔 Confira e envie de novo, ou digite *2* para pular.',
    pedirObjetivo: (nome, opcoes) => `Quase lá, ${nome}! Qual é o seu principal objetivo?\n\n${lista(opcoes)}\n\nResponda só com o número.`,
    serialIntro: (nome) =>
      `Pronto, ${nome}! ✅ Guardei seus dados só para liberar o seu acesso.\n\n` +
      `Agora vou te mandar o seu *serial*: é a sua chave pessoal de acesso ao Leviã. Ele garante que só quem passou por aqui usa o app e protege os seus dados. ` +
      `Vale para 2 aparelhos e não deve ser compartilhado.\n\nVou enviar o serial na *próxima mensagem*, sozinho, para ficar fácil de copiar 👇`,
    serialUso: (link) =>
      `Para usar: abra ${link}, toque em "Ativar" e cole o serial acima. O teste de 7 dias começa na ativação.\n\n` +
      `Perdeu o serial? Digite *SERIAL*. Para apagar seus dados, digite *APAGAR*. Seus registros de saúde ficam só no seu aparelho.`,
    serialNovoIntro: 'Aqui está o seu novo serial (o anterior deixou de valer). Vou mandar sozinho na próxima mensagem, para ficar fácil de copiar 👇',
    serialNovoUso: (link) => `Ative em ${link}. Os aparelhos que você já ativou continuam funcionando.`,
    videoLegenda: (nome) => `${chamar(nome)}conheça o Leviã em 20 segundos 👇`,
    serialIndisponivel: 'Seu cadastro foi feito, mas não consegui gerar o serial agora. Digite *SERIAL* em alguns minutos para tentar de novo.',
    serialLimite: 'Você já pediu serial 3 vezes hoje. Tente de novo amanhã.',
    erro: 'Ops, ocorreu um erro. Tente de novo em instantes ou digite *MENU* para recomeçar.',
    jaFinalizado: 'Você já completou o cadastro! 🎉\n\nPara um novo serial, digite *SERIAL*. Para apagar seus dados, digite *APAGAR*.',
    parar: 'Combinado! Não vou mais te escrever. Se quiser voltar, é só mandar um oi. 👋',
    confirmarApagar: `Tem certeza? Vou apagar seu cadastro e seus dados, e o serial e os aparelhos ativados deixam de valer.\n\n${NUMEROS[0]} DIGITE *1* PARA *APAGAR TUDO*\n${NUMEROS[1]} DIGITE *2* PARA *CANCELAR*`,
    apagado: 'Pronto! Apaguei seu cadastro e os dados que eu tinha de você. Se quiser voltar, é só mandar um oi. 👋',
    apagarCancelado: 'Tudo certo, não apaguei nada. 🙂',
    naoEntendi: 'Não entendi 😅 Responda só com o número.',
    handoff: 'Vou passar a sua conversa para uma pessoa da equipe. Pode levar um tempo, mas alguém vai te responder por aqui. 🙏',
    siteLinha: (url) => `Quer conhecer os planos ou assinar? Acesse ${url} 💚`,
    toqueConsentimento: 'Ainda por aí? 😊 Digite *1* para continuar ou *2* para não.',
    toqueNome: 'Ainda por aí? 😊 É só me dizer como posso te chamar.',
    toqueEmail: (nome) => `${chamar(nome)}ainda por aí? 😊 Pode enviar seu e-mail ou digitar *2* para pular.`,
    toqueObjetivo: (nome) => `${chamar(nome)}ainda por aí? 😊 Responda só com o número, de 1 a 6.`,
    toqueSegundo: (nome) =>
      `${chamar(nome)}falta pouquinho! ⏳ Em menos de 1 minuto você libera seu acesso ao Leviã e começa o teste de 7 dias. ` +
      `Quer continuar? É só responder aqui. Se preferir não receber mais mensagens, responda *PARAR*.`,
    toqueDiaSeguinte: (nome) =>
      `Oi${nome ? `, ${nome}` : ''}! 😊 Aqui é o *LEVI*, do Leviã. Ontem você começou seu cadastro e ficou faltando só um pouquinho.\n\n` +
      `O Leviã te ajuda a registrar suas refeições (até com foto 📸), acompanhar peso, medicação e glicemia, tudo no seu celular, com 7 dias de teste. ` +
      `Quer continuar de onde parou? É só responder aqui 💚\n\nSe preferir que eu não escreva mais, responda *PARAR*.`,
  },

  'pt-PT': {
    objetivos: ['Emagrecer', 'Controlar a diabetes', 'Acompanhar o tratamento com GLP-1', 'Ganhar massa muscular', 'Organizar a minha alimentação', 'Todos os anteriores'],
    consentimento: (pol) =>
      `Olá! 👋 Eu sou o *LEVI*, assistente virtual do Leviã. Em 1 minuto liberto o seu acesso.\n\n` +
      `Antes, preciso da sua autorização para guardar o seu *nome, telemóvel, e-mail (se o indicar) e objetivo* (que pode ser sobre saúde), ` +
      `apenas para libertar o acesso e dar apoio. Os seus registos de saúde da app ficam no seu telemóvel.\n` +
      `Política: ${pol}\n\n` +
      `${NUMEROS[0]} ESCREVA *1* PARA *SIM, concordo e quero continuar*\n${NUMEROS[1]} ESCREVA *2* PARA *NÃO*`,
    consentimentoNegado: 'Sem problema! Não foi guardado nada. Se mudar de ideias, é só falar comigo. 👋',
    pedirNome: 'Perfeito! Como posso tratá-lo(a)?',
    nomeSaudacao: 'Isso parece uma saudação 😊 Qual é o seu nome?',
    nomeInvalido: 'Não consegui perceber o nome. Pode escrever apenas como prefere ser tratado(a)?',
    pedirEmail: (nome) => `Muito gosto, ${nome}! 😊 Qual é o seu e-mail? É só para recuperar o seu acesso e avisá-lo(a) de algo importante.\n\nSe preferir não indicar, escreva *2*.`,
    emailInvalido: 'Esse e-mail não parece válido 🤔 Confirme e envie de novo, ou escreva *2* para saltar.',
    pedirObjetivo: (nome, opcoes) => `Quase lá, ${nome}! Qual é o seu principal objetivo?\n\n${lista(opcoes)}\n\nResponda só com o número.`,
    serialIntro: (nome) =>
      `Pronto, ${nome}! ✅ Guardei os seus dados apenas para libertar o seu acesso.\n\n` +
      `Agora vou enviar-lhe o seu *número de série*: é a sua chave pessoal de acesso ao Leviã. Garante que só quem passou por aqui usa a app e protege os seus dados. ` +
      `Vale para 2 dispositivos e não deve ser partilhado.\n\nVou enviá-lo na *próxima mensagem*, sozinho, para ser fácil de copiar 👇`,
    serialUso: (link) =>
      `Para usar: abra ${link}, toque em "Ativar" e cole o número de série acima. O teste de 7 dias começa na ativação.\n\n` +
      `Perdeu o número de série? Escreva *SERIAL*. Para apagar os seus dados, escreva *APAGAR*. Os seus registos de saúde ficam só no seu telemóvel.`,
    serialNovoIntro: 'Aqui está o seu novo número de série (o anterior deixou de valer). Vou enviá-lo sozinho na próxima mensagem, para ser fácil de copiar 👇',
    serialNovoUso: (link) => `Ative em ${link}. Os dispositivos já ativados continuam a funcionar.`,
    videoLegenda: (nome) => `${chamar(nome)}conheça o Leviã em 20 segundos 👇`,
    serialIndisponivel: 'O seu registo foi feito, mas não consegui gerar o número de série agora. Escreva *SERIAL* daqui a uns minutos para tentar de novo.',
    serialLimite: 'Já pediu número de série 3 vezes hoje. Tente novamente amanhã.',
    erro: 'Ups, ocorreu um erro. Tente de novo daqui a pouco ou escreva *MENU* para recomeçar.',
    jaFinalizado: 'Já concluiu o registo! 🎉\n\nPara um novo número de série, escreva *SERIAL*. Para apagar os seus dados, escreva *APAGAR*.',
    parar: 'Combinado! Não volto a escrever-lhe. Se quiser voltar, basta enviar um olá. 👋',
    confirmarApagar: `Tem a certeza? Vou apagar o seu registo e os seus dados, e o número de série e os dispositivos ativados deixam de valer.\n\n${NUMEROS[0]} ESCREVA *1* PARA *APAGAR TUDO*\n${NUMEROS[1]} ESCREVA *2* PARA *CANCELAR*`,
    apagado: 'Pronto! Apaguei o seu registo e os dados que tinha sobre si. Se quiser voltar, basta enviar um olá. 👋',
    apagarCancelado: 'Tudo certo, não apaguei nada. 🙂',
    naoEntendi: 'Não percebi 😅 Responda só com o número.',
    handoff: 'Vou passar a sua conversa a uma pessoa da equipa. Pode demorar um pouco, mas alguém vai responder-lhe por aqui. 🙏',
    siteLinha: (url) => `Quer conhecer os planos ou subscrever? Aceda a ${url} 💚`,
    toqueConsentimento: 'Ainda por aí? 😊 Escreva *1* para continuar ou *2* para não.',
    toqueNome: 'Ainda por aí? 😊 Basta dizer-me como o(a) devo tratar.',
    toqueEmail: (nome) => `${chamar(nome)}ainda por aí? 😊 Pode enviar o seu e-mail ou escrever *2* para saltar.`,
    toqueObjetivo: (nome) => `${chamar(nome)}ainda por aí? 😊 Responda só com o número, de 1 a 6.`,
    toqueSegundo: (nome) =>
      `${chamar(nome)}falta pouco! ⏳ Em menos de 1 minuto liberta o seu acesso ao Leviã e começa o teste de 7 dias. ` +
      `Quer continuar? Basta responder aqui. Se preferir não receber mais mensagens, responda *PARAR*.`,
    toqueDiaSeguinte: (nome) =>
      `Olá${nome ? `, ${nome}` : ''}! 😊 Aqui é o *LEVI*, do Leviã. Ontem começou o seu registo e faltou só um bocadinho.\n\n` +
      `O Leviã ajuda-o(a) a registar as refeições (até com foto 📸), acompanhar peso, medicação e glicemia, tudo no telemóvel, com 7 dias de teste. ` +
      `Quer continuar de onde parou? Basta responder aqui 💚\n\nSe preferir que eu não escreva mais, responda *PARAR*.`,
  },

  en: {
    objetivos: ['Lose weight', 'Manage diabetes', 'Follow GLP-1 treatment', 'Build muscle', 'Organize my eating', 'All of the above'],
    consentimento: (pol) =>
      `Hi! 👋 I'm *LEVI*, Leviã's virtual assistant. I'll set up your access in about a minute.\n\n` +
      `First, I need your permission to store your *name, phone number, email (if you give it) and goal* (which may relate to health), ` +
      `only to set up your access and give you support. Your health records in the app stay on your device.\n` +
      `Policy: ${pol}\n\n` +
      `${NUMEROS[0]} TYPE *1* FOR *YES, I agree and want to continue*\n${NUMEROS[1]} TYPE *2* FOR *NO*`,
    consentimentoNegado: 'No problem! Nothing was saved. If you change your mind, just message me. 👋',
    pedirNome: 'Great! What should I call you?',
    nomeSaudacao: "That looks like a greeting 😊 What's your name?",
    nomeInvalido: "I couldn't understand the name. Could you write just what you'd like to be called?",
    pedirEmail: (nome) => `Nice to meet you, ${nome}! 😊 What's your email? It's only to recover your access and tell you something important.\n\nIf you'd rather not share it, type *2*.`,
    emailInvalido: "That email doesn't look valid 🤔 Check it and send it again, or type *2* to skip.",
    pedirObjetivo: (nome, opcoes) => `Almost there, ${nome}! What is your main goal?\n\n${lista(opcoes)}\n\nReply with the number only.`,
    serialIntro: (nome) =>
      `Done, ${nome}! ✅ I saved your details only to set up your access.\n\n` +
      `Now I'll send you your *serial code*: it's your personal key to Leviã. It makes sure only people who went through here use the app, and it protects your data. ` +
      `It works on 2 devices and shouldn't be shared.\n\nI'll send the serial in the *next message*, on its own, so it's easy to copy 👇`,
    serialUso: (link) =>
      `To use it: open ${link}, tap "Activate" and paste the serial above. The 7-day trial starts when you activate.\n\n` +
      `Lost the serial? Type *SERIAL*. To delete your data, type *DELETE*. Your health records stay only on your device.`,
    serialNovoIntro: "Here is your new serial (the old one no longer works). I'll send it on its own in the next message, so it's easy to copy 👇",
    serialNovoUso: (link) => `Activate at ${link}. Devices you already activated keep working.`,
    videoLegenda: (nome) => `${chamar(nome)}meet Leviã in 20 seconds 👇`,
    serialIndisponivel: "Your sign-up is done, but I couldn't generate the serial right now. Type *SERIAL* in a few minutes to try again.",
    serialLimite: "You've already asked for a serial 3 times today. Please try again tomorrow.",
    erro: 'Oops, something went wrong. Try again in a moment or type *MENU* to start over.',
    jaFinalizado: "You've already completed your sign-up! 🎉\n\nFor a new serial, type *SERIAL*. To delete your data, type *DELETE*.",
    parar: "Understood! I won't message you anymore. If you want to come back, just say hi. 👋",
    confirmarApagar: `Are you sure? I'll delete your sign-up and your data, and the serial and activated devices will stop working.\n\n${NUMEROS[0]} TYPE *1* TO *DELETE EVERYTHING*\n${NUMEROS[1]} TYPE *2* TO *CANCEL*`,
    apagado: 'Done! I deleted your sign-up and the data I had about you. If you want to come back, just say hi. 👋',
    apagarCancelado: "All good, I didn't delete anything. 🙂",
    naoEntendi: "I didn't get that 😅 Reply with the number only.",
    handoff: "I'll pass your chat to a person on the team. It may take a while, but someone will reply here. 🙏",
    siteLinha: (url) => `Want to see the plans or subscribe? Go to ${url} 💚`,
    toqueConsentimento: 'Still there? 😊 Type *1* to continue or *2* for no.',
    toqueNome: 'Still there? 😊 Just tell me what I should call you.',
    toqueEmail: (nome) => `${chamar(nome)}still there? 😊 You can send your email or type *2* to skip.`,
    toqueObjetivo: (nome) => `${chamar(nome)}still there? 😊 Reply with the number only, from 1 to 6.`,
    toqueSegundo: (nome) =>
      `${chamar(nome)}almost done! ⏳ In under a minute you unlock your Leviã access and start your 7-day trial. ` +
      `Want to continue? Just reply here. If you'd rather not get more messages, reply *STOP*.`,
    toqueDiaSeguinte: (nome) =>
      `Hi${nome ? `, ${nome}` : ''}! 😊 It's *LEVI* from Leviã. Yesterday you started signing up and you're almost there.\n\n` +
      `Leviã helps you log your meals (even with a photo 📸) and track weight, medication and glucose, all on your phone, with a 7-day trial. ` +
      `Want to pick up where you left off? Just reply here 💚\n\nIf you'd rather I stop writing, reply *STOP*.`,
  },

  es: {
    objetivos: ['Adelgazar', 'Controlar la diabetes', 'Seguir el tratamiento con GLP-1', 'Ganar masa muscular', 'Organizar mi alimentación', 'Todos los anteriores'],
    consentimento: (pol) =>
      `¡Hola! 👋 Soy *LEVI*, el asistente virtual de Leviã. En 1 minuto activo tu acceso.\n\n` +
      `Antes, necesito tu autorización para guardar tu *nombre, teléfono, correo (si lo indicas) y objetivo* (que puede ser sobre salud), ` +
      `solo para activar tu acceso y darte soporte. Tus registros de salud de la app se quedan en tu dispositivo.\n` +
      `Política: ${pol}\n\n` +
      `${NUMEROS[0]} ESCRIBE *1* PARA *SÍ, estoy de acuerdo y quiero continuar*\n${NUMEROS[1]} ESCRIBE *2* PARA *NO*`,
    consentimentoNegado: '¡Sin problema! No se guardó nada. Si cambias de opinión, escríbeme. 👋',
    pedirNome: '¡Perfecto! ¿Cómo te puedo llamar?',
    nomeSaudacao: 'Eso parece un saludo 😊 ¿Cómo te llamas?',
    nomeInvalido: 'No pude entender el nombre. ¿Puedes escribir solo cómo prefieres que te llame?',
    pedirEmail: (nome) => `¡Mucho gusto, ${nome}! 😊 ¿Cuál es tu correo electrónico? Es solo para recuperar tu acceso y avisarte de algo importante.\n\nSi prefieres no indicarlo, escribe *2*.`,
    emailInvalido: 'Ese correo no parece válido 🤔 Revísalo y envíalo de nuevo, o escribe *2* para omitir.',
    pedirObjetivo: (nome, opcoes) => `¡Casi listo, ${nome}! ¿Cuál es tu objetivo principal?\n\n${lista(opcoes)}\n\nResponde solo con el número.`,
    serialIntro: (nome) =>
      `¡Listo, ${nome}! ✅ Guardé tus datos solo para activar tu acceso.\n\n` +
      `Ahora te voy a enviar tu *serial*: es tu llave personal de acceso a Leviã. Garantiza que solo quien pasó por aquí use la app y protege tus datos. ` +
      `Vale para 2 dispositivos y no debe compartirse.\n\nTe envío el serial en el *próximo mensaje*, solo, para que sea fácil de copiar 👇`,
    serialUso: (link) =>
      `Para usarlo: abre ${link}, toca "Activar" y pega el serial de arriba. La prueba de 7 días empieza al activar.\n\n` +
      `¿Perdiste el serial? Escribe *SERIAL*. Para borrar tus datos, escribe *BORRAR*. Tus registros de salud se quedan solo en tu dispositivo.`,
    serialNovoIntro: 'Aquí tienes tu nuevo serial (el anterior dejó de valer). Te lo envío solo en el próximo mensaje, para que sea fácil de copiar 👇',
    serialNovoUso: (link) => `Actívalo en ${link}. Los dispositivos que ya activaste siguen funcionando.`,
    videoLegenda: (nome) => `${chamar(nome)}conoce Leviã en 20 segundos 👇`,
    serialIndisponivel: 'Tu registro está hecho, pero no pude generar el serial ahora. Escribe *SERIAL* en unos minutos para intentarlo de nuevo.',
    serialLimite: 'Ya pediste serial 3 veces hoy. Inténtalo de nuevo mañana.',
    erro: 'Ups, ocurrió un error. Inténtalo de nuevo en un momento o escribe *MENU* para empezar otra vez.',
    jaFinalizado: '¡Ya completaste el registro! 🎉\n\nPara un nuevo serial, escribe *SERIAL*. Para borrar tus datos, escribe *BORRAR*.',
    parar: '¡De acuerdo! No te escribiré más. Si quieres volver, solo manda un hola. 👋',
    confirmarApagar: `¿Seguro? Voy a borrar tu registro y tus datos, y el serial y los dispositivos activados dejarán de valer.\n\n${NUMEROS[0]} ESCRIBE *1* PARA *BORRAR TODO*\n${NUMEROS[1]} ESCRIBE *2* PARA *CANCELAR*`,
    apagado: '¡Listo! Borré tu registro y los datos que tenía sobre ti. Si quieres volver, solo manda un hola. 👋',
    apagarCancelado: 'Todo bien, no borré nada. 🙂',
    naoEntendi: 'No entendí 😅 Responde solo con el número.',
    handoff: 'Voy a pasar tu conversación a una persona del equipo. Puede tardar un poco, pero alguien te responderá por aquí. 🙏',
    siteLinha: (url) => `¿Quieres ver los planes o suscribirte? Entra en ${url} 💚`,
    toqueConsentimento: '¿Sigues ahí? 😊 Escribe *1* para continuar o *2* para no.',
    toqueNome: '¿Sigues ahí? 😊 Solo dime cómo te puedo llamar.',
    toqueEmail: (nome) => `${chamar(nome)}¿sigues ahí? 😊 Puedes enviar tu correo o escribir *2* para omitir.`,
    toqueObjetivo: (nome) => `${chamar(nome)}¿sigues ahí? 😊 Responde solo con el número, del 1 al 6.`,
    toqueSegundo: (nome) =>
      `${chamar(nome)}¡falta poquito! ⏳ En menos de 1 minuto activas tu acceso a Leviã y empiezas la prueba de 7 días. ` +
      `¿Quieres continuar? Solo responde aquí. Si prefieres no recibir más mensajes, responde *PARAR*.`,
    toqueDiaSeguinte: (nome) =>
      `¡Hola${nome ? `, ${nome}` : ''}! 😊 Soy *LEVI*, de Leviã. Ayer empezaste tu registro y te falta solo un poquito.\n\n` +
      `Leviã te ayuda a registrar tus comidas (incluso con foto 📸) y a seguir peso, medicación y glucosa, todo en tu móvil, con 7 días de prueba. ` +
      `¿Quieres continuar donde lo dejaste? Solo responde aquí 💚\n\nSi prefieres que no escriba más, responde *PARAR*.`,
  },

  it: {
    objetivos: ['Dimagrire', 'Controllare il diabete', 'Seguire la terapia con GLP-1', 'Aumentare la massa muscolare', 'Organizzare la mia alimentazione', 'Tutte le precedenti'],
    consentimento: (pol) =>
      `Ciao! 👋 Sono *LEVI*, l'assistente virtuale di Leviã. In 1 minuto attivo il tuo accesso.\n\n` +
      `Prima mi serve la tua autorizzazione a conservare il tuo *nome, numero di telefono, e-mail (se la indichi) e obiettivo* (che può riguardare la salute), ` +
      `solo per attivare l'accesso e darti assistenza. I tuoi dati sanitari nell'app restano sul tuo dispositivo.\n` +
      `Informativa: ${pol}\n\n` +
      `${NUMEROS[0]} SCRIVI *1* PER *SÌ, accetto e voglio continuare*\n${NUMEROS[1]} SCRIVI *2* PER *NO*`,
    consentimentoNegado: 'Nessun problema! Non è stato salvato nulla. Se cambi idea, scrivimi. 👋',
    pedirNome: 'Perfetto! Come posso chiamarti?',
    nomeSaudacao: 'Sembra un saluto 😊 Come ti chiami?',
    nomeInvalido: 'Non sono riuscito a capire il nome. Puoi scrivere solo come preferisci essere chiamato/a?',
    pedirEmail: (nome) => `Piacere, ${nome}! 😊 Qual è la tua e-mail? Serve solo per recuperare il tuo accesso e avvisarti di qualcosa di importante.\n\nSe preferisci non indicarla, scrivi *2*.`,
    emailInvalido: 'Questa e-mail non sembra valida 🤔 Controllala e reinviala, oppure scrivi *2* per saltare.',
    pedirObjetivo: (nome, opcoes) => `Quasi fatto, ${nome}! Qual è il tuo obiettivo principale?\n\n${lista(opcoes)}\n\nRispondi solo con il numero.`,
    serialIntro: (nome) =>
      `Fatto, ${nome}! ✅ Ho salvato i tuoi dati solo per attivare il tuo accesso.\n\n` +
      `Ora ti mando il tuo *seriale*: è la tua chiave personale di accesso a Leviã. Garantisce che solo chi è passato da qui usi l'app e protegge i tuoi dati. ` +
      `Vale per 2 dispositivi e non va condiviso.\n\nTi mando il seriale nel *prossimo messaggio*, da solo, così è facile da copiare 👇`,
    serialUso: (link) =>
      `Per usarlo: apri ${link}, tocca "Attiva" e incolla il seriale qui sopra. La prova di 7 giorni inizia con l'attivazione.\n\n` +
      `Hai perso il seriale? Scrivi *SERIAL*. Per cancellare i tuoi dati, scrivi *CANCELLA*. I tuoi dati sanitari restano solo sul tuo dispositivo.`,
    serialNovoIntro: 'Ecco il tuo nuovo seriale (quello vecchio non vale più). Te lo mando da solo nel prossimo messaggio, così è facile da copiare 👇',
    serialNovoUso: (link) => `Attivalo su ${link}. I dispositivi già attivati continuano a funzionare.`,
    videoLegenda: (nome) => `${chamar(nome)}scopri Leviã in 20 secondi 👇`,
    serialIndisponivel: 'La tua registrazione è completa, ma ora non riesco a generare il seriale. Scrivi *SERIAL* tra qualche minuto per riprovare.',
    serialLimite: 'Hai già richiesto il seriale 3 volte oggi. Riprova domani.',
    erro: 'Ops, si è verificato un errore. Riprova tra poco o scrivi *MENU* per ricominciare.',
    jaFinalizado: 'Hai già completato la registrazione! 🎉\n\nPer un nuovo seriale, scrivi *SERIAL*. Per cancellare i tuoi dati, scrivi *CANCELLA*.',
    parar: "D'accordo! Non ti scriverò più. Se vuoi tornare, basta un ciao. 👋",
    confirmarApagar: `Sei sicuro/a? Cancellerò la tua registrazione e i tuoi dati, e il seriale e i dispositivi attivati smetteranno di funzionare.\n\n${NUMEROS[0]} SCRIVI *1* PER *CANCELLARE TUTTO*\n${NUMEROS[1]} SCRIVI *2* PER *ANNULLARE*`,
    apagado: 'Fatto! Ho cancellato la tua registrazione e i dati che avevo su di te. Se vuoi tornare, basta un ciao. 👋',
    apagarCancelado: 'Tutto a posto, non ho cancellato nulla. 🙂',
    naoEntendi: 'Non ho capito 😅 Rispondi solo con il numero.',
    handoff: "Passo la tua chat a una persona del team. Potrebbe volerci un po', ma qualcuno ti risponderà qui. 🙏",
    siteLinha: (url) => `Vuoi vedere i piani o abbonarti? Vai su ${url} 💚`,
    toqueConsentimento: 'Ci sei? 😊 Scrivi *1* per continuare o *2* per no.',
    toqueNome: 'Ci sei? 😊 Dimmi solo come posso chiamarti.',
    toqueEmail: (nome) => `${chamar(nome)}ci sei? 😊 Puoi inviare la tua e-mail o scrivere *2* per saltare.`,
    toqueObjetivo: (nome) => `${chamar(nome)}ci sei? 😊 Rispondi solo con il numero, da 1 a 6.`,
    toqueSegundo: (nome) =>
      `${chamar(nome)}ci siamo quasi! ⏳ In meno di 1 minuto attivi il tuo accesso a Leviã e inizi la prova di 7 giorni. ` +
      `Vuoi continuare? Rispondi qui. Se preferisci non ricevere altri messaggi, rispondi *STOP*.`,
    toqueDiaSeguinte: (nome) =>
      `Ciao${nome ? `, ${nome}` : ''}! 😊 Sono *LEVI* di Leviã. Ieri hai iniziato la registrazione e manca pochissimo.\n\n` +
      `Leviã ti aiuta a registrare i pasti (anche con una foto 📸) e a seguire peso, farmaci e glicemia, tutto sul tuo telefono, con 7 giorni di prova. ` +
      `Vuoi continuare da dove eri rimasto/a? Rispondi qui 💚\n\nSe preferisci che non scriva più, rispondi *STOP*.`,
  },
};

/** Idioma pelo número digitado ou por uma palavra ("english", "br", "italiano"…). */
export function idiomaEscolhido(texto) {
  const t = String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
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
