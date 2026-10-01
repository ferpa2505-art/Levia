import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiabetesData, diabetesDadosVazios } from '@models/diabetes';

const STORAGE_KEY = 'levia:diabetes';

export async function carregarDiabetes(): Promise<DiabetesData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return diabetesDadosVazios;
    const dados = JSON.parse(raw);
    return { ...diabetesDadosVazios, ...dados } as DiabetesData;
  } catch {
    return diabetesDadosVazios;
  }
}

export async function salvarDiabetes(dados: DiabetesData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}
