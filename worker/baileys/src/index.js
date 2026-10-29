/**
 * Baileys Gateway for Leviã
 * Conecta WhatsApp via Baileys e encaminha mensagens para /api/wa/inbound
 */

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import pino from 'pino';
import crypto from 'node:crypto';
import path from 'path';
import axios from 'axios';

const logger = pino({ level: 'info' }, pino.destination({ dest: process.stdout.fd, sync: false }));

// Configurações via env
const {
  WORKER_URL = 'https://levia-ia-worker.ferpa2505.workers.dev',
  WHATSAPP_WEBHOOK_SECRET,
  HEARTBEAT_INTERVAL_MS = '30000',
  RECONNECT_DELAY_MS = '5000',
  SESSION_NAME = 'levia-gateway'
} = process.env;

const heartbeatInterval = parseInt(HEARTBEAT_INTERVAL_MS, 10);
const reconnectDelay = parseInt(RECONNECT_DELAY_MS, 10);

let sock = null;
let isConnected = false;
let heartbeatTimer = null;

if (!WHATSAPP_WEBHOOK_SECRET) {
  logger.fatal('WHATSAPP_WEBHOOK_SECRET ausente: o Worker recusa mensagens sem assinatura');
  process.exit(1);
}

/** Envia ao Worker, assinado: HMAC-SHA256 de `${timestamp}.${corpo}` (o Worker confere os dois headers). */
async function sendToWorker(messages) {
  try {
    const corpo = JSON.stringify({ messages });
    const carimbo = String(Date.now());
    const assinatura = crypto.createHmac('sha256', WHATSAPP_WEBHOOK_SECRET).update(`${carimbo}.${corpo}`).digest('hex');

    const response = await axios.post(`${WORKER_URL}/api/wa/inbound`, corpo, {
      headers: { 'Content-Type': 'application/json', 'X-Timestamp': carimbo, 'X-Signature': assinatura },
      timeout: 10000,
      transformRequest: [(d) => d], // envia exatamente os bytes assinados
    });

    // sem telefone nem texto das mensagens nos logs (dado de saúde / LGPD)
    logger.info({ processados: response.data?.processados }, 'Mensagens encaminhadas para Worker');
    return response.data;
  } catch (error) {
    logger.error({ err: error.message, status: error.response?.status, quantidade: messages.length }, 'Erro ao enviar para Worker');
    throw error;
  }
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  
  heartbeatTimer = setInterval(async () => {
    if (sock && isConnected) {
      try {
        // Ping simples para manter conexão viva
        await sock.query({
          tag: 'iq',
          attrs: { type: 'get', to: 's.whatsapp.net', id: `ping_${Date.now()}` },
          content: [{ tag: 'ping', attrs: {} }]
        });
        logger.debug('Heartbeat enviado');
      } catch (error) {
        logger.warn({ err: error.message }, 'Heartbeat falhou');
      }
    }
  }, heartbeatInterval);
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
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      logger.info('QR Code gerado - escaneie com WhatsApp');
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

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    // só conversas diretas: grupos, status e canais ficam de fora
    const diretas = messages.filter((m) => {
      const jid = m.key?.remoteJid ?? '';
      return m.message && !m.key.fromMe && jid.endsWith('@s.whatsapp.net');
    });
    const formattedMessages = diretas
      .map((m) => ({
        jid: m.key.remoteJid,
        id: m.key.id,
        from: m.key.remoteJid.replace('@s.whatsapp.net', ''),
        body: m.message.conversation || m.message.extendedTextMessage?.text || '',
        timestamp: m.messageTimestamp,
      }))
      .filter((m) => m.body);

    if (formattedMessages.length === 0) return;
    logger.info({ count: formattedMessages.length }, 'Novas mensagens recebidas');
    try {
      const retorno = await sendToWorker(formattedMessages.map(({ jid, ...resto }) => resto));
      // o Worker devolve um resultado por mensagem, na mesma ordem: responde cada pessoa
      const resultados = retorno?.resultados ?? [];
      for (let i = 0; i < formattedMessages.length; i++) {
        const resposta = resultados[i]?.resposta;
        if (typeof resposta === 'string' && resposta) {
          await sock.sendMessage(formattedMessages[i].jid, { text: resposta });
          await new Promise((r) => setTimeout(r, 1500)); // ritmo humano: reduz risco de bloqueio do número
        }
      }
    } catch {
      // já registrado em sendToWorker; a mensagem não é respondida
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