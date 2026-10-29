import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordsData, registrosVazios } from '@models/records';

const STORAGE_KEY = 'levia:records';

export async function carregarRegistros(): Promise<RecordsData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return registrosVazios;
    return { ...registrosVazios, ...JSON.parse(raw) } as RecordsData;
  } catch {
    return registrosVazios;
  }
}

export async function salvarRegistros(dados: RecordsData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

/** Data de hoje no fuso do aparelho (toISOString usa UTC e jogava registros da noite para o dia seguinte) */
export function dataDeHoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function horarioAgora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function gerarId(): string {
  return `${Date.now()}-${Math.round(Math.random() * 100000)}`;
}
