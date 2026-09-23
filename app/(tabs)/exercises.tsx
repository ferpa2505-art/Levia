import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { X, ChevronLeft } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useRecords } from '@context/RecordsContext';
import {
  tiposExercicio,
  TipoExercicio,
  NIVEIS_INTENSIDADE,
  MULTIPLICADOR_INTENSIDADE,
  NivelIntensidade,
} from '@constants/exerciseTypes';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

export default function ExercisesScreen() {
  const { exerciciosHoje, kcalGastaHoje, adicionarExercicio, removerExercicio } = useRecords();

  const [tipoSelecionado, setTipoSelecionado] = useState<TipoExercicio | null>(null);
  const [tempoTexto, setTempoTexto] = useState('');
  const [intensidade, setIntensidade] = useState<NivelIntensidade>('Média');
  const [local, setLocal] = useState<string | null>(null);
  const [grupoMuscular, setGrupoMuscular] = useState<string | null>(null);
  const [kcalTexto, setKcalTexto] = useState('');

  function abrirTipo(tipo: TipoExercicio) {
    setTipoSelecionado(tipo);
    setTempoTexto('');
    setIntensidade('Média');
    setLocal(tipo.opcoesLocal ? tipo.opcoesLocal[0] : null);
    setGrupoMuscular(tipo.opcoesGrupoMuscular ? tipo.opcoesGrupoMuscular[0] : null);
    setKcalTexto('');
  }

  function fecharForm() {
    setTipoSelecionado(null);
    setTempoTexto('');
    setKcalTexto('');
  }

  function recalcularKcal(tempoTxt: string, nivel: NivelIntensidade) {
    if (!tipoSelecionado) return;
    const minutos = parseFloat(tempoTxt.replace(',', '.'));
    if (isNaN(minutos) || minutos <= 0) {
      setKcalTexto('');
      return;
    }
    const kcal = Math.round(minutos * tipoSelecionado.kcalPorMinutoBase * MULTIPLICADOR_INTENSIDADE[nivel]);
    setKcalTexto(String(kcal));
  }

  function handleTempoChange(texto: string) {
    setTempoTexto(texto);
    recalcularKcal(texto, intensidade);
  }

  function handleIntensidadeChange(nivel: NivelIntensidade) {
    setIntensidade(nivel);
    recalcularKcal(tempoTexto, nivel);
  }

  const duracaoNum = parseFloat(tempoTexto.replace(',', '.'));
  const kcalNum = parseInt(kcalTexto, 10);
  const formValido = !isNaN(duracaoNum) && duracaoNum > 0 && !isNaN(kcalNum) && kcalNum >= 0;

  async function handleSalvar() {
    if (!tipoSelecionado || !formValido) return;
    await adicionarExercicio(tipoSelecionado.nome, duracaoNum, kcalNum, {
      intensidade,
      local: tipoSelecionado.opcoesLocal ? local ?? undefined : undefined,
      grupoMuscular: tipoSelecionado.opcoesGrupoMuscular ? grupoMuscular ?? undefined : undefined,
    });
    fecharForm();
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="heading" color="text">Exercícios</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            Toque no tipo de exercício que você fez
          </ThemedText>
        </View>

        {!tipoSelecionado ? (
          <View style={styles.grid}>
            {tiposExercicio.map((tipo) => (
              <Pressable key={tipo.id} style={styles.gridItem} onPress={() => abrirTipo(tipo)}>
                <View style={styles.gridIconCircle}>
                  <MaterialCommunityIcons name={tipo.icone as any} size={28} color={colors.primary} />
                </View>
                <ThemedText variant="small" color="text" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
                  {tipo.nome}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
            <Pressable onPress={fecharForm} style={styles.voltarBotao}>
              <ChevronLeft size={16} color={colors.accent} strokeWidth={2.25} />
              <ThemedText variant="small" color="accent">Voltar</ThemedText>
            </Pressable>

            <View style={styles.formHeader}>
              <View style={styles.gridIconCircle}>
                <MaterialCommunityIcons name={tipoSelecionado.icone as any} size={26} color={colors.primary} />
              </View>
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.sm }}>
                {tipoSelecionado.nome}
              </ThemedText>
            </View>

            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
              Tempo (minutos)
            </ThemedText>
            <Input
              value={tempoTexto}
              onChangeText={handleTempoChange}
              placeholder="minutos"
              keyboardType="number-pad"
              style={styles.formInput}
              autoFocus
            />

            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              Intensidade
            </ThemedText>
            <View style={styles.chipsRow}>
              {NIVEIS_INTENSIDADE.map((nivel) => {
                const selecionada = intensidade === nivel;
                return (
                  <Pressable
                    key={nivel}
                    style={[styles.chip, selecionada && styles.chipSelecionado]}
                    onPress={() => handleIntensidadeChange(nivel)}
                  >
                    <ThemedText variant="small" color={selecionada ? 'primary' : 'textSecondary'}>
                      {nivel}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {tipoSelecionado.opcoesLocal && (
              <>
                <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                  Local
                </ThemedText>
                <View style={styles.chipsRow}>
                  {tipoSelecionado.opcoesLocal.map((opcao) => {
                    const selecionada = local === opcao;
                    return (
                      <Pressable
                        key={opcao}
                        style={[styles.chip, selecionada && styles.chipSelecionado]}
                        onPress={() => setLocal(opcao)}
                      >
                        <ThemedText variant="small" color={selecionada ? 'primary' : 'textSecondary'}>
                          {opcao}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {tipoSelecionado.opcoesGrupoMuscular && (
              <>
                <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                  Grupo muscular
                </ThemedText>
                <View style={styles.chipsRow}>
                  {tipoSelecionado.opcoesGrupoMuscular.map((opcao) => {
                    const selecionada = grupoMuscular === opcao;
                    return (
                      <Pressable
                        key={opcao}
                        style={[styles.chip, selecionada && styles.chipSelecionado]}
                        onPress={() => setGrupoMuscular(opcao)}
                      >
                        <ThemedText variant="small" color={selecionada ? 'primary' : 'textSecondary'}>
                          {opcao}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              Kcal estimadas (pode ajustar)
            </ThemedText>
            <Input
              value={kcalTexto}
              onChangeText={setKcalTexto}
              placeholder="kcal"
              keyboardType="number-pad"
              style={styles.formInput}
            />

            <View style={styles.formButtons}>
              <Button label="Cancelar" variant="outline" size="sm" onPress={fecharForm} style={{ marginRight: spacing.sm }} />
              <Button label="Salvar" variant="primary" size="sm" onPress={handleSalvar} disabled={!formValido} />
            </View>
          </ThemedView>
        )}

        {/* Registros de hoje */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">Hoje</ThemedText>
          {exerciciosHoje.length > 0 && (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
              {kcalGastaHoje} kcal gastas
            </ThemedText>
          )}

          {exerciciosHoje.length === 0 ? (
            <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
              Nenhum exercício registrado ainda hoje.
            </ThemedText>
          ) : (
            <View style={styles.lista}>
              {exerciciosHoje.map((e) => (
                <View key={e.id} style={styles.itemLista}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">{e.nome}</ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {e.horario} · {e.duracaoMin} min · {e.kcalGasto} kcal
                      {e.intensidade ? ` · ${e.intensidade}` : ''}
                      {e.local ? ` · ${e.local}` : ''}
                      {e.grupoMuscular ? ` · ${e.grupoMuscular}` : ''}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerExercicio(e.id)} style={styles.removerBotao}>
                    <X size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1 },
  header: { marginBottom: spacing['2xl'] },
  card: { padding: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xl },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  gridIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voltarBotao: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  formHeader: { flexDirection: 'row', alignItems: 'center' },
  formInput: { textAlign: 'left' },
  formButtons: { flexDirection: 'row', marginTop: spacing.lg },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelecionado: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  lista: { marginTop: spacing.md },
  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  removerBotao: { padding: spacing.sm },
}));
