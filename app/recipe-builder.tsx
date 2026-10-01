import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useCustomRecipes } from '@context/CustomRecipesContext';
import { buscarIngredientes } from '@constants/ingredients';
import { formasDePreparo } from '@constants/preparationMethods';
import { Ingrediente, IngredienteUsado, PORCAO_PADRAO_G, ReceitaPersonalizada, valoresDaPorcao } from '@models/ingredients';
import { useRecords } from '@context/RecordsContext';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';
import { usePreferences } from '@context/PreferencesContext';

export default function RecipeBuilderScreen() {
  const { t, tc, idioma } = usePreferences();
  const router = useRouter();
  const { receitasPersonalizadas, criarReceita, removerReceita, atualizarPorcaoPadrao } = useCustomRecipes();
  const { adicionarRefeicao } = useRecords();

  const [porcaoPadraoTexto, setPorcaoPadraoTexto] = useState(String(PORCAO_PADRAO_G));

  // Receita salva aberta para registrar de novo
  const [receitaAbertaId, setReceitaAbertaId] = useState<string | null>(null);
  const [porcaoTexto, setPorcaoTexto] = useState('');
  const [registradaId, setRegistradaId] = useState<string | null>(null);

  function lerGramas(texto: string): number {
    const g = parseFloat(texto.replace(',', '.'));
    return isNaN(g) || g <= 0 ? 0 : g;
  }

  function abrirReceita(r: ReceitaPersonalizada) {
    if (receitaAbertaId === r.id) {
      setReceitaAbertaId(null);
      return;
    }
    setReceitaAbertaId(r.id);
    setPorcaoTexto(String(r.porcaoPadraoG ?? PORCAO_PADRAO_G));
    setRegistradaId(null);
  }

  async function registrarReceita(r: ReceitaPersonalizada) {
    const gramas = lerGramas(porcaoTexto);
    if (!gramas) return;
    const { kcal, proteinaG } = valoresDaPorcao(r, gramas);
    await adicionarRefeicao(`${r.nome} (${gramas} g)`, kcal, proteinaG);
    setRegistradaId(r.id);
  }

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
    const receita = await criarReceita(nomeReceita.trim(), itens, lerGramas(porcaoPadraoTexto) || PORCAO_PADRAO_G);
    if (receita) {
      setNomeReceita('');
      setPorcaoPadraoTexto(String(PORCAO_PADRAO_G));
      setItens([]);
      router.back();
    }
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="heading" color="text">{t('r.titulo')}</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            {t('r.sub')}
          </ThemedText>
        </View>

        {/* Buscar e adicionar ingrediente */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text" style={{ marginBottom: spacing.sm }}>
            {t('r.adicionarIng')}
          </ThemedText>

          {!ingredienteSelecionado ? (
            <>
              {!idioma.startsWith('pt') ? (
                <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.xs }}>
                  {t('r.avisoLista')}
                </ThemedText>
              ) : null}
              <Input
                value={busca}
                onChangeText={setBusca}
                placeholder={t('r.buscar')}
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
                        {ing.kcalPor100g} kcal / 100g · {ing.unidadeComum ?? t('r.padrao', { g: ing.gramaPadrao })}
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
                    placeholder={t('r.gramas')}
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
                {t('r.forma')}
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
                        {tc(f.nome)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.formButtons}>
                <Button label={t('comum.cancelar')} variant="outline" size="sm" onPress={cancelarSelecao} style={{ marginRight: spacing.sm }} />
                <Button
                  label={t('r.adicionarReceita')}
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
              {t('r.ingredientes')}
            </ThemedText>
            <View style={styles.lista}>
              {itens.map((item, index) => (
                <View key={`${item.ingredienteNome}-${index}`} style={styles.itemLista}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">
                      {item.ingredienteNome} · {item.gramas}g
                      {item.formaPreparoNome ? ` · ${tc(item.formaPreparoNome)}` : ''}
                    </ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {t('d.valores', { kcal: item.kcal, prot: item.proteinaG })}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerItem(index)} style={styles.removerBotao}>
                    <X size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.totalBox}>
              <ThemedText variant="body" color="text">
                {t('r.total', { g: Math.round(pesoTotalG), kcal: Math.round(kcalTotal), prot: Math.round(proteinaGTotal * 10) / 10 })}
              </ThemedText>
              <ThemedText variant="small" color="accent" style={{ marginTop: spacing.xs }}>
                {t('r.por100', { kcal: kcalPor100gPreview, prot: proteinaPor100gPreview })}
              </ThemedText>
            </View>
          </ThemedView>
        )}

        {/* Nome e salvar */}
        {itens.length > 0 && (
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
            <ThemedText variant="subheading" color="text" style={{ marginBottom: spacing.sm }}>
              {t('r.nome')}
            </ThemedText>
            <Input
              value={nomeReceita}
              onChangeText={setNomeReceita}
              placeholder={t('r.nomePh')}
              style={styles.formInput}
            />
            <ThemedText variant="small" color="text" style={{ marginTop: spacing.sm }}>
              {t('r.porcaoPadrao')}
            </ThemedText>
            <View style={styles.porcaoRow}>
              <Input
                value={porcaoPadraoTexto}
                onChangeText={setPorcaoPadraoTexto}
                keyboardType="decimal-pad"
                style={[styles.formInput, styles.porcaoInput]}
              />
              <ThemedText variant="body" color="textSecondary" style={{ marginLeft: spacing.sm }}>g</ThemedText>
            </View>
            <ThemedText variant="caption" color="textSecondary">{t('r.porcaoDica')}</ThemedText>
            <Button
              label={t('r.salvar')}
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
            <ThemedText variant="subheading" color="text">
              {t('r.salvas')}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
              {t('r.toque')}
            </ThemedText>
            <View style={styles.lista}>
              {receitasPersonalizadas.map((r) => {
                const aberta = receitaAbertaId === r.id;
                const gramas = lerGramas(porcaoTexto);
                const porcao = valoresDaPorcao(r, gramas);
                const padrao = r.porcaoPadraoG ?? PORCAO_PADRAO_G;
                return (
                  <View key={r.id} style={styles.receitaSalva}>
                    <View style={styles.itemLinha}>
                      <Pressable onPress={() => abrirReceita(r)} style={{ flex: 1 }}>
                        <ThemedText variant="body" color={aberta ? 'primary' : 'text'}>{r.nome}</ThemedText>
                        <ThemedText variant="small" color="textSecondary">
                          {t('r.itemSalva', { kcal: r.kcalPor100g, prot: r.proteinaGPor100g, g: Math.round(r.pesoTotalG) })}
                        </ThemedText>
                        <ThemedText variant="caption" color="textSecondary">{t('r.porcaoAtual', { g: padrao })}</ThemedText>
                      </Pressable>
                      <Pressable onPress={() => removerReceita(r.id)} style={styles.removerBotao}>
                        <X size={16} color={colors.textSecondary} strokeWidth={2} />
                      </Pressable>
                    </View>

                    {aberta && (
                      <View style={styles.registrarBox}>
                        <ThemedText variant="small" color="text">{t('d.quantidade')}</ThemedText>
                        <View style={styles.porcaoRow}>
                          <Input
                            value={porcaoTexto}
                            onChangeText={(v) => {
                              setPorcaoTexto(v);
                              setRegistradaId(null);
                            }}
                            keyboardType="decimal-pad"
                            style={[styles.formInput, styles.porcaoInput]}
                          />
                          <ThemedText variant="body" color="textSecondary" style={{ marginLeft: spacing.sm }}>g</ThemedText>
                        </View>
                        {gramas > 0 && (
                          <ThemedText variant="small" color="primary">
                            {t('d.porcaoInfo', { kcal: porcao.kcal, prot: porcao.proteinaG, g: gramas })}
                          </ThemedText>
                        )}
                        {registradaId === r.id ? (
                          <ThemedText variant="body" color="primary" style={{ marginTop: spacing.sm }}>
                            {t('r.registrada')}
                          </ThemedText>
                        ) : (
                          <Button
                            label={t('r.registrarHoje')}
                            variant="primary"
                            size="sm"
                            onPress={() => registrarReceita(r)}
                            disabled={!gramas}
                            style={{ marginTop: spacing.sm }}
                          />
                        )}
                        {gramas > 0 && gramas !== padrao && (
                          <Button
                            label={t('r.usarPadrao')}
                            variant="outline"
                            size="sm"
                            onPress={() => atualizarPorcaoPadrao(r.id, gramas)}
                            style={{ marginTop: spacing.sm }}
                          />
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ThemedView>
        )}
      </ThemedView>
    </TelaRolavel>
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
  receitaSalva: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm },
  itemLinha: { flexDirection: 'row', alignItems: 'center' },
  registrarBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  porcaoRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  porcaoInput: { width: 110, marginBottom: spacing.xs },
  totalBox: { marginTop: spacing.md },
}));
