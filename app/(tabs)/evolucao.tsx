import { ReactNode, useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { BarrasKcal, LinhaPeso } from '@components/GraficoEvolucao';
import { useRecords } from '@context/RecordsContext';
import { useDiabetes } from '@context/DiabetesContext';
import { useGlp1 } from '@context/Glp1Context';
import { usePreferences } from '@context/PreferencesContext';
import { calcularEvolucao, diferenca, PeriodoEvolucao, ResumoPeriodo } from '@utils/evolucao';
import { dataDeHoje } from '@utils/recordsStorage';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const PERIODOS: PeriodoEvolucao[] = ['dia', 'semana', 'mes', 'inicio'];

function dataCurta(dataIso: string, idioma: string) {
  const [a, m, d] = dataIso.split('-').map(Number);
  try {
    return new Date(a, m - 1, d, 12).toLocaleDateString(idioma, { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return dataIso;
  }
}

/**
 * Diferença em relação ao período anterior. Sem juízo de valor: usa a cor de texto
 * secundária (subir ou descer não é "bom" nem "ruim" aqui).
 */
function Variacao({ ativo, valor, unidade, casas = 0 }: { ativo: boolean; valor: number | null; unidade: string; casas?: number }) {
  const { t } = usePreferences();
  if (!ativo) return null; // "desde o início" não tem período anterior para comparar
  if (valor === null) return <ThemedText variant="caption" color="textSecondary">{t('evo.semAnterior')}</ThemedText>;
  const seta = valor > 0 ? '▲' : valor < 0 ? '▼' : '•';
  const numero = Math.abs(valor).toLocaleString(undefined, { maximumFractionDigits: casas });
  const texto = valor === 0 ? '0' : `${valor > 0 ? '+' : '−'}${numero}`;
  return (
    <ThemedText variant="caption" color="textSecondary">
      {seta} {texto} {unidade} {t('evo.vsAnterior')}
    </ThemedText>
  );
}

function Linha({ rotulo, valor, unidade, variacao }: { rotulo: string; valor: number | null; unidade: string; variacao?: ReactNode }) {
  return (
    <View style={styles.linha}>
      <View style={{ flex: 1 }}>
        <ThemedText variant="small" color="textSecondary">{rotulo}</ThemedText>
        {variacao}
      </View>
      <ThemedText variant="subheading" color="text">
        {valor === null ? '—' : `${valor.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unidade}`}
      </ThemedText>
    </View>
  );
}

export default function EvolucaoScreen() {
  const { t, idioma } = usePreferences();
  const { refeicoes, aguas, pesos, exercicios } = useRecords();
  const { glicemias, medicacoes, config } = useDiabetes();
  const { doses } = useGlp1();
  const [periodo, setPeriodo] = useState<PeriodoEvolucao>('semana');

  const evo = useMemo(
    () => calcularEvolucao(
      {
        refeicoes, aguas, pesos, exercicios, glicemias, medicacoes,
        dosesGlp1: doses,
        alvoGlicemia: { min: config.alvoMinMgDl, max: config.alvoMaxMgDl },
      },
      periodo,
      dataDeHoje(),
    ),
    [refeicoes, aguas, pesos, exercicios, glicemias, medicacoes, doses, config, periodo],
  );
  const a: ResumoPeriodo = evo.atual;
  const p = evo.anterior;
  const dif = (x: number | null, y: number | null | undefined, casas = 0) => (p ? diferenca(x, y ?? null, casas) : null);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.conteudo}>
      <ThemedText variant="heading" color="primary">{t('evo.titulo')}</ThemedText>

      <View style={styles.pilulas} accessibilityRole="tablist">
        {PERIODOS.map((k) => {
          const ativo = k === periodo;
          return (
            <Pressable
              key={k}
              onPress={() => setPeriodo(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativo }}
              style={[styles.pilula, ativo && styles.pilulaAtiva]}
            >
              <ThemedText variant="small" style={{ color: ativo ? colors.surface : colors.text, fontWeight: '600' }}>
                {t(`evo.periodo.${k}` as 'evo.periodo.dia')}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {periodo !== 'dia' && (
        <ThemedText variant="caption" color="textSecondary">
          {t('evo.intervalo', { de: dataCurta(evo.de, idioma), ate: dataCurta(evo.ate, idioma) })}
        </ThemedText>
      )}

      {evo.vazio ? (
        <ThemedView variant="surface" style={[styles.cartao, styles.borda]}>
          <ThemedText variant="body" color="textSecondary">{t('evo.vazio')}</ThemedText>
        </ThemedView>
      ) : (
        <>
          <ThemedView variant="surface" style={[styles.cartao, styles.borda]}>
            <ThemedText variant="subheading">{t('evo.comeu')}</ThemedText>
            <Linha
              rotulo={t('evo.kcalMedia')}
              valor={a.kcalMediaDia}
              unidade="kcal"
              variacao={<Variacao ativo={!!p} valor={dif(a.kcalMediaDia, p?.kcalMediaDia)} unidade="kcal" />}
            />
            {evo.barras.length > 0 && <BarrasKcal barras={evo.barras} />}
            <Linha rotulo={t('evo.proteina')} valor={a.proteinaMediaDiaG} unidade="g"
              variacao={<Variacao ativo={!!p} valor={dif(a.proteinaMediaDiaG, p?.proteinaMediaDiaG, 1)} unidade="g" casas={1} />} />
            <Linha rotulo={t('evo.carbo')} valor={a.carboidratoMediaDiaG} unidade="g"
              variacao={<Variacao ativo={!!p} valor={dif(a.carboidratoMediaDiaG, p?.carboidratoMediaDiaG, 1)} unidade="g" casas={1} />} />
            <Linha rotulo={t('evo.gordura')} valor={a.gorduraMediaDiaG} unidade="g"
              variacao={<Variacao ativo={!!p} valor={dif(a.gorduraMediaDiaG, p?.gorduraMediaDiaG, 1)} unidade="g" casas={1} />} />
            <Linha rotulo={t('evo.fibra')} valor={a.fibraMediaDiaG} unidade="g"
              variacao={<Variacao ativo={!!p} valor={dif(a.fibraMediaDiaG, p?.fibraMediaDiaG, 1)} unidade="g" casas={1} />} />
            <Linha rotulo={t('evo.agua')} valor={a.aguaMediaDiaMl} unidade="ml"
              variacao={<Variacao ativo={!!p} valor={dif(a.aguaMediaDiaMl, p?.aguaMediaDiaMl)} unidade="ml" />} />
            {periodo !== 'dia' && (
              <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
                {t('evo.constancia', { dias: a.diasComRefeicao, total: a.dias })}
              </ThemedText>
            )}
          </ThemedView>

          {(a.pesoFinalKg !== null || a.glicemia.medicoes > 0) && (
            <ThemedView variant="surface" style={[styles.cartao, styles.borda]}>
              <ThemedText variant="subheading">{t('evo.mediu')}</ThemedText>
              {a.pesoFinalKg !== null && (
                <>
                  <Linha
                    rotulo={t('evo.peso')}
                    valor={a.pesoFinalKg}
                    unidade="kg"
                    variacao={
                      a.pesoVariacaoKg !== null ? (
                        <ThemedText variant="caption" color="textSecondary">
                          {a.pesoInicialKg} → {a.pesoFinalKg} kg ({a.pesoVariacaoKg > 0 ? '+' : a.pesoVariacaoKg < 0 ? '−' : ''}{Math.abs(a.pesoVariacaoKg)} kg)
                        </ThemedText>
                      ) : undefined
                    }
                  />
                  <LinhaPeso pesos={evo.pesos} />
                </>
              )}
              {a.glicemia.medicoes > 0 && (
                <View style={{ marginTop: spacing.sm }}>
                  <ThemedText variant="small" color="textSecondary">{t('evo.glicemia')}</ThemedText>
                  <ThemedText variant="body">
                    {t('evo.glicemiaMedia', { media: a.glicemia.mediaMgDl ?? '—', n: a.glicemia.medicoes })}
                  </ThemedText>
                  {a.glicemia.noAlvoPct !== null && (
                    <ThemedText variant="caption" color="textSecondary">
                      {t('evo.glicemiaAlvo', { pct: a.glicemia.noAlvoPct })}
                    </ThemedText>
                  )}
                </View>
              )}
            </ThemedView>
          )}

          {(a.dosesGlp1 > 0 || a.medicacoesRegistradas > 0) && (
            <ThemedView variant="surface" style={[styles.cartao, styles.borda]}>
              <ThemedText variant="subheading">{t('evo.tomou')}</ThemedText>
              {a.dosesGlp1 > 0 && <ThemedText variant="body">{t('evo.doses', { n: a.dosesGlp1 })}</ThemedText>}
              {a.medicacoesRegistradas > 0 && (
                <ThemedText variant="body">{t('evo.medicacoes', { n: a.medicacoesRegistradas })}</ThemedText>
              )}
            </ThemedView>
          )}

          {a.exercicioMin > 0 && (
            <ThemedView variant="surface" style={[styles.cartao, styles.borda]}>
              <ThemedText variant="subheading">{t('evo.movimento')}</ThemedText>
              <ThemedText variant="body">{t('evo.exercicio', { min: a.exercicioMin, kcal: a.exercicioKcal })}</ThemedText>
            </ThemedView>
          )}
        </>
      )}

      <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.md }}>{t('evo.aviso')}</ThemedText>
    </ScrollView>
  );
}

const styles = estilosTema(() => ({
  conteudo: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  pilulas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pilula: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  pilulaAtiva: { backgroundColor: colors.primary, borderColor: colors.primary },
  cartao: { padding: spacing.lg, borderRadius: radius.xl, gap: spacing.sm },
  borda: { borderWidth: 1, borderColor: colors.border },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
}));
