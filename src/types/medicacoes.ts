/**
 * Medicações da aba Saúde.
 *
 * - contínuo:   uso sem data para acabar; posologia + horário da 1ª dose são obrigatórios
 *               e geram lembretes diários (ou semanais)
 * - tratamento: dura N dias, X vezes por dia, a partir de uma data/hora de início;
 *               gera um lembrete para cada dose até o fim
 * - esporádico: só o cadastro, sem lembretes (ex.: analgésico quando precisar)
 */
export type UsoMedicacao = 'continuo' | 'tratamento' | 'esporadico';

/** Frequência do uso contínuo */
export type FrequenciaContinua = 'horas' | 'semanal';

export interface Medicacao {
  id: string;
  nome: string;
  /** Princípio ativo, quando o nome veio do banco (ex.: Ozempic -> semaglutida) */
  principio?: string;
  /** Quantidade por dose, como digitada (ex.: "500", "0,5", "1/2") */
  dose: string;
  /** Código da unidade (ver UNIDADES_DOSE) */
  unidade: string;
  uso: UsoMedicacao;

  // --- uso contínuo ---
  frequencia?: FrequenciaContinua;
  /** De quantas em quantas horas (4, 6, 8, 12, 24) */
  intervaloHoras?: number;
  /** Horário da primeira dose do dia, "HH:mm" */
  primeiraDose?: string;
  /** Dia da semana da dose semanal (0 = domingo) */
  diaSemana?: number;

  // --- tratamento ---
  dias?: number;
  vezesPorDia?: number;
  /** Início do tratamento, ISO local "AAAA-MM-DDTHH:mm" */
  inicio?: string;

  observacoes?: string;

  /** Notificações do app ligadas */
  lembretes: boolean;
  /** Também criar eventos no calendário do celular (Google Agenda) */
  calendario: boolean;

  notificationIds: string[];
  calendarEventIds: string[];
  criadaEm: string;
}

export interface MedicacoesData {
  medicacoes: Medicacao[];
  /** true depois de trazer as medicações antigas do módulo Diabetes */
  migradoDoDiabetes: boolean;
}

export const medicacoesVazias: MedicacoesData = { medicacoes: [], migradoDoDiabetes: false };

/** Unidades de dose. `rotulo` por idioma base (pt, en, es); demais usam en. */
export interface UnidadeDose {
  codigo: string;
  rotulo: { pt: string; en: string; es: string };
}

export const UNIDADES_DOSE: UnidadeDose[] = [
  { codigo: 'mg', rotulo: { pt: 'mg', en: 'mg', es: 'mg' } },
  { codigo: 'mcg', rotulo: { pt: 'mcg', en: 'mcg', es: 'mcg' } },
  { codigo: 'g', rotulo: { pt: 'g', en: 'g', es: 'g' } },
  { codigo: 'mL', rotulo: { pt: 'mL', en: 'mL', es: 'mL' } },
  { codigo: 'UI', rotulo: { pt: 'UI', en: 'IU', es: 'UI' } },
  { codigo: 'U', rotulo: { pt: 'U (insulina)', en: 'U (insulin)', es: 'U (insulina)' } },
  { codigo: 'comprimido', rotulo: { pt: 'comprimido(s)', en: 'tablet(s)', es: 'comprimido(s)' } },
  { codigo: 'capsula', rotulo: { pt: 'cápsula(s)', en: 'capsule(s)', es: 'cápsula(s)' } },
  { codigo: 'gota', rotulo: { pt: 'gota(s)', en: 'drop(s)', es: 'gota(s)' } },
  { codigo: 'jato', rotulo: { pt: 'jato(s)/puff', en: 'puff(s)', es: 'pulsación(es)' } },
  { codigo: 'aplicacao', rotulo: { pt: 'aplicação(ões)', en: 'application(s)', es: 'aplicación(es)' } },
  { codigo: 'clique', rotulo: { pt: 'clique(s) da caneta', en: 'pen click(s)', es: 'clic(s) de pluma' } },
  { codigo: 'sache', rotulo: { pt: 'sachê(s)', en: 'sachet(s)', es: 'sobre(s)' } },
  { codigo: 'ampola', rotulo: { pt: 'ampola(s)', en: 'ampoule(s)', es: 'ampolla(s)' } },
  { codigo: 'adesivo', rotulo: { pt: 'adesivo(s)', en: 'patch(es)', es: 'parche(s)' } },
  { codigo: 'supositorio', rotulo: { pt: 'supositório(s)', en: 'suppository(-ies)', es: 'supositorio(s)' } },
  { codigo: 'colher_cha', rotulo: { pt: 'colher de chá (5 mL)', en: 'teaspoon (5 mL)', es: 'cucharadita (5 mL)' } },
  { codigo: 'colher_sopa', rotulo: { pt: 'colher de sopa (15 mL)', en: 'tablespoon (15 mL)', es: 'cucharada (15 mL)' } },
  { codigo: 'mg/mL', rotulo: { pt: 'mg/mL', en: 'mg/mL', es: 'mg/mL' } },
  { codigo: '%', rotulo: { pt: '%', en: '%', es: '%' } },
  { codigo: 'unidade', rotulo: { pt: 'unidade(s)', en: 'unit(s)', es: 'unidad(es)' } },
];

export function rotuloUnidade(codigo: string, idioma: string): string {
  const u = UNIDADES_DOSE.find((x) => x.codigo === codigo);
  if (!u) return codigo;
  const base = idioma.slice(0, 2);
  return base === 'pt' ? u.rotulo.pt : base === 'es' ? u.rotulo.es : u.rotulo.en;
}
