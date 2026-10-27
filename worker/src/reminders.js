/**
 * Handler para lembretes de expiração (trial e licenças).
 * Executado via Cron Trigger diariamente às 09:00 UTC.
 */

function resposta(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function iguais(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diferente = 0;
  for (let i = 0; i < a.length; i++) diferente |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferente === 0;
}

const PHONE = /^\+[1-9]\d{7,14}$/;

function normalizarTelefone(valor) {
  if (typeof valor !== 'string') return '';
  return valor.replace(/[\s().-]/g, '');
}

async function enviarMensagemTypebot(env, telefone, mensagem) {
  if (!env.TYPEBOT_WHATSAPP_TOKEN) {
    console.warn('TYPEBOT_WHATSAPP_TOKEN não configurado, pulando envio');
    return false;
  }

  const typebotResponse = await fetch('https://api.typebot.io/v1/send-whatsapp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + env.TYPEBOT_WHATSAPP_TOKEN,
    },
    body: JSON.stringify({
      phoneNumber: telefone,
      message: mensagem,
    }),
  });

  if (!typebotResponse.ok) {
    console.error('Falha ao enviar WhatsApp via Typebot:', typebotResponse.status);
    return false;
  }

  return true;
}

async function processarLembretesTrial(env) {
  const agora = new Date();
  const amanha = new Date(agora.getTime() + 24 * 3600 * 1000);
  const amanhaISO = amanha.toISOString().slice(0, 10); // YYYY-MM-DD
  const agoraISO = agora.toISOString();

  // Buscar trials ativos que expiram amanhã
  const trials = await env.LEVIA_DB.prepare(
    `SELECT t.*, a.id as account_id 
     FROM trials t 
     JOIN accounts a ON a.id = t.account_id 
     WHERE t.status = ? AND date(t.expires_at) = ?`
  ).bind('active', amanhaISO).all();

  if (!trials?.results?.length) return { enviados: 0, erros: 0 };

  let enviados = 0;
  let erros = 0;

  for (const trial of trials.results) {
    // Buscar instalações/telefones associados a esta conta
    // Para trials, usamos o phone_hash do trial se existir, ou buscamos em installations
    const telefone = trial.phone_hash ? trial.phone_hash : null;
    
    if (!telefone) {
      console.log('Trial sem telefone:', trial.account_id);
      continue;
    }

    const mensagem = `⏰ *Lembrete Leviã*\n\nSeu teste gratuito de 7 dias expira *amanhã* (${amanha.toLocaleDateString('pt-BR')}).\n\nVocê usou ${trial.photo_used} de ${trial.photo_limit} análises de fotos.\n\nPara continuar usando o app, faça o upgrade agora:\n👉 https://levia-app.netlify.app/checkout\n\nObrigado por testar o Leviã! 💚`;

    const ok = await enviarMensagemTypebot(env, telefone, mensagem);
    if (ok) enviados++; else erros++;
  }

  return { enviados, erros };
}

async function processarLembretesLicencas(env) {
  const agora = new Date();
  const diasAvisos = [30, 15, 7, 1];
  let totalEnviados = 0;
  let totalErros = 0;

  for (const dias of diasAvisos) {
    const dataAlvo = new Date(agora.getTime() + dias * 24 * 3600 * 1000);
    const dataAlvoISO = dataAlvo.toISOString().slice(0, 10); // YYYY-MM-DD

    // Buscar entitlements ativos que expiram na data alvo
    const entitlements = await env.LEVIA_DB.prepare(
      `SELECT e.*, a.id as account_id 
       FROM entitlements e 
       JOIN accounts a ON a.id = e.account_id 
       WHERE e.status = ? AND date(e.current_period_end) = ?`
    ).bind('active', dataAlvoISO).all();

    if (!entitlements?.results?.length) continue;

    for (const ent of entitlements.results) {
      // Buscar telefone da conta (precisamos de uma forma de associar telefone)
      // Por enquanto, vamos tentar buscar em installations ou usar um campo na conta
      // Como não temos telefone direto na conta, vamos pular por enquanto
      // TODO: Implementar busca de telefone via installations ou adicionar campo na conta
      
      console.log(`Licença expira em ${dias} dias:`, ent.account_id, ent.plan);
      
      // Placeholder para envio real quando tivermos o telefone
      // const mensagem = `⏰ *Lembrete Leviã*\n\nSua licença ${ent.plan} expira em *${dias} dia(s)* (${dataAlvo.toLocaleDateString('pt-BR')}).\n\nPara renovar, acesse:\n👉 https://levia-app.netlify.app/checkout\n\nObrigado por usar o Leviã! 💚`;
      // const ok = await enviarMensagemTypebot(env, telefone, mensagem);
    }
  }

  return { enviados: totalEnviados, erros: totalErros };
}

export async function handleReminders(env) {
  console.log('Iniciando processamento de lembretes...');
  
  const trialResult = await processarLembretesTrial(env);
  const licencaResult = await processarLembretesLicencas(env);

  return resposta({
    ok: true,
    trials: trialResult,
    licencas: licencaResult,
    timestamp: new Date().toISOString()
  });
}

// Exportar para uso no index.js
export { processarLembretesTrial, processarLembretesLicencas };