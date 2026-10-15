import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Droplet, ChevronRight } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { GraficoGlicemia } from '@components/diabetes/GraficoGlicemia';
import { useDiabetes } from '@context/DiabetesContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';
import { glicemiasDoPeriodo, valorMgDl } from '@utils/glicemia';

const PERIODOS = [7, 14, 30];

interface Props {
  /** Ao tocar no cabeçalho (ex.: abrir a tela de Diabetes) */
  onAbrir?: () => void;
}

/** Cartão de glicemia: período, gráfico com faixa-alvo e média, e resumo. */
export function CartaoGlicemia({ onAbrir }: Props) {
  const { t } = usePreferences();
  const { glicemias, config } = useDiabetes();
  const [dias, setDias] = useState(7);

  const doPeriodo = glicemiasDoPeriodo(glicemias, dias);
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - (dias - 1));

  const valores = doPeriodo.map(valorMgDl);
  const ultima = doPeriodo[doPeriodo.length - 1];
  const noAlvo = valores.length
    ? Math.round((valores.filter((v) => v >= config.alvoMinMgDl && v <= config.alvoMaxMgDl).length / valores.length) * 100)
    : null;

  return (
    <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
      <Pressable onPress={onAbrir} disabled={!onAbrir} style={styles.cabecalho}>
        <View style={styles.icone}>
          <Droplet size={20} color={colors.primary} strokeWidth={2} />
        </View>
        <ThemedText variant="subheading" color="text" style={{ flex: 1, marginLeft: spacing.md }}>
          {t('gl.titulo')}
        </ThemedText>
        {ultima && (
          <ThemedText variant="subheading" color="primary" style={{ marginRight: spacing.xs }}>
            {valorMgDl(ultima)} <ThemedText variant="caption" color="textSecondary">mg/dL</ThemedText>
          </ThemedText>
        )}
        {onAbrir && <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />}
      </Pressable>

      <View style={styles.periodos}>
        {PERIODOS.map((n) => (
          <Pressable key={n} onPress={() => setDias(n)} style={[styles.periodo, dias === n && styles.periodoAtivo]}>
            <ThemedText variant="caption" color={dias === n ? 'primary' : 'textSecondary'}>
              {t('gl.dias', { n })}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {doPeriodo.length >= 2 ? (
        <>
          <GraficoGlicemia
            glicemias={doPeriodo}
            inicio={inicio}
            alvoMin={config.alvoMinMgDl}
            alvoMax={config.alvoMaxMgDl}
          />
          {noAlvo !== null && (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
              {t('gl.noAlvo', { p: noAlvo })} · {config.alvoMinMgDl}–{config.alvoMaxMgDl} mg/dL
            </ThemedText>
          )}
        </>
      ) : (
        <Pressable onPress={onAbrir} disabled={!onAbrir}>
          <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
            {glicemias.length === 0 && onAbrir ? t('gl.homeVazio') : t('gl.semDados')}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
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
  cabecalho: { flexDirection: 'row', alignItems: 'center' },
  icone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  periodos: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.md },
  periodo: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodoAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
}));
