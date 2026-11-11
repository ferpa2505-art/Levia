import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, X } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useFitness } from '@context/FitnessContext';
import { useT } from '@context/PreferencesContext';
import { BIBLIOTECA_EXERCICIOS, exercicioPorId } from '@constants/exerciciosFitness';
import type { ExercicioNoTreino } from '@/types/fitness';
import { colors, spacing, radius } from '@constants/colors';

const PADRAO: Omit<ExercicioNoTreino, 'exercicioId'> = { series: 3, repeticoes: 10, descansoSeg: 60 };

function numero(texto: string, fallback: number): number {
  const n = parseInt(texto.replace(',', '.'), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default function EditorTreino() {
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { treinos, salvarTreino, removerTreino } = useFitness();
  const existente = treinos.find((x) => x.id === id);

  const [nome, setNome] = useState('');
  const [exercicios, setExercicios] = useState<ExercicioNoTreino[]>([]);
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);

  useEffect(() => {
    if (existente) {
      setNome(existente.nome);
      setExercicios(existente.exercicios);
    }
    // carrega só uma vez por treino
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existente?.id]);

  function adicionar(exercicioId: string) {
    setExercicios((atual) => [...atual, { exercicioId, ...PADRAO }]);
    setMostrarBiblioteca(false);
  }

  function atualizar(indice: number, campo: keyof Omit<ExercicioNoTreino, 'exercicioId'>, valor: string) {
    setExercicios((atual) =>
      atual.map((e, i) => (i === indice ? { ...e, [campo]: numero(valor, e[campo] ?? 0) } : e))
    );
  }

  function remover(indice: number) {
    setExercicios((atual) => atual.filter((_, i) => i !== indice));
  }

  async function salvar() {
    if (!nome.trim() || exercicios.length === 0) return;
    await salvarTreino({
      id: existente?.id,
      nome: nome.trim(),
      exercicios,
    });
    router.back();
  }

  function excluir() {
    if (!existente) return;
    Alert.alert(t('fitness.excluirTreino'), t('fitness.confirmarExcluir'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('fitness.excluirTreino'),
        style: 'destructive',
        onPress: async () => {
          await removerTreino(existente.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedText variant="subheading" color="text">{t('fitness.nomeTreino')}</ThemedText>
        <Input value={nome} onChangeText={setNome} placeholder={t('fitness.nomeTreino')} />

        {exercicios.length === 0 && (
          <ThemedText variant="small" color="textSecondary">{t('fitness.semExercicios')}</ThemedText>
        )}

        {exercicios.map((item, indice) => {
          const ex = exercicioPorId(item.exercicioId);
          return (
            <ThemedView key={`${item.exercicioId}-${indice}`} variant="surface" style={styles.card}>
              <View style={styles.linhaTopo}>
                <ThemedText variant="subheading" color="text" style={{ flex: 1 }}>
                  {ex?.nome ?? item.exercicioId}
                </ThemedText>
                <Pressable onPress={() => remover(indice)} hitSlop={8} accessibilityLabel={t('comum.fechar')}>
                  <X size={18} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>
              <View style={styles.linhaCampos}>
                <Campo rotulo={t('fitness.series')} valor={String(item.series)} onChange={(v) => atualizar(indice, 'series', v)} />
                <Campo rotulo={t('fitness.repeticoes')} valor={String(item.repeticoes)} onChange={(v) => atualizar(indice, 'repeticoes', v)} />
              </View>
              <View style={styles.linhaCampos}>
                <Campo
                  rotulo={t('fitness.carga')}
                  valor={item.cargaKg != null ? String(item.cargaKg) : ''}
                  onChange={(v) => atualizar(indice, 'cargaKg', v)}
                />
                <Campo rotulo={t('fitness.descanso')} valor={String(item.descansoSeg)} onChange={(v) => atualizar(indice, 'descansoSeg', v)} />
              </View>
            </ThemedView>
          );
        })}

        {mostrarBiblioteca ? (
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="subheading" color="text">{t('fitness.bibliotecaTitulo')}</ThemedText>
            {BIBLIOTECA_EXERCICIOS.map((ex) => (
              <Pressable key={ex.id} onPress={() => adicionar(ex.id)} style={styles.itemBiblioteca}>
                <ThemedText variant="body" color="text">{ex.nome}</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        ) : (
          <Button label={t('fitness.adicionarExercicio')} variant="outline" onPress={() => setMostrarBiblioteca(true)} />
        )}

        <Button label={t('fitness.salvarTreino')} onPress={salvar} disabled={!nome.trim() || exercicios.length === 0} />

        {existente && (
          <Button
            label={t('fitness.excluirTreino')}
            variant="outline"
            icon={<Trash2 size={16} color={colors.primary} strokeWidth={2} />}
            onPress={excluir}
          />
        )}
      </ThemedView>
    </TelaRolavel>
  );
}

function Campo({ rotulo, valor, onChange }: { rotulo: string; valor: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <ThemedText variant="small" color="textSecondary">{rotulo}</ThemedText>
      <Input value={valor} onChangeText={onChange} keyboardType="numeric" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  linhaTopo: { flexDirection: 'row', alignItems: 'center' },
  linhaCampos: { flexDirection: 'row', gap: spacing.sm },
  itemBiblioteca: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
