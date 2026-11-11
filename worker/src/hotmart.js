import { iguais } from './cripto';
import { lerCorpo, processarPagamento, resposta } from './pagamentos';

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
    // resumo sem dados pessoais, guardado em payment_events para diagnosticar plano não reconhecido
    resumo: {
      evento: texto(corpo.event).toUpperCase(),
      produto: { id: d.product?.id ?? null, ucode: d.product?.ucode ?? null, nome: d.product?.name ?? null },
      oferta: compra.offer?.code ?? null,
      preco: compra.price?.value ?? null,
      moeda: compra.price?.currency?.code ?? compra.price?.currency ?? null,
      status: compra.status ?? null,
      tipoPagamento: compra.payment?.type ?? null,
    },
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

  // espaços e quebras de linha nas pontas vêm da colagem do segredo; o valor em si não é comparado com eles
  const hottok = (request.headers.get('x-hotmart-hottok') || dados.hottok || '').trim();
  const esperado = String(env.HOTMART_HOTTOK).trim();
  if (!iguais(hottok, esperado)) {
    // só os tamanhos, nunca os valores: ajuda a ver se foi colado o código errado
    return resposta({ erro: 'nao_autorizado', recebido: hottok.length, esperado: esperado.length }, 401);
  }
  if (!dados.idEvento) return resposta({ erro: 'sem_id_da_compra' }, 400);

  const tipo = PAGO.has(dados.evento) ? 'paid' : REVERTIDO.has(dados.evento) ? 'reverted' : null;
  if (!tipo) return resposta({ ok: true, ignorado: dados.evento || 'sem_evento' });
  return processarPagamento(env, 'hotmart', tipo, dados, corpo, agora);
}
