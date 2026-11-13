import { useEffect, useState } from 'react';
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
import { ItemRefeicao, TipoRefeicao, TIPOS_REFEICAO, tipoPeloHorario } from '@models/records';
import { AlimentoPor100g, PORCAO_PADRAO_G, valoresDaPorcao, somarNutrientes } from '@models/ingredients';
import { textoNutrientes, textoNutrientes100 } from '@utils/textoNutrientes';
import { AnaliseIAPrato } from '@components/AnaliseIAPrato';
import { Dica } from '@components/Dica';
import { dataDeHoje, horarioAgora } from '@utils/recordsStorage';
import { fotografarPrato, escolherFotoDaGaleria } from '@utils/fotosRefeicao';
import { colors, spacing, radius } from '@constants/colors';
import { SeletorHorario } from '@components/forms/SeletorHorario';
import { MensagemErro } from '@components/forms/MensagemErro';
import { estilosTema } from '@theme/estilos';
import { buscarPorNome } from '@utils/buscaAlimentos';
import {
  AlimentoSalvo,
  UNIDADES,
  UnidadeMedida,
  carregarAlimentosSalvos,
  gramasPadraoDaUnidade,
  marcarUso,
  naoPerguntarCompartilhar,
  nuncaCompartilhar,
  recentes,
  removerAlimento,
  salvarAlimento,
  unidadeDireta,
} from '@utils/alimentosSalvos';
import { enviarAlimentoParaEquipe } from '@utils/emailAlimento';

type Opcao = { tipo: 'por100'; alimento: AlimentoPor100g; rotulo: string; salvo?: AlimentoSalvo };

const arred = (n: number, casas = 0) => Math.round(n * 10 ** casas) / 10 ** casas;

export default function RefeicaoScreen() {
  const { t } = usePreferences();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; data?: string; tipo?: TipoRefeicao }>();
  const { refeicoes, salvarRefeicao, removerRefeicao } = useRecords();
  const { buscarReceitasPersonalizadas, receitasPersonalizadas } = useCustomRecipes();
  const existente = params.id ? refeicoes.find((r) => r.id === params.id) : undefined;

  const agora = horarioAgora();
  const numero = (txt: string) => parseFloat(txt.replace(',', '.'));
  const [tipo, setTipo] = useState<TipoRefeicao>(existente?.tipo ?? params.tipo ?? tipoPeloHorario(agora));
  const [tipoLivre, setTipoLivre] = useState(existente?.tipoPersonalizado ?? '');
  const [horario, setHorario] = useState(existente?.horario ?? agora);
  const [itens, setItens] = useState<ItemRefeicao[]>(
    existente?.itens ??
      (existente
        ? [{
            nome: existente.nome,
            kcal: existente.kcal,
            proteinaG: existente.proteinaG,
            carboidratoG: existente.carboidratoG,
            gorduraG: existente.gorduraG,
            fibraG: existente.fibraG,
          }]
        : [])
  );
  const [foto, setFoto] = useState<string | undefined>(existente?.fotoUri);
  const [obs, setObs] = useState(existente?.observacoes ?? '');
  const [lembrete, setLembrete] = useState(false);
  const [horasLembrete, setHorasLembrete] = useState(3);

  // busca de alimentos
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState<Opcao | null>(null);
  /** quantidade na medida escolhida (em g/ml, é a própria quantidade) */
  const [gramas, setGramas] = useState('');
  const [unidade, setUnidade] = useState<UnidadeMedida>('g');
  const [gPorUnidade, setGPorUnidade] = useState('');
  // alimentos digitados antes, guardados no aparelho
  const [salvos, setSalvos] = useState<AlimentoSalvo[]>([]);
  useEffect(() => {
    carregarAlimentosSalvos().then(setSalvos);
  }, []);
  // item digitado à mão
  const [manual, setManual] = useState(false);
  const [mNome, setMNome] = useState('');
  const [mKcal, setMKcal] = useState('');
  const [mProt, setMProt] = useState('');
  const [mCarb, setMCarb] = useState('');
  const [mGord, setMGord] = useState('');
  const [mFibra, setMFibra] = useState('');
  const [mQtd, setMQtd] = useState('1');
  const [mUnidade, setMUnidade] = useState<UnidadeMedida>('porcao');
  const [mGPorUnidade, setMGPorUnidade] = useState(String(gramasPadraoDaUnidade('porcao')));
  const [mSalvar, setMSalvar] = useState(true);

  const opcoes: Opcao[] = !busca.trim() || escolhido
    ? []
    : [
        ...buscarPorNome(salvos, busca, (a) => a.nome, 4).map((a) => ({ tipo: 'por100' as const, alimento: a, salvo: a, rotulo: t('alim.seuAlimento', { nome: a.nome }) })),
        ...buscarReceitasPersonalizadas(busca).map((r) => ({ tipo: 'por100' as const, alimento: r, rotulo: t('d.suaReceita', { nome: r.nome }) })),
        ...buscarIngredientes(busca, 6).map((i) => ({
          tipo: 'por100' as const,
          alimento: { ...i, porcaoPadraoG: i.gramaPadrao },
          rotulo: i.nome,
        })),
      ];
  // com a busca vazia, atalhos para as receitas salvas
  const atalhos = !busca.trim() && !escolhido ? receitasPersonalizadas.slice(-4).reverse() : [];
  const atalhosSalvos = !busca.trim() && !escolhido ? recentes(salvos, 6) : [];

  function escolher(o: Opcao) {
    setEscolhido(o);
    const u = o.salvo?.unidade ?? 'g';
    setUnidade(u);
    setGPorUnidade(String(o.salvo?.gramasPorUnidade ?? gramasPadraoDaUnidade(u, o.alimento.porcaoPadraoG)));
    setGramas(unidadeDireta(u) ? String(o.alimento.porcaoPadraoG ?? PORCAO_PADRAO_G) : '1');
  }

  function trocarUnidade(u: UnidadeMedida) {
    if (!escolhido) return;
    // ao trocar entre g/ml e uma medida caseira, recomeça com a porção padrão / 1 medida
    if (unidadeDireta(u) !== unidadeDireta(unidade)) {
      setGramas(unidadeDireta(u) ? String(escolhido.alimento.porcaoPadraoG ?? PORCAO_PADRAO_G) : '1');
    }
    setUnidade(u);
    const s = escolhido.salvo;
    setGPorUnidade(String(s && s.unidade === u ? s.gramasPorUnidade : gramasPadraoDaUnidade(u, escolhido.alimento.porcaoPadraoG)));
  }

  function trocarUnidadeManual(u: UnidadeMedida) {
    if (unidadeDireta(u) !== unidadeDireta(mUnidade)) setMQtd(unidadeDireta(u) ? '100' : '1');
    setMUnidade(u);
    setMGPorUnidade(String(gramasPadraoDaUnidade(u)));
  }

  /** gramas totais de `qtd` na medida `u` */
  const emGramas = (qtd: string, u: UnidadeMedida, porUn: string) =>
    unidadeDireta(u) ? numero(qtd) : numero(qtd) * numero(porUn);

  function confirmarEscolhido() {
    if (!escolhido) return;
    const g = arred(emGramas(gramas, unidade, gPorUnidade), 1);
    if (!(g > 0)) return;
    const a = escolhido.alimento;
    const medida = unidade === 'g' ? {} : { quantidade: numero(gramas), unidade };
    setItens((l) => [...l, { nome: a.nome, gramas: g, ...medida, ...valoresDaPorcao(a, g) }]);
    if (escolhido.salvo) marcarUso(escolhido.salvo.id).then(setSalvos);
    setEscolhido(null);
    setBusca('');
  }

  function excluirSalvo(a: AlimentoSalvo) {
    Alert.alert(t('alim.excluirTitulo', { nome: a.nome }), undefined, [
      { text: t('comum.cancelar'), style: 'cancel' },
      { text: t('alim.excluir'), style: 'destructive', onPress: () => removerAlimento(a.id).then(setSalvos) },
    ]);
  }

  /** Só para alimentos novos: pergunta se pode mandar à equipe revisar e incluir no banco */
  async function oferecerCompartilhar(a: AlimentoSalvo) {
    if (await naoPerguntarCompartilhar()) return;
    Alert.alert(t('alim.compartilharTitulo'), t('alim.compartilharMsg', { nome: a.nome }), [
      // na web as ações viram perguntas em sequência: Enviar? → Não perguntar mais? → (agora não)
      { text: t('alim.agoraNao'), style: 'cancel' },
      { text: t('alim.enviar'), onPress: () => enviarAlimentoParaEquipe(a) },
      { text: t('alim.nuncaPerguntar'), onPress: () => nuncaCompartilhar() },
    ]);
  }

  async function adicionarManual() {
    const kcal = parseFloat(mKcal.replace(',', '.'));
    if (!mNome.trim() || !(kcal >= 0)) return;
    const opcional = (txt: string) => (txt.trim() ? arred(parseFloat(txt.replace(',', '.')) || 0, 1) : undefined);
    const g = arred(emGramas(mQtd, mUnidade, mGPorUnidade), 1);
    const item: ItemRefeicao = {
      nome: mNome.trim(),
      ...(g > 0 ? { gramas: g } : {}),
      ...(g > 0 && mUnidade !== 'g' ? { quantidade: numero(mQtd), unidade: mUnidade } : {}),
      kcal: arred(kcal),
      proteinaG: arred(parseFloat(mProt.replace(',', '.')) || 0, 1),
      carboidratoG: opcional(mCarb),
      gorduraG: opcional(mGord),
      fibraG: opcional(mFibra),
    };
    setItens((l) => [...l, item]);
    if (mSalvar && g > 0) {
      // guarda por 100 g, para servir a qualquer quantidade da próxima vez
      const por100 = (v: number | undefined) => (v == null ? undefined : arred((v * 100) / g, 1));
      const { lista, novo } = await salvarAlimento({
        nome: item.nome,
        kcalPor100g: arred((item.kcal * 100) / g),
        proteinaGPor100g: por100(item.proteinaG) ?? 0,
        carboidratoGPor100g: por100(item.carboidratoG),
        gorduraGPor100g: por100(item.gorduraG),
        fibraGPor100g: por100(item.fibraG),
        porcaoPadraoG: unidadeDireta(mUnidade) ? g : numero(mGPorUnidade),
        unidade: mUnidade,
        gramasPorUnidade: unidadeDireta(mUnidade) ? 1 : numero(mGPorUnidade),
      });
      setSalvos(lista);
      const salvo = lista.find((a) => a.nome === item.nome);
      if (novo && salvo) oferecerCompartilhar(salvo);
    }
    setMNome('');
    setMKcal('');
    setMProt('');
    setMCarb('');
    setMGord('');
    setMFibra('');
    setMQtd(unidadeDireta(mUnidade) ? '100' : '1');
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
  }

  const total = somarNutrientes(itens);
  const gramasEscolhido = emGramas(gramas, unidade, gPorUnidade);
  const erroGramas =
    gramas.trim() && !(numero(gramas) > 0 && gramasEscolhido > 0 && gramasEscolhido <= 5000) ? t('form.erroGramas') : null;
  const gramasManual = emGramas(mQtd, mUnidade, mGPorUnidade);
  const erroManualQtd = mQtd.trim() && !(gramasManual > 0 && gramasManual <= 5000) ? t('form.erroGramas') : null;
  const erroManualKcal = mKcal.trim() && !(numero(mKcal) >= 0 && numero(mKcal) <= 5000) ? t('form.erroNumero') : null;
  const erroManualProt = mProt.trim() && !(numero(mProt) >= 0 && numero(mProt) <= 500) ? t('form.erroNumero') : null;
  const erroManualCarb = mCarb.trim() && !(numero(mCarb) >= 0 && numero(mCarb) <= 1000) ? t('form.erroNumero') : null;
  const erroManualGord = mGord.trim() && !(numero(mGord) >= 0 && numero(mGord) <= 500) ? t('form.erroNumero') : null;
  const erroManualFibra = mFibra.trim() && !(numero(mFibra) >= 0 && numero(mFibra) <= 200) ? t('form.erroNumero') : null;
  const erroManual = erroManualKcal || erroManualProt || erroManualCarb || erroManualGord || erroManualFibra || erroManualQtd;

  async function handleSalvar() {
    if (itens.length === 0 && !foto) {
      Alert.alert(t('ref.precisaItem'));
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
        proteinaG: total.proteinaG,
        carboidratoG: total.carboidratoG,
        gorduraG: total.gorduraG,
        fibraG: total.fibraG,
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
        <SeletorHorario valor={horario} onChange={setHorario} />
      </ThemedView>

      <Dica id="ref.foto" texto="dica.foto" />

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
            <AnaliseIAPrato fotoUri={foto} onAdicionar={(novos) => setItens((l) => [...l, ...novos])} />
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
                {i.gramas ? <ThemedText variant="small" color="textSecondary">{`  ${rotuloQuantidade(t, i)}`}</ThemedText> : null}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                {textoNutrientes(t, i)}
              </ThemedText>
            </View>
            <Pressable onPress={() => setItens((l) => l.filter((_, k) => k !== idx))} hitSlop={8}>
              <X size={16} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>
        ))}

        {escolhido ? (
          <View style={styles.caixaGramas}>
            <ThemedText variant="body" color="text">{escolhido.alimento.nome}</ThemedText>
            <SeletorMedida valor={unidade} onChange={trocarUnidade} />
            <View style={[styles.linha, { marginTop: spacing.sm }]}>
              <Input
                value={gramas}
                onChangeText={setGramas}
                keyboardType="decimal-pad"
                autoFocus
                style={[styles.input, { width: 80 }, erroGramas && styles.inputErro]}
              />
              <ThemedText variant="body" color="textSecondary" style={{ marginHorizontal: spacing.sm }}>{t(`un.${unidade}` as never)}</ThemedText>
              <View style={{ flex: 1 }} />
              <Button label={t('ref.incluir')} size="sm" onPress={confirmarEscolhido} disabled={!gramas.trim() || !!erroGramas} />
              <Pressable onPress={() => setEscolhido(null)} style={{ marginLeft: spacing.md }} hitSlop={8}>
                <X size={18} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
            {!unidadeDireta(unidade) && (
              <GramasPorMedida unidade={unidade} valor={gPorUnidade} onChange={setGPorUnidade} />
            )}
            {!erroGramas && gramasEscolhido > 0 && (
              <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>
                {`${arred(gramasEscolhido, 1)} ${unidade === 'ml' ? 'ml' : 'g'} · `}
                {textoNutrientes(t, valoresDaPorcao(escolhido.alimento, gramasEscolhido))}
              </ThemedText>
            )}
            <MensagemErro texto={erroGramas} />
          </View>
        ) : manual ? (
          <View style={styles.caixaGramas}>
            <Input value={mNome} onChangeText={setMNome} placeholder={t('ref.manualNome')} style={styles.input} />
            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>{t('alim.quantoComeu')}</ThemedText>
            <SeletorMedida valor={mUnidade} onChange={trocarUnidadeManual} />
            <View style={[styles.linha, { marginTop: spacing.xs }]}>
              <Input value={mQtd} onChangeText={setMQtd} keyboardType="decimal-pad" style={[styles.input, { width: 80 }, erroManualQtd && styles.inputErro]} />
              <ThemedText variant="body" color="textSecondary" style={{ marginHorizontal: spacing.sm }}>{t(`un.${mUnidade}` as never)}</ThemedText>
            </View>
            {!unidadeDireta(mUnidade) && <GramasPorMedida unidade={mUnidade} valor={mGPorUnidade} onChange={setMGPorUnidade} />}
            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>{t('alim.valoresDaQtd')}</ThemedText>
            <View style={[styles.linha, { gap: spacing.xs, marginTop: spacing.xs }]}>
              <Input value={mKcal} onChangeText={setMKcal} placeholder="kcal" keyboardType="decimal-pad" style={[styles.input, { flex: 1 }, erroManualKcal && styles.inputErro]} />
              <Input value={mProt} onChangeText={setMProt} placeholder={t('ref.protG')} keyboardType="decimal-pad" style={[styles.input, { flex: 1 }, erroManualProt && styles.inputErro]} />
              <Input value={mCarb} onChangeText={setMCarb} placeholder={t('ref.carbG')} keyboardType="decimal-pad" style={[styles.input, { flex: 1 }, erroManualCarb && styles.inputErro]} />
            </View>
            <View style={[styles.linha, { gap: spacing.xs, marginTop: spacing.xs }]}>
              <Input value={mGord} onChangeText={setMGord} placeholder={t('ref.gordG')} keyboardType="decimal-pad" style={[styles.input, { flex: 1 }, erroManualGord && styles.inputErro]} />
              <Input value={mFibra} onChangeText={setMFibra} placeholder={t('ref.fibraG')} keyboardType="decimal-pad" style={[styles.input, { flex: 1 }, erroManualFibra && styles.inputErro]} />
              <View style={{ flex: 1 }} />
            </View>
            <MensagemErro texto={erroManual || null} />
            <View style={[styles.linha, { marginTop: spacing.sm }]}>
              <ThemedText variant="small" color="textSecondary" style={{ flex: 1 }}>{t('alim.salvarParaDepois')}</ThemedText>
              <Switch
                value={mSalvar}
                onValueChange={setMSalvar}
                trackColor={{ true: colors.primary, false: colors.border }}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>
            <View style={[styles.linha, { marginTop: spacing.sm }]}>
              <Button label={t('ref.incluir')} size="sm" onPress={adicionarManual} disabled={!mNome.trim() || !mKcal || !!erroManual} />
              <Pressable onPress={() => setManual(false)} style={{ marginLeft: spacing.md }}>
                <ThemedText variant="small" color="textSecondary">{t('comum.cancelar')}</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Input value={busca} onChangeText={setBusca} placeholder={t('ref.buscarPh')} style={[styles.input, { marginTop: spacing.md }]} />
            {(opcoes.length > 0 || atalhos.length > 0 || atalhosSalvos.length > 0) && (
              <View style={styles.sugestoes}>
                {atalhosSalvos.length > 0 && (
                  <ThemedText variant="caption" color="textSecondary" style={styles.sugTitulo}>{t('alim.meusAlimentos')}</ThemedText>
                )}
                {atalhosSalvos.map((a) => (
                  <View key={`sv-${a.id}`} style={[styles.sugestao, styles.linha]}>
                    <Pressable style={{ flex: 1 }} onPress={() => escolher({ tipo: 'por100', alimento: a, salvo: a, rotulo: a.nome })}>
                      <ThemedText variant="small" color="text">{a.nome}</ThemedText>
                      <ThemedText variant="caption" color="textSecondary">{textoNutrientes100(t, a)}</ThemedText>
                    </Pressable>
                    <Pressable onPress={() => excluirSalvo(a)} hitSlop={8} style={{ marginLeft: spacing.sm }}>
                      <Trash2 size={14} color={colors.textSecondary} strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}
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
                    <ThemedText variant="caption" color="textSecondary">{textoNutrientes100(t, o.alimento)}</ThemedText>
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
              {t('ref.totalNut', { valores: textoNutrientes(t, total) })}
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Observações */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <Rotulo texto={t('med.obs')} primeiro />
        <Input value={obs} onChangeText={setObs} placeholder={t('ref.obsPh')} multiline style={[styles.input, { minHeight: 56 }]} />
      </ThemedView>

      {/* Lembrete da próxima refeição: discreto, só o interruptor até ser ligado */}
      <View style={styles.lembrete}>
        <View style={styles.linha}>
          <ThemedText variant="small" color="textSecondary" style={{ flex: 1 }}>{t('ref.lembrete')}</ThemedText>
          <Switch
            value={lembrete}
            onValueChange={setLembrete}
            trackColor={{ true: colors.primary, false: colors.border }}
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        </View>
        {lembrete && (
          <View style={[styles.linha, { marginTop: spacing.xs }]}>
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
      </View>

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

type Traduzir = ReturnType<typeof usePreferences>['t'];

/** "2 colher de sopa (30 g)" ou "150 g" */
function rotuloQuantidade(t: Traduzir, i: ItemRefeicao) {
  const u = i.unidade as UnidadeMedida | undefined;
  if (!u || i.quantidade == null) return `${i.gramas} g`;
  if (u === 'ml') return `${i.quantidade} ml`;
  return `${i.quantidade} ${t(`un.${u}` as never)} (${i.gramas} g)`;
}

/** Chips com as medidas: g, ml, unidade, porção, fatia, colheres, xícara, copo */
function SeletorMedida({ valor, onChange }: { valor: UnidadeMedida; onChange: (u: UnidadeMedida) => void }) {
  const { t } = usePreferences();
  return (
    <View style={[styles.chips, { marginTop: spacing.sm }]}>
      {UNIDADES.map((u) => (
        <Chip key={u} ativo={valor === u} texto={t(`un.${u}` as never)} onPress={() => onChange(u)} />
      ))}
    </View>
  );
}

/** "1 colher de sopa = [15] g": a pessoa ajusta o peso da medida caseira */
function GramasPorMedida({ unidade, valor, onChange }: { unidade: UnidadeMedida; valor: string; onChange: (v: string) => void }) {
  const { t } = usePreferences();
  return (
    <View style={[styles.linha, { marginTop: spacing.xs }]}>
      <ThemedText variant="small" color="textSecondary">{t('alim.umaMedida', { u: t(`un.${unidade}` as never) })}</ThemedText>
      <Input value={valor} onChangeText={onChange} keyboardType="decimal-pad" style={[styles.input, { width: 70, marginHorizontal: spacing.xs }]} />
      <ThemedText variant="small" color="textSecondary">g</ThemedText>
    </View>
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
  lembrete: { paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
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
