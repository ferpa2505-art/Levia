import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing } from '@constants/colors';

type Estado = 'parado' | 'procurando' | 'atualizado' | 'baixando' | 'pronto' | 'erro';

/**
 * Item "Atualizações" do menu ⋮: versão instalada, data da última atualização
 * recebida e botão para procurar/aplicar uma atualização na hora.
 */
export function PainelAtualizacoes() {
  const { t, idioma } = usePreferences();
  const [estado, setEstado] = useState<Estado>('parado');

  const versao = Constants.expoConfig?.version ?? '–';
  const dataAtualizacao = !Updates.isEmbeddedLaunch && Updates.createdAt ? Updates.createdAt : null;
  let textoData = t('atu.original');
  if (dataAtualizacao) {
    try {
      textoData = dataAtualizacao.toLocaleString(idioma, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      textoData = dataAtualizacao.toISOString().slice(0, 16).replace('T', ' ');
    }
  }

  async function procurar() {
    if (!Updates.isEnabled) {
      setEstado('erro');
      return;
    }
    try {
      setEstado('procurando');
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        setEstado('atualizado');
        return;
      }
      setEstado('baixando');
      await Updates.fetchUpdateAsync();
      setEstado('pronto');
    } catch {
      setEstado('erro');
    }
  }

  const mensagem: Partial<Record<Estado, string>> = {
    atualizado: t('atu.emDia'),
    pronto: t('atu.pronta'),
    erro: t('atu.erro'),
  };

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
      <Linha rotulo={t('atu.versao')} valor={versao} />
      <Linha rotulo={t('atu.ultima')} valor={textoData} />

      {mensagem[estado] ? (
        <ThemedText
          variant="small"
          color={estado === 'erro' ? 'error' : 'primary'}
          style={{ marginTop: spacing.md }}
        >
          {mensagem[estado]}
        </ThemedText>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        {estado === 'procurando' || estado === 'baixando' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md }}>
            <ActivityIndicator color={colors.primary} />
            <ThemedText variant="body" color="textSecondary" style={{ marginLeft: spacing.sm }}>
              {estado === 'procurando' ? t('atu.procurando') : t('atu.baixando')}
            </ThemedText>
          </View>
        ) : estado === 'pronto' ? (
          <Button label={t('atu.reiniciar')} onPress={() => Updates.reloadAsync().catch(() => setEstado('erro'))} />
        ) : (
          <Button label={t('atu.procurar')} variant="outline" onPress={procurar} />
        )}
      </View>
    </View>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
      <ThemedText variant="body" color="textSecondary">{rotulo}</ThemedText>
      <ThemedText variant="body" color="text">{valor}</ThemedText>
    </View>
  );
}
