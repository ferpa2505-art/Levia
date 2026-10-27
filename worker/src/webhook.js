/**
 * Hotmart webhook handler e geração de serial para licenças.
 */

function mapHotmartPlan(productId) {
  // Mapear IDs de produto Hotmart para planos internos
  const planMap = {
    'monthly': 'monthly',
    'semiannual': 'semiannual',
    'annual': 'annual',
    // Adicionar mapeamentos reais dos IDs do Hotmart aqui
    // 'hotmart-product-id-monthly': 'monthly',
    // 'hotmart-product-id-semiannual': 'semiannual',
    // 'hotmart-product-id-annual': 'annual',
  };
  return planMap[productId] || planMap[productId?.toLowerCase?.()];
}

const PLANS = {
  monthly: { periodDays: 30, photoLimit: 100 },
  semiannual: { periodDays: 180, photoLimit: 500 },
  annual: { periodDays: 365, photoLimit: 1200 },
};

function generateSerial() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return 'LEVIA-' + segments.join('-');
}

async function verifyHotmartSignature(env, payload, signature) {
  if (!env.HOTMART_WEBHOOK_SECRET) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.HOTMART_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sigBytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
}

export async function handleHotmartWebhook(request, env) {
  if (!env.HOTMART_WEBHOOK_SECRET || !env.LEVIA_DB) {
    return new Response(JSON.stringify({ erro: 'nao_configurado' }), { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-hotmart-signature') || request.headers.get('X-Hotmart-Signature');
  
  if (!signature) {
    return new Response(JSON.stringify({ erro: 'assinatura_ausente' }), { status: 401 });
  }

  const valid = await verifyHotmartSignature(env, rawBody, signature);
  if (!valid) {
    return new Response(JSON.stringify({ erro: 'assinatura_invalida' }), { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ erro: 'payload_invalido' }), { status: 400 });
  }

  // Hotmart events: PURCHASE_COMPLETE, PURCHASE_CANCELED, SUBSCRIPTION_CANCELLED, etc.
  const eventType = event?.event || event?.type;
  const purchase = event?.data || event;

  if (!eventType || !purchase) {
    return new Response(JSON.stringify({ erro: 'evento_invalido' }), { status: 400 });
  }

  const eventId = purchase?.transaction || purchase?.id || crypto.randomUUID();
  const eventHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawBody));
  const payloadHash = [...new Uint8Array(eventHash)].map(b => b.toString(16).padStart(2, '0')).join('');

  // Idempotência: verificar se já processamos este evento
  const existing = await env.LEVIA_DB.prepare(
    'SELECT 1 FROM payment_events WHERE provider = ? AND event_id = ?'
  ).bind('hotmart', eventId).first();

  if (existing) {
    return new Response(JSON.stringify({ ok: true, duplicado: true }), { status: 200 });
  }

  // Registrar evento de pagamento
  await env.LEVIA_DB.prepare(
    'INSERT INTO payment_events (provider, event_id, event_type, payload_hash, signature_valid, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind('hotmart', eventId, eventType, payloadHash, 1, new Date().toISOString()).run();

  if (eventType === 'PURCHASE_COMPLETE' || eventType === 'PURCHASE_APPROVED') {
    return await processPurchaseComplete(purchase, env);
  }

  if (eventType === 'PURCHASE_CANCELED' || eventType === 'PURCHASE_REFUNDED' || eventType === 'SUBSCRIPTION_CANCELLED') {
    return await processPurchaseCancelled(purchase, env);
  }

  return new Response(JSON.stringify({ ok: true, ignorado: true }), { status: 200 });
}

async function processPurchaseComplete(purchase, env) {
  const buyerEmail = purchase?.buyer?.email || purchase?.email;
  const plan = mapHotmartPlan(purchase?.product?.id || purchase?.plan);
  const amount = purchase?.price?.value || purchase?.value || 0;
  const subscriptionId = purchase?.subscription?.id || purchase?.subscription_id;
  const transactionId = purchase?.transaction || purchase?.id;

  if (!buyerEmail || !plan) {
    return new Response(JSON.stringify({ erro: 'dados_insuficientes' }), { status: 400 });
  }

  const emailHash = await sha256(buyerEmail.toLowerCase().trim());
  
  // Buscar ou criar conta
  let account = await env.LEVIA_DB.prepare(
    'SELECT id FROM accounts WHERE email_hash = ? LIMIT 1'
  ).bind(emailHash).first();

  let accountId;
  if (account) {
    accountId = account.id;
  } else {
    accountId = crypto.randomUUID();
    const agora = new Date().toISOString();
    await env.LEVIA_DB.prepare(
      'INSERT INTO accounts (id, email_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(accountId, emailHash, 'active', agora, agora).run();
  }

  // Verificar se já existe entitlement ativo para esta conta
  const entitlementExistente = await env.LEVIA_DB.prepare(
    'SELECT * FROM entitlements WHERE account_id = ? AND status IN (?, ?) LIMIT 1'
  ).bind(accountId, 'active', 'trialing').first();

  const serial = generateSerial();
  const serialHash = await sha256(serial);
  const agora = new Date();
  const currentPeriodStart = agora.toISOString();
  const currentPeriodEnd = new Date(agora.getTime() + PLANS[plan].periodDays * 24 * 3600 * 1000).toISOString();

  if (entitlementExistente) {
    // Atualizar entitlement existente (renovação/upgrade)
    await env.LEVIA_DB.prepare(
      'UPDATE entitlements SET plan = ?, status = ?, photo_limit = ?, photo_used = 0, current_period_start = ?, current_period_end = ?, provider_subscription_id = ?, last_payment_id = ?, updated_at = ? WHERE id = ?'
    ).bind(plan, 'active', PLANS[plan].photoLimit, currentPeriodStart, currentPeriodEnd, subscriptionId, transactionId, agora.toISOString(), entitlementExistente.id).run();

    // Criar novo código de ativação
    const codeId = crypto.randomUUID();
    await env.LEVIA_DB.prepare(
      'INSERT INTO activation_codes (id, account_id, entitlement_id, code_hash, issued_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(codeId, accountId, entitlementExistente.id, serialHash, agora.toISOString(), new Date(agora.getTime() + 7 * 24 * 3600 * 1000).toISOString()).run();

    return new Response(JSON.stringify({ ok: true, serial, renovacao: true }), { status: 200 });
  }

  // Criar novo entitlement
  const entitlementId = crypto.randomUUID();
  await env.LEVIA_DB.prepare(
    'INSERT INTO entitlements (id, account_id, plan, status, photo_limit, photo_used, current_period_start, current_period_end, provider_subscription_id, last_payment_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(entitlementId, accountId, plan, 'active', PLANS[plan].photoLimit, 0, currentPeriodStart, currentPeriodEnd, subscriptionId, transactionId, agora.toISOString(), agora.toISOString()).run();

  // Criar código de ativação
  const codeId = crypto.randomUUID();
  await env.LEVIA_DB.prepare(
    'INSERT INTO activation_codes (id, account_id, entitlement_id, code_hash, issued_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(codeId, accountId, entitlementId, serialHash, agora.toISOString(), new Date(agora.getTime() + 7 * 24 * 3600 * 1000).toISOString()).run();

  return new Response(JSON.stringify({ ok: true, serial, novo: true }), { status: 200 });
}

async function processPurchaseCancelled(purchase, env) {
  const subscriptionId = purchase?.subscription?.id || purchase?.subscription_id;
  const transactionId = purchase?.transaction || purchase?.id;

  if (subscriptionId) {
    await env.LEVIA_DB.prepare(
      'UPDATE entitlements SET status = ?, updated_at = ? WHERE provider_subscription_id = ? AND status = ?'
    ).bind('cancelled', new Date().toISOString(), subscriptionId, 'active').run();
  } else if (transactionId) {
    const entitlement = await env.LEVIA_DB.prepare(
      'SELECT id FROM entitlements WHERE last_payment_id = ? AND status = ? LIMIT 1'
    ).bind(transactionId, 'active').first();
    if (entitlement) {
      await env.LEVIA_DB.prepare(
        'UPDATE entitlements SET status = ?, updated_at = ? WHERE id = ?'
      ).bind('cancelled', new Date().toISOString(), entitlement.id).run();
    }
  }

  return new Response(JSON.stringify({ ok: true, cancelado: true }), { status: 200 });
}

async function sha256(texto) {
  const bytes = new TextEncoder().encode(texto);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export { generateSerial, PLANS, mapHotmartPlan };
