/**
 * Baileys Gateway for Leviã
 * Conecta WhatsApp via Baileys e encaminha mensagens para /api/wa/inbound
 */

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import pino from 'pino';
import crypto from 'node:crypto';
import path from 'path';
import axios from 'axios';
import qrcode from 'qrcode-terminal';

const logger = pino({ level: 'info' }, pino.destination({ dest: process.stdout.fd, sync: false }));

// Configurações via env
const {
  WORKER_URL = 'https://levia-ia-worker.ferpa2505.workers.dev',
  WHATSAPP_WEBHOOK_SECRET,
  HEARTBEAT_INTERVAL_MS = '30000',
  RECONNECT_DELAY_MS = '5000',
  ESPERA_RESPOSTA_MS: ESPERA_RESPOSTA = '5000',
  LEMBRETES_INTERVALO_MS = '5000',
  SESSION_NAME = 'levia-gateway'
} = process.env;

const heartbeatInterval = parseInt(HEARTBEAT_INTERVAL_MS, 10);
const reconnectDelay = parseInt(RECONNECT_DELAY_MS, 10);
const ESPERA_RESPOSTA_MS = parseInt(ESPERA_RESPOSTA, 10);
const INTERVALO_LEMBRETES_MS = parseInt(LEMBRETES_INTERVALO_MS, 10);

let sock = null;
let isConnected = false;
let heartbeatTimer = null;

if (!WHATSAPP_WEBHOOK_SECRET) {
  logger.fatal('WHATSAPP_WEBHOOK_SECRET ausente: o Worker recusa mensagens sem assinatura');
  process.exit(1);
}

/** POST assinado ao Worker: HMAC-SHA256 de `${timestamp}.${corpo}` (o Worker confere os dois headers). */
async function postAssinado(caminho, objeto) {
  const corpo = JSON.stringify(objeto);
  const carimbo = String(Date.now());
  const assinatura = crypto.createHmac('sha256', WHATSAPP_WEBHOOK_SECRET).update(`${carimbo}.${corpo}`).digest('hex');
  return axios.post(`${WORKER_URL}${caminho}`, corpo, {
    headers: { 'Content-Type': 'application/json', 'X-Timestamp': carimbo, 'X-Signature': assinatura },
    timeout: 10000,
    transformRequest: [(d) => d], // envia exatamente os bytes assinados
  });
}

async function sendToWorker(messages) {
  try {
    const response = await postAssinado('/api/wa/inbound', { messages });
    // sem telefone nem texto das mensagens nos logs (dado de saúde / LGPD)
    logger.info({ processados: response.data?.processados }, 'Mensagens encaminhadas para Worker');
    return response.data;
  } catch (error) {
    logger.error({ err: error.message, status: error.response?.status, quantidade: messages.length }, 'Erro ao enviar para Worker');
    throw error;
  }
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// Todo envio passa por uma fila só: uma mensagem por vez, com intervalo e "digitando…" (ritmo humano
// reduz o risco de bloqueio do número).
let filaDeEnvio = Promise.resolve();
function responder(jid, texto) {
  filaDeEnvio = filaDeEnvio.then(async () => {
    try {
      await sock.sendPresenceUpdate('composing', jid);
      await dormir(Math.min(4000, 1200 + texto.length * 12));
      await sock.sendMessage(jid, { text: texto });
      await sock.sendPresenceUpdate('paused', jid);
      await dormir(1500);
    } catch (e) {
      logger.error({ err: e?.message }, 'Falha ao enviar mensagem');
    }
  });
  return filaDeEnvio;
}

// Espera ESPERA_RESPOSTA_MS (5 s) sem novas mensagens da mesma pessoa e junta o que ela escreveu
// em uma só: "Maria" + "Silva" chega ao Worker como "Maria Silva" e gera uma única resposta.
const emEspera = new Map(); // telefone → { jid, textos, ids, timer }
function aguardarEProcessar(msg) {
  const atual = emEspera.get(msg.from) ?? { jid: msg.jid, textos: [], ids: [] };
  atual.jid = msg.jid;
  atual.textos.push(msg.body);
  atual.ids.push(msg.id);
  clearTimeout(atual.timer);
  atual.timer = setTimeout(() => processarGrupo(msg.from), ESPERA_RESPOSTA_MS);
  emEspera.set(msg.from, atual);
}

async function processarGrupo(telefone) {
  const grupo = emEspera.get(telefone);
  emEspera.delete(telefone);
  if (!grupo) return;
  try {
    const retorno = await sendToWorker([{
      from: telefone,
      id: grupo.ids.join('+'),
      body: grupo.textos.join(' '),
      timestamp: Math.floor(Date.now() / 1000),
    }]);
    const resposta = retorno?.resultados?.[0]?.resposta;
    if (typeof resposta === 'string' && resposta) await responder(grupo.jid, resposta);
  } catch {
    // já registrado em sendToWorker; a mensagem não é respondida
  }
}

// Lembretes: quem agenda é o Worker; o gateway busca o que já venceu e envia (cada um sai uma vez).
let buscandoLembretes = false;
async function enviarLembretesVencidos() {
  if (buscandoLembretes || !isConnected) return;
  buscandoLembretes = true;
  try {
    const { data } = await postAssinado('/api/wa/outbox/pull', {});
    for (const m of data?.mensagens ?? []) {
      if (m?.telefone && m?.texto) await responder(`${m.telefone}@s.whatsapp.net`, m.texto);
    }
    if (data?.mensagens?.length) logger.info({ enviados: data.mensagens.length }, 'Lembretes enviados');
  } catch (e) {
    logger.warn({ err: e?.message, status: e?.response?.status }, 'Não consegui buscar lembretes');
  } finally {
    buscandoLembretes = false;
  }
}
setInterval(enviarLembretesVencidos, INTERVALO_LEMBRETES_MS);

// O keep-alive é do próprio Baileys (keepAliveIntervalMs): um IQ de ping montado à mão
// nunca recebe resposta do WhatsApp e só gerava "Timed Out" a cada ciclo.
function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    logger.info({ conectado: isConnected }, 'Gateway ativo');
  }, heartbeatInterval * 20); // a cada ~10 min, só para os logs mostrarem que o processo está vivo
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(process.cwd(), 'auth'));
  
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, 'Versão Baileys');

  sock = makeWASocket({
    version,
    logger: logger.child({ module: 'baileys' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    syncFullHistory: false,
    keepAliveIntervalMs: heartbeatInterval,
    // false: o gateway não marca "online" e o celular do número continua recebendo as notificações
    markOnlineOnConnect: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      logger.info('QR Code gerado - escaneie com WhatsApp');
      // o Baileys não imprime mais o QR sozinho; ele só vale por alguns segundos e troca sempre
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'open') {
      isConnected = true;
      logger.info('Conectado ao WhatsApp!');
      startHeartbeat();
    } else if (connection === 'close') {
      isConnected = false;
      stopHeartbeat();
      const reason = lastDisconnect?.error?.output?.statusCode;
      logger.warn({ reason }, 'Desconectado do WhatsApp');
      
      if (reason === DisconnectReason.loggedOut) {
        logger.error('Sessão expirada - remova pasta auth e reinicie');
        process.exit(1);
      } else {
        logger.info({ reconnectDelay }, 'Reconectando...');
        setTimeout(connect, reconnectDelay);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;

    // só conversas diretas: grupos, status e canais ficam de fora.
    // Hoje o WhatsApp identifica quem escreve por "@lid"; o telefone vem em senderPn/participantPn.
    const soDigitos = (jid) => (jid ?? '').split('@')[0].split(':')[0].replace(/\D/g, '');
    const telefoneDe = (m) => {
      const jid = m.key?.remoteJid ?? '';
      if (jid.endsWith('@s.whatsapp.net')) return soDigitos(jid);
      if (jid.endsWith('@lid')) return soDigitos(m.key.senderPn || m.key.participantPn);
      return '';
    };
    for (const m of messages) {
      if (!m.message || m.key?.fromMe) continue;
      const jid = m.key?.remoteJid ?? '';
      if (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@lid')) continue;
      const from = telefoneDe(m);
      if (!from) {
        logger.warn('Mensagem direta sem telefone identificável: ignorada');
        continue;
      }
      const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
      if (!body) continue;
      aguardarEProcessar({ jid, id: m.key.id, from, body });
    }
  });

  // Encerrar sem sair da conta: logout() desvincularia o aparelho e exigiria novo QR Code
  const encerrar = () => {
    logger.info('Encerrando...');
    stopHeartbeat();
    sock?.end(undefined);
    process.exit(0);
  };
  process.once('SIGINT', encerrar);
  process.once('SIGTERM', encerrar);
}

logger.info('Iniciando Baileys Gateway...');
connect().catch(err => {
  logger.fatal({ err }, 'Erro fatal');
  process.exit(1);
});