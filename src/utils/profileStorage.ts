import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, perfilVazio } from '@models/profile';

const STORAGE_KEY = 'levia:userProfile';

export async function carregarPerfil(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return perfilVazio;
    return { ...perfilVazio, ...JSON.parse(raw) } as UserProfile;
  } catch {
    return perfilVazio;
  }
}

export async function salvarPerfil(perfil: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(perfil));
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
