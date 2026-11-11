import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { exportarArquivoTreinos, lerArquivoTreinos } from '@utils/fitnessArquivo';

const INCREMENTOS = [0.5, 1, 2.5, 5];

export default function ConfiguracoesFitness() {
  const { t } = usePreferences();
  const { config, salvarConfig, exportarJson, importarJson } = useFitness();

  async function exportar() {
    try {
      await exportarArquivoTreinos(exportarJson());
    } catch {
      Alert.alert(t('fitness.exportarTreinos'), t('fitness.erroArquivo'));
    }
  }

  async function importar() {
    try {
      const texto = await lerArquivoTreinos();
      if (!texto) return;
      Alert.alert(t('fitness.importarTreinos'), t('fitness.importarAviso'), [
        { text: t('comum.cancelar'), style: 'cancel' },
        {
          text: t('fitness.importar'),
          style: 'destructive',
          onPress: async () => {
            try {
              await importarJson(texto);
              Alert.alert(t('fitness.importarTreinos'), t('fitness.importado'));
            } catch {
              Alert.alert(t('fitness.importarTreinos'), t('fitness.arquivoInvalido'));
            }
          },
        },
      ]);
    } catch {
      Alert.alert(t('fitness.importarTreinos'), t('fitness.erroArquivo'));
    }
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedView variant="surface" style={styles.card}>
          <Opcoes
            rotulo={t('fitness.unidade')}
            valor={config.unidade}
            opcoes={[
              { id: 'kg', rotulo: 'kg' },
              { id: 'lb', rotulo: 'lb' },
            ]}
            onChange={(v) => void salvarConfig({ unidade: v as 'kg' | 'lb' })}
          />
          <Opcoes
            rotulo={t('fitness.inicioSemana')}
            valor={config.inicioSemana}
            opcoes={[
              { id: 'seg', rotulo: t('fitness.segunda') },
              { id: 'dom', rotulo: t('fitness.domingo') },
            ]}
            onChange={(v) => void salvarConfig({ inicioSemana: v as 'seg' | 'dom' })}
          />
          <Opcoes
            rotulo={t('fitness.incremento')}
            valor={config.incrementoKg}
            opcoes={INCREMENTOS.map((i) => ({ id: i, rotulo: `${i} ${config.unidade}` }))}
            onChange={(v) => void salvarConfig({ incrementoKg: Number(v) })}
          />
          <View style={styles.linhaSwitch}>
            <ThemedText variant="body" color="text" style={{ flex: 1 }}>{t('fitness.manterTela')}</ThemedText>
            <Switch
              value={config.manterTelaLigada}
              onValueChange={(v) => void salvarConfig({ manterTelaLigada: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </ThemedView>

        <ThemedView variant="surface" style={styles.card}>
          <ThemedText variant="subheading" color="text">{t('fitness.meusDados')}</ThemedText>
          <ThemedText variant="small" color="textSecondary">{t('fitness.meusDadosAviso')}</ThemedText>
          <Button label={t('fitness.exportarTreinos')} variant="outline" onPress={exportar} />
          <Button label={t('fitness.importarTreinos')} variant="outline" onPress={importar} />
        </ThemedView>
      </ThemedView>
    </TelaRolavel>
  );
}

function Opcoes<T extends string | number>({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string;
  valor: T;
  opcoes: { id: T; rotulo: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <ThemedText variant="small" color="textSecondary">{rotulo}</ThemedText>
      <View style={styles.chips}>
        {opcoes.map((o) => (
          <Pressable
            key={String(o.id)}
            onPress={() => onChange(o.id)}
            style={[styles.chip, valor === o.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <ThemedText variant="small" color={valor === o.id ? 'surface' : 'text'}>{o.rotulo}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center' },
});
