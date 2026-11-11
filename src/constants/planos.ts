/**
 * Planos pagos do Leviã (vendidos pela Hotmart). Os preços aqui são os de referência em reais;
 * no pagamento a Hotmart converte para a moeda do país da pessoa. Os mesmos links estão na landing
 * (site/landing/src/config.ts). Os códigos dos produtos (8875689 e 8876081) são os do worker.
 */
export const CHECKOUT_MENSAL = 'https://pay.hotmart.com/M108322229J';
export const CHECKOUT_ANUAL = 'https://pay.hotmart.com/T108322944O';

export const PRECO_MENSAL = 'R$ 19,97';
export const PRECO_ANUAL = 'R$ 191,71';

export type PlanoPago = 'mensal' | 'anual';

export function linkDoPlano(plano: PlanoPago): string {
  return plano === 'mensal' ? CHECKOUT_MENSAL : CHECKOUT_ANUAL;
}
