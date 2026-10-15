import { Alert, AlertButton, Platform } from 'react-native';

/**
 * Na versão web (PWA) o `Alert.alert` do React Native não faz nada: as
 * caixas de aviso e confirmação simplesmente não aparecem. Aqui ele passa a
 * usar as caixas do próprio navegador (alert / confirm).
 *
 * - Sem botões ou com 1 botão: mostra o aviso e executa o botão.
 * - "Cancelar" + 1 ação: confirm → OK executa a ação, Cancelar executa o cancelar.
 * - Várias ações: pergunta uma a uma, na ordem.
 *
 * Basta importar este arquivo uma vez, no início do app.
 */
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = globalThis as any;

  Alert.alert = (titulo: string, mensagem?: string, botoes?: AlertButton[]) => {
    const texto = [titulo, mensagem].filter(Boolean).join('\n\n');
    const lista = botoes ?? [];

    if (lista.length <= 1) {
      nav.alert(texto);
      lista[0]?.onPress?.();
      return;
    }

    const cancelar = lista.find((b) => b.style === 'cancel');
    const acoes = lista.filter((b) => b !== cancelar);

    if (acoes.length === 1) {
      if (nav.confirm(texto)) acoes[0].onPress?.();
      else cancelar?.onPress?.();
      return;
    }

    for (const b of acoes) {
      if (nav.confirm(`${texto}\n\n→ ${b.text ?? ''}?`)) {
        b.onPress?.();
        return;
      }
    }
    cancelar?.onPress?.();
  };
}

export {};
