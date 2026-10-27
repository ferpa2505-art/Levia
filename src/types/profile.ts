export type Pronome = 'ela' | 'ele';
export type SexoBiologico = 'feminino' | 'masculino';
/** null = ainda nÃ£o respondeu; 'nenhum' = nÃ£o tem diabetes */
export type TipoDiabetes = 'tipo1' | 'tipo2' | 'nenhum' | null;

export interface UserProfile {\n  nome: string;\n  comoChamar: string;\n  pronome: Pronome | null;\n  alturaCm: number | null;\n  pesoAtualKg: number | null;\n  idade: number | null;\n  sexoBiologico: SexoBiologico | null;\n  metaPesoKg: number | null;\n  tipoDiabetes: TipoDiabetes;\n  /** E-mail para receber os relatórios (fica só no aparelho) */\n  email: string;\n  onboardingConcluido: boolean;\n  sessionToken?: string;\n  entitlement?: {\n    plan: string;\n    photo_limit: number;\n    photo_used: number;\n    current_period_start: string;\n    current_period_end: string;\n  };\n}

export const perfilVazio: UserProfile = {\n  nome: '',\n  comoChamar: '',\n  pronome: null,\n  alturaCm: null,\n  pesoAtualKg: null,\n  idade: null,\n  sexoBiologico: null,\n  metaPesoKg: null,\n  tipoDiabetes: null,\n  email: '',\n  onboardingConcluido: false,\n  sessionToken: undefined,\n  entitlement: undefined,\n};


