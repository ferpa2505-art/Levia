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
// DDI conhecidos (espelha a lista de fusos de lembretes.js) com o tamanho máximo do número
// nacional. Serve para quando o checkout manda o número SEM o "+", como a Hotmart faz:
// "35699506350" é Malta (356 + 99506350), não um DDD brasileiro 35.
const DDIS_CONHECIDOS = [
  ['351', 9], ['353', 9], ['356', 8], ['352', 9], ['34', 9], ['33', 9], ['39', 10], ['49', 11],
  ['44', 10], ['31', 9], ['32', 8], ['41', 9], ['43', 11], ['30', 10], ['46', 9], ['45', 8],
  ['47', 8], ['48', 9], ['54', 10], ['55', 11], ['1', 10],
].sort((a, b) => String(b[0]).length - String(a[0]).length);
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
      // sem "+", mas começando com um DDI conhecido: "35699506350" é Malta (356 + 99506350)
      const achado = DDIS_CONHECIDOS.find(([ddi, maxNacional]) => {
        if (!semZero.startsWith(ddi)) return false;
        const nacional = semZero.slice(String(ddi).length).length;
        return nacional >= 7 && nacional <= maxNacional;
      });
      if (!achado) return null; // não há como saber o país
      digitos = semZero;
    }
  }

  const minimo = comDDI ? MIN_COM_DDI : MIN_COM_DDI + 2;
  return digitos.length >= minimo && digitos.length <= MAX_E164 ? `+${digitos}` : null;
}
