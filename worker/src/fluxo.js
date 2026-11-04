/**
 * fluxo.js - Conversa do LEVI (assistente virtual do Leviã) no WhatsApp.
 *
 * Etapas (a autorização vem ANTES de qualquer dado pessoal):
 *   sem sessão     → LEVI se apresenta e pergunta o idioma (1 BR, 2 PT, 3 EN, 4 ES, 5 IT)
 *   idioma         → pede o consentimento (1 = SIM, 2 = NÃO), já no idioma escolhido
 *   consentimento  → 1: pede o nome | 2: encerra sem guardar nada
 *   nome           → pede o e-mail (opcional: 2 pula)
 *   e-mail         → pede o objetivo (opções numeradas)
 *   objetivo       → cria o lead; manda o serial em mensagens separadas (explicação, serial sozinho, como usar) e o vídeo
 * Comandos em qualquer etapa: PARAR (não escrever mais), APAGAR (excluir tudo), SERIAL, MENU.
 * Quem para de responder recebe lembretes (ver lembretes.js). Os textos estão em textos.js.
 */

import { apagarContaPorTelefone, emitirSerial } from './serial';
import { agendarLembretes, cancelarLembretes } from './lembretes';
import { avisarEquipe, pedeAtendente } from './avisos';
import {
  MENU_IDIOMA, OBJETIVOS_GRAVADOS, TEXTOS, TOQUE_IDIOMA, idiomaEscolhido, idiomaPeloTelefone,
} from './textos';
import { buscarResposta } from './faq';

/** Nome da mídia que o gateway envia (vídeo de uso do app); sem o arquivo ele manda só o texto. */
const MIDIA_VIDEO = 'video';
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const PULAR = ['2', 'pular', 'pula', 'skip', 'saltar', 'salta', 'omitir', 'saltare', 'nao', 'no'];

const POLITICA_URL = 'https://ferpa2505-art.github.io/levia-policies/privacidade.html';

// objetivo digitado por extenso → número da opção (todos os idiomas do atendimento)
const PALAVRAS_DO_OBJETIVO = [
  ['todos', 6], ['todas', 6], ['all', 6], ['tutt', 6],
  ['emagrec', 1], ['lose', 1], ['weight', 1], ['adelgaz', 1], ['dimagr', 1],
  ['diabet', 2],
  ['glp', 3],
  ['massa', 4], ['muscle', 4], ['muscol', 4],
  ['aliment', 5], ['eating', 5],
];

const COMANDOS_PARAR = ['parar', 'pare', 'stop', 'sair', 'salir', 'detener', 'fermati', 'esci'];
const COMANDOS_APAGAR = ['apagar', 'apagar tudo', 'delete', 'delete all', 'delete my data', 'borrar', 'borrar todo', 'eliminar', 'elimina', 'cancella', 'cancella tutto'];
const COMANDOS_REINICIAR = ['menu', 'reiniciar', 'comecar', 'iniciar', 'start', 'restart', 'ricomincia', 'empezar'];

const ESTADOS = {
  AGUARDANDO_IDIOMA: 'aguardando_idioma',
  AGUARDANDO_CONSENTIMENTO: 'aguardando_consentimento',
  AGUARDANDO_NOME: 'aguardando_nome',
  AGUARDANDO_EMAIL: 'aguardando_email',
  AGUARDANDO_OBJETIVO: 'aguardando_objetivo',
  CONFIRMAR_APAGAR: 'confirmar_apagar',
};

/** Resposta em várias mensagens: `respostas` (texto ou { texto, midia }) e `resposta` (o texto junto, p/ compatibilidade). */
const varias = (tipo, itens, extra = {}) => ({
  tipo,
  respostas: itens,
  resposta: itens.map((i) => (typeof i === 'string' ? i : i.texto)).join('\n\n'),
  ...extra,
});

const linkSite = (env) => env.SITE_URL || 'https://www.leviapp.org';
const linkApp = (env) => `${env.APP_BASE_URL || 'https://leviapp.org'}/ativar`;
const linkPolitica = (env) => env.POLITICA_URL || POLITICA_URL;

/** A pergunta que está em aberto, para repetir e para os lembretes do dia seguinte. */
function perguntaDaEtapa(estado, dados, env, idioma) {
  const T = TEXTOS[idioma];
  if (estado === ESTADOS.AGUARDANDO_IDIOMA) return MENU_IDIOMA;
  if (estado === ESTADOS.AGUARDANDO_CONSENTIMENTO) return T.consentimento(linkPolitica(env));
  if (estado === ESTADOS.AGUARDANDO_NOME) return T.pedirNome;
  if (estado === ESTADOS.AGUARDANDO_EMAIL) return T.pedirEmail(dados.nome);
  if (estado === ESTADOS.AGUARDANDO_OBJETIVO) return T.pedirObjetivo(dados.nome, T.objetivos);
  return T.confirmarApagar;
}

function toquesDaEtapa(estado, dados, env, idioma) {
  const T = TEXTOS[idioma];
  if (estado === ESTADOS.AGUARDANDO_IDIOMA) {
    return {
      primeiro: TOQUE_IDIOMA,
      segundo: 'Sem pressa! · No rush! · ¡Sin prisa! · Nessuna fretta! 😊\nPara parar · To stop · Para parar · Per fermare: PARAR / STOP',
      diaSeguinte: `Olá! 👋 Hello! ¡Hola! Ciao! — LEVI, Leviã.

${MENU_IDIOMA}`,
    };
  }
  const nome = dados.nome;
  const primeiro = {
    [ESTADOS.AGUARDANDO_CONSENTIMENTO]: T.toqueConsentimento,
    [ESTADOS.AGUARDANDO_NOME]: T.toqueNome,
    [ESTADOS.AGUARDANDO_EMAIL]: T.toqueEmail(nome),
    [ESTADOS.AGUARDANDO_OBJETIVO]: T.toqueObjetivo(nome),
  }[estado] ?? T.toqueConsentimento;
  // só quem já autorizou recebe o vídeo; antes do consentimento os toques são só texto
  const texto = `${T.toqueDiaSeguinte(nome)}

${perguntaDaEtapa(estado, dados, env, idioma)}`;
  return {
    primeiro,
    segundo: T.toqueSegundo(nome),
    diaSeguinte: dados.consentimento_em ? { texto, midia: MIDIA_VIDEO } : texto,
  };
}

// ---------- entendimento do texto ----------

const semAcento = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
/** "OIIII", "olá!!" e "Hello" viram a mesma forma para comparar com a lista de cumprimentos. */
const forma = (t) => semAcento(t).replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');

const NAO_SAO_NOMES = new Set([
  'oi', 'oie', 'ola', 'alo', 'hello', 'hi', 'hey', 'hola', 'bonjour', 'ciao', 'hallo', 'salve', 'opa', 'eai', 'eae',
  'bomdia', 'boatarde', 'boanoite', 'goodmorning', 'goodafternoon', 'goodevening', 'buenosdias', 'buenastardes',
  'buenasnoches', 'buongiorno', 'buonasera', 'tudobem', 'tdbem', 'ok', 'sim', 'nao', 'si', 'yes', 'no', 'teste', 'test',
  'menu', 'start', 'comecar', 'iniciar', 'quero', 'obrigado', 'obrigada', 'thanks', 'gracias', 'grazie', 'ajuda', 'help',
].map(forma));

const SAUDACAO_INICIAL = /^[\s,!.¡¿?-]*(?:oi+e?|ol[aá]+|al[oô]|hello|hi|hey|hola|bonjour|ciao|hallo|salve|opa|e\s*a[ií]|bom\s*dia|boa\s*tarde|boa\s*noite|good\s*(?:morning|afternoon|evening)|buenos\s*d[ií]as|buenas\s*(?:tardes|noches)|buongiorno|buonasera|tudo\s*bem)(?=[\s,!.¡¿?-]|$)/i;
const APRESENTACAO = /^[\s,!.-]*(?:meu\s+nome\s+(?:é|e)|me\s+chamo|eu\s+sou(?:\s+(?:o|a))?|sou(?:\s+(?:o|a))?|my\s+name\s+is|i\s*am|i'm|me\s+llamo|mi\s+nombre\s+es|soy|mi\s+chiamo|mi\s+chiamano)\s+/i;
const PARTICULAS = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'di', 'van', 'von', 'la', 'le']);

function iniciaisMaiusculas(nome) {
  return nome.split(/\s+/).map((p, i) => {
    if (i > 0 && PARTICULAS.has(p.toLowerCase())) return p.toLowerCase();
    const tudoIgual = p === p.toLowerCase() || p === p.toUpperCase();
    return tudoIgual ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p;
  }).join(' ');
}

/** { nome } ou { invalido: true, ehSaudacao } — "oi, sou a Renata" vira "Renata"; "olá" não é nome. */
function extrairNome(texto) {
  let resto = texto.trim();
  let tinhaSaudacao = false;
  for (let i = 0; i < 3 && SAUDACAO_INICIAL.test(resto); i++) {
    resto = resto.replace(SAUDACAO_INICIAL, '');
    tinhaSaudacao = true;
  }
  resto = resto.replace(APRESENTACAO, '').replace(/^[\s,!.?-]+|[\s,!.?]+$/g, '');
  if (!resto) return { invalido: true, ehSaudacao: tinhaSaudacao || NAO_SAO_NOMES.has(forma(texto)) };
  const palavras = resto.split(/\s+/);
  const valido = resto.length >= 2 && resto.length <= 60 && palavras.length <= 5 && /^[\p{L}][\p{L}'’ -]*$/u.test(resto);
  if (!valido || NAO_SAO_NOMES.has(forma(resto))) {
    return { invalido: true, ehSaudacao: tinhaSaudacao || NAO_SAO_NOMES.has(forma(resto)) };
  }
  return { nome: iniciaisMaiusculas(resto) };
}

function respostaSimNao(texto) {
  const t = semAcento(texto).replace(/[^a-z0-9 ]/g, '').trim();
  if (['1', 'sim', 'concordo', 'aceito', 'autorizo', 'ok', 'claro', 'quero', 'yes', 'si', 'accetto', 'acuerdo'].includes(t)) return 'sim';
  if (['2', 'nao', 'nao concordo', 'nao quero', 'cancelar', 'no', 'non'].includes(t)) return 'nao';
  return null;
}

function escolherObjetivo(texto) {
  const t = semAcento(texto).replace(/[^a-z0-9 ]/g, '').trim();
  if (/^[1-6]$/.test(t)) return Number(t);
  for (const [trecho, numero] of PALAVRAS_DO_OBJETIVO) if (t.includes(trecho)) return numero;
  return null;
}

// ---------- banco ----------

async function obterSessao(db, phone) {
  if (!db) return null;
  try {
    const row = await db.prepare('SELECT * FROM wa_sessions WHERE phone = ? ORDER BY updated_at DESC LIMIT 1').bind(phone).first();
    return row ? { estado: row.stage, data: JSON.parse(row.data_json || '{}') } : null;
  } catch (e) {
    console.error('Erro ao buscar sessão:', e?.message);
    return null;
  }
}

async function salvarSessao(db, phone, estado, data) {
  if (!db) return false;
  try {
    await db.prepare(
      `INSERT INTO wa_sessions (phone, stage, data_json, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(phone) DO UPDATE SET stage = excluded.stage, data_json = excluded.data_json, updated_at = excluded.updated_at`,
    ).bind(phone, estado, JSON.stringify(data), new Date().toISOString()).run();
    return true;
  } catch (e) {
    console.error('Erro ao salvar sessão:', e?.message);
    return false;
  }
}

async function limparSessao(db, phone) {
  if (!db) return false;
  try {
    await db.prepare('DELETE FROM wa_sessions WHERE phone = ?').bind(phone).run();
    return true;
  } catch (e) {
    console.error('Erro ao limpar sessão:', e?.message);
    return false;
  }
}

async function verificarProcessado(db, messageId) {
  if (!db) return false;
  try {
    return !!(await db.prepare('SELECT 1 FROM wa_processed WHERE msg_id = ?').bind(messageId).first());
  } catch (e) {
    console.error('Erro ao verificar processado:', e?.message);
    return false;
  }
}

async function marcarProcessado(db, messageId) {
  if (!db) return false;
  try {
    await db.prepare('INSERT OR IGNORE INTO wa_processed (msg_id, created_at) VALUES (?, ?)').bind(messageId, new Date().toISOString()).run();
    return true;
  } catch (e) {
    console.error('Erro ao marcar processado:', e?.message);
    return false;
  }
}

/** Conversas abandonadas e registros de mensagens antigos não ficam guardados para sempre. */
async function limparAntigos(db, agora) {
  if (!db || Math.random() >= 0.05) return;
  try {
    await db.prepare('DELETE FROM wa_sessions WHERE updated_at < ?').bind(new Date(agora - 3 * 24 * 3600 * 1000).toISOString()).run();
    await db.prepare('DELETE FROM wa_processed WHERE created_at < ?').bind(new Date(agora - 30 * 24 * 3600 * 1000).toISOString()).run();
  } catch (e) {
    console.error('Erro ao limpar antigos:', e?.message);
  }
}

async function buscarLeadPorTelefone(db, phone) {
  if (!db) return null;
  try {
    const row = await db.prepare('SELECT id FROM leads WHERE phone = ? ORDER BY created_at DESC LIMIT 1').bind(phone).first();
    return row?.id || null;
  } catch (e) {
    console.error('Erro ao buscar lead por telefone:', e?.message);
    return null;
  }
}

async function criarLeadCompleto(env, { phone, name, email, dor, consent_at }) {
  const agora = new Date().toISOString();
  const leadId = crypto.randomUUID();
  if (env.LEVIA_DB) {
    try {
      await env.LEVIA_DB.prepare(
        `INSERT INTO leads (id, name, phone, email, pain_point, source, consent_at, channel, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(leadId, name, phone, email, dor, 'whatsapp', consent_at, 'whatsapp', agora, agora).run();
      return leadId;
    } catch (e) {
      console.error('Erro ao salvar lead no D1:', e?.message);
    }
  }
  try {
    await env.LEVIA_COTAS.put(
      `lead:${leadId}`,
      JSON.stringify({ id: leadId, name, phone, email, pain_point: dor, source: 'whatsapp', consent_at, channel: 'whatsapp', created_at: agora, updated_at: agora }),
      { expirationTtl: 30 * 24 * 3600 },
    );
    return leadId;
  } catch (e) {
    console.error('Erro ao salvar lead no KV:', e?.message);
    return null;
  }
}

async function apagarTudoDe(env, phone) {
  if (env.LEVIA_DB) {
    for (const sql of [
      'DELETE FROM leads WHERE phone = ?',
      'DELETE FROM wa_sessions WHERE phone = ?',
      'DELETE FROM wa_outbox WHERE phone = ?',
    ]) {
      try { await env.LEVIA_DB.prepare(sql).bind(phone).run(); } catch (e) { console.error('apagar:', e?.message); }
    }
  }
  await apagarContaPorTelefone(env, phone);
}

// ---------- a conversa ----------

export async function processarMensagemWhatsApp(env, phone, texto, messageId, agora = Date.now()) {
  // o gateway do WhatsApp já manda o número com o código do país (E.164): não se acrescenta +55
  const phoneFormatado = '+' + String(phone).replace(/\D/g, '');
  const db = env.LEVIA_DB;

  if (await verificarProcessado(db, messageId)) return { tipo: 'duplicado', resposta: null };
  await marcarProcessado(db, messageId);
  // qualquer mensagem da pessoa cancela os lembretes pendentes; a pergunta seguinte agenda os novos
  await cancelarLembretes(env, phoneFormatado, agora);
  await limparAntigos(db, agora);

  const comando = semAcento(texto).replace(/[^a-z0-9 ]/g, '').trim();
  const sessao = await obterSessao(db, phoneFormatado);
  const estadoAtual = sessao?.estado;
  const dados = sessao?.data || {};
  // o idioma escolhido fica na conversa; quem já se cadastrou é atendido no idioma do país do número
  const idioma = dados.idioma || idiomaPeloTelefone(phoneFormatado);
  const T = TEXTOS[idioma];

  // FAQ lookup: intercepta mensagens antes da máquina de estados
  // Só faz FAQ lookup se não for um comando conhecido
  const ehComando = COMANDOS_PARAR.includes(comando) || COMANDOS_APAGAR.includes(comando) || COMANDOS_REINICIAR.includes(comando) || comando === 'serial';
  let respostaFAQ = null;
  if (!ehComando && estadoAtual && estadoAtual !== ESTADOS.CONFIRMAR_APAGAR) {
    respostaFAQ = buscarResposta(texto, idioma);
  }

  const perguntar = async (estado, novosDados, tipo, idiomaDaPergunta = novosDados.idioma || idioma) => {
    await salvarSessao(db, phoneFormatado, estado, novosDados);
    await agendarLembretes(env, phoneFormatado, toquesDaEtapa(estado, novosDados, env, idiomaDaPergunta), agora);
    return { tipo, resposta: perguntaDaEtapa(estado, novosDados, env, idiomaDaPergunta) };
  };
  // passa a conversa para uma pessoa E avisa a equipe (WhatsApp + e-mail); falha no aviso nunca derruba a resposta ao cliente
  const passarParaPessoa = async (motivo, estado) => {
    await limparSessao(db, phoneFormatado);
    try {
      await avisarEquipe(env, { telefone: phoneFormatado, nome: dados.nome, etapa: estado, idioma, motivo, agora });
    } catch (e) {
      console.error('aviso à equipe falhou:', e?.message);
    }
    return { tipo: 'handoff_humano', resposta: T.handoff };
  };
  // resposta inválida: repete a pergunta; na 3ª seguida a conversa passa para uma pessoa.
  // (Só respostas inválidas contam: uma resposta certa nunca dispara a transferência.)
  const repetir = async (estado, resposta, tipo) => {
    const tentativas = (dados.tentativasInvalidas || 0) + 1;
    if (tentativas >= 3) return passarParaPessoa('respostas_invalidas', estado);
    await salvarSessao(db, phoneFormatado, estado, { ...dados, tentativasInvalidas: tentativas });
    await agendarLembretes(env, phoneFormatado, toquesDaEtapa(estado, dados, env, idioma), agora);
    return { tipo, resposta };
  };

  // apagar: pede confirmação e só então exclui
  if (estadoAtual === ESTADOS.CONFIRMAR_APAGAR) {
    const r = respostaSimNao(texto);
    if (r === 'sim') {
      await apagarTudoDe(env, phoneFormatado);
      return { tipo: 'apagado', resposta: T.apagado };
    }
    if (r === 'nao') {
      if (dados.voltarPara) return perguntar(dados.voltarPara, dados.dadosAnteriores || {}, 'apagar_cancelado');
      await limparSessao(db, phoneFormatado);
      return { tipo: 'apagar_cancelado', resposta: T.apagarCancelado };
    }
    return { tipo: 'apagar_pendente', resposta: `${T.naoEntendi}\n\n${T.confirmarApagar}` };
  }
  if (COMANDOS_APAGAR.includes(comando)) {
    await salvarSessao(db, phoneFormatado, ESTADOS.CONFIRMAR_APAGAR, estadoAtual ? { voltarPara: estadoAtual, dadosAnteriores: dados, idioma } : { idioma });
    return { tipo: 'confirmar_apagar', resposta: T.confirmarApagar };
  }

  // parar: nada de lembretes nem novas mensagens por iniciativa do LEVI
  if (COMANDOS_PARAR.includes(comando)) {
    await limparSessao(db, phoneFormatado);
    return { tipo: 'parou', resposta: T.parar };
  }

  // pediu para falar com uma pessoa: passa na hora e avisa a equipe (vale até para quem já se cadastrou)
  if (!ehComando && pedeAtendente(texto)) return passarParaPessoa('pediu_atendente', estadoAtual);

  // quem já se cadastrou: o pedido possível é um novo serial
  const leadExistente = await buscarLeadPorTelefone(db, phoneFormatado);
  if (leadExistente) {
    if (comando === 'serial') {
      const emissao = await emitirSerial(env, { telefone: phoneFormatado });
      if (emissao.ok) return varias('serial_novo', [T.serialNovoIntro, emissao.serial, T.serialNovoUso(linkApp(env))], { leadId: leadExistente });
      if (emissao.motivo === 'limite') return { tipo: 'serial_limite', resposta: T.serialLimite };
      return { tipo: 'erro', resposta: T.erro };
    }
    return { tipo: 'ja_finalizado', resposta: T.jaFinalizado, pwaLink: linkApp(env) };
  }

  if (COMANDOS_REINICIAR.includes(comando)) {
    return perguntar(ESTADOS.AGUARDANDO_IDIOMA, {}, 'reiniciado', 'pt-BR');
  }

  // dúvida respondida pelo FAQ: responde e repete a pergunta em aberto (não conta como erro)
  if (respostaFAQ) {
    await agendarLembretes(env, phoneFormatado, toquesDaEtapa(estadoAtual, dados, env, idioma), agora);
    return varias('faq', [respostaFAQ, perguntaDaEtapa(estadoAtual, dados, env, idioma)]);
  }

  switch (estadoAtual) {
    case ESTADOS.AGUARDANDO_IDIOMA: {
      const escolhido = idiomaEscolhido(texto);
      if (!escolhido) return repetir(estadoAtual, MENU_IDIOMA, 'idioma_invalido');
      return perguntar(ESTADOS.AGUARDANDO_CONSENTIMENTO, { idioma: escolhido, tentativasInvalidas: 0 }, 'pergunta_consentimento');
    }

    case ESTADOS.AGUARDANDO_CONSENTIMENTO: {
      const r = respostaSimNao(texto);
      if (r === 'nao') {
        await limparSessao(db, phoneFormatado);
        return { tipo: 'cancelado', resposta: T.consentimentoNegado };
      }
      if (r !== 'sim') {
        // "oi", "ok?" etc.: repete a pergunta com o aviso, sem avançar
        return repetir(estadoAtual, `${T.naoEntendi}\n\n${perguntaDaEtapa(estadoAtual, dados, env, idioma)}`, 'consentimento_invalido');
      }
      return perguntar(ESTADOS.AGUARDANDO_NOME, { idioma, consentimento_em: new Date(agora).toISOString(), tentativasInvalidas: 0 }, 'pergunta_nome');
    }

    case ESTADOS.AGUARDANDO_NOME: {
      const r = extrairNome(texto);
      if (r.invalido) return repetir(estadoAtual, r.ehSaudacao ? T.nomeSaudacao : T.nomeInvalido, 'nome_invalido');
      return perguntar(ESTADOS.AGUARDANDO_EMAIL, { ...dados, nome: r.nome, tentativasInvalidas: 0 }, 'pergunta_email');
    }

    case ESTADOS.AGUARDANDO_EMAIL: {
      if (PULAR.includes(comando)) {
        return perguntar(ESTADOS.AGUARDANDO_OBJETIVO, { ...dados, email: null, tentativasInvalidas: 0 }, 'pergunta_objetivo');
      }
      const email = texto.trim().toLowerCase();
      if (!EMAIL.test(email) || email.length > 120) return repetir(estadoAtual, T.emailInvalido, 'email_invalido');
      return perguntar(ESTADOS.AGUARDANDO_OBJETIVO, { ...dados, email, tentativasInvalidas: 0 }, 'pergunta_objetivo');
    }

    case ESTADOS.AGUARDANDO_OBJETIVO: {
      const escolha = escolherObjetivo(texto);
      if (!escolha) {
        return repetir(estadoAtual, `${T.naoEntendi}

${perguntaDaEtapa(estadoAtual, dados, env, idioma)}`, 'objetivo_invalido');
      }
      const leadId = await criarLeadCompleto(env, {
        phone: phoneFormatado,
        name: dados.nome,
        email: dados.email || null,
        dor: OBJETIVOS_GRAVADOS[escolha - 1],
        consent_at: dados.consentimento_em || new Date(agora).toISOString(),
      });
      if (!leadId) return { tipo: 'erro', resposta: T.erro };

      await limparSessao(db, phoneFormatado);
      const emissao = await emitirSerial(env, { telefone: phoneFormatado });
      if (!emissao.ok) {
        // o lead já existe: quem digitar SERIAL depois tenta de novo
        return { tipo: 'finalizado_sem_serial', resposta: T.serialIndisponivel, leadId };
      }
      // explicação → serial sozinho (fácil de copiar) → como usar → vídeo
      return varias(
        'finalizado',
        [
          T.serialIntro(dados.nome),
          emissao.serial,
          `${T.serialUso(linkApp(env))}

${T.siteLinha(linkSite(env))}`,
          { texto: T.videoLegenda(dados.nome), midia: MIDIA_VIDEO },
        ],
        { pwaLink: linkApp(env), leadId },
      );
    }

    default:
      // sem conversa (ou etapa antiga): o LEVI se apresenta e pergunta o idioma
      return perguntar(ESTADOS.AGUARDANDO_IDIOMA, {}, 'pergunta_idioma', 'pt-BR');
  }
}