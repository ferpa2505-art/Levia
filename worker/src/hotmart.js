import { iguais } from './cripto';
import { lerCorpo, processarPagamento, resposta } from './payt';

/**
 * Pagamento pela Hotmart (webhook versão 2.0.0): o hottok vem no cabeçalho X-HOTMART-HOTTOK
 * (e também no corpo). Compra aprovada libera o plano; reembolso, chargeback e cancelamento
 * revogam. O telefone sai do comprador (buyer.checkout_phone), então o checkout precisa pedir o WhatsApp.
 */
const PAGO = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);
const REVERTIDO = new Set(['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_CANCELED', 'PURCHASE_PROTEST']);

const texto = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
const primeiro = (...v) => v.map(texto).find(Boolean) ?? '';

function extrair(corpo) {
  const d = corpo.data ?? {};
  const compra = d.purchase ?? {};
  const comprador = d.buyer ?? {};
  const valor = Number(compra.price?.value ?? compra.full_price?.value ?? 0);
  return {
    evento: texto(corpo.event).toUpperCase(),
    hottok: primeiro(corpo.hottok),
    idEvento: primeiro(compra.transaction),
    telefone: primeiro(comprador.checkout_phone, comprador.phone),
    produtos: [d.product?.id, d.product?.ucode, compra.offer?.code, d.product?.name]
      .map((v) => texto(v).toLowerCase()).filter(Boolean),
    valorCentavos: Math.round(valor * 100) || 0,
  };
}

/** POST /v1/hotmart/webhook */
export async function receberWebhookHotmart(request, env, agora = Date.now()) {
  if (!env.LEVIA_DB || !env.HOTMART_HOTTOK || !env.TYPEBOT_PHONE_HMAC_KEY || !env.EMAIL_HASH_KEY) {
    return resposta({ erro: 'nao_configurado' }, 503);
  }
  const corpo = await lerCorpo(request);
  if (!corpo || typeof corpo !== 'object') return resposta({ erro: 'corpo_invalido' }, 400);
  const dados = extrair(corpo);

  const hottok = request.headers.get('x-hotmart-hottok') || dados.hottok;
  if (!iguais(hottok, env.HOTMART_HOTTOK)) return resposta({ erro: 'nao_autorizado' }, 401);
  if (!dados.idEvento) return resposta({ erro: 'sem_id_da_compra' }, 400);

  const tipo = PAGO.has(dados.evento) ? 'paid' : REVERTIDO.has(dados.evento) ? 'reverted' : null;
  if (!tipo) return resposta({ ok: true, ignorado: dados.evento || 'sem_evento' });
  return processarPagamento(env, 'hotmart', tipo, dados, corpo, agora);
}
