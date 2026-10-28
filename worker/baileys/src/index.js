/**
 * Baileys Gateway for Leviã
 * Conecta WhatsApp via Baileys e encaminha mensagens para /api/wa/inbound
 */

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
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

function generateHMAC(payload) {
  if (!WHATSAPP_WEBHOOK_SECRET) return null;
  const crypto = require('crypto');
  return crypto.createHmac('sha256', WHATSAPP_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

async function sendToWorker(messages) {
  try {
    const payload = { messages };
    const headers = { 'Content-Type': 'application/json' };
    
    const signature = generateHMAC(payload);
    if (signature) {
      headers['X-Signature'] = signature;
    }

    const response = await axios.post(`${WORKER_URL}/api/wa/inbound`, payload, {
      headers,
      timeout: 10000
    });

    logger.info({ results: response.data }, 'Mensagens encaminhadas para Worker');
    return response.data;
  } catch (error) {
    logger.error({ err: error.message, payload: messages }, 'Erro ao enviar para Worker');
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

    const formattedMessages = messages
      .filter(m => m.message && !m.key.fromMe)
      .map(m => ({
        message_id: m.key.id,
        from: m.key.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', ''),
        body: m.message.conversation || m.message.extendedTextMessage?.text || '',
        timestamp: m.messageTimestamp,
        pushName: m.pushName
      }))
      .filter(m => m.body);

    if (formattedMessages.length > 0) {
      logger.info({ count: formattedMessages.length }, 'Novas mensagens recebidas');
      await sendToWorker(formattedMessages);
    }
  });

  // Manter processo vivo
  process.on('SIGINT', async () => {
    logger.info('Encerrando...');
    stopHeartbeat();
    if (sock) await sock.logout();
    process.exit(0);
  });
}

logger.info('Iniciando Baileys Gateway...');
connect().catch(err => {
  logger.fatal({ err }, 'Erro fatal');
  process.exit(1);
});