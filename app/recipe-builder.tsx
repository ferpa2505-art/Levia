import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useCustomRecipes } from '@context/CustomRecipesContext';
import { buscarIngredientes } from '@constants/ingredients';
import { formasDePreparo } from '@constants/preparationMethods';
import { Ingrediente, IngredienteUsado } from '@models/ingredients';
import { colors, spacing, radius } from '@constants/colors';

export default function RecipeBuilderScreen() {
  const router = useRouter();
  const { receitasPersonalizadas, criarReceita, removerReceita } = useCustomRecipes();

  const [nomeReceita, setNomeReceita] = useState('');
  const [itens, setItens] = useState<IngredienteUsado[]>([]);

  const [busca, setBusca] = useState('');
  const [ingredienteSelecionado, setIngredienteSelecionado] = useState<Ingrediente | null>(null);
  const [gramasTexto, setGramasTexto] = useState('');
  const [formaSelecionadaNome, setFormaSelecionadaNome] = useState<string | undefined>(undefined);

  const sugestoesIngredientes = buscarIngredientes(busca);

  const pesoTotalG = itens.reduce((soma, i) => soma + i.gramas, 0);
  const kcalTotal = itens.reduce((soma, i) => soma + i.kcal, 0);
  const proteinaGTotal = itens.reduce((soma, i) => soma + i.proteinaG, 0);
  const kcalPor100gPreview = pesoTotalG > 0 ? Math.round((kcalTotal / pesoTotalG) * 100) : 0;
  const proteinaPor100gPreview = pesoTotalG > 0 ? Math.round(((proteinaGTotal / pesoTotalG) * 100) * 10) / 10 : 0;

  function escolherIngrediente(ingrediente: Ingrediente) {
    setIngredienteSelecionado(ingrediente);
    setGramasTexto(String(ingrediente.gramaPadrao));
    setFormaSelecionadaNome(undefined);
    setBusca('');
  }

  function cancelarSelecao() {
    setIngredienteSelecionado(null);
    setGramasTexto('');
    setFormaSelecionadaNome(undefined);
  }

  function adicionarItem() {
    if (!ingredienteSelecionado) return;
    const gramas = parseFloat(gramasTexto.replace(',', '.'));
    if (isNaN(gramas) || gramas <= 0) return;

    const forma = formasDePreparo.find((f) => f.nome === formaSelecionadaNome);
    const kcalBase = (gramas * ingredienteSelecionado.kcalPor100g) / 100;
    const proteinaBase = (gramas * ingredienteSelecionado.proteinaGPor100g) / 100;

    const novoItem: IngredienteUsado = {
      ingredienteNome: ingredienteSelecionado.nome,
      gramas,
      formaPreparoNome: forma?.nome,
      kcal: Math.round(kcalBase + (forma?.kcalAdicional ?? 0)),
      proteinaG: Math.round((proteinaBase + (forma?.proteinaGAdicional ?? 0)) * 10) / 10,
    };

    setItens((prev) => [...prev, novoItem]);
    cancelarSelecao();
  }

  function removerItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  const podeSalvar = nomeReceita.trim().length > 0 && itens.length > 0;

  async function handleSalvar() {
    if (!podeSalvar) return;
    const receita = await criarReceita(nomeReceita.trim(), itens);
    if (receita) {
      setNomeReceita('');
      setItens([]);
      router.back();
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="heading" color="text">Monte sua receita</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            Junte os ingredientes que você usou, com a quantidade em gramas, e a gente calcula o total por 100g pra você.
          </ThemedText>
        </View>

        {/* Buscar e adicionar ingrediente */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text" style={{ marginBottom: spacing.sm }}>
            Adicionar ingrediente
          </ThemedText>

          {!ingredienteSelecionado ? (
            <>
              <Input
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar ingrediente (ex: ovo, batata, queijo...)"
                style={styles.formInput}
              />
              {sugestoesIngredientes.length > 0 && (
                <View style={styles.sugestoes}>
                  {sugestoesIngredientes.map((ing) => (
                    <Pressable
                      key={ing.nome}
                      style={styles.sugestaoItem}
                      onPress={() => escolherIngrediente(ing)}
                    >
                      <ThemedText variant="small" color="text">{ing.nome}</ThemedText>
                      <ThemedText variant="small" color="textSecondary">
                        {ing.kcalPor100g} kcal / 100g · {ing.unidadeComum ?? `${ing.gramaPadrao}g padrão`}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View>
              <ThemedText variant="body" color="text" style={{ marginBottom: spacing.sm }}>
                {ingredienteSelecionado.nome}
              </ThemedText>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Input
                    value={gramasTexto}
                    onChangeText={setGramasTexto}
                    placeholder="Gramas"
                    keyboardType="decimal-pad"
                    style={styles.formInput}
                    autoFocus
                  />
                </View>
                <ThemedText variant="body" color="textSecondary" style={{ marginLeft: spacing.sm }}>
                  g
                </ThemedText>
              </View>

              <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
                Forma de preparo (opcional)
              </ThemedText>
              <View style={styles.chipsRow}>
                {formasDePreparo.map((f) => {
                  const selecionada = formaSelecionadaNome === f.nome;
                  return (
                    <Pressable
                      key={f.nome}
                      style={[styles.chip, selecionada && styles.chipSelecionado]}
                      onPress={() => setFormaSelecionadaNome(selecionada ? undefined : f.nome)}
                    >
                      <ThemedText variant="small" color={selecionada ? 'primary' : 'textSecondary'}>
                        {f.nome}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.formButtons}>
                <Button label="Cancelar" variant="outline" size="sm" onPress={cancelarSelecao} style={{ marginRight: spacing.sm }} />
                <Button
                  label="Adicionar à receita"
                  variant="primary"
                  size="sm"
                  onPress={adicionarItem}
                  disabled={!gramasTexto || isNaN(parseFloat(gramasTexto.replace(',', '.')))}
                />
              </View>
            </View>
          )}
        </ThemedView>

        {/* Itens já adicionados */}
        {itens.length > 0 && (
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
            <ThemedText variant="subheading" color="text" style={{ marginBottom: spacing.sm }}>
              Ingredientes da receita
            </ThemedText>
            <View style={styles.lista}>
              {itens.map((item, index) => (
                <View key={`${item.ingredienteNome}-${index}`} style={styles.itemLista}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">
                      {item.ingredienteNome} · {item.gramas}g
                      {item.formaPreparoNome ? ` · ${item.formaPreparoNome}` : ''}
                    </ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {item.kcal} kcal · {item.proteinaG} g proteína
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerItem(index)} style={styles.removerBotao}>
                    <ThemedText variant="body" color="textSecondary">✕</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.totalBox}>
              <ThemedText variant="body" color="text">
                Total: {Math.round(pesoTotalG)}g · {Math.round(kcalTotal)} kcal · {Math.round(proteinaGTotal * 10) / 10} g proteína
              </ThemedText>
              <ThemedText variant="small" color="accent" style={{ marginTop: spacing.xs }}>
                Por 100g desta receita: {kcalPor100gPreview} kcal · {proteinaPor100gPreview} g proteína
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {/* Nome e salvar */}
        {itens.length > 0 && (
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
            <ThemedText variant="subheading" color="text" style={{ marginBottom: spacing.sm }}>
              Nome da receita
            </ThemedText>
            <Input
              value={nomeReceita}
              onChangeText={setNomeReceita}
              placeholder='Ex: "Torta da Rê"'
              style={styles.formInput}
            />
            <Button
              label="Salvar receita"
              variant="primary"
              onPress={handleSalvar}
              disabled={!podeSalvar}
              style={{ marginTop: spacing.sm }}
            />
          </ThemedView>
        )}

        {/* Receitas já salvas */}
        {receitasPersonalizadas.length > 0 && (
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
            <ThemedText variant="subheading" color="text" style={{ marginBottom: spacing.sm }}>
              Minhas receitas salvas
            </ThemedText>
            <View style={styles.lista}>
              {receitasPersonalizadas.map((r) => (
                <View key={r.id} style={styles.itemLista}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">{r.nome}</ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {r.kcalPor100g} kcal / 100g · {r.proteinaGPor100g} g proteína / 100g · total {Math.round(r.pesoTotalG)}g
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerReceita(r.id)} style={styles.removerBotao}>
                    <ThemedText variant="body" color="textSecondary">✕</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          </ThemedView>
        )}
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
  formInput: { textAlign: 'left', marginBottom: spacing.sm },
  formRow: { flexDirection: 'row', alignItems: 'center' },
  formCol: { flex: 1 },
  formButtons: { flexDirection: 'row', marginTop: spacing.md },
  sugestoes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  sugestaoItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
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
  lista: { marginTop: spacing.xs },
  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  removerBotao: { padding: spacing.sm },
  totalBox: { marginTop: spacing.md },
});
