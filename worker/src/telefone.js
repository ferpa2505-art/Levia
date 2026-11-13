/**
 * Telefone em E.164 (+DDI…), para compradores de qualquer país.
 *
 * O DDI explícito manda: "+356 9950 6350" e "00356 9950 6350" ficam como Malta, nunca viram
 * brasileiro. Só quando o campo vem sem DDI é que se tenta o Brasil — e mesmo aí apenas se o
 * número tem cara de brasileiro (DDD válido e celular começando com 9, ou fixo começando com
 * 2–5). O que não dá para interpretar devolve null: quem chama registra a compra como "sem
 * telefone" e avisa a equipe, em vez de mandar o serial para um número de outro país.
 */
const DDI_BR = '55';
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

export function normalizarTelefoneE164(bruto) {
  if (typeof bruto !== 'string' && typeof bruto !== 'number') return null;
  const original = String(bruto).trim();
  if (!original) return null;

  const comDDI = original.startsWith('+') || original.startsWith('00');
  let digitos = original.replace(/\D/g, '');
  if (original.startsWith('00')) digitos = digitos.slice(2); // 00 + DDI é o mesmo que +
  if (!digitos) return null;

  if (!comDDI) {
    const semZero = digitos.replace(/^0+/, ''); // tronco brasileiro: 0 + DDD + número
    if (semZero.startsWith(DDI_BR) && brasileiroPlausivel(semZero.slice(DDI_BR.length))) {
      digitos = semZero; // já veio com o 55 na frente
    } else if (brasileiroPlausivel(semZero)) {
      digitos = `${DDI_BR}${semZero}`;
    } else {
      return null; // sem DDI e sem cara de brasileiro: não há como saber o país
    }
  }

  const minimo = comDDI ? MIN_COM_DDI : MIN_COM_DDI + 2;
  return digitos.length >= minimo && digitos.length <= MAX_E164 ? `+${digitos}` : null;
}
