import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { obterVersaoTema } from '@constants/colors';

/** Qualquer estilo válido do React Native (substitui StyleSheet.NamedStyles, removido nos tipos do RN 0.88) */
type EstiloRN = ViewStyle | TextStyle | ImageStyle;

/**
 * Igual ao StyleSheet.create, mas refaz os estilos quando o tema muda.
 *
 * Uso:  const styles = estilosTema(() => ({ ... }));
 *
 * Os estilos só são calculados na primeira vez que são usados e de novo
 * sempre que o tema for trocado — assim as cores fixas dentro dos estilos
 * (ex.: borderColor: colors.primary) acompanham o tema escolhido.
 */
export function estilosTema<const T extends Record<string, EstiloRN>>(
  fabrica: () => T
): T {
  let cache: T | null = null;
  let versao = -1;

  function obter(): T {
    const atual = obterVersaoTema();
    if (!cache || versao !== atual) {
      cache = StyleSheet.create(fabrica()) as T;
      versao = atual;
    }
    return cache as T;
  }

  return new Proxy({} as T, {
    get(_alvo, chave) {
      return (obter() as any)[chave];
    },
    has(_alvo, chave) {
      return chave in (obter() as any);
    },
  });
}
