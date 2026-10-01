import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Beef, X } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useGlp1 } from '@context/Glp1Context';
import { useRecords } from '@context/RecordsContext';
import { usePreferences } from '@context/PreferencesContext';
import { NivelApetite, RegistroDoseGLP1 } from '@models/glp1';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const NIVEIS: { nivel: NivelApetite; emoji: string; chave: 'ap.nivel1' | 'ap.nivel2' | 'ap.nivel3' | 'ap.nivel4' | 'ap.nivel5' }[] = [
  { nivel: 1, emoji: '😶', chave: 'ap.nivel1' },
  { nivel: 2, emoji: '🙂', chave: 'ap.nivel2' },
  { nivel: 3, emoji: '😊', chave: 'ap.nivel3' },
  { nivel: 4, emoji: '😋', chave: 'ap.nivel4' },
  { nivel: 5, emoji: '🤤', chave: 'ap.nivel5' },
];

const DIAS_HISTORICO = 14;

function paraData(dataIso: string): Date {
  const [a, m, d] = dataIso.split('-').map(Number);
  return new Date(a, (m || 1) - 1, d || 1);
}

function formatarData(dataIso: string, idioma: string): string {
  try {
    return paraData(dataIso).toLocaleDateString(idioma, { weekday: 'short', day: '2-digit', month: '2-digit' });
  } catch {
    return dataIso.split('-').reverse().join('/');
  }
}

/** Quantos dias depois da última dose (até aquela data) o registro foi feito */
function diasAposDose(dataIso: string, doses: RegistroDoseGLP1[]): number | null {
  const dose = doses.find((d) => d.data <= dataIso); // doses vêm da mais recente para a mais antiga
  if (!dose) return null;
  return Math.round((paraData(dataIso).getTime() - paraData(dose.data).getTime()) / 86400000);
}

export default function ApetiteScreen() {
  const { t, idioma } = usePreferences();
  const { apetites, apetiteHoje, registrarApetite, removerApetite, doses } = useGlp1();
  const { proteinaHojeG } = useRecords();

  const [nivel, setNivel] = useState<NivelApetite | null>(apetiteHoje?.nivel ?? null);
  const [obs, setObs] = useState(apetiteHoje?.observacoes ?? '');
  const [salvo, setSalvo] = useState(false);

  async function handleSalvar() {
    if (nivel == null) return;
    await registrarApetite(nivel, obs);
    setSalvo(true);
  }

  function rotuloDose(dataIso: string): string | null {
    const n = diasAposDose(dataIso, doses);
    if (n == null) return null;
    return n === 0 ? t('ap.diaDose0') : t('ap.diaDoseN', { n });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <ThemedView style={styles.container}>
        <ThemedText variant="body" color="textSecondary" style={{ marginBottom: spacing.lg }}>
          {t('ap.sub')}
        </ThemedText>

        {/* Registro de hoje */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.niveisRow}>
            {NIVEIS.map((n) => {
              const ativo = nivel === n.nivel;
              return (
                <Pressable
                  key={n.nivel}
                  onPress={() => {
                    setNivel(n.nivel);
                    setSalvo(false);
                  }}
                  style={[styles.nivel, ativo && styles.nivelAtivo]}
                >
                  <ThemedText variant="heading">{n.emoji}</ThemedText>
                  <ThemedText variant="caption" color={ativo ? 'primary' : 'textSecondary'} style={styles.nivelTexto}>
                    {t(n.chave)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Input
            value={obs}
            onChangeText={(v) => {
              setObs(v);
              setSalvo(false);
            }}
            placeholder={t('ap.obsPh')}
            multiline
            style={styles.obs}
          />

          {salvo ? (
            <ThemedText variant="body" color="primary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
              {t('ap.hojeSalvo')}
            </ThemedText>
          ) : (
            <Button
              label={apetiteHoje ? t('ap.atualizar') : t('ap.salvar')}
              variant="primary"
              onPress={handleSalvar}
              disabled={nivel == null}
              style={{ marginTop: spacing.md }}
            />
          )}
        </ThemedView>

        {/* Proteína do dia */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.proteinaRow}>
            <Beef size={18} color={colors.secondary} strokeWidth={2} />
            <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
              {t('ap.proteinaHoje', { g: proteinaHojeG })}
            </ThemedText>
          </View>
          {nivel != null && nivel <= 2 && (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
              {t('ap.proteinaDica')}
            </ThemedText>
          )}
        </ThemedView>

        {/* Histórico */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">{t('ap.historico')}</ThemedText>
          {apetites.length === 0 ? (
            <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
              {t('ap.vazio')}
            </ThemedText>
          ) : (
            apetites.slice(0, DIAS_HISTORICO).map((a) => {
              const info = NIVEIS.find((n) => n.nivel === a.nivel)!;
              const dose = rotuloDose(a.data);
              return (
                <View key={a.id} style={styles.itemRow}>
                  <ThemedText variant="heading" style={{ marginRight: spacing.md }}>{info.emoji}</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">
                      {t(info.chave)} · {formatarData(a.data, idioma)}
                    </ThemedText>
                    {dose && (
                      <ThemedText variant="caption" color="primary">{dose}</ThemedText>
                    )}
                    {a.observacoes && (
                      <ThemedText variant="small" color="textSecondary">{a.observacoes}</ThemedText>
                    )}
                  </View>
                  <Pressable onPress={() => removerApetite(a.id)} style={styles.remover} hitSlop={8}>
                    <X size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              );
            })
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
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
  niveisRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  nivel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nivelAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  nivelTexto: { textAlign: 'center', marginTop: 2 },
  obs: { marginTop: spacing.md, textAlign: 'left', minHeight: 60, textAlignVertical: 'top' },
  proteinaRow: { flexDirection: 'row', alignItems: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  remover: { marginLeft: spacing.md, padding: 2 },
}));
