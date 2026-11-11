import { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Star, Trash2 } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { EQUIPAMENTOS, GRUPOS } from '@constants/exerciciosFitness';
import type { Equipamento, Exercicio, GrupoMuscular, TipoExercicio } from '@/types/fitness';
import { chaveGrupo, chaveEquipamento, chaveTipo } from '@utils/fitnessRotulos';

export default function BibliotecaFitness() {
  const { t } = usePreferences();
  const { exercicios, favoritos, alternarFavorito, adicionarPersonalizado, removerPersonalizado } = useFitness();
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState<GrupoMuscular | null>(null);
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoGrupo, setNovoGrupo] = useState<GrupoMuscular>('peito');
  const [novoEquip, setNovoEquip] = useState<Equipamento>('halter');
  const [novoTipo, setNovoTipo] = useState<TipoExercicio>('carga');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return exercicios.filter((e) =>
      (!termo || e.nome.toLowerCase().includes(termo)) &&
      (!grupo || e.grupo === grupo) &&
      (!equipamento || e.equipamento === equipamento) &&
      (!soFavoritos || favoritos.includes(e.id)),
    );
  }, [exercicios, busca, grupo, equipamento, soFavoritos, favoritos]);

  // agrupa por grupo muscular, na ordem da lista de grupos
  const porGrupo = GRUPOS.map((g) => ({ grupo: g, itens: filtrados.filter((e) => e.grupo === g) })).filter((x) => x.itens.length > 0);

  async function criar() {
    if (!novoNome.trim()) return;
    await adicionarPersonalizado({ nome: novoNome, grupo: novoGrupo, equipamento: novoEquip, tipo: novoTipo });
    setNovoNome('');
    setCriando(false);
  }

  function confirmarRemocao(e: Exercicio) {
    Alert.alert(t('fitness.excluirExercicio'), e.nome, [
      { text: t('comum.cancelar'), style: 'cancel' },
      { text: t('fitness.excluirExercicio'), style: 'destructive', onPress: () => void removerPersonalizado(e.id) },
    ]);
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <Input value={busca} onChangeText={setBusca} placeholder={t('fitness.buscarExercicio')} />

        <View style={styles.chips}>
          <Chip ativo={soFavoritos} onPress={() => setSoFavoritos(!soFavoritos)} rotulo={t('fitness.favoritos')} />
          {GRUPOS.map((g) => (
            <Chip key={g} ativo={grupo === g} onPress={() => setGrupo(grupo === g ? null : g)} rotulo={t(chaveGrupo(g))} />
          ))}
        </View>
        <View style={styles.chips}>
          {EQUIPAMENTOS.map((e) => (
            <Chip key={e} ativo={equipamento === e} onPress={() => setEquipamento(equipamento === e ? null : e)} rotulo={t(chaveEquipamento(e))} />
          ))}
        </View>

        {criando ? (
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="subheading" color="text">{t('fitness.novoExercicio')}</ThemedText>
            <Input value={novoNome} onChangeText={setNovoNome} placeholder={t('fitness.nomeExercicio')} />
            <View style={styles.chips}>
              {GRUPOS.map((g) => (
                <Chip key={g} ativo={novoGrupo === g} onPress={() => setNovoGrupo(g)} rotulo={t(chaveGrupo(g))} />
              ))}
            </View>
            <View style={styles.chips}>
              {EQUIPAMENTOS.map((e) => (
                <Chip key={e} ativo={novoEquip === e} onPress={() => setNovoEquip(e)} rotulo={t(chaveEquipamento(e))} />
              ))}
            </View>
            <View style={styles.chips}>
              {(['carga', 'corpo', 'tempo'] as const).map((tp) => (
                <Chip key={tp} ativo={novoTipo === tp} onPress={() => setNovoTipo(tp)} rotulo={t(chaveTipo(tp))} />
              ))}
            </View>
            <Button label={t('fitness.salvar')} onPress={criar} disabled={!novoNome.trim()} />
            <Button label={t('comum.cancelar')} variant="outline" onPress={() => setCriando(false)} />
          </ThemedView>
        ) : (
          <Button label={t('fitness.novoExercicio')} variant="outline" onPress={() => setCriando(true)} />
        )}

        {filtrados.length === 0 && <ThemedText variant="small" color="textSecondary">{t('fitness.nenhumExercicio')}</ThemedText>}

        {porGrupo.map(({ grupo: g, itens }) => (
          <ThemedView key={g} variant="surface" style={styles.card}>
            <ThemedText variant="small" color="primary">{t(chaveGrupo(g))}</ThemedText>
            {itens.map((e) => (
              <View key={e.id} style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="body" color="text">{e.nome}</ThemedText>
                  <ThemedText variant="small" color="textSecondary">{t(chaveEquipamento(e.equipamento))}</ThemedText>
                </View>
                {e.personalizado && (
                  <Pressable onPress={() => confirmarRemocao(e)} hitSlop={8} accessibilityLabel={t('fitness.excluirExercicio')} style={{ marginRight: spacing.md }}>
                    <Trash2 size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                )}
                <Pressable onPress={() => void alternarFavorito(e.id)} hitSlop={8} accessibilityLabel={t('fitness.favorito')}>
                  <Star
                    size={18}
                    color={favoritos.includes(e.id) ? colors.accent : colors.textSecondary}
                    strokeWidth={2}
                    fill={favoritos.includes(e.id) ? colors.accent : 'none'}
                  />
                </Pressable>
              </View>
            ))}
          </ThemedView>
        ))}
      </ThemedView>
    </TelaRolavel>
  );
}

function Chip({ ativo, onPress, rotulo }: { ativo: boolean; onPress: () => void; rotulo: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, ativo && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <ThemedText variant="small" color={ativo ? 'surface' : 'text'}>{rotulo}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
