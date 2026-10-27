// Função para enviar mensagens via Typebot WhatsApp
// Requer TYPEBOT_WHATSAPP_TOKEN no Worker

export async function enviarWhatsApp(request, env) {
  // Funções utilitárias locais (duplicadas de licencas.js para evitar dependência circular)
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

  // Verificar autorização
  if (!env.TYPEBOT_WHATSAPP_TOKEN || !iguais(request.headers.get('x-levia-typebot') ?? '', env.TYPEBOT_WHATSAPP_TOKEN)) {
    return resposta({ erro: 'nao_autorizado' }, 401);
  }

  // Validar corpo da requisição
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta({ erro: 'corpo_invalido' }, 400);
  }

  const telefone = normalizarTelefone(corpo?.telefone);
  const mensagem = corpo?.mensagem;

  if (typeof telefone !== 'string' || telefone.length < 10 || !PHONE.test(telefone)) {
    return resposta({ erro: 'telefone_invalido' }, 400);
  }

  if (typeof mensagem !== 'string' || mensagem.length < 1 || mensagem.length > 1000) {
    return resposta({ erro: 'mensagem_invalida' }, 400);
  }

  // Chamar API do Typebot para enviar mensagem
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
    return resposta({ erro: 'falha_envio' }, 502);
  }

  return resposta({ ok: true });
}
