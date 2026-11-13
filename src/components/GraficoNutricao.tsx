import { useEffect, useMemo, useState } from 'react';
import { View, Pressable, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Polyline, Circle, Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { SeletorData } from '@components/forms/SeletorData';
import { useRecords } from '@context/RecordsContext';
import { useDiabetes } from '@context/DiabetesContext';
import { usePreferences } from '@context/PreferencesContext';
import { TIPOS_REFEICAO, TipoRefeicao } from '@models/records';
import { dataDeHoje } from '@utils/recordsStorage';
import {
  Agrupamento,
  METRICAS,
  Metrica,
  agrupamentoSugerido,
  calcularInfluencias,
  dataDeIso,
  forcaDaRelacao,
  isoDe,
  montarSerie,
  somarDias,
} from '@utils/analiseNutricao';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const CHAVE_CONFIG = 'levia:grafico_nutricao';
const PERIODOS = ['7', '30', '90', '365', 'personalizado'] as const;
type Periodo = (typeof PERIODOS)[number];

interface Config {
  periodo: Periodo;
  /** só no personalizado */
  inicio?: string;
  fim?: string;
  /** null = automático pelo tamanho do período */
  agrupamento: Agrupamento | null;
  /** null = todas as refeições */
  tipos: TipoRefeicao[] | null;
  metricas: Metrica[];
  peso: boolean;
  glicemia: boolean;
}

const CONFIG_PADRAO: Config = { periodo: '30', agrupamento: null, tipos: null, metricas: ['kcal', 'carboidratoG'], peso: true, glicemia: true };

const corDa = (m: Metrica | 'peso' | 'glicemia') =>
  ({
    kcal: colors.primary,
    carboidratoG: colors.secondary,
    proteinaG: colors.accent,
    fibraG: colors.success,
    gorduraG: colors.warning,
    aguaMl: '#4A90C2',
    peso: colors.text,
    glicemia: colors.error,
  })[m];

const unidadeDa = (m: Metrica) => (m === 'kcal' ? 'kcal' : m === 'aguaMl' ? 'ml' : 'g');

/**
 * Gráfico configurável da alimentação: período, agrupamento, refeições e
 * nutrientes à escolha, com peso e glicemia no mesmo eixo de tempo e um
 * resumo do que andou junto com eles. A configuração fica salva no aparelho.
 */
export function GraficoNutricao() {
  const { t, idioma } = usePreferences();
  const { refeicoes, aguas, pesos } = useRecords();
  const { glicemias } = useDiabetes();
  const [cfg, setCfg] = useState<Config>(CONFIG_PADRAO);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_CONFIG)
      .then((raw) => raw && setCfg({ ...CONFIG_PADRAO, ...JSON.parse(raw) }))
      .catch(() => {});
  }, []);

  function mudar(m: Partial<Config>) {
    setCfg((c) => {
      const novo = { ...c, ...m };
      AsyncStorage.setItem(CHAVE_CONFIG, JSON.stringify(novo)).catch(() => {});
      return novo;
    });
  }

  const hoje = dataDeHoje();
  const fim = cfg.periodo === 'personalizado' ? cfg.fim ?? hoje : hoje;
  const inicioCustom = cfg.inicio ?? somarDias(hoje, -29);
  const inicio = cfg.periodo === 'personalizado' ? (inicioCustom <= fim ? inicioCustom : fim) : somarDias(hoje, -(Number(cfg.periodo) - 1));
  const totalDias = Math.round((dataDeIso(fim).getTime() - dataDeIso(inicio).getTime()) / 86_400_000) + 1;
  const agrupamento = cfg.agrupamento ?? agrupamentoSugerido(totalDias);

  const baldes = useMemo(
    () => montarSerie({ refeicoes, aguas, pesos, glicemias, inicio, fim, agrupamento, tipos: cfg.tipos }),
    [refeicoes, aguas, pesos, glicemias, inicio, fim, agrupamento, cfg.tipos]
  );
  const influencias = useMemo(() => calcularInfluencias(baldes, cfg.metricas), [baldes, cfg.metricas]);

  const rotulo = (iso: string) => {
    try {
      return dataDeIso(iso).toLocaleDateString(idioma, agrupamento === 'mes' ? { month: 'short', year: '2-digit' } : { day: '2-digit', month: '2-digit' });
    } catch {
      return iso.slice(5);
    }
  };
  const rotulos = baldes.map((b) => rotulo(b.inicio));

  const alternarTipo = (tp: TipoRefeicao) => {
    const atual = cfg.tipos ?? [];
    const novo = atual.includes(tp) ? atual.filter((x) => x !== tp) : [...atual, tp];
    mudar({ tipos: novo.length ? novo : null });
  };
  const alternarMetrica = (m: Metrica) => {
    const novo = cfg.metricas.includes(m) ? cfg.metricas.filter((x) => x !== m) : [...cfg.metricas, m];
    mudar({ metricas: METRICAS.filter((x) => novo.includes(x)) });
  };

  const pesosSerie = baldes.map((b) => b.pesoKg);
  const glicSerie = baldes.map((b) => b.glicemiaMgDl);
  const comPeso = pesosSerie.filter((v) => v != null) as number[];
  const variacaoPeso = comPeso.length >= 2 ? Math.round((comPeso[comPeso.length - 1] - comPeso[0]) * 10) / 10 : null;

  return (
    <View>
      {/* Configuração */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <Rotulo texto={t('gn.periodo')} primeiro />
        <View style={styles.chips}>
          {PERIODOS.map((p) => (
            <Chip key={p} ativo={cfg.periodo === p} texto={t(`gn.periodo.${p}` as never)} onPress={() => mudar({ periodo: p })} />
          ))}
        </View>
        {cfg.periodo === 'personalizado' && (
          <View style={{ marginTop: spacing.sm }}>
            <ThemedText variant="caption" color="textSecondary">{t('gn.de')}</ThemedText>
            <SeletorData valor={dataDeIso(inicio)} onChange={(d) => mudar({ inicio: isoDe(d) })} />
            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>{t('gn.ate')}</ThemedText>
            <SeletorData valor={dataDeIso(fim)} onChange={(d) => mudar({ fim: isoDe(d) > hoje ? hoje : isoDe(d) })} />
          </View>
        )}

        <Rotulo texto={t('gn.agrupar')} />
        <View style={styles.chips}>
          <Chip ativo={cfg.agrupamento === null} texto={t('gn.auto')} onPress={() => mudar({ agrupamento: null })} />
          {(['dia', 'semana', 'mes'] as const).map((a) => (
            <Chip key={a} ativo={cfg.agrupamento === a} texto={t(`gn.ag.${a}` as never)} onPress={() => mudar({ agrupamento: a })} />
          ))}
        </View>

        <Rotulo texto={t('gn.refeicoes')} />
        <View style={styles.chips}>
          <Chip ativo={cfg.tipos === null} texto={t('gn.todas')} onPress={() => mudar({ tipos: null })} />
          {TIPOS_REFEICAO.map((tp) => (
            <Chip key={tp} ativo={!!cfg.tipos?.includes(tp)} texto={t(`ref.tipo.${tp}` as never)} onPress={() => alternarTipo(tp)} />
          ))}
        </View>

        <Rotulo texto={t('gn.comparar')} />
        <View style={styles.chips}>
          {METRICAS.map((m) => (
            <Chip key={m} ativo={cfg.metricas.includes(m)} cor={corDa(m)} texto={t(`gn.m.${m}` as never)} onPress={() => alternarMetrica(m)} />
          ))}
        </View>

        <Rotulo texto={t('gn.efeitos')} />
        <View style={styles.chips}>
          <Chip ativo={cfg.peso} cor={corDa('peso')} texto={t('gn.peso')} onPress={() => mudar({ peso: !cfg.peso })} />
          <Chip ativo={cfg.glicemia} cor={corDa('glicemia')} texto={t('gn.glicemia')} onPress={() => mudar({ glicemia: !cfg.glicemia })} />
        </View>
      </ThemedView>

      {/* Gráficos, todos no mesmo eixo de tempo */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <ThemedText variant="caption" color="textSecondary">
          {t('gn.legendaMedia', { ag: t(`gn.ag.${agrupamento}` as never).toLowerCase() })}
          {cfg.tipos ? ` · ${cfg.tipos.map((tp) => t(`ref.tipo.${tp}` as never)).join(', ')}` : ''}
        </ThemedText>
        {cfg.metricas.length === 0 && !cfg.peso && !cfg.glicemia && (
          <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.md }}>{t('gn.escolhaAlgo')}</ThemedText>
        )}
        {cfg.metricas.map((m) => (
          <MiniGrafico
            key={m}
            titulo={t(`gn.m.${m}` as never)}
            unidade={unidadeDa(m)}
            valores={baldes.map((b) => b.valores[m])}
            rotulos={rotulos}
            cor={corDa(m)}
            tipo="barra"
          />
        ))}
        {cfg.peso && (
          <MiniGrafico
            titulo={variacaoPeso != null ? t('gn.pesoVariacao', { v: `${variacaoPeso > 0 ? '+' : ''}${variacaoPeso}` }) : t('gn.peso')}
            unidade="kg"
            valores={pesosSerie}
            rotulos={rotulos}
            cor={corDa('peso')}
            tipo="linha"
          />
        )}
        {cfg.glicemia && (
          <MiniGrafico titulo={t('gn.glicemia')} unidade="mg/dL" valores={glicSerie} rotulos={rotulos} cor={corDa('glicemia')} tipo="linha" />
        )}
      </ThemedView>

      {/* O que andou junto com peso e glicemia */}
      {cfg.metricas.length > 0 && (cfg.peso || cfg.glicemia) && (
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">{t('gn.influenciaTitulo')}</ThemedText>
          {influencias.map((inf) => (
            <View key={inf.metrica} style={styles.influencia}>
              <ThemedText variant="small" color="text">{t(`gn.m.${inf.metrica}` as never)}</ThemedText>
              {cfg.glicemia && <FraseRelacao alvo={t('gn.glicemia')} rel={inf.glicemia} />}
              {cfg.peso && <FraseRelacao alvo={t('gn.variacaoPeso')} rel={inf.peso} />}
            </View>
          ))}
          <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.md }}>{t('gn.avisoCorrelacao')}</ThemedText>
        </ThemedView>
      )}
    </View>
  );
}

function FraseRelacao({ alvo, rel }: { alvo: string; rel: { r: number; n: number } | null }) {
  const { t } = usePreferences();
  if (!rel) {
    return <ThemedText variant="caption" color="textSecondary">{t('gn.semDadosRelacao', { alvo: alvo.toLowerCase() })}</ThemedText>;
  }
  const forca = forcaDaRelacao(rel.r);
  const chave = forca === 'fraca' ? 'gn.relFraca' : rel.r > 0 ? 'gn.relSobe' : 'gn.relDesce';
  return (
    <ThemedText variant="caption" color="textSecondary">
      {t(chave, { alvo: alvo.toLowerCase(), forca: t(`gn.forca.${forca}` as never), r: rel.r.toFixed(2), n: rel.n })}
    </ThemedText>
  );
}

const ALTURA = 110;

/** Barras (nutrientes) ou linha (peso, glicemia) de uma série; grupos sem dado ficam vazios */
function MiniGrafico({
  titulo,
  unidade,
  valores,
  rotulos,
  cor,
  tipo,
}: {
  titulo: string;
  unidade: string;
  valores: (number | null)[];
  rotulos: string[];
  cor: string;
  tipo: 'barra' | 'linha';
}) {
  const { t } = usePreferences();
  const [largura, setLargura] = useState(0);
  const existentes = valores.filter((v): v is number => v != null);
  const n = valores.length;
  const media = existentes.length ? existentes.reduce((s, v) => s + v, 0) / existentes.length : null;
  const casas = unidade === 'kcal' || unidade === 'ml' || unidade === 'mg/dL' ? 1 : 10;
  const fmt = (v: number) => String(Math.round(v * casas) / casas);

  const max = existentes.length ? Math.max(...existentes) : 0;
  const min = existentes.length ? Math.min(...existentes) : 0;
  // barras partem do zero; linhas usam a faixa dos dados, com folga
  const base = tipo === 'barra' ? 0 : min - (max - min || 1) * 0.15;
  const topo = tipo === 'barra' ? max || 1 : max + (max - min || 1) * 0.15;
  const y = (v: number) => ALTURA - ((v - base) / (topo - base)) * ALTURA;
  const passo = n ? largura / n : 0;
  const x = (i: number) => passo * i + passo / 2;
  const marcas = n <= 7 ? rotulos.map((_, i) => i) : [0, Math.round((n - 1) / 3), Math.round(((n - 1) * 2) / 3), n - 1];

  return (
    <View style={{ marginTop: spacing.lg }} onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}>
      <View style={styles.cabecalhoGrafico}>
        <View style={[styles.ponto, { backgroundColor: cor }]} />
        <ThemedText variant="small" color="text" style={{ flex: 1 }}>{titulo}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">
          {media != null ? t('gn.mediaMinMax', { m: fmt(media), min: fmt(min), max: fmt(max), u: unidade }) : t('gn.semRegistros')}
        </ThemedText>
      </View>
      {largura > 0 && existentes.length > 0 && (
        <Svg width={largura} height={ALTURA + 2}>
          <Line x1={0} x2={largura} y1={ALTURA} y2={ALTURA} stroke={colors.border} strokeWidth={1} />
          {media != null && (
            <Line x1={0} x2={largura} y1={y(media)} y2={y(media)} stroke={cor} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="4 4" />
          )}
          {tipo === 'barra'
            ? valores.map((v, i) =>
                v == null ? null : (
                  <Rect key={i} x={x(i) - (passo * 0.7) / 2} y={y(v)} width={Math.max(passo * 0.7, 1)} height={ALTURA - y(v)} rx={2} fill={cor} />
                )
              )
            : (
              <>
                <Polyline
                  points={valores.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(' ')}
                  fill="none"
                  stroke={cor}
                  strokeWidth={2}
                />
                {valores.map((v, i) => (v == null ? null : <Circle key={i} cx={x(i)} cy={y(v)} r={3} fill={cor} />))}
              </>
            )}
        </Svg>
      )}
      {largura > 0 && existentes.length > 0 && (
        <View style={{ height: 16 }}>
          {marcas.map((i) => (
            <ThemedText
              key={i}
              variant="caption"
              color="textSecondary"
              style={{ position: 'absolute', left: Math.min(Math.max(x(i) - 22, 0), largura - 44), width: 44, textAlign: 'center' }}
            >
              {rotulos[i]}
            </ThemedText>
          ))}
        </View>
      )}
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

function Chip({ ativo, texto, onPress, cor }: { ativo: boolean; texto: string; onPress: () => void; cor?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo, ativo && cor ? { borderColor: cor } : null]}>
      {cor && <View style={[styles.ponto, { backgroundColor: cor, opacity: ativo ? 1 : 0.35 }]} />}
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  ponto: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  cabecalhoGrafico: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  influencia: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
}));
