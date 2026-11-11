import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Plus, Star, X } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import type { ChaveTraducao } from '@/i18n/traducoes/pt-BR';
import { colors, spacing, radius } from '@constants/colors';
import type { SerieRealizada, Exercicio } from '@/types/fitness';
import {
  dataISO,
  estimativa1RM,
  melhor1RMAnterior,
  metaDoExercicio,
  MetaExercicio,
  pesoDeExibicao,
  pesoParaExibir,
  ultimasSeriesDoExercicio,
} from '@utils/fitnessLogica';

const RIR_CORES = ['#C0392B', '#E67E22', '#F1C40F', '#7DCEA0', '#2E86C1'];

/** Campo numérico que aceita vírgula ou ponto no meio da digitação (ex.: "62,"). */
function CampoNumero({ valor, onChange, decimal = false, largura }: { valor: number | undefined; onChange: (v: number | undefined) => void; decimal?: boolean; largura?: number }) {
  const [texto, setTexto] = useState(valor !== undefined ? String(valor) : '');
  useEffect(() => {
    const atual = parseFloat(texto.replace(',', '.'));
    if (valor !== atual && !(valor === undefined && texto === '')) {
      setTexto(valor !== undefined ? String(valor) : '');
    }
    // sincroniza só quando o valor externo muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  return (
    <View style={{ flex: 1, width: largura }}>
      <Input
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        value={texto}
        onChangeText={(v) => {
          const limpo = decimal ? v.replace(/[^0-9.,]/g, '') : v.replace(/[^0-9]/g, '');
          setTexto(limpo);
          if (limpo === '' || limpo === '.' || limpo === ',') {
            onChange(undefined);
            return;
          }
          const n = parseFloat(limpo.replace(',', '.'));
          onChange(Number.isFinite(n) ? n : undefined);
        }}
      />
    </View>
  );
}

export default function ExecutarTreino() {
  const { t, idioma } = usePreferences();
  const router = useRouter();
  const { id, data: dataRetro, duracao } = useLocalSearchParams<{ id: string; data?: string; duracao?: string }>();
  const { rotinas, sessoes, pesagens, config, exercicios, favoritos, exercicioPorId, registrarSessao, loading } = useFitness();

  const retro = !!dataRetro;
  const livre = id === 'livre';
  const rotina = livre ? undefined : rotinas.find((r) => r.id === id);
  const nomeSessao = livre ? t('fitness.treinoLivre') : rotina?.nome ?? '';

  const inicioRef = useRef(new Date().toISOString());
  const [series, setSeries] = useState<SerieRealizada[]>([]);
  const [metas, setMetas] = useState<Record<string, MetaExercicio>>({});
  const [montado, setMontado] = useState(false);
  const [pesoCorpo, setPesoCorpo] = useState<number | undefined>(undefined);
  const [minutos, setMinutos] = useState(duracao ?? '60');
  const [descanso, setDescanso] = useState<{ restante: number } | null>(null);
  const [recordes, setRecordes] = useState<string[]>([]);
  const [adicionando, setAdicionando] = useState(false);
  const [busca, setBusca] = useState('');
  const unidade = config.unidade;
  const incremento = config.incrementoKg;

  const ultimoPeso = pesagens[0]?.kg;

  // monta as séries quando os dados carregam
  useEffect(() => {
    if (loading || montado) return;
    if (!livre && !rotina) return;
    const novas: SerieRealizada[] = [];
    const novasMetas: Record<string, MetaExercicio> = {};
    if (rotina) {
      for (const ex of rotina.exercicios) {
        const tipo = exercicioPorId(ex.exercicioId)?.tipo ?? 'carga';
        const ultimas = ultimasSeriesDoExercicio(sessoes, ex.exercicioId);
        const meta = metaDoExercicio(ex, tipo, ultimas, incremento);
        novasMetas[ex.exercicioId] = meta;
        for (let n = 1; n <= meta.series; n++) {
          novas.push({ exercicioId: ex.exercicioId, numero: n, tipo: 'trabalho', repeticoes: meta.repsAlvo, cargaKg: meta.cargaKg, feita: false });
        }
      }
    }
    setSeries(novas);
    setMetas(novasMetas);
    setPesoCorpo(ultimoPeso);
    setMontado(true);
  }, [loading, montado, livre, rotina, sessoes, exercicioPorId, incremento, ultimoPeso]);

  // descanso: contagem regressiva
  useEffect(() => {
    if (!descanso) return;
    if (descanso.restante <= 0) {
      setDescanso(null);
      return;
    }
    const timer = setTimeout(() => setDescanso({ restante: descanso.restante - 1 }), 1000);
    return () => clearTimeout(timer);
  }, [descanso]);

  // mantém a tela acesa durante o treino (quando o navegador/celular permite)
  useEffect(() => {
    if (!config.manterTelaLigada) return;
    const nav = (globalThis as unknown as { navigator?: { wakeLock?: { request: (tipo: string) => Promise<{ release: () => Promise<void> }> } } }).navigator;
    let trava: { release: () => Promise<void> } | undefined;
    nav?.wakeLock?.request('screen').then((l) => (trava = l)).catch(() => {});
    return () => {
      void trava?.release().catch(() => {});
    };
  }, [config.manterTelaLigada]);

  const pesoExercicios = useMemo(() => {
    const ordem: string[] = [];
    for (const s of series) if (!ordem.includes(s.exercicioId)) ordem.push(s.exercicioId);
    return ordem;
  }, [series]);

  if (!livre && !rotina && !loading) {
    return (
      <TelaRolavel>
        <ThemedView style={styles.container}>
          <ThemedText variant="body" color="textSecondary">{t('fitness.semTreinos')}</ThemedText>
        </ThemedView>
      </TelaRolavel>
    );
  }

  function atualizarSerie(indice: number, parcial: Partial<SerieRealizada>) {
    setSeries((atual) => atual.map((s, i) => (i === indice ? { ...s, ...parcial } : s)));
  }

  function alternarFeita(indice: number) {
    const s = series[indice];
    const marcando = !s.feita;
    atualizarSerie(indice, { feita: marcando });
    if (!marcando) return;

    if (s.tipo === 'trabalho') {
      const plano = rotina?.exercicios.find((e) => e.exercicioId === s.exercicioId);
      setDescanso({ restante: plano?.descansoSeg ?? 90 });
      const e = estimativa1RM(s.cargaKg ?? 0, s.repeticoes);
      const anterior = melhor1RMAnterior(sessoes, s.exercicioId);
      if (e !== undefined && anterior !== undefined && e > anterior) {
        setRecordes((r) => (r.includes(s.exercicioId) ? r : [...r, s.exercicioId]));
      }
    }
  }

  function ciclarRir(indice: number) {
    const atual = series[indice].rir;
    const proximo = atual === undefined ? 0 : atual >= 4 ? undefined : atual + 1;
    atualizarSerie(indice, { rir: proximo });
  }

  function adicionarSerie(exercicioId: string, tipo: SerieRealizada['tipo']) {
    setSeries((atual) => {
      const doEx = atual.filter((s) => s.exercicioId === exercicioId);
      const ultimaPosicao = atual.map((s) => s.exercicioId).lastIndexOf(exercicioId);
      const trabalho = doEx.filter((s) => s.tipo === 'trabalho');
      const base = tipo === 'aquecimento'
        ? { repeticoes: 8, cargaKg: trabalho[0]?.cargaKg !== undefined ? Math.round((trabalho[0].cargaKg * 0.5) * 10) / 10 : undefined }
        : { repeticoes: trabalho[trabalho.length - 1]?.repeticoes ?? 10, cargaKg: trabalho[trabalho.length - 1]?.cargaKg };
      const nova: SerieRealizada = {
        exercicioId,
        numero: doEx.filter((s) => s.tipo === tipo).length + 1,
        tipo,
        repeticoes: base.repeticoes,
        cargaKg: base.cargaKg,
        feita: false,
      };
      const copia = [...atual];
      copia.splice(ultimaPosicao + 1, 0, nova);
      return copia;
    });
  }

  function removerSerie(indice: number) {
    setSeries((atual) => atual.filter((_, i) => i !== indice));
  }

  function removerExercicio(exercicioId: string) {
    setSeries((atual) => atual.filter((s) => s.exercicioId !== exercicioId));
  }

  function adicionarExercicioLivre(ex: Exercicio) {
    const ultimas = ultimasSeriesDoExercicio(sessoes, ex.id);
    const novas: SerieRealizada[] = ultimas && ultimas.length > 0
      ? ultimas.map((s, i) => ({ exercicioId: ex.id, numero: i + 1, tipo: 'trabalho', repeticoes: s.repeticoes, cargaKg: s.cargaKg, feita: false }))
      : [1, 2, 3].map((n) => ({ exercicioId: ex.id, numero: n, tipo: 'trabalho' as const, repeticoes: ex.tipo === 'tempo' ? 30 : 10, feita: false }));
    setSeries((atual) => [...atual, ...novas]);
    setAdicionando(false);
    setBusca('');
  }

  function formatarCarga(kg: number | undefined): string {
    return kg === undefined ? '' : String(pesoParaExibir(kg, unidade));
  }

  function montarSessao(): Omit<Parameters<typeof registrarSessao>[0], 'id'> {
    const inicio = retro
      ? new Date(`${dataRetro}T12:00:00`).toISOString()
      : inicioRef.current;
    const fim = retro
      ? new Date(new Date(inicio).getTime() + (parseInt(minutos, 10) || 60) * 60000).toISOString()
      : new Date().toISOString();
    return {
      data: retro ? dataRetro! : dataISO(),
      rotinaId: rotina?.id,
      nome: nomeSessao,
      inicio,
      fim,
      pesoCorpoKg: pesoCorpo !== undefined ? pesoDeExibicao(pesoCorpo, unidade) : undefined,
      series,
    };
  }

  async function concluir() {
    if (!series.some((s) => s.feita)) {
      Alert.alert(t('fitness.concluirTreino'), t('fitness.semSeriesFeitas'));
      return;
    }
    const sessao = montarSessao();

    // registrar um treino passado no mesmo dia da mesma rotina: pergunta antes de duplicar
    const duplicada = retro
      ? sessoes.find((s) => s.data === dataRetro && s.rotinaId === rotina?.id)
      : undefined;
    if (duplicada) {
      Alert.alert(t('fitness.jaExisteTreino'), t('fitness.jaExisteTreinoAviso'), [
        { text: t('comum.cancelar'), style: 'cancel' },
        { text: t('fitness.manterAmbos'), onPress: () => void salvarERetornar(sessao) },
        { text: t('fitness.substituir'), style: 'destructive', onPress: () => void salvarERetornar({ ...sessao, id: duplicada.id } as Parameters<typeof registrarSessao>[0]) },
      ]);
      return;
    }
    await salvarERetornar(sessao);
  }

  async function salvarERetornar(sessao: Omit<Parameters<typeof registrarSessao>[0], 'id'> & { id?: string }) {
    await registrarSessao(sessao);
    router.replace('/fitness/historico');
  }

  function linhasDoExercicio(exercicioId: string) {
    return series
      .map((s, indice) => ({ s, indice }))
      .filter(({ s }) => s.exercicioId === exercicioId);
  }

  const emTempo = (exercicioId: string) => exercicioPorId(exercicioId)?.tipo === 'tempo';

  const resultadosBusca = exercicios
    .filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) => Number(favoritos.includes(b.id)) - Number(favoritos.includes(a.id)))
    .slice(0, 50);

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedText variant="heading" color="text">{nomeSessao}</ThemedText>

        {retro && (
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="small" color="textSecondary">{t('fitness.registroPassado')} · {dataRetro}</ThemedText>
            <View style={styles.linhaCampos}>
              <View style={{ flex: 1 }}>
                <ThemedText variant="small" color="textSecondary">{t('fitness.duracaoMin')}</ThemedText>
                <Input keyboardType="number-pad" value={minutos} onChangeText={(v) => setMinutos(v.replace(/[^0-9]/g, ''))} />
              </View>
            </View>
          </ThemedView>
        )}

        {(
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="small" color="textSecondary">{t('fitness.pesoCorpoHoje')} ({unidade})</ThemedText>
            <CampoNumero
              valor={pesoCorpo !== undefined ? pesoParaExibir(pesoCorpo, unidade) : undefined}
              decimal
              onChange={(v) => setPesoCorpo(v === undefined ? undefined : pesoDeExibicao(v, unidade))}
            />
          </ThemedView>
        )}

        {descanso && (
          <ThemedView variant="surface" style={styles.descanso}>
            <ThemedText variant="subheading" color="primary">
              {t('fitness.descansando')}: {descanso.restante}s
            </ThemedText>
            <Pressable onPress={() => setDescanso(null)} hitSlop={8}>
              <ThemedText variant="small" color="textSecondary">{t('fitness.pular')}</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {pesoExercicios.map((exercicioId) => {
          const ex = exercicioPorId(exercicioId);
          const meta = metas[exercicioId];
          const linhas = linhasDoExercicio(exercicioId);
          const tempo = emTempo(exercicioId);
          const recorde = recordes.includes(exercicioId);
          return (
            <ThemedView key={exercicioId} variant="surface" style={styles.card}>
              <View style={styles.linhaTopo}>
                <ThemedText variant="subheading" color="text" style={{ flex: 1 }}>
                  {ex?.nome ?? exercicioId}
                </ThemedText>
                {recorde && <ThemedText variant="small" color="primary">{t('fitness.recorde')}</ThemedText>}
                <Pressable onPress={() => removerExercicio(exercicioId)} hitSlop={8} accessibilityLabel={t('fitness.remover')} style={{ marginLeft: spacing.sm }}>
                  <X size={18} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>

              {meta && rotina && (
                <ThemedText variant="small" color="textSecondary">
                  {t('fitness.meta')}: {meta.series}× {meta.repsAlvo} {tempo ? 's' : ''}
                  {meta.cargaKg !== undefined ? ` · ${pesoParaExibir(meta.cargaKg, unidade)} ${unidade}` : ''}
                  {' · '}{t(chaveMotivo(meta.motivo))}
                </ThemedText>
              )}

              {linhas.map(({ s, indice }) => (
                <View key={`${exercicioId}-${indice}`} style={[styles.linhaSerie, s.feita && { opacity: 0.7 }, s.tipo === 'aquecimento' && { backgroundColor: colors.background }]}>
                  <ThemedText variant="small" color="textSecondary" style={{ width: 44 }}>
                    {s.tipo === 'aquecimento' ? t('fitness.aquecimentoCurto') : `${t('fitness.serieCurto')} ${s.numero}`}
                  </ThemedText>
                  <View style={{ width: 70 }}>
                    <CampoNumero valor={s.repeticoes} onChange={(v) => atualizarSerie(indice, { repeticoes: v ?? 0 })} />
                  </View>
                  {!tempo && (
                    <View style={{ width: 80 }}>
                      <CampoNumero
                        decimal
                        valor={s.cargaKg !== undefined ? pesoParaExibir(s.cargaKg, unidade) : undefined}
                        onChange={(v) => atualizarSerie(indice, { cargaKg: v === undefined ? undefined : pesoDeExibicao(v, unidade) })}
                      />
                    </View>
                  )}
                  <Pressable onPress={() => ciclarRir(indice)} style={[styles.rir, s.rir !== undefined && { backgroundColor: RIR_CORES[s.rir] }]} accessibilityLabel={t('fitness.rir')}>
                    <ThemedText variant="small" color={s.rir !== undefined ? 'text' : 'textSecondary'}>
                      {s.rir !== undefined ? `${s.rir}` : 'RIR'}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => alternarFeita(indice)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: s.feita }}
                    accessibilityLabel={t('fitness.feita')}
                    style={[styles.check, s.feita && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <Check size={16} color={s.feita ? colors.background : colors.textSecondary} strokeWidth={2.5} />
                  </Pressable>
                  <Pressable onPress={() => removerSerie(indice)} hitSlop={6} accessibilityLabel={t('fitness.remover')}>
                    <X size={14} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}

              <View style={styles.acoesExercicio}>
                <Pressable onPress={() => adicionarSerie(exercicioId, 'trabalho')} hitSlop={6} style={styles.acao}>
                  <Plus size={14} color={colors.primary} strokeWidth={2} />
                  <ThemedText variant="small" color="primary">{t('fitness.serie')}</ThemedText>
                </Pressable>
                {!tempo && (
                  <Pressable onPress={() => adicionarSerie(exercicioId, 'aquecimento')} hitSlop={6} style={styles.acao}>
                    <Plus size={14} color={colors.primary} strokeWidth={2} />
                    <ThemedText variant="small" color="primary">{t('fitness.aquecimento')}</ThemedText>
                  </Pressable>
                )}
              </View>
            </ThemedView>
          );
        })}

        {adicionando ? (
          <ThemedView variant="surface" style={styles.card}>
            <Input value={busca} onChangeText={setBusca} placeholder={t('fitness.buscarExercicio')} autoFocus />
            {resultadosBusca.map((ex) => (
              <Pressable key={ex.id} onPress={() => adicionarExercicioLivre(ex)} style={styles.itemBusca}>
                <ThemedText variant="body" color="text" style={{ flex: 1 }}>{ex.nome}</ThemedText>
                {favoritos.includes(ex.id) && <Star size={14} color={colors.accent} strokeWidth={2} fill={colors.accent} />}
              </Pressable>
            ))}
            <Button label={t('comum.fechar')} variant="outline" onPress={() => setAdicionando(false)} />
          </ThemedView>
        ) : (
          <Button label={t('fitness.adicionarExercicioAgora')} variant="outline" onPress={() => setAdicionando(true)} />
        )}

        <Button label={t('fitness.concluirTreino')} onPress={concluir} />
        <View style={{ height: spacing.xl }} />
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  linhaCampos: { flexDirection: 'row', gap: spacing.sm },
  linhaSerie: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.xs },
  rir: { width: 40, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  check: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  acoesExercicio: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  descanso: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.lg, padding: spacing.md },
  itemBusca: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
});

function chaveMotivo(motivo: MetaExercicio['motivo']): ChaveTraducao {
  switch (motivo) {
    case 'primeira':
      return 'fitness.motivo.primeira';
    case 'sobe':
      return 'fitness.motivo.sobe';
    case 'repsSobem':
      return 'fitness.motivo.repsSobem';
    case 'reinicia':
      return 'fitness.motivo.reinicia';
    case 'mantem':
      return 'fitness.motivo.mantem';
    case 'semProgressao':
      return 'fitness.motivo.semProgressao';
    case 'corpo':
      return 'fitness.motivo.corpo';
  }
}
