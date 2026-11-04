/**
 * Perguntas frequentes do LEVI no WhatsApp (pt-BR, pt-PT, en, es, it).
 *
 * Regra de ouro: só afirmar o que o produto realmente faz. Preços ficam SÓ no site (www.leviapp.org);
 * nada de promessa de criptografia, telefone ou menu que não existe. Quando o produto mudar, revise aqui.
 *
 * Só responde quando a mensagem parece uma dúvida (várias palavras ou "?") e bate com palavras-chave:
 * assim um nome, um e-mail ou "1" nunca viram resposta de FAQ.
 */
const SITE = 'www.leviapp.org';
const ATIVAR = 'leviapp.org/ativar';
const POLITICA = 'https://ferpa2505-art.github.io/levia-policies/privacidade.html';

const FAQ = {
  'pt-BR': {
    como_funciona: `O Leviã ajuda você a registrar refeições (até com foto 📸), acompanhar peso, medicação, glicemia e GLP-1, com lembretes e relatórios.\n\nFunciona no navegador do celular, sem baixar em loja. Você começa com 7 dias de teste: recebe um serial aqui no WhatsApp e ativa em ${ATIVAR}.\n\nCalorias e nutrientes são estimativas, e o Leviã não substitui médico ou nutricionista.`,
    preco: `Você começa com 7 dias de teste, sem cartão. Depois, os planos mensal e anual estão em ${SITE} (pagamento seguro pela Hotmart).`,
    privacidade: `Seus registros de saúde ficam no seu aparelho. Aqui no WhatsApp guardo só nome, telefone, e-mail (se você informou) e objetivo, com a sua autorização, para liberar o seu acesso. Se você pedir a análise de uma foto de prato, ela é enviada para a IA do Google. Para apagar tudo, digite *APAGAR*.\nPolítica: ${POLITICA}`,
    ativacao_serial: `Para ativar: abra ${ATIVAR}, toque em "Ativar" e cole o serial que enviei aqui. Vale para 2 aparelhos. Perdeu o serial? Digite *SERIAL*.`,
    cancelamento: `Durante o teste é só não assinar: nada é cobrado. Se você assinou pela Hotmart, o cancelamento e o reembolso são feitos na própria Hotmart (área de compras) ou pelo contato em ${SITE}.`,
    tecnico: `O Leviã roda no navegador do celular ou do computador (Chrome, Safari, Edge) e pode ser adicionado à tela inicial. Não precisa de loja de aplicativos. A análise de foto por IA precisa de internet.`,
    suporte: `Escreva sua dúvida aqui. Se eu não conseguir ajudar, passo a conversa para uma pessoa. Também há contato em ${SITE}.`,
    comandos: `Comandos: *SERIAL* (novo serial), *APAGAR* (excluir seus dados), *PARAR* (não receber mais mensagens) e *MENU* (recomeçar).`,
    problemas_comuns: `Serial não funciona? Confira a digitação (o serial não usa as letras I e O nem os números 0 e 1), se não passou de 2 aparelhos e se não venceu: digite *SERIAL* para receber outro.\n\n"Este aparelho já está ligado a outro serial": cada aparelho fica ligado a uma conta. Fale com o suporte para soltá-lo.`,
  },
  'pt-PT': {
    como_funciona: `O Leviã ajuda-o(a) a registar refeições (até com foto 📸), acompanhar peso, medicação, glicemia e GLP-1, com lembretes e relatórios.\n\nFunciona no navegador do telemóvel, sem instalar de nenhuma loja. Começa com 7 dias de teste: recebe um número de série aqui no WhatsApp e ativa em ${ATIVAR}.\n\nCalorias e nutrientes são estimativas, e o Leviã não substitui médico ou nutricionista.`,
    preco: `Começa com 7 dias de teste, sem cartão. Depois, os planos mensal e anual estão em ${SITE} (pagamento seguro pela Hotmart).`,
    privacidade: `Os seus registos de saúde ficam no seu telemóvel. Aqui no WhatsApp guardo apenas nome, telemóvel, e-mail (se o indicou) e objetivo, com a sua autorização, para libertar o seu acesso. Se pedir a análise de uma foto de prato, ela é enviada para a IA da Google. Para apagar tudo, escreva *APAGAR*.\nPolítica: ${POLITICA}`,
    ativacao_serial: `Para ativar: abra ${ATIVAR}, toque em "Ativar" e cole o número de série que enviei aqui. Vale para 2 dispositivos. Perdeu o número de série? Escreva *SERIAL*.`,
    cancelamento: `Durante o teste basta não subscrever: nada é cobrado. Se subscreveu pela Hotmart, o cancelamento e o reembolso fazem-se na própria Hotmart (área de compras) ou pelo contacto em ${SITE}.`,
    tecnico: `O Leviã corre no navegador do telemóvel ou do computador (Chrome, Safari, Edge) e pode ser adicionado ao ecrã inicial. Não precisa de loja de aplicações. A análise de foto por IA precisa de internet.`,
    suporte: `Escreva aqui a sua dúvida. Se eu não conseguir ajudar, passo a conversa a uma pessoa. Também há contacto em ${SITE}.`,
    comandos: `Comandos: *SERIAL* (novo número de série), *APAGAR* (eliminar os seus dados), *PARAR* (não receber mais mensagens) e *MENU* (recomeçar).`,
    problemas_comuns: `O número de série não funciona? Confirme a escrita (não usa as letras I e O nem os números 0 e 1), se não excedeu 2 dispositivos e se não expirou: escreva *SERIAL* para receber outro.\n\n"Este aparelho já está ligado a outro serial": cada dispositivo fica ligado a uma conta. Fale com o apoio para o libertar.`,
  },
  en: {
    como_funciona: `Leviã helps you log meals (even with a photo 📸) and track weight, medication, glucose and GLP-1, with reminders and reports.\n\nIt works in your phone's browser, with no app store. You start with a 7-day trial: you get a serial here on WhatsApp and activate it at ${ATIVAR}.\n\nCalories and nutrients are estimates, and Leviã does not replace a doctor or dietitian.`,
    preco: `You start with a 7-day trial, no card needed. After that, the monthly and annual plans are at ${SITE} (secure payment through Hotmart).`,
    privacidade: `Your health records stay on your device. Here on WhatsApp I only store your name, phone number, email (if you gave it) and goal, with your permission, to set up your access. If you ask for a meal photo analysis, the photo is sent to Google's AI. To delete everything, type *DELETE*.\nPolicy: ${POLITICA}`,
    ativacao_serial: `To activate: open ${ATIVAR}, tap "Activate" and paste the serial I sent here. It works on 2 devices. Lost the serial? Type *SERIAL*.`,
    cancelamento: `During the trial just don't subscribe: nothing is charged. If you subscribed through Hotmart, cancellation and refunds are handled on Hotmart itself (purchases area) or through the contact at ${SITE}.`,
    tecnico: `Leviã runs in your phone or computer browser (Chrome, Safari, Edge) and can be added to your home screen. No app store needed. Photo analysis by AI needs an internet connection.`,
    suporte: `Write your question here. If I can't help, I'll pass the chat to a person. There is also a contact at ${SITE}.`,
    comandos: `Commands: *SERIAL* (new serial), *DELETE* (erase your data), *STOP* (no more messages) and *MENU* (start over).`,
    problemas_comuns: `Serial not working? Check how you typed it (serials don't use the letters I and O or the numbers 0 and 1), that it isn't on more than 2 devices and hasn't expired: type *SERIAL* to get another.\n\n"This device is already linked to another serial": each device is tied to one account. Contact support to release it.`,
  },
  es: {
    como_funciona: `Leviã te ayuda a registrar comidas (incluso con foto 📸) y a seguir peso, medicación, glucosa y GLP-1, con recordatorios e informes.\n\nFunciona en el navegador del móvil, sin tienda de apps. Empiezas con 7 días de prueba: recibes un serial aquí en WhatsApp y lo activas en ${ATIVAR}.\n\nLas calorías y los nutrientes son estimaciones, y Leviã no sustituye a un médico o nutricionista.`,
    preco: `Empiezas con 7 días de prueba, sin tarjeta. Después, los planes mensual y anual están en ${SITE} (pago seguro con Hotmart).`,
    privacidade: `Tus registros de salud se quedan en tu dispositivo. Aquí en WhatsApp solo guardo nombre, teléfono, correo (si lo indicaste) y objetivo, con tu autorización, para activar tu acceso. Si pides el análisis de una foto de comida, se envía a la IA de Google. Para borrar todo, escribe *BORRAR*.\nPolítica: ${POLITICA}`,
    ativacao_serial: `Para activar: abre ${ATIVAR}, toca "Activar" y pega el serial que te envié aquí. Vale para 2 dispositivos. ¿Perdiste el serial? Escribe *SERIAL*.`,
    cancelamento: `Durante la prueba basta con no suscribirte: no se cobra nada. Si te suscribiste con Hotmart, la cancelación y el reembolso se gestionan en la propia Hotmart (área de compras) o por el contacto en ${SITE}.`,
    tecnico: `Leviã funciona en el navegador del móvil o del ordenador (Chrome, Safari, Edge) y se puede añadir a la pantalla de inicio. No necesita tienda de aplicaciones. El análisis de fotos con IA necesita internet.`,
    suporte: `Escribe aquí tu duda. Si no puedo ayudarte, paso la conversación a una persona. También hay contacto en ${SITE}.`,
    comandos: `Comandos: *SERIAL* (nuevo serial), *BORRAR* (eliminar tus datos), *PARAR* (no recibir más mensajes) y *MENU* (empezar de nuevo).`,
    problemas_comuns: `¿El serial no funciona? Revisa cómo lo escribiste (el serial no usa las letras I y O ni los números 0 y 1), que no pase de 2 dispositivos y que no haya vencido: escribe *SERIAL* para recibir otro.\n\n"Este dispositivo ya está vinculado a otro serial": cada dispositivo queda unido a una cuenta. Habla con soporte para liberarlo.`,
  },
  it: {
    como_funciona: `Leviã ti aiuta a registrare i pasti (anche con una foto 📸) e a seguire peso, farmaci, glicemia e GLP-1, con promemoria e report.\n\nFunziona nel browser del telefono, senza negozio di app. Inizi con 7 giorni di prova: ricevi un seriale qui su WhatsApp e lo attivi su ${ATIVAR}.\n\nCalorie e nutrienti sono stime, e Leviã non sostituisce un medico o un nutrizionista.`,
    preco: `Inizi con 7 giorni di prova, senza carta. Poi i piani mensile e annuale sono su ${SITE} (pagamento sicuro con Hotmart).`,
    privacidade: `I tuoi dati sanitari restano sul tuo dispositivo. Qui su WhatsApp conservo solo nome, numero di telefono, e-mail (se l'hai indicata) e obiettivo, con la tua autorizzazione, per attivare l'accesso. Se chiedi l'analisi di una foto di un pasto, viene inviata all'IA di Google. Per cancellare tutto, scrivi *CANCELLA*.\nInformativa: ${POLITICA}`,
    ativacao_serial: `Per attivare: apri ${ATIVAR}, tocca "Attiva" e incolla il seriale che ti ho inviato qui. Vale per 2 dispositivi. Hai perso il seriale? Scrivi *SERIAL*.`,
    cancelamento: `Durante la prova basta non abbonarsi: non viene addebitato nulla. Se ti sei abbonato con Hotmart, disdetta e rimborso si gestiscono su Hotmart stessa (area acquisti) o tramite il contatto su ${SITE}.`,
    tecnico: `Leviã funziona nel browser del telefono o del computer (Chrome, Safari, Edge) e si può aggiungere alla schermata iniziale. Non serve un negozio di app. L'analisi delle foto con IA richiede internet.`,
    suporte: `Scrivi qui il tuo dubbio. Se non riesco ad aiutarti, passo la chat a una persona. C'è anche un contatto su ${SITE}.`,
    comandos: `Comandi: *SERIAL* (nuovo seriale), *CANCELLA* (elimina i tuoi dati), *STOP* (niente più messaggi) e *MENU* (ricominciare).`,
    problemas_comuns: `Il seriale non funziona? Controlla come l'hai scritto (il seriale non usa le lettere I e O né i numeri 0 e 1), che non superi 2 dispositivi e che non sia scaduto: scrivi *SERIAL* per riceverne un altro.\n\n"Questo dispositivo è già collegato a un altro seriale": ogni dispositivo è legato a un account. Contatta il supporto per liberarlo.`,
  },
};

// palavras-chave (sem acento, minúsculas) de todos os idiomas; ganha o assunto com mais acertos
const PALAVRAS = {
  como_funciona: ['como funciona', 'como e o', 'o que e o', 'para que serve', 'what is', 'how does', 'how it works', 'que es', 'como funciona', 'come funziona', 'cose'],
  preco: ['preco', 'quanto custa', 'valor', 'mensal', 'anual', 'plano', 'assinatura', 'assinar', 'subscrever', 'subscricao', 'pagamento', 'price', 'cost', 'how much', 'subscription', 'subscribe', 'payment', 'precio', 'cuanto cuesta', 'suscripcion', 'prezzo', 'quanto costa', 'abbonamento', 'abbonarsi'],
  privacidade: ['privacidade', 'privacy', 'privacidad', 'lgpd', 'gdpr', 'meus dados', 'seus dados', 'my data', 'mis datos', 'miei dati', 'seguranca', 'seguro', 'safe', 'secure', 'seguridad', 'sicurezza'],
  ativacao_serial: ['ativar', 'ativacao', 'activate', 'activation', 'activar', 'activacion', 'attivare', 'attivazione'],
  cancelamento: ['cancelar', 'cancelamento', 'cancel', 'reembolso', 'refund', 'reembolsar', 'rimborso', 'annullare', 'devolucao'],
  tecnico: ['requisitos', 'tecnico', 'iphone', 'android', 'navegador', 'browser', 'offline', 'compativel', 'requirements', 'compatible', 'requisiti'],
  suporte: ['suporte', 'atendente', 'falar com', 'humano', 'support', 'human', 'agent', 'soporte', 'persona real', 'assistenza', 'operatore', 'apoio'],
  comandos: ['comandos', 'commands', 'comandi', 'o que posso digitar', 'what can i type'],
  problemas_comuns: ['nao funciona', 'nao consigo', 'erro', 'problema', 'not working', 'error', 'problem', 'no funciona', 'non funziona', 'cannot', 'falha'],
};

const normalizar = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** Só dúvidas de verdade: ao menos 2 palavras (ou "?") e 6 letras. Nome, e-mail e "1" ficam de fora. */
function pareceDuvida(texto) {
  const t = normalizar(texto);
  if (t.length < 6 || t.includes('@')) return false;
  return t.includes('?') || t.split(' ').length >= 2;
}

export function buscarResposta(texto, idioma) {
  if (!pareceDuvida(texto)) return null;
  const t = normalizar(texto);
  let melhor = null;
  let pontos = 0;
  for (const [assunto, palavras] of Object.entries(PALAVRAS)) {
    const acertos = palavras.filter((p) => t.includes(p)).length;
    if (acertos > pontos) { melhor = assunto; pontos = acertos; }
  }
  if (!melhor) return null;
  const respostas = FAQ[idioma] ?? FAQ['pt-BR'];
  return respostas[melhor];
}

export { FAQ };
