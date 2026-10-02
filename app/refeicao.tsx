import { useState } from 'react';
import { View, Pressable, Switch, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ImagePlus, Sparkles, Trash2, X, Minus, Plus, PencilLine } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useRecords } from '@context/RecordsContext';
import { useCustomRecipes } from '@context/CustomRecipesContext';
import { usePreferences } from '@context/PreferencesContext';
import { buscarIngredientes } from '@constants/ingredients';
import { buscarReceitas } from '@constants/recipes';
import { ItemRefeicao, TipoRefeicao, TIPOS_REFEICAO, tipoPeloHorario } from '@models/records';
import { AlimentoPor100g, PORCAO_PADRAO_G } from '@models/ingredients';
import { dataDeHoje, horarioAgora } from '@utils/recordsStorage';
import { fotografarPrato, escolherFotoDaGaleria } from '@utils/fotosRefeicao';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

type Opcao =
  | { tipo: 'por100'; alimento: AlimentoPor100g & { carboidratoGPor100g?: number }; rotulo: string }
  | { tipo: 'porcao'; item: ItemRefeicao; rotulo: string };

const arred = (n: number, casas = 0) => Math.round(n * 10 ** casas) / 10 ** casas;

export default function RefeicaoScreen() {
  const { t } = usePreferences();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; data?: string; tipo?: TipoRefeicao }>();
  const { refeicoes, salvarRefeicao, removerRefeicao } = useRecords();
  const { buscarReceitasPersonalizadas, receitasPersonalizadas } = useCustomRecipes();
  const existente = params.id ? refeicoes.find((r) => r.id === params.id) : undefined;

  const agora = horarioAgora();
  const [tipo, setTipo] = useState<TipoRefeicao>(existente?.tipo ?? params.tipo ?? tipoPeloHorario(agora));
  const [tipoLivre, setTipoLivre] = useState(existente?.tipoPersonalizado ?? '');
  const [horario, setHorario] = useState(existente?.horario ?? agora);
  const [itens, setItens] = useState<ItemRefeicao[]>(
    existente?.itens ??
      (existente
        ? [{ nome: existente.nome, kcal: existente.kcal, proteinaG: existente.proteinaG, carboidratoG: existente.carboidratoG }]
        : [])
  );
  const [foto, setFoto] = useState<string | undefined>(existente?.fotoUri);
  const [obs, setObs] = useState(existente?.observacoes ?? '');
  const [lembrete, setLembrete] = useState(false);
  const [horasLembrete, setHorasLembrete] = useState(3);

  // busca de alimentos
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState<Opcao | null>(null);
  const [gramas, setGramas] = useState('');
  // item digitado à mão
  const [manual, setManual] = useState(false);
  const [mNome, setMNome] = useState('');
  const [mKcal, setMKcal] = useState('');
  const [mProt, setMProt] = useState('');
  const [mCarb, setMCarb] = useState('');

  const opcoes: Opcao[] = !busca.trim() || escolhido
    ? []
    : [
        ...buscarReceitasPersonalizadas(busca).map((r) => ({ tipo: 'por100' as const, alimento: r, rotulo: t('d.suaReceita', { nome: r.nome }) })),
        ...buscarReceitas(busca).map((r) => ({
          tipo: 'porcao' as const,
          item: { nome: r.nome, kcal: r.kcal, proteinaG: r.proteinaG },
          rotulo: r.nome,
        })),
        ...buscarIngredientes(busca, 6).map((i) => ({
          tipo: 'por100' as const,
          alimento: { ...i, porcaoPadraoG: i.gramaPadrao },
          rotulo: i.nome,
        })),
      ];
  // com a busca vazia, atalhos para as receitas salvas
  const atalhos = !busca.trim() && !escolhido ? receitasPersonalizadas.slice(-4).reverse() : [];

  function escolher(o: Opcao) {
    if (o.tipo === 'porcao') {
      setItens((l) => [...l, o.item]);
      setBusca('');
      return;
    }
    setEscolhido(o);
    setGramas(String(o.alimento.porcaoPadraoG ?? PORCAO_PADRAO_G));
  }

  function confirmarEscolhido() {
    if (!escolhido || escolhido.tipo !== 'por100') return;
    const g = parseFloat(gramas.replace(',', '.'));
    if (!(g > 0)) return;
    const a = escolhido.alimento;
    setItens((l) => [
      ...l,
      {
        nome: a.nome,
        gramas: g,
        kcal: arred((a.kcalPor100g * g) / 100),
        proteinaG: arred((a.proteinaGPor100g * g) / 100, 1),
        carboidratoG: a.carboidratoGPor100g != null ? arred((a.carboidratoGPor100g * g) / 100, 1) : undefined,
      },
    ]);
    setEscolhido(null);
    setBusca('');
  }

  function adicionarManual() {
    const kcal = parseFloat(mKcal.replace(',', '.'));
    if (!mNome.trim() || !(kcal >= 0)) return;
    setItens((l) => [
      ...l,
      {
        nome: mNome.trim(),
        kcal: arred(kcal),
        proteinaG: arred(parseFloat(mProt.replace(',', '.')) || 0, 1),
        carboidratoG: mCarb ? arred(parseFloat(mCarb.replace(',', '.')) || 0, 1) : undefined,
      },
    ]);
    setMNome('');
    setMKcal('');
    setMProt('');
    setMCarb('');
    setManual(false);
  }

  async function handleFoto(origem: 'camera' | 'galeria') {
    const r = origem === 'camera' ? await fotografarPrato() : await escolherFotoDaGaleria();
    if (!r) return;
    if ('negado' in r) {
      Alert.alert(t('ref.semPermissaoFoto'));
      return;
    }
    setFoto(r.uri);
    Alert.alert(t('ref.fotoSalvaTitulo'), t('ref.fotoSalvaMsg'));
  }

  const total = {
    kcal: arred(itens.reduce((s, i) => s + i.kcal, 0)),
    prot: arred(itens.reduce((s, i) => s + i.proteinaG, 0), 1),
    carb: arred(itens.reduce((s, i) => s + (i.carboidratoG ?? 0), 0), 1),
  };
  const horarioOk = /^([01]?\d|2[0-3]):[0-5]\d$/.test(horario.trim());

  async function handleSalvar() {
    if (itens.length === 0 && !foto) {
      Alert.alert(t('ref.precisaItem'));
      return;
    }
    if (!horarioOk) {
      Alert.alert(t('ref.horarioInvalido'));
      return;
    }
    const [h, m] = horario.trim().split(':');
    const nomeTipo = tipo === 'outro' && tipoLivre.trim() ? tipoLivre.trim() : t(`ref.tipo.${tipo}` as never);
    const r = await salvarRefeicao(
      {
        id: existente?.id,
        data: existente?.data ?? params.data ?? dataDeHoje(),
        horario: `${h.padStart(2, '0')}:${m}`,
        nome: itens.length ? itens.map((i) => i.nome).join(', ') : nomeTipo,
        kcal: total.kcal,
        proteinaG: total.prot,
        carboidratoG: itens.some((i) => i.carboidratoG != null) ? total.carb : undefined,
        tipo,
        tipoPersonalizado: tipo === 'outro' ? tipoLivre.trim() || undefined : undefined,
        itens,
        fotoUri: foto,
        observacoes: obs.trim() || undefined,
      },
      lembrete ? horasLembrete : null
    );
    if (lembrete) {
      Alert.alert(
        t('ref.salva'),
        r.lembreteAgendado ? t('ref.lembreteOk', { h: horasLembrete }) : t('ref.lembreteFalhou'),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      router.back();
    }
  }

  function handleExcluir() {
    if (!existente) return;
    Alert.alert(t('ref.excluirTitulo'), undefined, [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('ref.excluir'),
        style: 'destructive',
        onPress: async () => {
          await removerRefeicao(existente.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <TelaRolavel>
      {/* Tipo e horário */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <Rotulo texto={t('ref.qual')} primeiro />
        <View style={styles.chips}>
          {TIPOS_REFEICAO.map((tp) => (
            <Chip key={tp} ativo={tipo === tp} texto={t(`ref.tipo.${tp}` as never)} onPress={() => setTipo(tp)} />
          ))}
        </View>
        {tipo === 'outro' && (
          <Input value={tipoLivre} onChangeText={setTipoLivre} placeholder={t('ref.tipoLivrePh')} style={[styles.input, { marginTop: spacing.sm }]} />
        )}
        <Rotulo texto={t('ref.horario')} />
        <Input
          value={horario}
          onChangeText={setHorario}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          style={[styles.input, { width: 110 }, !horarioOk && styles.inputErro]}
        />
      </ThemedView>

      {/* Foto do prato */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <View style={styles.linha}>
          <Sparkles size={18} color={colors.primary} strokeWidth={2} />
          <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs, flex: 1 }}>
            {t('ref.fotoTitulo')}
          </ThemedText>
        </View>
        {foto ? (
          <View style={{ marginTop: spacing.md }}>
            <Image source={{ uri: foto }} style={styles.foto} />
            <Pressable onPress={() => setFoto(undefined)} style={styles.fotoRemover} hitSlop={8}>
              <X size={16} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
              {t('ref.iaEmBreve')}
            </ThemedText>
          </View>
        ) : (
          <>
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
              {t('ref.fotoDesc')}
            </ThemedText>
            <View style={[styles.linha, { marginTop: spacing.md, gap: spacing.sm }]}>
              <Pressable style={styles.botaoFoto} onPress={() => handleFoto('camera')}>
                <Camera size={18} color={colors.primary} strokeWidth={2} />
                <ThemedText variant="body" color="primary" style={{ marginLeft: spacing.xs }}>{t('ref.camera')}</ThemedText>
              </Pressable>
              <Pressable style={styles.botaoFoto} onPress={() => handleFoto('galeria')}>
                <ImagePlus size={18} color={colors.primary} strokeWidth={2} />
                <ThemedText variant="body" color="primary" style={{ marginLeft: spacing.xs }}>{t('ref.galeria')}</ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </ThemedView>

      {/* Alimentos */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <ThemedText variant="subheading" color="text">{t('ref.oQueComeu')}</ThemedText>

        {itens.map((i, idx) => (
          <View key={`${i.nome}-${idx}`} style={styles.item}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="body" color="text">
                {i.nome}
                {i.gramas ? <ThemedText variant="small" color="textSecondary">{`  ${i.gramas} g`}</ThemedText> : null}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                {t('ref.macros', { kcal: i.kcal, prot: i.proteinaG, carb: i.carboidratoG ?? '–' })}
              </ThemedText>
            </View>
            <Pressable onPress={() => setItens((l) => l.filter((_, k) => k !== idx))} hitSlop={8}>
              <X size={16} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>
        ))}

        {escolhido && escolhido.tipo === 'por100' ? (
          <View style={styles.caixaGramas}>
            <ThemedText variant="body" color="text">{escolhido.alimento.nome}</ThemedText>
            <View style={[styles.linha, { marginTop: spacing.sm }]}>
              <Input value={gramas} onChangeText={setGramas} keyboardType="decimal-pad" autoFocus style={[styles.input, { width: 100 }]} />
              <ThemedText variant="body" color="textSecondary" style={{ marginHorizontal: spacing.sm }}>g</ThemedText>
              <Button label={t('ref.incluir')} size="sm" onPress={confirmarEscolhido} />
              <Pressable onPress={() => setEscolhido(null)} style={{ marginLeft: spacing.md }} hitSlop={8}>
                <X size={18} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        ) : manual ? (
          <View style={styles.caixaGramas}>
            <Input value={mNome} onChangeText={setMNome} placeholder={t('ref.manualNome')} style={styles.input} />
            <View style={[styles.linha, { gap: spacing.xs, marginTop: spacing.xs }]}>
              <Input value={mKcal} onChangeText={setMKcal} placeholder="kcal" keyboardType="decimal-pad" style={[styles.input, { flex: 1 }]} />
              <Input value={mProt} onChangeText={setMProt} placeholder={t('ref.protG')} keyboardType="decimal-pad" style={[styles.input, { flex: 1 }]} />
              <Input value={mCarb} onChangeText={setMCarb} placeholder={t('ref.carbG')} keyboardType="decimal-pad" style={[styles.input, { flex: 1 }]} />
            </View>
            <View style={[styles.linha, { marginTop: spacing.sm }]}>
              <Button label={t('ref.incluir')} size="sm" onPress={adicionarManual} disabled={!mNome.trim() || !mKcal} />
              <Pressable onPress={() => setManual(false)} style={{ marginLeft: spacing.md }}>
                <ThemedText variant="small" color="textSecondary">{t('comum.cancelar')}</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Input value={busca} onChangeText={setBusca} placeholder={t('ref.buscarPh')} style={[styles.input, { marginTop: spacing.md }]} />
            {(opcoes.length > 0 || atalhos.length > 0) && (
              <View style={styles.sugestoes}>
                {atalhos.length > 0 && (
                  <ThemedText variant="caption" color="textSecondary" style={styles.sugTitulo}>{t('d.minhasReceitas')}</ThemedText>
                )}
                {atalhos.map((r) => (
                  <Pressable key={`at-${r.id}`} style={styles.sugestao} onPress={() => escolher({ tipo: 'por100', alimento: r, rotulo: r.nome })}>
                    <ThemedText variant="small" color="text">{r.nome}</ThemedText>
                  </Pressable>
                ))}
                {opcoes.map((o, k) => (
                  <Pressable key={`op-${k}-${o.rotulo}`} style={styles.sugestao} onPress={() => escolher(o)}>
                    <ThemedText variant="small" color="text">{o.rotulo}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      {o.tipo === 'porcao'
                        ? t('d.valores', { kcal: o.item.kcal, prot: o.item.proteinaG })
                        : t('d.valores100', { kcal: o.alimento.kcalPor100g, prot: o.alimento.proteinaGPor100g })}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
            <Pressable onPress={() => setManual(true)} style={[styles.linha, { marginTop: spacing.md }]}>
              <PencilLine size={14} color={colors.primary} strokeWidth={2} />
              <ThemedText variant="small" color="primary" style={{ marginLeft: spacing.xs }}>{t('ref.manual')}</ThemedText>
            </Pressable>
          </>
        )}

        {itens.length > 0 && (
          <View style={styles.total}>
            <ThemedText variant="subheading" color="primary">
              {t('ref.total', { kcal: total.kcal, prot: total.prot, carb: total.carb })}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Lembrete e observações */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <View style={styles.linha}>
          <ThemedText variant="body" color="text" style={{ flex: 1 }}>{t('ref.lembrete')}</ThemedText>
          <Switch value={lembrete} onValueChange={setLembrete} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
        {lembrete && (
          <View style={[styles.linha, { marginTop: spacing.sm }]}>
            <ThemedText variant="small" color="textSecondary" style={{ flex: 1 }}>{t('ref.lembreteEm', { h: horasLembrete })}</ThemedText>
            <Pressable onPress={() => setHorasLembrete((h) => Math.max(1, h - 1))} style={styles.passo} hitSlop={6}>
              <Minus size={16} color={colors.primary} strokeWidth={2.5} />
            </Pressable>
            <ThemedText variant="subheading" color="primary" style={{ minWidth: 48, textAlign: 'center' }}>{horasLembrete} h</ThemedText>
            <Pressable onPress={() => setHorasLembrete((h) => Math.min(12, h + 1))} style={styles.passo} hitSlop={6}>
              <Plus size={16} color={colors.primary} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}
        <Rotulo texto={t('med.obs')} />
        <Input value={obs} onChangeText={setObs} placeholder={t('ref.obsPh')} multiline style={[styles.input, { minHeight: 56 }]} />
      </ThemedView>

      <Button label={t('comum.salvar')} size="lg" onPress={handleSalvar} />
      {existente && (
        <Pressable onPress={handleExcluir} style={styles.excluir}>
          <Trash2 size={16} color={colors.error} strokeWidth={2} />
          <ThemedText variant="body" color="error" style={{ marginLeft: spacing.xs }}>{t('ref.excluir')}</ThemedText>
        </Pressable>
      )}
      <View style={{ height: spacing['2xl'] }} />
    </TelaRolavel>
  );
}

function Rotulo({ texto, primeiro }: { texto: string; primeiro?: boolean }) {
  return (
    <ThemedText variant="small" color="text" style={{ marginTop: primeiro ? 0 : spacing.md, marginBottom: spacing.xs }}>
      {texto}
    </ThemedText>
  );
}

function Chip({ ativo, texto, onPress }: { ativo: boolean; texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]}>
      <ThemedText variant="small" color={ativo ? 'primary' : 'textSecondary'}>{texto}</ThemedText>
    </Pressable>
  );
}

const styles = estilosTema(() => ({
  card: { padding: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xl },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  linha: { flexDirection: 'row', alignItems: 'center' },
  input: { textAlign: 'left' },
  inputErro: { borderColor: colors.error },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  botaoFoto: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.border },
  fotoRemover: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  caixaGramas: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  sugestoes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  sugTitulo: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  sugestao: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  total: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  passo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  excluir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
}));
