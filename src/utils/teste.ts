/**
 * Em que ponto está o teste grátis (serial de 7 dias). Só olha a data de fim guardada na licença:
 * quem barra de verdade o acesso é o servidor, isto só decide que aviso mostrar.
 */
export type EstadoTeste = 'nenhum' | 'normal' | 'ultimosDias' | 'ultimoDia' | 'vencido';

const DIA_MS = 24 * 3600 * 1000;
/** Nos últimos dias o aviso fica mais forte (e pode ser dispensado uma vez por dia). */
export const DIAS_DO_CONVITE = 3;

export interface LicencaParaAviso {
  plano?: string;
  acessoAte?: string;
}

export function estadoDoTeste(licenca: LicencaParaAviso | null | undefined, agora: number = Date.now()): { estado: EstadoTeste; dias: number } {
  if (!licenca || licenca.plano !== 'teste' || !licenca.acessoAte) return { estado: 'nenhum', dias: 0 };
  const fim = Date.parse(licenca.acessoAte);
  if (Number.isNaN(fim)) return { estado: 'nenhum', dias: 0 };
  const restante = fim - agora;
  if (restante <= 0) return { estado: 'vencido', dias: 0 };
  const dias = Math.ceil(restante / DIA_MS);
  if (dias <= 1) return { estado: 'ultimoDia', dias: 1 };
  if (dias <= DIAS_DO_CONVITE) return { estado: 'ultimosDias', dias };
  return { estado: 'normal', dias };
}

/** O convite forte só aparece de novo no dia seguinte a uma dispensa; o vencido nunca pode ser dispensado. */
export function conviteDispensadoHoje(dispensadoEm: string | null | undefined, hoje: string): boolean {
  return !!dispensadoEm && dispensadoEm === hoje;
}
