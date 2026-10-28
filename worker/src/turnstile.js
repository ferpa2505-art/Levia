const ACTION = 'levia_analisar_prato';
const MAX_TOKEN_LENGTH = 2048;

function json(corpo, status) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function turnstileSitekey(env) {
  if (typeof env.TURNSTILE_SITE_KEY !== 'string' || !env.TURNSTILE_SITE_KEY.trim()) {
    return json({ erro: 'nao_configurado' }, 503);
  }
  return json({ sitekey: env.TURNSTILE_SITE_KEY.trim() }, 200);
}

export async function validarTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY) {
    return { ok: false, response: json({ erro: 'protecao_nao_configurada' }, 503) };
  }
  if (typeof token !== 'string' || token.length < 10 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, response: json({ erro: 'desafio_obrigatorio' }, 403) };
  }

  let result;
  try {
    const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) form.set('remoteip', ip);
    const verified = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!verified.ok) return { ok: false, response: json({ erro: 'desafio_indisponivel' }, 503) };
    result = await verified.json();
  } catch {
    return { ok: false, response: json({ erro: 'desafio_indisponivel' }, 503) };
  }

  const allowed = String(env.TURNSTILE_ALLOWED_HOSTNAMES || 'levia-app.netlify.app,localhost')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const hostname = String(result?.hostname || '').toLowerCase();
  if (
    result?.success !== true ||
    result?.action !== ACTION ||
    !allowed.includes(hostname)
  ) {
    return { ok: false, response: json({ erro: 'desafio_invalido' }, 403) };
  }
  return { ok: true };
}
