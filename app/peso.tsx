import { useState } from 'react';
import { View, ScrollView, Pressable, LayoutChangeEvent } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { TrendingDown, TrendingUp, Target, X } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useProfile } from '@context/ProfileContext';
import { useRecords } from '@context/RecordsContext';
import { usePreferences } from '@context/PreferencesContext';
import { RegistroPeso } from '@models/records';
import { colors, spacing, radius } from '@constants/colors';
import { MensagemErro } from '@components/forms/MensagemErro';
import { estilosTema } from '@theme/estilos';

const ALTURA_GRAFICO = 160;
const MAX_PONTOS = 30;

/** Data salva como "AAAA-MM-DD" → dia/mês no idioma escolhido */
function formatarData(dataIso: string, idioma: string): string {
  const [a, m, d] = dataIso.split('-').map(Number);
  const data = new Date(a, (m || 1) - 1, d || 1);
  try {
    return data.toLocaleDateString(idioma, { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return dataIso.split('-').reverse().join('/');
  }
}

function arredondar(n: number): number {
  return Math.round(n * 10) / 10;
}

function GraficoPeso({ pesos, meta, idioma }: { pesos: RegistroPeso[]; meta: number | null; idioma: string }) {
  const [largura, setLargura] = useState(0);
  const pontos = pesos.slice(-MAX_PONTOS);

  const valores = pontos.map((p) => p.pesoKg);
  if (meta != null) valores.push(meta);
  const min = Math.min(...valores) - 1;
  const max = Math.max(...valores) + 1;
  const margem = 8;

  const x = (i: number) =>
    margem + (pontos.length === 1 ? 0 : (i / (pontos.length - 1)) * (largura - margem * 2));
  const y = (kg: number) => margem + (1 - (kg - min) / (max - min)) * (ALTURA_GRAFICO - margem * 2);

  return (
    <View onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)} style={{ marginTop: spacing.md }}>
      {largura > 0 && (
        <Svg width={largura} height={ALTURA_GRAFICO}>
          {meta != null && (
            <Line
              x1={margem}
              x2={largura - margem}
              y1={y(meta)}
              y2={y(meta)}
              stroke={colors.secondary}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          )}
          <Polyline
            points={pontos.map((p, i) => `${x(i)},${y(p.pesoKg)}`).join(' ')}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {pontos.map((p, i) => (
            <Circle key={p.id} cx={x(i)} cy={y(p.pesoKg)} r={3.5} fill={colors.primary} />
          ))}
        </Svg>
      )}
      <View style={styles.eixoRow}>
        <ThemedText variant="caption" color="textSecondary">{formatarData(pontos[0].data, idioma)}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{formatarData(pontos[pontos.length - 1].data, idioma)}</ThemedText>
      </View>
    </View>
  );
}

export default function PesoScreen() {
  const { t, idioma } = usePreferences();
  const { profile } = useProfile();
  const { pesos, pesoAtualKg, adicionarPeso, removerPeso } = useRecords();

  const [pesoTexto, setPesoTexto] = useState('');

  const pesoInicial = profile.pesoAtualKg ?? (pesos.length > 0 ? pesos[0].pesoKg : null);
  const pesoAtual = pesoAtualKg ?? profile.pesoAtualKg;
  const variacao = pesoInicial != null && pesoAtual != null ? arredondar(pesoAtual - pesoInicial) : null;
  const meta = profile.metaPesoKg;
  const faltaMeta = meta != null && pesoAtual != null ? arredondar(Math.abs(pesoAtual - meta)) : null;

  const erroPeso = pesoTexto.trim() && !(parseFloat(pesoTexto.replace(',', '.')) >= 20 && parseFloat(pesoTexto.replace(',', '.')) <= 400) ? t('form.erroPeso') : null;

  async function handleSalvar() {
    const kg = parseFloat(pesoTexto.replace(',', '.'));
    if (isNaN(kg) || kg <= 0) return;
    await adicionarPeso(kg);
    setPesoTexto('');
  }

  const historico = [...pesos].reverse();

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        {/* Resumo */}
        <View style={styles.resumoRow}>
          <ThemedView variant="surface" style={[styles.resumoCard, styles.cardShadow]}>
            <ThemedText variant="small" color="textSecondary">{t('p.inicial')}</ThemedText>
            <ThemedText variant="heading" color="text">{pesoInicial != null ? `${pesoInicial}` : '--'}</ThemedText>
          </ThemedView>
          <ThemedView variant="surface" style={[styles.resumoCard, styles.cardShadow]}>
            <ThemedText variant="small" color="textSecondary">{t('p.atual')}</ThemedText>
            <ThemedText variant="heading" color="primary">{pesoAtual != null ? `${pesoAtual}` : '--'}</ThemedText>
          </ThemedView>
          <ThemedView variant="surface" style={[styles.resumoCard, styles.cardShadow]}>
            <ThemedText variant="small" color="textSecondary">{t('p.variacao')}</ThemedText>
            <View style={styles.variacaoRow}>
              {variacao != null && variacao !== 0 &&
                (variacao < 0 ? (
                  <TrendingDown size={16} color={colors.primary} strokeWidth={2} />
                ) : (
                  <TrendingUp size={16} color={colors.secondary} strokeWidth={2} />
                ))}
              <ThemedText variant="heading" color={variacao != null && variacao > 0 ? 'secondary' : 'primary'}>
                {variacao != null ? `${variacao > 0 ? '+' : ''}${variacao}` : '--'}
              </ThemedText>
            </View>
          </ThemedView>
        </View>

        {meta != null && faltaMeta != null && (
          <View style={styles.metaRow}>
            <Target size={14} color={colors.textSecondary} strokeWidth={2} />
            <ThemedText variant="small" color="textSecondary" style={{ marginLeft: spacing.xs }}>
              {faltaMeta === 0 ? t('p.naMeta') : t('p.faltaMeta', { n: faltaMeta, meta })}
            </ThemedText>
          </View>
        )}

        {/* Gráfico */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">{t('p.grafico')}</ThemedText>
          {pesos.length >= 2 ? (
            <GraficoPeso pesos={pesos} meta={meta} idioma={idioma} />
          ) : (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
              {t('p.graficoVazio')}
            </ThemedText>
          )}
        </ThemedView>

        {/* Registrar */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">{t('p.registrar')}</ThemedText>
          <View style={styles.registrarRow}>
            <Input
              value={pesoTexto}
              onChangeText={setPesoTexto}
              keyboardType="decimal-pad"
              placeholder={pesoAtual != null ? String(pesoAtual) : '0'}
              style={[styles.input, erroPeso && { borderColor: colors.error }]}
            />
            <ThemedText variant="body" color="textSecondary" style={{ marginHorizontal: spacing.sm }}>kg</ThemedText>
            <Button label={t('comum.salvar')} variant="primary" size="sm" onPress={handleSalvar} disabled={!pesoTexto.trim() || !!erroPeso} />
          </View>
          <MensagemErro texto={erroPeso} />
          <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>
            {t('p.umaPorDia')}
          </ThemedText>
        </ThemedView>

        {/* Histórico */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">{t('p.historico')}</ThemedText>
          {historico.length === 0 ? (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
              {t('p.vazio')}
            </ThemedText>
          ) : (
            historico.map((p, i) => {
              const anterior = historico[i + 1];
              const dif = anterior ? arredondar(p.pesoKg - anterior.pesoKg) : null;
              return (
                <View key={p.id} style={styles.itemRow}>
                  <ThemedText variant="body" color="text" style={{ flex: 1 }}>
                    {formatarData(p.data, idioma)}
                  </ThemedText>
                  {dif != null && dif !== 0 && (
                    <ThemedText variant="small" color={dif < 0 ? 'primary' : 'secondary'} style={{ marginRight: spacing.md }}>
                      {dif > 0 ? '+' : ''}{dif}
                    </ThemedText>
                  )}
                  <ThemedText variant="subheading" color="text">{p.pesoKg} kg</ThemedText>
                  <Pressable onPress={() => removerPeso(p.id)} style={styles.remover} hitSlop={8}>
                    <X size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              );
            })
          )}
        </ThemedView>
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1 },
  card: { padding: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xl },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  resumoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  resumoCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center' },
  variacaoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  eixoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  registrarRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  input: { flex: 1, textAlign: 'left' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  remover: { marginLeft: spacing.md, padding: 2 },
}));
