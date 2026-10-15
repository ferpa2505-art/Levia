export type Pronome = 'ela' | 'ele';
export type SexoBiologico = 'feminino' | 'masculino';
/** null = ainda não respondeu; 'nenhum' = não tem diabetes */
export type TipoDiabetes = 'tipo1' | 'tipo2' | 'nenhum' | null;

export interface UserProfile {
  nome: string;
  comoChamar: string;
  pronome: Pronome | null;
  alturaCm: number | null;
  pesoAtualKg: number | null;
  idade: number | null;
  sexoBiologico: SexoBiologico | null;
  metaPesoKg: number | null;
  tipoDiabetes: TipoDiabetes;
  /** E-mail para receber os relatórios (fica só no aparelho) */
  email: string;
  onboardingConcluido: boolean;
}

export const perfilVazio: UserProfile = {
  nome: '',
  comoChamar: '',
  pronome: null,
  alturaCm: null,
  pesoAtualKg: null,
  idade: null,
  sexoBiologico: null,
  metaPesoKg: null,
  tipoDiabetes: null,
  email: '',
  onboardingConcluido: false,
};
