import { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import { RegistroPeso } from '@models/records';
import { calcularTendencia, preverMeta, pesoNaReta, diaNumero, dataDoDia, Previsao } from '@utils/tendenciaPeso';
import { colors, spacing } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const ALTURA = 170;
const MARGEM = 10;
/** Janela visível do gráfico */
const DIAS_VISIVEIS = 120;

function dataCurta(dia: number, idioma: string) {
  try {
    return dataDoDia(dia).toLocaleDateString(idioma, { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

function dataLonga(dia: number, idioma: string) {
  try {
    return dataDoDia(dia).toLocaleDateString(idioma, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

const kg = (n: number) => String(Math.round(n * 10) / 10);

/**
 * Gráfico de peso da tela inicial: pesagens, peso inicial, linha de tendência
 * (últimas 4 semanas) e quando a tendência alcança a meta.
 */
export function GraficoPesoTendencia({
  pesos,
  meta,
  pesoInicialPerfil,
}: {
  /** em ordem cronológica */
  pesos: RegistroPeso[];
  meta: number | null;
  /** peso do cadastro, usado como inicial quando ainda não há pesagens */
  pesoInicialPerfil: number | null;
}) {
  const { t, idioma } = usePreferences();
  const [largura, setLargura] = useState(0);

  const inicial = pesos[0]?.pesoKg ?? pesoInicialPerfil;
  const atual = pesos[pesos.length - 1]?.pesoKg ?? pesoInicialPerfil;
  const tendencia = calcularTendencia(pesos);
  const previsao: Previsao = preverMeta(tendencia, atual, meta);

  if (pesos.length < 2) {
    return (
      <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
        {t('grafico.poucosDados')}
      </ThemedText>
    );
  }

  const ultimoDia = diaNumero(pesos[pesos.length - 1].data);
  const visiveis = pesos.filter((p) => diaNumero(p.data) >= ultimoDia - DIAS_VISIVEIS);
  const primeiroDia = diaNumero(visiveis[0].data);
  const span = Math.max(7, ultimoDia - primeiroDia);

  // a projeção só estica o eixo se a meta estiver "perto" (até o dobro do período mostrado)
  const projetaAteMeta = previsao.tipo === 'data' && previsao.dia - ultimoDia <= Math.max(30, span);
  const fimDia = projetaAteMeta && previsao.tipo === 'data' ? previsao.dia : ultimoDia + (tendencia ? Math.round(span * 0.15) : 0);

  const valores = visiveis.map((p) => p.pesoKg);
  if (meta != null) valores.push(meta);
  if (tendencia) valores.push(pesoNaReta(tendencia, fimDia));
  const min = Math.min(...valores) - 0.5;
  const max = Math.max(...valores) + 0.5;

  const x = (dia: number) => MARGEM + ((dia - primeiroDia) / Math.max(1, fimDia - primeiroDia)) * (largura - MARGEM * 2);
  const y = (v: number) => MARGEM + (1 - (v - min) / (max - min)) * (ALTURA - MARGEM * 2);

  const ritmoSemana = tendencia ? tendencia.kgPorDia * 7 : 0;

  return (
    <View style={{ marginTop: spacing.md }}>
      <View onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}>
        {largura > 0 && (
          <Svg width={largura} height={ALTURA}>
            {meta != null && (
              <Line x1={MARGEM} x2={largura - MARGEM} y1={y(meta)} y2={y(meta)} stroke={colors.secondary} strokeWidth={1.5} strokeDasharray="6 4" />
            )}
            {tendencia && (
              <Line
                x1={x(Math.max(primeiroDia, tendencia.diaInicio))}
                y1={y(pesoNaReta(tendencia, Math.max(primeiroDia, tendencia.diaInicio)))}
                x2={x(fimDia)}
                y2={y(pesoNaReta(tendencia, fimDia))}
                stroke={colors.accent}
                strokeWidth={2}
                strokeDasharray="3 4"
              />
            )}
            <Polyline
              points={visiveis.map((p) => `${x(diaNumero(p.data))},${y(p.pesoKg)}`).join(' ')}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {visiveis.map((p) => (
              <Circle key={p.id} cx={x(diaNumero(p.data))} cy={y(p.pesoKg)} r={3} fill={colors.primary} />
            ))}
            {/* inicial: anel; atual: ponto maior */}
            {visiveis[0] === pesos[0] && (
              <Circle cx={x(primeiroDia)} cy={y(pesos[0].pesoKg)} r={6} fill={colors.surface} stroke={colors.primary} strokeWidth={2.5} />
            )}
            <Circle cx={x(ultimoDia)} cy={y(atual!)} r={6} fill={colors.primary} />
            {projetaAteMeta && previsao.tipo === 'data' && meta != null && (
              <Circle cx={x(previsao.dia)} cy={y(meta)} r={6} fill={colors.secondary} />
            )}
          </Svg>
        )}
      </View>
      <View style={styles.eixo}>
        <ThemedText variant="caption" color="textSecondary">{dataCurta(primeiroDia, idioma)}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{dataCurta(fimDia, idioma)}</ThemedText>
      </View>

      <View style={styles.legenda}>
        <Item cor={colors.primary} anel texto={t('grafico.inicial', { kg: kg(inicial!) })} />
        <Item cor={colors.primary} texto={t('grafico.atual', { kg: kg(atual!) })} />
        {tendencia && <Item cor={colors.accent} tracejado texto={t('grafico.tendencia')} />}
        {meta != null && <Item cor={colors.secondary} tracejado texto={t('grafico.meta', { kg: kg(meta) })} />}
      </View>

      <ThemedText variant="small" color="text" style={{ marginTop: spacing.sm }}>
        {previsao.tipo === 'data'
          ? t('grafico.previsao', {
              ritmo: (ritmoSemana > 0 ? '+' : '') + kg(ritmoSemana),
              data: dataLonga(previsao.dia, idioma),
              semanas: previsao.semanas,
            })
          : previsao.tipo === 'naMeta'
            ? t('home.naMeta')
            : previsao.tipo === 'longe'
              ? t('grafico.longe')
              : previsao.tipo === 'muitoLonge'
                ? t('grafico.muitoLonge')
                : previsao.tipo === 'semDados'
                  ? t('grafico.semDados')
                  : t('grafico.semMeta')}
      </ThemedText>
      {previsao.tipo === 'data' && (
        <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>{t('grafico.estimativa')}</ThemedText>
      )}
    </View>
  );
}

function Item({ cor, texto, anel, tracejado }: { cor: string; texto: string; anel?: boolean; tracejado?: boolean }) {
  return (
    <View style={styles.item}>
      {tracejado ? (
        <View style={[styles.traco, { borderColor: cor }]} />
      ) : (
        <View style={[styles.bolinha, anel ? { borderColor: cor, borderWidth: 2 } : { backgroundColor: cor }]} />
      )}
      <ThemedText variant="caption" color="textSecondary">{texto}</ThemedText>
    </View>
  );
}

const styles = estilosTema(() => ({
  eixo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center' },
  bolinha: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  traco: { width: 14, borderTopWidth: 2, borderStyle: 'dashed', marginRight: 4 },
}));
