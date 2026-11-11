import AsyncStorage from '@react-native-async-storage/async-storage';
import { cofre } from '@utils/cofre';
import { ReceitaPersonalizada } from '@models/ingredients';

const CHAVE_RECEITAS_PERSONALIZADAS = 'levia:custom_recipes';

export async function carregarReceitasPersonalizadas(): Promise<ReceitaPersonalizada[]> {
  try {
    const bruto = await cofre.lerDado(CHAVE_RECEITAS_PERSONALIZADAS);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

export async function salvarReceitasPersonalizadas(receitas: ReceitaPersonalizada[]): Promise<void> {
  try {
    await cofre.gravarDado(CHAVE_RECEITAS_PERSONALIZADAS, JSON.stringify(receitas));
  } catch {
    // silencioso: se falhar em salvar, o app continua funcionando com o estado em memória
  }
}
