import { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDown, ArrowUp, Minus, Plus, Star, Trash2, X } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import type { ExercicioNaRotina, Progressao } from '@/types/fitness';

const PADRAO: Omit<ExercicioNaRotina, 'exercicioId'> = {
  series: 3,
  repMin: 8,
  repMax: 12,
  descansoSeg: 90,
  progressao: 'dupla',
};

const PROGRESSOES: { id: Progressao; chave: 'fitness.progressaoNenhuma' | 'fitness.progressaoLinear' | 'fitness.progressaoDupla' }[] = [
  { id: 'nenhuma', chave: 'fitness.progressaoNenhuma' },
  { id: 'linear', chave: 'fitness.progressaoLinear' },
  { id: 'dupla', chave: 'fitness.progressaoDupla' },
];

function inteiro(texto: string, minimo: number, fallback: number): number {
  const n = parseInt(texto.replace(',', '.'), 10);
  return Number.isFinite(n) && n >= minimo ? n : fallback;
}

export default function EditorRotina() {
  const { t } = usePreferences();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rotinas, exercicios, favoritos, exercicioPorId, salvarRotina, removerRotina, alternarFavorito } = useFitness();
  const existente = id !== 'novo' ? rotinas.find((r) => r.id === id) : undefined;

  const [nome, setNome] = useState('');
  const [lista, setLista] = useState<ExercicioNaRotina[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [busca, setBusca] = useState('');
  const [carregadoPara, setCarregadoPara] = useState<string | null>(null);

  useEffect(() => {
    if (existente && carregadoPara !== existente.id) {
      setNome(existente.nome);
      setLista(existente.exercicios);
      setCarregadoPara(existente.id);
    }
  }, [existente, carregadoPara]);

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = termo ? exercicios.filter((e) => e.nome.toLowerCase().includes(termo)) : exercicios;
    // favoritos primeiro
    return [...base].sort((a, b) => Number(favoritos.includes(b.id)) - Number(favoritos.includes(a.id))).slice(0, 60);
  }, [busca, exercicios, favoritos]);

  function adicionar(exercicioId: string) {
    const ex = exercicioPorId(exercicioId);
    const padrao = ex?.tipo === 'tempo' ? { ...PADRAO, repMin: 30, repMax: 60, progressao: 'nenhuma' as const } : PADRAO;
    setLista((l) => [...l, { exercicioId, ...padrao }]);
    setBuscando(false);
    setBusca('');
  }

  function alterar(indice: number, parcial: Partial<ExercicioNaRotina>) {
    setLista((l) => l.map((e, i) => (i === indice ? { ...e, ...parcial } : e)));
  }

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= lista.length) return;
    setLista((l) => {
      const copia = [...l];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  async function salvar() {
    if (!nome.trim() || lista.length === 0) return;
    await salvarRotina({ id: existente?.id, nome: nome.trim(), exercicios: lista });
    router.back();
  }

  function excluir() {
    if (!existente) return;
    Alert.alert(t('fitness.excluirRotina'), t('fitness.confirmarExcluir'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('fitness.excluirRotina'),
        style: 'destructive',
        onPress: async () => {
          await removerRotina(existente.id);
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

        {lista.length === 0 && (
          <ThemedText variant="small" color="textSecondary">{t('fitness.semExercicios')}</ThemedText>
        )}

        {lista.map((item, indice) => {
          const ex = exercicioPorId(item.exercicioId);
          const tempo = ex?.tipo === 'tempo';
          return (
            <ThemedView key={`${item.exercicioId}-${indice}`} variant="surface" style={styles.card}>
              <View style={styles.linhaTopo}>
                <ThemedText variant="subheading" color="text" style={{ flex: 1 }}>
                  {ex?.nome ?? item.exercicioId}
                </ThemedText>
                <Pressable onPress={() => mover(indice, -1)} hitSlop={8} accessibilityLabel={t('fitness.subir')}>
                  <ArrowUp size={18} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
                <Pressable onPress={() => mover(indice, 1)} hitSlop={8} accessibilityLabel={t('fitness.descer')} style={{ marginLeft: spacing.sm }}>
                  <ArrowDown size={18} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
                <Pressable onPress={() => setLista((l) => l.filter((_, i) => i !== indice))} hitSlop={8} accessibilityLabel={t('fitness.remover')} style={{ marginLeft: spacing.sm }}>
                  <X size={18} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>

              <View style={styles.linhaCampos}>
                <Stepper rotulo={t('fitness.series')} valor={item.series} minimo={1} onChange={(v) => alterar(indice, { series: v })} />
                <Stepper rotulo={tempo ? t('fitness.segMin') : t('fitness.repMin')} valor={item.repMin} minimo={1} onChange={(v) => alterar(indice, { repMin: Math.min(v, item.repMax) })} />
                <Stepper rotulo={tempo ? t('fitness.segMax') : t('fitness.repMax')} valor={item.repMax} minimo={1} onChange={(v) => alterar(indice, { repMax: Math.max(v, item.repMin) })} />
              </View>

              <View style={styles.linhaCampos}>
                <Stepper rotulo={t('fitness.descanso')} valor={item.descansoSeg} minimo={0} passo={15} onChange={(v) => alterar(indice, { descansoSeg: v })} />
              </View>

              {!tempo && (
                <View style={styles.chips}>
                  {PROGRESSOES.map((p) => {
                    const ativo = item.progressao === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => alterar(indice, { progressao: p.id })}
                        style={[styles.chip, ativo && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      >
                        <ThemedText variant="small" color={ativo ? 'surface' : 'text'}>{t(p.chave)}</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ThemedView>
          );
        })}

        {buscando ? (
          <ThemedView variant="surface" style={styles.card}>
            <Input value={busca} onChangeText={setBusca} placeholder={t('fitness.buscarExercicio')} autoFocus />
            {resultados.map((ex) => (
              <View key={ex.id} style={styles.itemBusca}>
                <Pressable onPress={() => adicionar(ex.id)} style={{ flex: 1 }}>
                  <ThemedText variant="body" color="text">{ex.nome}</ThemedText>
                </Pressable>
                <Pressable onPress={() => void alternarFavorito(ex.id)} hitSlop={8} accessibilityLabel={t('fitness.favorito')}>
                  <Star size={18} color={favoritos.includes(ex.id) ? colors.accent : colors.textSecondary} strokeWidth={2} fill={favoritos.includes(ex.id) ? colors.accent : 'none'} />
                </Pressable>
              </View>
            ))}
            <Button label={t('comum.fechar')} variant="outline" onPress={() => setBuscando(false)} />
          </ThemedView>
        ) : (
          <Button label={t('fitness.adicionarExercicio')} variant="outline" onPress={() => setBuscando(true)} />
        )}

        <Button label={t('fitness.salvarTreino')} onPress={salvar} disabled={!nome.trim() || lista.length === 0} />

        {existente && (
          <Button
            label={t('fitness.excluirRotina')}
            variant="outline"
            icon={<Trash2 size={16} color={colors.primary} strokeWidth={2} />}
            onPress={excluir}
          />
        )}
      </ThemedView>
    </TelaRolavel>
  );
}

function Stepper({ rotulo, valor, minimo, passo = 1, onChange }: { rotulo: string; valor: number; minimo: number; passo?: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <ThemedText variant="small" color="textSecondary">{rotulo}</ThemedText>
      <View style={styles.stepper}>
        <Pressable onPress={() => onChange(Math.max(minimo, valor - passo))} hitSlop={6} style={styles.botaoStep} accessibilityLabel="-">
          <Minus size={16} color={colors.primary} strokeWidth={2} />
        </Pressable>
        <ThemedText variant="body" color="text" style={{ minWidth: 40, textAlign: 'center' }}>{valor}</ThemedText>
        <Pressable onPress={() => onChange(valor + passo)} hitSlop={6} style={styles.botaoStep} accessibilityLabel="+">
          <Plus size={16} color={colors.primary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  linhaTopo: { flexDirection: 'row', alignItems: 'center' },
  linhaCampos: { flexDirection: 'row', gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  botaoStep: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  itemBusca: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
});
