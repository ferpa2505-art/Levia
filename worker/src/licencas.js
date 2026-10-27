const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+[1-9]\d{7,14}$/;
const MAX_EMAIL = 254;
const MAX_PHONE = 16;
const TRIAL_DAYS = 7;
const LINK_MINUTES = 30;
const SESSION_TTL_DAYS = 30;

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

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function base64Bytes(str) {
  const bin = atob(str);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
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
  return base64url(iv) + '.' + base64url(new Uint8Array(cifra));
}

async function incrementarLimite(kv, chave, limite, ttl) {
  const atual = Number((await kv.get(chave)) ?? 0);
  if (atual >= limite) return false;
  await kv.put(chave, String(atual + 1), { expirationTtl: ttl });
  return true;
}

async function enviarLink(env, email, token) {
  const url = (env.APP_BASE_URL || 'https://levia-app.netlify.app') + '/ativar?token=' + encodeURIComponent(token);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: 'Seu acesso de teste ao Leviã',
      text: 'Abra este link em até ' + LINK_MINUTES + ' minutos para iniciar seu teste de 7 dias do Leviã:\n\n' + url + '\n\nSe você não pediu este acesso, ignore esta mensagem.',
    }),
  });
  return response.ok;
}

// JWT utilities
async function importSigningKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function createSessionToken(accountId, env) {
  const key = await importSigningKey(env.EMAIL_ENCRYPTION_KEY);
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_TTL_DAYS * 24 * 3600;
  const payload = { sub: accountId, iat: now, exp };
  const headerB64 = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = headerB64 + '.' + payloadB64;
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const signatureB64 = base64url(new Uint8Array(signature));
  return signingInput + '.' + signatureB64;
}

async function verifySessionToken(token, env) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    const key = await importSigningKey(env.EMAIL_ENCRYPTION_KEY);
    const signingInput = headerB64 + '.' + payloadB64;
    const signature = base64urlDecode(signatureB64);
    const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(signingInput));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function validarLicenca(request, env) {
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta({ erro: 'corpo_invalido' }, 400);
  }

  const serial = corpo?.serial;
  if (typeof serial !== 'string' || serial.length < 10) {
    return resposta({ erro: 'serial_invalido' }, 400);
  }

  const serialHash = await sha256(serial);
  const agora = new Date().toISOString();

  // Buscar código de ativação válido
  const code = await env.LEVIA_DB.prepare(
    'SELECT ac.id, ac.account_id, ac.issued_at, ac.expires_at, ac.used_at, ac.invalidated_at, a.id as account_id, a.email_hash FROM activation_codes ac JOIN accounts a ON a.id = ac.account_id WHERE ac.code_hash = ? LIMIT 1'
  ).bind(serialHash).first();

  if (!code) {
    return resposta({ erro: 'serial_invalido' }, 400);
  }

  if (code.used_at || code.invalidated_at) {
    return resposta({ erro: 'serial_ja_usado' }, 400);
  }

  if (new Date(code.expires_at) < new Date(agora)) {
    return resposta({ erro: 'serial_expirado' }, 400);
  }

  // Buscar entitlement ativo para esta conta
  const entitlement = await env.LEVIA_DB.prepare(
    'SELECT * FROM entitlements WHERE account_id = ? AND status = ? LIMIT 1'
  ).bind(code.account_id, 'active').first();

  if (!entitlement) {
    return resposta({ erro: 'licenca_nao_ativa' }, 400);
  }

  // Marcar código como usado
  await env.LEVIA_DB.prepare(
    'UPDATE activation_codes SET used_at = ? WHERE id = ?'
  ).bind(agora, code.id).run();

  const sessionToken = await createSessionToken(code.account_id, env);

  return resposta({
    ok: true,
    session_token: sessionToken,
    entitlement: {
      plan: entitlement.plan,
      photo_limit: entitlement.photo_limit,
      photo_used: entitlement.photo_used,
      current_period_start: entitlement.current_period_start,
      current_period_end: entitlement.current_period_end,
    }
  });
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
  const limiteEmail = await incrementarLimite(env.LEVIA_COTAS, 'trial-email:' + emailHash + ':' + hora, 3, 3600);
  const limiteTelefone = await incrementarLimite(env.LEVIA_COTAS, 'trial-phone:' + telefoneHash + ':' + hora, 3, 3600);
  const limiteIp = await incrementarLimite(env.LEVIA_COTAS, 'trial-ip:' + ip + ':' + hora, 20, 3600);
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

export async function ativarTeste(request, env) {
  if (!env.LEVIA_DB || !env.EMAIL_ENCRYPTION_KEY) {
    return resposta({ erro: 'nao_configurado' }, 503);
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta({ erro: 'corpo_invalido' }, 400);
  }

  const token = corpo?.token;
  if (typeof token !== 'string' || token.length < 10) {
    return resposta({ erro: 'token_invalido' }, 400);
  }

  const codeHash = await sha256(token);
  const agora = new Date().toISOString();

  // Buscar código de ativação válido
  const code = await env.LEVIA_DB.prepare(
    'SELECT ac.id, ac.account_id, ac.issued_at, ac.expires_at, ac.used_at, ac.invalidated_at, a.id as account_id, a.email_hash FROM activation_codes ac JOIN accounts a ON a.id = ac.account_id WHERE ac.code_hash = ? LIMIT 1'
  ).bind(codeHash).first();

  if (!code) {
    return resposta({ erro: 'token_invalido' }, 400);
  }

  if (code.used_at || code.invalidated_at) {
    return resposta({ erro: 'token_ja_usado' }, 400);
  }

  if (new Date(code.expires_at) < new Date(agora)) {
    return resposta({ erro: 'token_expirado' }, 400);
  }

  const accountId = code.account_id;

  // Verificar se já existe trial ativo para esta conta
  const trialExistente = await env.LEVIA_DB.prepare(
    'SELECT * FROM trials WHERE account_id = ? AND status = ? LIMIT 1'
  ).bind(accountId, 'active').first();

  if (trialExistente) {
    // Marcar código como usado mesmo assim
    await env.LEVIA_DB.prepare(
      'UPDATE activation_codes SET used_at = ? WHERE id = ?'
    ).bind(agora, code.id).run();

    const sessionToken = await createSessionToken(accountId, env);
    return resposta({ ok: true, session_token: sessionToken, trial_ja_ativo: true });
  }

  // Criar trial: 7 dias, 2 fotos
  const trialId = crypto.randomUUID();
  const startedAt = agora;
  const expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000).toISOString();

  await env.LEVIA_DB.batch([
    env.LEVIA_DB.prepare(
      'INSERT INTO trials (account_id, started_at, expires_at, photo_limit, photo_used, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(accountId, startedAt, expiresAt, 2, 0, 'active', startedAt, startedAt),
    env.LEVIA_DB.prepare(
      'UPDATE activation_codes SET used_at = ? WHERE id = ?'
    ).bind(agora, code.id),
  ]);

  const sessionToken = await createSessionToken(accountId, env);

  return resposta({
    ok: true,
    session_token: sessionToken,
    trial: {
      started_at: startedAt,
      expires_at: expiresAt,
      photo_limit: 2,
      photo_used: 0,
    }
  });
}

// Exportar funções JWT para uso em outros módulos
export { createSessionToken, verifySessionToken, validarLicenca };
