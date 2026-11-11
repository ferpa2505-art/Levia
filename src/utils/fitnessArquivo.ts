/** Exportar e importar os dados do Guia de Treinos como arquivo JSON (mesmo padrão do backup do app). */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { baixarArquivo } from '@utils/web';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';

export async function exportarArquivoTreinos(conteudo: string): Promise<boolean> {
  const hoje = new Date().toISOString().slice(0, 10);
  const nome = `leviã-treinos-${hoje}.json`;
  if (Platform.OS === 'web') {
    baixarArquivo(nome, conteudo, 'application/json');
    return true;
  }
  const uri = `${FileSystem.cacheDirectory}${nome}`;
  await FileSystem.writeAsStringAsync(uri, conteudo);
  if (!(await Sharing.isAvailableAsync())) return false;
  suspenderBloqueio();
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: nome });
  return true;
}

/** Abre o seletor de arquivo e devolve o texto escolhido, ou null se cancelado. */
export async function lerArquivoTreinos(): Promise<string | null> {
  suspenderBloqueio();
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.[0]) return null;
  return FileSystem.readAsStringAsync(r.assets[0].uri);
}
