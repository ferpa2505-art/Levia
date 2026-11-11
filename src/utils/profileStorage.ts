import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, perfilVazio } from '@models/profile';
import { cofre } from '@utils/cofre';

/**
 * O perfil tem duas partes. A parte básica (e-mail e se o onboarding terminou) fica em uma
 * chave simples, porque o portão de entrada precisa dela antes do PIN. O perfil inteiro
 * (peso, altura, tipo de diabetes…) é dado de saúde e fica no cofre.
 */
const CHAVE_COMPLETO = 'levia:userProfile';
const CHAVE_BASICO = 'levia:perfilBasico';

export interface PerfilBasico {
  email: string;
  onboardingConcluido: boolean;
}

export function basicoDe(perfil: UserProfile): PerfilBasico {
  return { email: perfil.email ?? '', onboardingConcluido: !!perfil.onboardingConcluido };
}

export async function carregarPerfilBasico(): Promise<PerfilBasico> {
  try {
    const raw = await AsyncStorage.getItem(CHAVE_BASICO);
    if (raw) return { ...basicoDe(perfilVazio), ...JSON.parse(raw) };
  } catch { /* sem parte básica: segue como novo */ }
  return basicoDe(perfilVazio);
}

/**
 * Perfil completo. Com o cofre bloqueado devolve só a parte básica (o resto volta quando abrir).
 * A parte completa tem prioridade: a básica só preenche o que faltar.
 */
export async function carregarPerfil(): Promise<UserProfile> {
  const basico = await carregarPerfilBasico();
  try {
    const raw = await cofre.lerDado(CHAVE_COMPLETO);
    if (!raw) return { ...perfilVazio, ...basico } as UserProfile;
    return { ...perfilVazio, ...basico, ...JSON.parse(raw) } as UserProfile;
  } catch {
    return { ...perfilVazio, ...basico } as UserProfile;
  }
}

export async function salvarPerfil(perfil: UserProfile): Promise<void> {
  // o cofre recusa a gravação com o app bloqueado; a parte básica só é gravada junto
  await cofre.gravarDado(CHAVE_COMPLETO, JSON.stringify(perfil));
  await AsyncStorage.setItem(CHAVE_BASICO, JSON.stringify(basicoDe(perfil)));
}

/**
 * Faixa de peso saudável (kg) a partir da altura, usando a faixa de IMC
 * recomendada (18,5 a 24,9) em vez de um número único e rígido.
 */
export function calcularFaixaSaudavel(alturaCm: number): { min: number; max: number } {
  const alturaM = alturaCm / 100;
  const min = 18.5 * alturaM * alturaM;
  const max = 24.9 * alturaM * alturaM;
  return { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 };
}
