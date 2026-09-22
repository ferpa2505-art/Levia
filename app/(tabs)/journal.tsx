import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useRecords } from '@context/RecordsContext';
import { useCustomRecipes } from '@context/CustomRecipesContext';
import { buscarReceitas, ReceitaConhecida } from '@constants/recipes';
import { buscarExercicios, Exercicio } from '@constants/exercises';
import { ReceitaPersonalizada } from '@models/ingredients';
import { colors, spacing, radius } from '@constants/colors';

const OPCOES_AGUA = [200, 300, 500];

export default function JournalScreen() {
  const router = useRouter();
  const {
    refeicoesHoje,
    aguasHoje,
    aguaHojeMl,
    adicionarAgua,
    removerAgua,
    adicionarRefeicao,
    removerRefeicao,
    exerciciosHoje,
    kcalGastaHoje,
    adicionarExercicio,
    removerExercicio,
  } = useRecords();
  const { buscarReceitasPersonalizadas } = useCustomRecipes();

  const [mostrarListaAgua, setMostrarListaAgua] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState('');
  const [kcal, setKcal] = useState('');
  const [proteina, setProteina] = useState('');

  const [mostrarFormExercicio, setMostrarFormExercicio] = useState(false);
  const [nomeExercicio, setNomeExercicio] = useState('');
  const [duracaoExercicio, setDuracaoExercicio] = useState('');
  const [kcalExercicio, setKcalExercicio] = useState('');
  const [exercicioSelecionado, setExercicioSelecionado] = useState<Exercicio | null>(null);

  const sugestoes = buscarReceitas(nome);
  const sugestoesPersonalizadas = buscarReceitasPersonalizadas(nome);

  const kcalNum = parseInt(kcal, 10);
  const proteinaNum = parseInt(proteina, 10) || 0;
  const formValido = nome.trim().length > 0 && !isNaN(kcalNum) && kcalNum > 0;

  function escolherSugestao(receita: ReceitaConhecida) {
    setNome(receita.nome);
    setKcal(String(receita.kcal));
    setProteina(String(receita.proteinaG));
  }

  function escolherReceitaPersonalizada(receita: ReceitaPersonalizada) {
    // valores da receita personalizada são por 100g; o usuário pode ajustar
    // a quantidade depois, editando os campos livremente.
    setNome(receita.nome);
    setKcal(String(receita.kcalPor100g));
    setProteina(String(receita.proteinaGPor100g));
  }

  async function handleAdicionarRefeicao() {
    if (!formValido) return;
    await adicionarRefeicao(nome.trim(), kcalNum, proteinaNum);
    setNome('');
    setKcal('');
    setProteina('');
    setMostrarForm(false);
  }

  const sugestoesExercicios = buscarExercicios(nomeExercicio);
  const duracaoNum = parseInt(duracaoExercicio, 10);
  const kcalExercicioNum = parseInt(kcalExercicio, 10);
  const formExercicioValido =
    nomeExercicio.trim().length > 0 &&
    !isNaN(duracaoNum) && duracaoNum > 0 &&
    !isNaN(kcalExercicioNum) && kcalExercicioNum >= 0;

  function escolherExercicio(ex: Exercicio) {
    setNomeExercicio(ex.nome);
    setExercicioSelecionado(ex);
    const duracaoAtual = parseInt(duracaoExercicio, 10);
    if (!isNaN(duracaoAtual) && duracaoAtual > 0) {
      setKcalExercicio(String(Math.round(duracaoAtual * ex.kcalPorMinuto)));
    }
  }

  function handleDuracaoExercicioChange(texto: string) {
    setDuracaoExercicio(texto);
    const duracaoNova = parseInt(texto, 10);
    if (exercicioSelecionado && !isNaN(duracaoNova) && duracaoNova > 0) {
      setKcalExercicio(String(Math.round(duracaoNova * exercicioSelecionado.kcalPorMinuto)));
    }
  }

  async function handleAdicionarExercicio() {
    if (!formExercicioValido) return;
    await adicionarExercicio(nomeExercicio.trim(), duracaoNum, kcalExercicioNum);
    setNomeExercicio('');
    setDuracaoExercicio('');
    setKcalExercicio('');
    setExercicioSelecionado(null);
    setMostrarFormExercicio(false);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="heading" color="text">Diário</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            Suas refeições e água de hoje
          </ThemedText>
        </View>

        {/* Água */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.aguaHeader}>
            <ThemedText variant="subheading" color="text">Água</ThemedText>
            {aguasHoje.length > 0 && (
              <Pressable onPress={() => setMostrarListaAgua((v) => !v)}>
                <ThemedText variant="small" color="accent">
                  {mostrarListaAgua ? 'ocultar registros' : 'ver registros'}
                </ThemedText>
              </Pressable>
            )}
          </View>
          <ThemedText variant="title" color="accent" style={{ marginVertical: spacing.sm }}>
            {aguaHojeMl} ml
          </ThemedText>
          <View style={styles.aguaRow}>
            {OPCOES_AGUA.map((ml) => (
              <Pressable
                key={ml}
                style={styles.aguaChip}
                onPress={() => adicionarAgua(ml)}
              >
                <ThemedText variant="body" color="accent">+{ml} ml</ThemedText>
              </Pressable>
            ))}
          </View>

          {mostrarListaAgua && (
            <View style={styles.lista}>
              {aguasHoje.map((a) => (
                <View key={a.id} style={styles.itemLista}>
                  <ThemedText variant="body" color="text">{a.horario} · {a.ml} ml</ThemedText>
                  <Pressable onPress={() => removerAgua(a.id)} style={styles.removerBotao}>
                    <ThemedText variant="body" color="textSecondary">✕</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Refeições */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.refeicoesHeader}>
            <ThemedText variant="subheading" color="text">Refeições</ThemedText>
            {!mostrarForm && (
              <View style={{ flexDirection: 'row' }}>
                <Button
                  label="Minhas receitas"
                  variant="outline"
                  size="sm"
                  onPress={() => router.push('/recipe-builder')}
                  style={{ marginRight: spacing.sm }}
                />
                <Button label="+ Adicionar" variant="outline" size="sm" onPress={() => setMostrarForm(true)} />
              </View>
            )}
          </View>

          {mostrarForm && (
            <View style={styles.form}>
              <Input
                value={nome}
                onChangeText={setNome}
                placeholder="Nome da refeição"
                style={styles.formInput}
                autoFocus
              />

              {(sugestoesPersonalizadas.length > 0 || sugestoes.length > 0) && (
                <View style={styles.sugestoes}>
                  {sugestoesPersonalizadas.map((r) => (
                    <Pressable
                      key={`personalizada-${r.id}`}
                      style={styles.sugestaoItem}
                      onPress={() => escolherReceitaPersonalizada(r)}
                    >
                      <ThemedText variant="small" color="text">{r.nome} · sua receita</ThemedText>
                      <ThemedText variant="small" color="textSecondary">
                        {r.kcalPor100g} kcal · {r.proteinaGPor100g} g proteína (por 100g)
                      </ThemedText>
                    </Pressable>
                  ))}
                  {sugestoes.map((s) => (
                    <Pressable
                      key={s.nome}
                      style={styles.sugestaoItem}
                      onPress={() => escolherSugestao(s)}
                    >
                      <ThemedText variant="small" color="text">{s.nome}</ThemedText>
                      <ThemedText variant="small" color="textSecondary">
                        {s.kcal} kcal · {s.proteinaG} g proteína
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Input
                    value={kcal}
                    onChangeText={setKcal}
                    placeholder="kcal"
                    keyboardType="number-pad"
                    style={styles.formInput}
                  />
                </View>
                <View style={styles.formCol}>
                  <Input
                    value={proteina}
                    onChangeText={setProteina}
                    placeholder="g proteína"
                    keyboardType="number-pad"
                    style={styles.formInput}
                  />
                </View>
              </View>
              <View style={styles.formButtons}>
                <Button
                  label="Cancelar"
                  variant="outline"
                  size="sm"
                  onPress={() => setMostrarForm(false)}
                  style={{ marginRight: spacing.sm }}
                />
                <Button
                  label="Salvar"
                  variant="primary"
                  size="sm"
                  onPress={handleAdicionarRefeicao}
                  disabled={!formValido}
                />
              </View>
            </View>
          )}

          {refeicoesHoje.length === 0 && !mostrarForm ? (
            <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
              Nenhuma refeição registrada ainda hoje.
            </ThemedText>
          ) : (
            <View style={styles.lista}>
              {refeicoesHoje.map((r) => (
                <View key={r.id} style={styles.itemRefeicao}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">{r.nome}</ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {r.horario} · {r.kcal} kcal · {r.proteinaG} g proteína
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerRefeicao(r.id)} style={styles.removerBotao}>
                    <ThemedText variant="body" color="textSecondary">✕</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Exercícios */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.refeicoesHeader}>
            <ThemedText variant="subheading" color="text">Exercícios</ThemedText>
            {!mostrarFormExercicio && (
              <Button label="+ Adicionar" variant="outline" size="sm" onPress={() => setMostrarFormExercicio(true)} />
            )}
          </View>

          {exerciciosHoje.length > 0 && (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
              {kcalGastaHoje} kcal gastas hoje
            </ThemedText>
          )}

          {mostrarFormExercicio && (
            <View style={styles.form}>
              <Input
                value={nomeExercicio}
                onChangeText={(texto) => {
                  setNomeExercicio(texto);
                  setExercicioSelecionado(null);
                }}
                placeholder="Nome do exercício"
                style={styles.formInput}
                autoFocus
              />

              {sugestoesExercicios.length > 0 && (
                <View style={styles.sugestoes}>
                  {sugestoesExercicios.map((ex) => (
                    <Pressable
                      key={ex.nome}
                      style={styles.sugestaoItem}
                      onPress={() => escolherExercicio(ex)}
                    >
                      <ThemedText variant="small" color="text">{ex.nome}</ThemedText>
                      <ThemedText variant="small" color="textSecondary">
                        ≈ {ex.kcalPorMinuto} kcal/min · {ex.categoria}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Input
                    value={duracaoExercicio}
                    onChangeText={handleDuracaoExercicioChange}
                    placeholder="minutos"
                    keyboardType="number-pad"
                    style={styles.formInput}
                  />
                </View>
                <View style={styles.formCol}>
                  <Input
                    value={kcalExercicio}
                    onChangeText={setKcalExercicio}
                    placeholder="kcal gastas"
                    keyboardType="number-pad"
                    style={styles.formInput}
                  />
                </View>
              </View>
              <View style={styles.formButtons}>
                <Button
                  label="Cancelar"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setMostrarFormExercicio(false);
                    setExercicioSelecionado(null);
                  }}
                  style={{ marginRight: spacing.sm }}
                />
                <Button
                  label="Salvar"
                  variant="primary"
                  size="sm"
                  onPress={handleAdicionarExercicio}
                  disabled={!formExercicioValido}
                />
              </View>
            </View>
          )}

          {exerciciosHoje.length === 0 && !mostrarFormExercicio ? (
            <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
              Nenhum exercício registrado ainda hoje.
            </ThemedText>
          ) : (
            <View style={styles.lista}>
              {exerciciosHoje.map((e) => (
                <View key={e.id} style={styles.itemRefeicao}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">{e.nome}</ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {e.horario} · {e.duracaoMin} min · {e.kcalGasto} kcal
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerExercicio(e.id)} style={styles.removerBotao}>
                    <ThemedText variant="body" color="textSecondary">✕</ThemedText>
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

const styles = StyleSheet.create({
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
  aguaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aguaRow: { flexDirection: 'row', marginTop: spacing.sm },
  aguaChip: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  refeicoesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  form: { marginTop: spacing.md },
  formInput: { textAlign: 'left', marginBottom: spacing.sm },
  sugestoes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  sugestaoItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formRow: { flexDirection: 'row', gap: spacing.sm },
  formCol: { flex: 1 },
  formButtons: { flexDirection: 'row', marginTop: spacing.sm },
  lista: { marginTop: spacing.md },
  itemRefeicao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  removerBotao: { padding: spacing.sm },
});
