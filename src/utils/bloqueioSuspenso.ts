/**
 * Ações que levam a pessoa para fora do app (câmera, e-mail, arquivos,
 * compartilhar) não devem bloquear o app na volta: elas chamam
 * suspenderBloqueio() antes, e o SegurancaContext consulta bloqueioSuspenso().
 */
let suspensoAte = 0;

export function suspenderBloqueio(ms = 3 * 60_000) {
  suspensoAte = Date.now() + ms;
}

/** true se o bloqueio estava suspenso (e já consome a suspensão) */
export function consumirSuspensao(): boolean {
  const suspenso = Date.now() < suspensoAte;
  suspensoAte = 0;
  return suspenso;
}

/** Consulta sem consumir (para decidir já ao sair do app) */
export function bloqueioEstaSuspenso(): boolean {
  return Date.now() < suspensoAte;
}
