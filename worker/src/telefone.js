/**
 * Telefone em E.164 (+DDI…), para compradores de qualquer país.
 *
 * O DDI explícito manda. Sem + ou 00, números que também parecem nacionais brasileiros
 * ficam pendentes: a lista de DDIs abaixo não é completa e não prova ausência de conflito.
 */
const DDI_BR = '55';
// DDI conhecidos (espelha a lista de fusos de lembretes.js) com o tamanho máximo do número
// nacional. Serve para quando o checkout manda o número SEM o "+", como a Hotmart faz:
// "35699506350" é Malta (356 + 99506350), não um DDD brasileiro 35.
const DDIS_CONHECIDOS = [
  ['351', 9], ['353', 9], ['356', 8], ['352', 9], ['34', 9], ['33', 9], ['39', 10], ['49', 11],
  ['44', 10], ['31', 9], ['32', 8], ['41', 9], ['43', 11], ['30', 10], ['46', 9], ['45', 8],
  ['47', 8], ['48', 9], ['54', 10], ['55', 11], ['1', 10],
];
const MIN_COM_DDI = 8; // menor número nacional realista (o E.164 vai até 15)
const MAX_E164 = 15;

/** DDD válido (11–99) e assinante no formato brasileiro: celular 9xxxxxxxx ou fixo 2–5xxxxxxx. */
function brasileiroPlausivel(digitos) {
  if (digitos.length !== 10 && digitos.length !== 11) return false;
  const ddd = Number(digitos.slice(0, 2));
  if (!(ddd >= 11 && ddd <= 99)) return false;
  const assinante = digitos.slice(2);
  return digitos.length === 11 ? assinante.startsWith('9') : /^[2-5]/.test(assinante);
}

/**
 * @param {string|number} bruto telefone como veio do checkout ou formulário
 * @param {{ paisIso?: string }} [contexto] país do comprador informado pelo próprio checkout
 *   (Hotmart: buyer.address.country_iso). Com "BR", um número nacional brasileiro sem DDI
 *   recebe o +55: o país declarado é a prova que falta para desfazer a ambiguidade
 *   (ex.: "31987654321" é BH ou +31 Holanda). Sem país, a ambiguidade continua dando null.
 */
export function normalizarTelefoneE164(bruto, { paisIso } = {}) {
  if (typeof bruto !== 'string' && typeof bruto !== 'number') return null;
  const original = String(bruto).trim();
  if (!original) return null;

  const comDDI = original.startsWith('+') || original.startsWith('00');
  let digitos = original.replace(/\D/g, '');
  if (original.startsWith('00')) digitos = digitos.slice(2); // 00 + DDI é o mesmo que +
  if (!digitos) return null;

  if (!comDDI) {
    if (String(paisIso ?? '').trim().toUpperCase() === 'BR') {
      const semZero = digitos.replace(/^0+/, ''); // tronco brasileiro: 0 + DDD + número
      if (brasileiroPlausivel(semZero)) return `+${DDI_BR}${semZero}`;
    }
    if (brasileiroPlausivel(digitos)) return null;
    const candidatos = new Set();
    for (const [ddi, maxNacional] of DDIS_CONHECIDOS) {
      if (!digitos.startsWith(ddi)) continue;
      const nacional = digitos.slice(ddi.length);
      if (ddi === DDI_BR ? brasileiroPlausivel(nacional) : nacional.length >= 7 && nacional.length <= maxNacional) {
        candidatos.add(digitos);
      }
    }
    if (candidatos.size !== 1) return null;
    digitos = [...candidatos][0];
  }

  const minimo = comDDI ? MIN_COM_DDI : MIN_COM_DDI + 2;
  return digitos.length >= minimo && digitos.length <= MAX_E164 ? `+${digitos}` : null;
}
