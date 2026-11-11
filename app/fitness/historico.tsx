import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { dataISO, sessoesRecentes } from '@utils/fitnessLogica';

export default function HistoricoFitness() {
  const { t } = usePreferences();
  const router = useRouter();
  const { sessoes, rotinas, removerSessao } = useFitness();
  const [registrando, setRegistrando] = useState(false);
  const [data, setData] = useState(dataISO());
  const [minutos, setMinutos] = useState('60');
  const [rotinaId, setRotinaId] = useState<string>('livre');
  const [erro, setErro] = useState<string | null>(null);

  function iniciarRegistro() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(new Date(`${data}T12:00:00`).getTime())) {
      setErro(t('fitness.dataInvalida'));
      return;
    }
    if (data > dataISO()) {
      setErro(t('fitness.dataFutura'));
      return;
    }
    setErro(null);
    router.push(`/fitness/executar/${rotinaId}?data=${data}&duracao=${parseInt(minutos, 10) || 60}`);
  }

  function confirmarExclusao(id: string) {
    Alert.alert(t('fitness.excluirTreino'), t('fitness.confirmarExcluir'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      { text: t('fitness.excluirTreino'), style: 'destructive', onPress: () => void removerSessao(id) },
    ]);
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        {registrando ? (
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="subheading" color="text">{t('fitness.registrarPassado')}</ThemedText>
            <ThemedText variant="small" color="textSecondary">{t('fitness.dataAAAAMMDD')}</ThemedText>
            <Input value={data} onChangeText={setData} placeholder="2026-01-31" />
            <ThemedText variant="small" color="textSecondary">{t('fitness.duracaoMin')}</ThemedText>
            <Input keyboardType="number-pad" value={minutos} onChangeText={(v) => setMinutos(v.replace(/[^0-9]/g, ''))} />
            <View style={styles.chips}>
              {[{ id: 'livre', nome: t('fitness.treinoLivre') }, ...rotinas.map((r) => ({ id: r.id, nome: r.nome }))].map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => setRotinaId(o.id)}
                  style={[styles.chip, rotinaId === o.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <ThemedText variant="small" color={rotinaId === o.id ? 'surface' : 'text'}>{o.nome}</ThemedText>
                </Pressable>
              ))}
            </View>
            {erro && <ThemedText variant="small" color="primary">{erro}</ThemedText>}
            <Button label={t('fitness.continuar')} onPress={iniciarRegistro} />
            <Button label={t('comum.cancelar')} variant="outline" onPress={() => setRegistrando(false)} />
          </ThemedView>
        ) : (
          <Button label={t('fitness.registrarPassado')} variant="outline" onPress={() => setRegistrando(true)} />
        )}

        {sessoes.length === 0 && (
          <ThemedText variant="body" color="textSecondary">{t('fitness.semHistorico')}</ThemedText>
        )}

        {sessoesRecentes(sessoes).map((s) => {
          const feitas = s.series.filter((x) => x.feita).length;
          const minutosTreino = Math.max(0, Math.round((new Date(s.fim).getTime() - new Date(s.inicio).getTime()) / 60000));
          return (
            <ThemedView key={s.id} variant="surface" style={styles.cardSessao}>
              <View style={{ flex: 1 }}>
                <ThemedText variant="subheading" color="text">{s.nome}</ThemedText>
                <ThemedText variant="small" color="textSecondary">
                  {s.data} · {feitas}/{s.series.length} · {minutosTreino} min
                  {s.pesoCorpoKg !== undefined ? ` · ${Math.round(s.pesoCorpoKg * 10) / 10} kg` : ''}
                </ThemedText>
              </View>
              <Pressable onPress={() => confirmarExclusao(s.id)} hitSlop={8} accessibilityLabel={t('fitness.excluirTreino')}>
                <Trash2 size={18} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </ThemedView>
          );
        })}
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardSessao: { borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
});
