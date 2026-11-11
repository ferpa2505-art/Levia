/** Chaves de tradução dos rótulos do Guia de Treinos (tipadas, sem casts). */
import type { ChaveTraducao } from '@/i18n/traducoes/pt-BR';
import type { Equipamento, GrupoMuscular, TipoExercicio } from '@/types/fitness';

const GRUPOS: Record<GrupoMuscular, ChaveTraducao> = {
  peito: 'fitness.grupo.peito',
  costas: 'fitness.grupo.costas',
  ombros: 'fitness.grupo.ombros',
  biceps: 'fitness.grupo.biceps',
  triceps: 'fitness.grupo.triceps',
  antebraco: 'fitness.grupo.antebraco',
  core: 'fitness.grupo.core',
  quadriceps: 'fitness.grupo.quadriceps',
  posteriores: 'fitness.grupo.posteriores',
  gluteos: 'fitness.grupo.gluteos',
  panturrilha: 'fitness.grupo.panturrilha',
  cardio: 'fitness.grupo.cardio',
  corpoInteiro: 'fitness.grupo.corpoInteiro',
};

const EQUIPAMENTOS: Record<Equipamento, ChaveTraducao> = {
  'peso-livre': 'fitness.equip.pesoLivre',
  barra: 'fitness.equip.barra',
  halter: 'fitness.equip.halter',
  maquina: 'fitness.equip.maquina',
  cabo: 'fitness.equip.cabo',
  kettlebell: 'fitness.equip.kettlebell',
  elastico: 'fitness.equip.elastico',
  corpo: 'fitness.equip.corpo',
  outro: 'fitness.equip.outro',
};

const TIPOS: Record<TipoExercicio, ChaveTraducao> = {
  carga: 'fitness.tipo.carga',
  corpo: 'fitness.tipo.corpo',
  tempo: 'fitness.tipo.tempo',
};

export const chaveGrupo = (g: GrupoMuscular): ChaveTraducao => GRUPOS[g];
export const chaveEquipamento = (e: Equipamento): ChaveTraducao => EQUIPAMENTOS[e];
export const chaveTipo = (tp: TipoExercicio): ChaveTraducao => TIPOS[tp];
