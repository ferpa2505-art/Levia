import { useState } from 'react';
import { View, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { FileText, Download, Upload, ShieldCheck } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import { compartilharRelatorio } from '@utils/relatorio';
import { exportarBackup, escolherBackup, aplicarBackup } from '@utils/backup';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const PERIODOS = [7, 30, 90];

/** Aba Saúde: relatório em PDF para o médico, backup e restauração dos dados */
export function CartaoMeusDados() {
  const { t, idioma } = usePreferences();
  const [dias, setDias] = useState(30);
  const [ocupado, setOcupado] = useState<null | 'pdf' | 'backup' | 'restaurar'>(null);

  async function gerarPdf() {
    setOcupado('pdf');
    try {
      if (!(await compartilharRelatorio(dias))) Alert.alert(t('dados.erro'));
    } catch {
      Alert.alert(t('dados.erro'));
    } finally {
      setOcupado(null);
    }
  }

  async function backup() {
    setOcupado('backup');
    try {
      if (!(await exportarBackup(t('dados.backup')))) Alert.alert(t('dados.erro'));
    } catch {
      Alert.alert(t('dados.erro'));
    } finally {
      setOcupado(null);
    }
  }

  async function restaurar() {
    setOcupado('restaurar');
    const lido = await escolherBackup().catch(() => ({ ok: false as const, motivo: 'invalido' as const }));
    setOcupado(null);
    if (!lido.ok) {
      if (lido.motivo === 'invalido') Alert.alert(t('dados.arquivoInvalido'));
      return;
    }
    let quando = '';
    try {
      quando = new Date(lido.exportadoEm).toLocaleString(idioma, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      quando = lido.exportadoEm;
    }
    Alert.alert(t('dados.confirmarTitulo'), t('dados.confirmarMsg', { d: quando }), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('dados.restaurarAgora'),
        style: 'destructive',
        onPress: async () => {
          await aplicarBackup(lido.dados);
          // recarrega o app para todas as telas lerem os dados restaurados
          await Updates.reloadAsync().catch(() => Alert.alert(t('dados.reabra')));
        },
      },
    ]);
  }

  const Acao = ({ id, icone, titulo, desc, onPress }: { id: 'pdf' | 'backup' | 'restaurar'; icone: React.ReactNode; titulo: string; desc: string; onPress: () => void }) => (
    <Pressable onPress={onPress} disabled={!!ocupado} style={({ pressed }) => [styles.acao, pressed && { opacity: 0.7 }]}>
      <View style={styles.icone}>{ocupado === id ? <ActivityIndicator color={colors.primary} size="small" /> : icone}</View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <ThemedText variant="body" color="text">{titulo}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{desc}</ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
      <View style={styles.cabecalho}>
        <ShieldCheck size={20} color={colors.primary} strokeWidth={2} />
        <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>{t('dados.titulo')}</ThemedText>
      </View>

      <Acao
        id="pdf"
        icone={<FileText size={20} color={colors.primary} strokeWidth={2} />}
        titulo={t('dados.pdf')}
        desc={t('dados.pdfDesc')}
        onPress={gerarPdf}
      />
      <View style={styles.periodos}>
        {PERIODOS.map((n) => (
          <Pressable key={n} onPress={() => setDias(n)} style={[styles.periodo, dias === n && styles.periodoAtivo]}>
            <ThemedText variant="caption" color={dias === n ? 'primary' : 'textSecondary'}>{t('gl.dias', { n })}</ThemedText>
          </Pressable>
        ))}
      </View>

      <Acao
        id="backup"
        icone={<Download size={20} color={colors.primary} strokeWidth={2} />}
        titulo={t('dados.backup')}
        desc={t('dados.backupDesc')}
        onPress={backup}
      />
      <Acao
        id="restaurar"
        icone={<Upload size={20} color={colors.primary} strokeWidth={2} />}
        titulo={t('dados.restaurar')}
        desc={t('dados.restaurarDesc')}
        onPress={restaurar}
      />
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
  cabecalho: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  periodos: { flexDirection: 'row', gap: spacing.xs, marginLeft: 52, marginBottom: spacing.md },
  periodo: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodoAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
}));
