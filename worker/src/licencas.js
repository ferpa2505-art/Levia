const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+[1-9]\d{7,14}$/;
const MAX_EMAIL = 254;
const MAX_PHONE = 16;
const TRIAL_DAYS = 7;
const LINK_MINUTES = 30;

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

function normalizarEmail(valor) {
  return typeof valor === 'string' ? valor.trim().toLowerCase() : '';
}

function normalizarTelefone(valor) {
  if (typeof valor !== 'string') return '';
  return valor.replace(/[\s().-]/g, '');
}

function base64url(bytes) {
  let texto = '';
  for (const byte of bytes) texto += String.fromCharCode(byte);
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64Bytes(valor) {
  const binario = atob(valor);
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

async function sha256(texto) {
  const bytes = new TextEncoder().encode(texto);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, texto) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(texto));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function cifrarEmail(email, secret) {
  let keyBytes;
  try {
    keyBytes = base64Bytes(secret);
  } catch {
    return null;
  }
  if (keyBytes.length !== 32) return null;
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifra = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(email));
  return `${base64url(iv)}.${base64url(new Uint8Array(cifra))}`;
}

async function incrementarLimite(kv, chave, limite, ttl) {
  const atual = Number((await kv.get(chave)) ?? 0);
  if (atual >= limite) return false;
  await kv.put(chave, String(atual + 1), { expirationTtl: ttl });
  return true;
}

async function enviarLink(env, email, token) {
  const url = `${env.APP_BASE_URL || 'https://levia-app.netlify.app'}/ativar?token=${encodeURIComponent(token)}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: 'Seu acesso de teste ao Leviã',
      text: `Abra este link em até ${LINK_MINUTES} minutos para iniciar seu teste de 7 dias do Leviã:\n\n${url}\n\nSe você não pediu este acesso, ignore esta mensagem.`,
    }),
  });
  return response.ok;
}

export async function iniciarTeste(request, env) {
  if (!env.TYPEBOT_SHARED_SECRET || !iguais(request.headers.get('x-levia-typebot') ?? '', env.TYPEBOT_SHARED_SECRET)) {
    return resposta({ erro: 'nao_autorizado' }, 401);
  }
  if (!env.LEVIA_DB || !env.LEVIA_COTAS || !env.RESEND_API_KEY || !env.EMAIL_FROM || !env.EMAIL_ENCRYPTION_KEY) {
    return resposta({ erro: 'nao_configurado' }, 503);
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta({ erro: 'corpo_invalido' }, 400);
  }
  const email = normalizarEmail(corpo?.email);
  const telefone = normalizarTelefone(corpo?.telefone);
  if (email.length > MAX_EMAIL || !EMAIL.test(email)) return resposta({ erro: 'email_invalido' }, 400);
  if (telefone.length > MAX_PHONE || !PHONE.test(telefone)) return resposta({ erro: 'telefone_invalido' }, 400);
  if (corpo?.consentimento_contato !== true) return resposta({ erro: 'consentimento_obrigatorio' }, 400);

  const ip = request.headers.get('cf-connecting-ip') ?? 'sem-ip';
  const hora = new Date().toISOString().slice(0, 13);
  const emailHash = await sha256(email);
  const telefoneHash = await hmacHex(env.TYPEBOT_PHONE_HMAC_KEY || env.TYPEBOT_SHARED_SECRET, telefone);
  const limiteEmail = await incrementarLimite(env.LEVIA_COTAS, `trial-email:${emailHash}:${hora}`, 3, 3600);
  const limiteTelefone = await incrementarLimite(env.LEVIA_COTAS, `trial-phone:${telefoneHash}:${hora}`, 3, 3600);
  const limiteIp = await incrementarLimite(env.LEVIA_COTAS, `trial-ip:${ip}:${hora}`, 20, 3600);
  if (!limiteEmail || !limiteTelefone || !limiteIp) return resposta({ erro: 'limite' }, 429);

  const existente = await env.LEVIA_DB.prepare(
    'SELECT id, phone_hash FROM accounts WHERE email_hash = ? OR phone_hash = ? LIMIT 1',
  ).bind(emailHash, telefoneHash).first();
  if (existente?.phone_hash === telefoneHash) return resposta({ erro: 'telefone_ja_usou_teste' }, 403);
  if (existente) return resposta({ erro: 'conta_existente' }, 409);

  const accountId = crypto.randomUUID();
  const codeId = crypto.randomUUID();
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64url(tokenBytes);
  const codeHash = await sha256(token);
  const agora = new Date();
  const expira = new Date(agora.getTime() + LINK_MINUTES * 60 * 1000).toISOString();
  const emailCiphertext = await cifrarEmail(email, env.EMAIL_ENCRYPTION_KEY);
  if (!emailCiphertext) return resposta({ erro: 'nao_configurado' }, 503);

  await env.LEVIA_DB.batch([
    env.LEVIA_DB.prepare(
      'INSERT INTO accounts (id, email_hash, email_ciphertext, phone_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(accountId, emailHash, emailCiphertext, telefoneHash, agora.toISOString(), agora.toISOString()),
    env.LEVIA_DB.prepare(
      'INSERT INTO activation_codes (id, account_id, code_hash, issued_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(codeId, accountId, codeHash, agora.toISOString(), expira),
  ]);

  const enviado = await enviarLink(env, email, token);
  if (!enviado) return resposta({ erro: 'falha_email' }, 502);
  return resposta({ ok: true, lead_id: accountId, email_enviado: true });
}
