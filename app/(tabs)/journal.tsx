import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useRecords } from '@context/RecordsContext';
import { useCustomRecipes } from '@context/CustomRecipesContext';
import { buscarReceitas, ReceitaConhecida } from '@constants/recipes';
import { AlimentoPor100g, Ingrediente, PORCAO_PADRAO_G, valoresDaPorcao } from '@models/ingredients';
import { buscarIngredientes } from '@constants/ingredients';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';
import { usePreferences } from '@context/PreferencesContext';

const OPCOES_AGUA = [200, 300, 500];

export default function JournalScreen() {
  const { t } = usePreferences();
  const router = useRouter();
  const {
    refeicoesHoje,
    aguasHoje,
    aguaHojeMl,
    adicionarAgua,
    removerAgua,
    adicionarRefeicao,
    removerRefeicao,
  } = useRecords();
  const { buscarReceitasPersonalizadas, receitasPersonalizadas } = useCustomRecipes();

  const [mostrarListaAgua, setMostrarListaAgua] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState('');
  const [kcal, setKcal] = useState('');
  const [proteina, setProteina] = useState('');
  // Receita salva escolhida: kcal/proteína acompanham a quantidade em gramas
  const [receitaEscolhida, setReceitaEscolhida] = useState<AlimentoPor100g | null>(null);
  const [gramasTexto, setGramasTexto] = useState('');

  const sugestoes = receitaEscolhida ? [] : buscarReceitas(nome);
  const sugestoesAlimentos = receitaEscolhida || !nome.trim() ? [] : buscarIngredientes(nome, 6);
  // Com o nome vazio, mostra as receitas salvas para repetir com um toque
  const sugestoesPersonalizadas = receitaEscolhida
    ? []
    : nome.trim().length === 0
      ? receitasPersonalizadas.slice(-5).reverse()
      : buscarReceitasPersonalizadas(nome);

  const kcalNum = parseInt(kcal, 10);
  const proteinaNum = parseFloat(proteina.replace(',', '.')) || 0;
  const formValido = nome.trim().length > 0 && !isNaN(kcalNum) && kcalNum > 0;

  function escolherSugestao(receita: ReceitaConhecida) {
    setNome(receita.nome);
    setKcal(String(receita.kcal));
    setProteina(String(receita.proteinaG));
  }

  function aplicarPorcao(receita: AlimentoPor100g, texto: string) {
    setGramasTexto(texto);
    const gramas = parseFloat(texto.replace(',', '.'));
    if (isNaN(gramas) || gramas <= 0) return;
    const { kcal: k, proteinaG } = valoresDaPorcao(receita, gramas);
    setKcal(String(k));
    setProteina(String(proteinaG));
  }

  function escolherAlimento(alimento: Ingrediente) {
    escolherReceitaPersonalizada({ ...alimento, porcaoPadraoG: alimento.gramaPadrao });
  }

  function escolherReceitaPersonalizada(receita: AlimentoPor100g) {
    setNome(receita.nome);
    setReceitaEscolhida(receita);
    aplicarPorcao(receita, String(receita.porcaoPadraoG ?? PORCAO_PADRAO_G));
  }

  function limparForm() {
    setNome('');
    setKcal('');
    setProteina('');
    setReceitaEscolhida(null);
    setGramasTexto('');
  }

  async function handleAdicionarRefeicao() {
    if (!formValido) return;
    const gramas = parseFloat(gramasTexto.replace(',', '.'));
    const nomeFinal = receitaEscolhida && gramas > 0 ? `${nome.trim()} (${gramas} g)` : nome.trim();
    await adicionarRefeicao(nomeFinal, kcalNum, proteinaNum);
    limparForm();
    setMostrarForm(false);
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="heading" color="text">{t('abas.diario')}</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            {t('d.sub')}
          </ThemedText>
        </View>

        {/* Água */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.aguaHeader}>
            <ThemedText variant="subheading" color="text">{t('d.agua')}</ThemedText>
            {aguasHoje.length > 0 && (
              <Pressable onPress={() => setMostrarListaAgua((v) => !v)}>
                <ThemedText variant="small" color="accent">
                  {mostrarListaAgua ? t('d.ocultar') : t('d.ver')}
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
                    <X size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Refeições */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.refeicoesHeader}>
            <ThemedText variant="subheading" color="text">{t('d.refeicoes')}</ThemedText>
            {!mostrarForm && (
              <View style={{ flexDirection: 'row' }}>
                <Button
                  label={t('titulos.receitas')}
                  variant="outline"
                  size="sm"
                  onPress={() => router.push('/recipe-builder')}
                  style={{ marginRight: spacing.sm }}
                />
                <Button label={t('d.adicionar')} variant="outline" size="sm" onPress={() => setMostrarForm(true)} />
              </View>
            )}
          </View>

          {mostrarForm && (
            <View style={styles.form}>
              <Input
                value={nome}
                onChangeText={(v) => {
                  setNome(v);
                  setReceitaEscolhida(null);
                }}
                placeholder={t('d.nomeRefeicao')}
                style={styles.formInput}
                autoFocus
              />

              {(sugestoesPersonalizadas.length > 0 || sugestoes.length > 0 || sugestoesAlimentos.length > 0) && (
                <View style={styles.sugestoes}>
                  {nome.trim().length === 0 && sugestoesPersonalizadas.length > 0 && (
                    <ThemedText variant="caption" color="textSecondary" style={styles.sugestaoTitulo}>
                      {t('d.minhasReceitas')}
                    </ThemedText>
                  )}
                  {sugestoesPersonalizadas.map((r) => (
                    <Pressable
                      key={`personalizada-${r.id}`}
                      style={styles.sugestaoItem}
                      onPress={() => escolherReceitaPersonalizada(r)}
                    >
                      <ThemedText variant="small" color="text">{t('d.suaReceita', { nome: r.nome })}</ThemedText>
                      <ThemedText variant="small" color="textSecondary">
                        {t('d.valores100', { kcal: r.kcalPor100g, prot: r.proteinaGPor100g })}
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
                        {t('d.valores', { kcal: s.kcal, prot: s.proteinaG })}
                      </ThemedText>
                    </Pressable>
                  ))}
                  {sugestoesAlimentos.map((a) => (
                    <Pressable
                      key={`alimento-${a.nome}`}
                      style={styles.sugestaoItem}
                      onPress={() => escolherAlimento(a)}
                    >
                      <ThemedText variant="small" color="text">{a.nome}</ThemedText>
                      <ThemedText variant="small" color="textSecondary">
                        {t('d.valores100', { kcal: a.kcalPor100g, prot: a.proteinaGPor100g })}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}

              {receitaEscolhida && (
                <View style={styles.quantidadeBox}>
                  <ThemedText variant="small" color="text">{t('d.quantidade')}</ThemedText>
                  <Input
                    value={gramasTexto}
                    onChangeText={(v) => aplicarPorcao(receitaEscolhida, v)}
                    keyboardType="decimal-pad"
                    style={[styles.formInput, { marginTop: spacing.xs }]}
                  />
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Input
                    value={kcal}
                    onChangeText={setKcal}
                    placeholder={t('home.kcal')}
                    keyboardType="number-pad"
                    style={styles.formInput}
                  />
                </View>
                <View style={styles.formCol}>
                  <Input
                    value={proteina}
                    onChangeText={setProteina}
                    placeholder={t('home.proteina')}
                    keyboardType="decimal-pad"
                    style={styles.formInput}
                  />
                </View>
              </View>
              <View style={styles.formButtons}>
                <Button
                  label={t('comum.cancelar')}
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    limparForm();
                    setMostrarForm(false);
                  }}
                  style={{ marginRight: spacing.sm }}
                />
                <Button
                  label={t('comum.salvar')}
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
              {t('d.vazio')}
            </ThemedText>
          ) : (
            <View style={styles.lista}>
              {refeicoesHoje.map((r) => (
                <View key={r.id} style={styles.itemRefeicao}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">{r.nome}</ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {r.horario} · {t('d.valores', { kcal: r.kcal, prot: r.proteinaG })}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerRefeicao(r.id)} style={styles.removerBotao}>
                    <X size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>
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
  quantidadeBox: { marginBottom: spacing.xs },
  sugestaoTitulo: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
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
}));
