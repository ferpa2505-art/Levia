import { useState } from 'react';
import { View, Pressable, Switch } from 'react-native';
import { Bell, Minus, Plus, Target } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { MensagemErro } from '@components/forms/MensagemErro';
import { useDiabetes } from '@context/DiabetesContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

/** Lembrete de medição (1–24 h após a última) e faixa-alvo da glicemia */
export function ConfigGlicemia() {
  const { t } = usePreferences();
  const { config, atualizarConfig } = useDiabetes();
  const [min, setMin] = useState(String(config.alvoMinMgDl));
  const [max, setMax] = useState(String(config.alvoMaxMgDl));

  const minNum = parseInt(min, 10);
  const maxNum = parseInt(max, 10);
  const faixaValida = minNum >= 40 && maxNum <= 400 && minNum < maxNum;
  const faixaMudou = minNum !== config.alvoMinMgDl || maxNum !== config.alvoMaxMgDl;

  function mudarHoras(delta: number) {
    const horas = Math.min(24, Math.max(1, config.lembreteHoras + delta));
    if (horas !== config.lembreteHoras) atualizarConfig({ lembreteHoras: horas });
  }

  return (
    <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
      <View style={styles.linha}>
        <Bell size={18} color={colors.primary} strokeWidth={2} />
        <ThemedText variant="subheading" color="text" style={{ flex: 1, marginLeft: spacing.xs }}>
          {t('gl.lembrete')}
        </ThemedText>
        <Switch
          value={config.lembreteAtivo}
          onValueChange={(v) => atualizarConfig({ lembreteAtivo: v })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      {config.lembreteAtivo && (
        <View style={[styles.linha, { marginTop: spacing.sm }]}>
          <ThemedText variant="small" color="textSecondary" style={{ flex: 1 }}>
            {t('gl.lembreteDesc', { h: config.lembreteHoras })}
          </ThemedText>
          <Pressable onPress={() => mudarHoras(-1)} style={styles.passo} hitSlop={6}>
            <Minus size={16} color={colors.primary} strokeWidth={2.5} />
          </Pressable>
          <ThemedText variant="subheading" color="primary" style={styles.horas}>{config.lembreteHoras} h</ThemedText>
          <Pressable onPress={() => mudarHoras(1)} style={styles.passo} hitSlop={6}>
            <Plus size={16} color={colors.primary} strokeWidth={2.5} />
          </Pressable>
        </View>
      )}

      <View style={[styles.linha, { marginTop: spacing.lg }]}>
        <Target size={18} color={colors.primary} strokeWidth={2} />
        <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>{t('gl.faixa')}</ThemedText>
      </View>
      <View style={[styles.linha, { marginTop: spacing.sm }]}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <ThemedText variant="caption" color="textSecondary">{t('gl.min')}</ThemedText>
          <Input value={min} onChangeText={setMin} keyboardType="number-pad" maxLength={3} style={styles.input} />
        </View>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <ThemedText variant="caption" color="textSecondary">{t('gl.max')}</ThemedText>
          <Input value={max} onChangeText={setMax} keyboardType="number-pad" maxLength={3} style={styles.input} />
        </View>
        {faixaMudou && (
          <Button
            label={t('comum.salvar')}
            size="sm"
            disabled={!faixaValida}
            onPress={() => atualizarConfig({ alvoMinMgDl: minNum, alvoMaxMgDl: maxNum })}
            style={{ alignSelf: 'flex-end' }}
          />
        )}
      </View>
      <MensagemErro texto={faixaMudou && !faixaValida ? t('gl.faixaErro') : null} />
      <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>
        {t('gl.faixaDica')}
      </ThemedText>
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
  linha: { flexDirection: 'row', alignItems: 'center' },
  passo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  horas: { minWidth: 48, textAlign: 'center' },
  input: { textAlign: 'left', paddingVertical: spacing.sm },
}));
