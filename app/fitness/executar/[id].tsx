import { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useFitness } from '@context/FitnessContext';
import { useT } from '@context/PreferencesContext';
import { exercicioPorId } from '@constants/exerciciosFitness';
import { dataDeHoje } from '@utils/recordsStorage';
import type { SerieRealizada } from '@/types/fitness';
import { colors, spacing, radius } from '@constants/colors';

export default function ExecutarTreino() {
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { treinos, registrarSessao } = useFitness();
  const treino = treinos.find((x) => x.id === id);

  const inicioRef = useRef(new Date().toISOString());
  const [series, setSeries] = useState<SerieRealizada[]>([]);
  const [descanso, setDescanso] = useState<{ restante: number } | null>(null);
  const [montadoPara, setMontadoPara] = useState<string | null>(null);

  // monta as séries a partir do plano, uma vez por treino
  useEffect(() => {
    if (!treino || montadoPara === treino.id) return;
    const lista: SerieRealizada[] = [];
    for (const ex of treino.exercicios) {
      for (let n = 1; n <= ex.series; n++) {
        lista.push({
          exercicioId: ex.exercicioId,
          numero: n,
          repeticoes: ex.repeticoes,
          cargaKg: ex.cargaKg,
          feita: false,
        });
      }
    }
    setSeries(lista);
    setMontadoPara(treino.id);
  }, [treino, montadoPara]);

  // contagem regressiva do descanso
  useEffect(() => {
    if (!descanso) return;
    if (descanso.restante <= 0) {
      setDescanso(null);
      return;
    }
    const timer = setTimeout(() => setDescanso({ restante: descanso.restante - 1 }), 1000);
    return () => clearTimeout(timer);
  }, [descanso]);

  if (!treino) {
    return (
      <TelaRolavel>
        <ThemedView style={styles.container}>
          <ThemedText variant="body" color="textSecondary">{t('fitness.semTreinos')}</ThemedText>
        </ThemedView>
      </TelaRolavel>
    );
  }

  function alterar(indice: number, campo: 'repeticoes' | 'cargaKg', valor: string) {
    const n = parseFloat(valor.replace(',', '.'));
    setSeries((atual) =>
      atual.map((s, i) => (i === indice ? { ...s, [campo]: Number.isFinite(n) ? n : undefined } : s))
    );
  }

  function alternarFeita(indice: number) {
    const serie = series[indice];
    const marcando = !serie.feita;
    setSeries((atual) => atual.map((s, i) => (i === indice ? { ...s, feita: marcando } : s)));
    if (marcando) {
      const plano = treino?.exercicios.find((e) => e.exercicioId === serie.exercicioId);
      setDescanso({ restante: plano?.descansoSeg ?? 60 });
    }
  }

  async function concluir() {
    await registrarSessao({
      treinoId: treino!.id,
      nomeTreino: treino!.nome,
      data: dataDeHoje(),
      inicio: inicioRef.current,
      fim: new Date().toISOString(),
      series,
    });
    router.replace('/fitness/historico');
  }

  function confirmarConclusao() {
    const feitas = series.filter((s) => s.feita).length;
    if (feitas === 0) {
      Alert.alert(t('fitness.concluirTreino'), t('fitness.semSeriesFeitas'));
      return;
    }
    concluir();
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedText variant="heading" color="text">{treino.nome}</ThemedText>

        {descanso && (
          <ThemedView variant="surface" style={styles.descanso}>
            <ThemedText variant="subheading" color="primary">
              {t('fitness.descansando')}: {descanso.restante}s
            </ThemedText>
            <Pressable onPress={() => setDescanso(null)} hitSlop={8}>
              <ThemedText variant="small" color="textSecondary">{t('fitness.pular')}</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {series.map((serie, indice) => {
          const primeiraDoExercicio = indice === 0 || series[indice - 1].exercicioId !== serie.exercicioId;
          return (
            <View key={`${serie.exercicioId}-${serie.numero}-${indice}`}>
              {primeiraDoExercicio && (
                <ThemedText variant="subheading" color="text" style={{ marginTop: spacing.sm }}>
                  {exercicioPorId(serie.exercicioId)?.nome ?? serie.exercicioId}
                </ThemedText>
              )}
              <ThemedView variant="surface" style={[styles.linhaSerie, serie.feita && styles.serieFeita]}>
                <ThemedText variant="body" color="text" style={{ width: 56 }}>
                  {t('fitness.serie')} {serie.numero}
                </ThemedText>
                <View style={{ flex: 1 }}>
                  <Input
                    keyboardType="numeric"
                    value={serie.repeticoes != null ? String(serie.repeticoes) : ''}
                    onChangeText={(v) => alterar(indice, 'repeticoes', v)}
                    placeholder={t('fitness.repeticoes')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    keyboardType="numeric"
                    value={serie.cargaKg != null ? String(serie.cargaKg) : ''}
                    onChangeText={(v) => alterar(indice, 'cargaKg', v)}
                    placeholder={t('fitness.carga')}
                  />
                </View>
                <Pressable
                  onPress={() => alternarFeita(indice)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: serie.feita }}
                  accessibilityLabel={t('fitness.feita')}
                  style={[styles.check, serie.feita && { backgroundColor: colors.primary }]}
                >
                  <Check size={18} color={serie.feita ? colors.background : colors.textSecondary} strokeWidth={2.5} />
                </Pressable>
              </ThemedView>
            </View>
          );
        })}

        <Button label={t('fitness.concluirTreino')} onPress={confirmarConclusao} />
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  descanso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  linhaSerie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  serieFeita: { opacity: 0.7 },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
