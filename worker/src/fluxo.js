/**
 * fluxo.js - Máquina de estados do fluxo de onboarding WhatsApp para Leviã
 * 
 * Estados:
 * - 'inicio' → Saudação + pede nome
 * - 'aguardando_nome' → Recebe nome → pede dor/objetivo
 * - 'aguardando_dor' → Recebe dor → pede consentimento LGPD
 * - 'aguardando_consentimento' → Recebe consentimento → cria lead → retorna link PWA
 * - 'finalizado' → Lead criado, fluxo encerrado
 */

import { emitirSerial } from './serial';

// Mensagens do fluxo
const MENSAGENS = {
  saudacao: (nome = '') => 
    `Olá! 👋 Sou o assistente da Leviã.\n\n` +
    `Para começar, qual é o seu nome?`,
  
  pedirNome: () =>
    `Como posso te chamar?`,
  
  pedirDor: (nome) =>
    `Prazer, ${nome}! 😊\n\n` +
    `Qual é o seu principal objetivo ou dificuldade hoje?\n` +
    `Ex: "Quero emagrecer", "Tenho diabetes e preciso controlar", "Quero ganhar massa muscular", etc.`,
  
  pedirConsentimento: (nome, dor) =>
    `Entendido, ${nome}. Obrigado por compartilhar! 📝\n\n` +
    `Para que eu possa criar seu perfil e te enviar o link do app, preciso do seu consentimento para:\n` +
    `• Armazenar seu nome, telefone e objetivo\n` +
    `• Usar esses dados para personalizar sua experiência no app\n` +
    `• Entrar em contato via WhatsApp se necessário\n\n` +
    `Responda "SIM" ou "CONCORDO" para continuar.`,
  
  consentimentoNegado: () =>
    `Tudo bem! Sem problemas. Se mudar de ideia, é só me chamar novamente. 👋`,
  
  leadCriado: (serial, link) =>
    `Perfeito! ✅ Seu perfil foi criado.\n\n` +
    `Seu serial de acesso (é pessoal, não compartilhe):\n*${serial}*\n\n` +
    `Como usar: abra ${link} (ou o app Leviã), toque em "Ativar" e digite o serial. ` +
    `Ele vale para até 2 aparelhos e seu teste de 7 dias começa na ativação.\n\n` +
    `Perdeu o serial? Digite SERIAL aqui que eu gero outro (o anterior deixa de valer).`,

  serialNovo: (serial, link) =>
    `Aqui está seu novo serial (o anterior deixou de valer):\n*${serial}*\n\n` +
    `Ative em ${link}. Os aparelhos que você já ativou continuam funcionando.`,

  serialIndisponivel: () =>
    `Seu perfil foi criado, mas não consegui gerar o serial agora. Digite SERIAL em alguns minutos para tentar de novo.`,

  serialLimite: () =>
    `Você já pediu serial 3 vezes hoje. Tente de novo amanhã.`,

  erroGenerico: () =>
    `Ops, ocorreu um erro. Tente novamente em alguns instantes ou digite "MENU" para reiniciar.`,

  jaFinalizado: () =>
    `Você já completou o cadastro! 🎉\n\n` +
    `Para receber um novo serial de acesso, digite SERIAL.`,
  
  comandoInvalido: (estado) => {
    const opcoes = {
      aguardando_nome: 'Digite seu nome para continuar.',
      aguardando_dor: 'Conte seu objetivo/dificuldade (ex: "quero emagrecer").',
      aguardando_consentimento: 'Responda "SIM" ou "CONCORDO" para autorizar.',
    };
    return `Não entendi. ${opcoes[estado] || 'Digite "MENU" para reiniciar.'}`;
  },
};

// Validadores
function validarNome(texto) {
  const limpo = texto.trim();
  return limpo.length >= 2 && limpo.length <= 80 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(limpo);
}

function validarDor(texto) {
  const limpo = texto.trim();
  return limpo.length >= 3 && limpo.length <= 500;
}

function validarConsentimento(texto) {
  const limpo = texto.trim().toLowerCase();
  return ['sim', 'concordo', 'ok', 'aceito', 'autorizo', 'permito'].includes(limpo);
}

// Máquina de estados
const ESTADOS = {
  INICIO: 'inicio',
  AGUARDANDO_NOME: 'aguardando_nome',
  AGUARDANDO_DOR: 'aguardando_dor',
  AGUARDANDO_CONSENTIMENTO: 'aguardando_consentimento',
  FINALIZADO: 'finalizado',
  ERRO: 'erro',
};

async function obterSessao(db, phone) {
  if (!db) return null;
  try {
    const row = await db.prepare(
      'SELECT * FROM wa_sessions WHERE phone = ? ORDER BY updated_at DESC LIMIT 1'
    ).bind(phone).first();
    return row ? {
      phone: row.phone,
      estado: row.stage,
      data: JSON.parse(row.data_json || '{}'),
      updated_at: row.updated_at,
    } : null;
  } catch (e) {
    console.error('Erro ao buscar sessão:', e?.message);
    return null;
  }
}

async function salvarSessao(db, phone, estado, data) {
  if (!db) return false;
  try {
    const agora = new Date().toISOString();
    await db.prepare(
      `INSERT INTO wa_sessions (phone, stage, data_json, updated_at) 
       VALUES (?, ?, ?, ?)
       ON CONFLICT(phone) DO UPDATE SET 
         stage = excluded.stage,
         data_json = excluded.data_json,
         updated_at = excluded.updated_at`
    ).bind(phone, estado, JSON.stringify(data), agora).run();
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
    const row = await db.prepare('SELECT 1 FROM wa_processed WHERE msg_id = ?').bind(messageId).first();
    return !!row;
  } catch (e) {
    console.error('Erro ao verificar processado:', e?.message);
    return false;
  }
}

async function marcarProcessado(db, messageId) {
  if (!db) return false;
  try {
    const agora = new Date().toISOString();
    await db.prepare(
      'INSERT OR IGNORE INTO wa_processed (msg_id, created_at) VALUES (?, ?)'
    ).bind(messageId, agora).run();
    return true;
  } catch (e) {
    console.error('Erro ao marcar processado:', e?.message);
    return false;
  }
}

async function criarLeadCompleto(env, leadData) {
  const { phone, name, dor, consent_at } = leadData;
  const agora = new Date().toISOString();
  const leadId = crypto.randomUUID();
  
  let salvo = false;
  if (env.LEVIA_DB) {
    try {
      await env.LEVIA_DB.prepare(
        `INSERT INTO leads (id, name, phone, pain_point, source, consent_at, channel, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        leadId,
        name,
        phone,
        dor,
        'whatsapp',
        consent_at,
        'whatsapp',
        agora,
        agora
      ).run();
      salvo = true;
    } catch (e) {
      console.error('Erro ao salvar lead no D1:', e?.message);
    }
  }
  
  if (!salvo) {
    try {
      const leadData = {
        id: leadId,
        name,
        phone,
        pain_point: dor,
        source: 'whatsapp',
        consent_at,
        channel: 'whatsapp',
        created_at: agora,
        updated_at: agora,
      };
      await env.LEVIA_COTAS.put(`lead:${leadId}`, JSON.stringify(leadData), { expirationTtl: 30 * 24 * 3600 });
      salvo = true;
    } catch (e) {
      console.error('Erro ao salvar lead no KV:', e?.message);
      return null;
    }
  }
  
  return leadId;
}

export async function processarMensagemWhatsApp(env, phone, texto, messageId) {
  // Normalizar telefone
  const phoneNormalizado = String(phone).replace(/\D/g, '');
  const phoneFormatado = phoneNormalizado.startsWith('55') ? '+' + phoneNormalizado : '+55' + phoneNormalizado;
  
  // Verificar idempotência
  if (await verificarProcessado(env.LEVIA_DB, messageId)) {
    return { tipo: 'duplicado', resposta: null };
  }
  
  // Verificar se já finalizou (lead existe): o único pedido possível é um novo serial
  const leadExistente = await buscarLeadPorTelefone(env.LEVIA_DB, phoneFormatado);
  if (leadExistente) {
    const link = `${env.APP_BASE_URL || 'https://leviapp.org'}/ativar`;
    await marcarProcessado(env.LEVIA_DB, messageId);
    if (texto.trim().toLowerCase() === 'serial') {
      const emissao = await emitirSerial(env, { telefone: phoneFormatado });
      if (emissao.ok) return { tipo: 'serial_novo', resposta: MENSAGENS.serialNovo(emissao.serial, link), leadId: leadExistente };
      if (emissao.motivo === 'limite') return { tipo: 'serial_limite', resposta: MENSAGENS.serialLimite() };
      return { tipo: 'erro', resposta: MENSAGENS.erroGenerico() };
    }
    return { tipo: 'ja_finalizado', resposta: MENSAGENS.jaFinalizado(), pwaLink: link };
  }
  
  // Obter sessão atual
  const sessao = await obterSessao(env.LEVIA_DB, phoneFormatado);
  const estadoAtual = sessao?.estado || ESTADOS.INICIO;
  const dados = sessao?.data || {};
  
  // Processar comando de reinício
  const textoLimpo = texto.trim().toLowerCase();
  if (['menu', 'reiniciar', 'começar', 'iniciar', 'start'].includes(textoLimpo)) {
    await limparSessao(env.LEVIA_DB, phoneFormatado);
    await salvarSessao(env.LEVIA_DB, phoneFormatado, ESTADOS.AGUARDANDO_NOME, {});
    await marcarProcessado(env.LEVIA_DB, messageId);
    return { tipo: 'reiniciado', resposta: MENSAGENS.saudacao() };
  }
  
  // Máquina de estados
  switch (estadoAtual) {
    case ESTADOS.INICIO: {
      await salvarSessao(env.LEVIA_DB, phoneFormatado, ESTADOS.AGUARDANDO_NOME, {});
      await marcarProcessado(env.LEVIA_DB, messageId);
      return { tipo: 'pergunta_nome', resposta: MENSAGENS.saudacao() };
    }
    
    case ESTADOS.AGUARDANDO_NOME: {
      if (!validarNome(texto)) {
        await marcarProcessado(env.LEVIA_DB, messageId);
        return { tipo: 'nome_invalido', resposta: MENSAGENS.comandoInvalido(ESTADOS.AGUARDANDO_NOME) };
      }
      
      const nome = texto.trim();
      await salvarSessao(env.LEVIA_DB, phoneFormatado, ESTADOS.AGUARDANDO_DOR, { nome });
      await marcarProcessado(env.LEVIA_DB, messageId);
      return { tipo: 'pergunta_dor', resposta: MENSAGENS.pedirDor(nome) };
    }
    
    case ESTADOS.AGUARDANDO_DOR: {
      if (!validarDor(texto)) {
        await marcarProcessado(env.LEVIA_DB, messageId);
        return { tipo: 'dor_invalida', resposta: MENSAGENS.comandoInvalido(ESTADOS.AGUARDANDO_DOR) };
      }
      
      const dor = texto.trim();
      await salvarSessao(env.LEVIA_DB, phoneFormatado, ESTADOS.AGUARDANDO_CONSENTIMENTO, { 
        ...dados, 
        dor 
      });
      await marcarProcessado(env.LEVIA_DB, messageId);
      return { tipo: 'pergunta_consentimento', resposta: MENSAGENS.pedirConsentimento(dados.nome, dor) };
    }
    
    case ESTADOS.AGUARDANDO_CONSENTIMENTO: {
      if (!validarConsentimento(texto)) {
        if (['não', 'nao', 'não quero', 'cancelar'].includes(textoLimpo)) {
          await limparSessao(env.LEVIA_DB, phoneFormatado);
          await marcarProcessado(env.LEVIA_DB, messageId);
          return { tipo: 'cancelado', resposta: MENSAGENS.consentimentoNegado() };
        }
        await marcarProcessado(env.LEVIA_DB, messageId);
        return { tipo: 'consentimento_invalido', resposta: MENSAGENS.comandoInvalido(ESTADOS.AGUARDANDO_CONSENTIMENTO) };
      }
      
      // Criar lead
      const consent_at = new Date().toISOString();
      const leadId = await criarLeadCompleto(env, {
        phone: phoneFormatado,
        name: dados.nome,
        dor: dados.dor,
        consent_at,
      });
      
      if (!leadId) {
        await marcarProcessado(env.LEVIA_DB, messageId);
        return { tipo: 'erro', resposta: MENSAGENS.erroGenerico() };
      }
      
      // Limpar sessão e finalizar
      await limparSessao(env.LEVIA_DB, phoneFormatado);
      await marcarProcessado(env.LEVIA_DB, messageId);
      
      const pwaLink = `${env.APP_BASE_URL || 'https://leviapp.org'}/ativar`;
      const emissao = await emitirSerial(env, { telefone: phoneFormatado });
      if (!emissao.ok) {
        // o lead já existe: quem digitar SERIAL depois tenta de novo
        return { tipo: 'finalizado_sem_serial', resposta: MENSAGENS.serialIndisponivel(), leadId };
      }

      return {
        tipo: 'finalizado',
        resposta: MENSAGENS.leadCriado(emissao.serial, pwaLink),
        pwaLink,
        leadId,
      };
    }

    case ESTADOS.FINALIZADO: {
      await marcarProcessado(env.LEVIA_DB, messageId);
      return {
        tipo: 'ja_finalizado',
        resposta: MENSAGENS.jaFinalizado(),
        pwaLink: `${env.APP_BASE_URL || 'https://leviapp.org'}/ativar`,
      };
    }
    
    default: {
      // Estado desconhecido - reiniciar
      await limparSessao(env.LEVIA_DB, phoneFormatado);
      await salvarSessao(env.LEVIA_DB, phoneFormatado, ESTADOS.AGUARDANDO_NOME, {});
      await marcarProcessado(env.LEVIA_DB, messageId);
      return { tipo: 'reiniciado', resposta: MENSAGENS.saudacao() };
    }
  }
}

// Função auxiliar (importada do index.js ou duplicada aqui)
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


