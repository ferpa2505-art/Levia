import AsyncStorage from '@react-native-async-storage/async-storage';
import { Glp1Data, glp1DadosVazios } from '@models/glp1';

const STORAGE_KEY = 'levia:glp1';

export async function carregarGlp1(): Promise<Glp1Data> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return glp1DadosVazios;
    const dados = JSON.parse(raw);
    return {
      ...glp1DadosVazios,
      ...dados,
      configCaneta: { ...glp1DadosVazios.configCaneta, ...(dados.configCaneta ?? {}) },
      configLembrete: { ...glp1DadosVazios.configLembrete, ...(dados.configLembrete ?? {}) },
    } as Glp1Data;
  } catch {
    return glp1DadosVazios;
  }
}

export async function salvarGlp1(dados: Glp1Data): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}
