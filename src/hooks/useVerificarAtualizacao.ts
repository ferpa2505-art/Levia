import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Updates from 'expo-updates';
import { traduzirAtual as t } from '@/i18n';

/** Não procura de novo antes disso (evita perguntar várias vezes seguidas) */
const INTERVALO_MINIMO = 30 * 60_000;

/**
 * Sempre que o app abre ou volta para a tela, procura uma atualização.
 * Se houver, baixa em segundo plano e pergunta se a pessoa quer aplicar agora
 * (o app reinicia) ou depois (ela entra sozinha na próxima abertura).
 */
export function useVerificarAtualizacao(ativo: boolean) {
  const ultimaVerificacao = useRef(0);
  const perguntando = useRef(false);

  useEffect(() => {
    if (!ativo || !Updates.isEnabled) return;

    async function verificar() {
      if (perguntando.current || Date.now() - ultimaVerificacao.current < INTERVALO_MINIMO) return;
      ultimaVerificacao.current = Date.now();
      try {
        const r = await Updates.checkForUpdateAsync();
        if (!r.isAvailable) return;
        await Updates.fetchUpdateAsync();
        perguntando.current = true;
        Alert.alert(t('atu.perguntaTitulo'), t('atu.perguntaMsg'), [
          { text: t('atu.depois'), style: 'cancel', onPress: () => (perguntando.current = false) },
          {
            text: t('atu.agora'),
            onPress: () => {
              perguntando.current = false;
              Updates.reloadAsync().catch(() => {});
            },
          },
        ]);
      } catch {
        // sem internet ou servidor fora do ar: tenta de novo na próxima abertura
      }
    }

    verificar();
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') verificar();
    });
    return () => sub.remove();
  }, [ativo]);
}
