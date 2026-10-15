import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Pill, Plus, ChevronRight, Bell, CalendarDays } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { useMedicacoes } from '@context/MedicacoesContext';
import { usePreferences } from '@context/PreferencesContext';
import { rotuloUnidade, Medicacao } from '@models/medicacoes';
import { proximaDose, fimDoTratamento } from '@utils/agendaMedicacao';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

/** Seção "Medicações" da aba Saúde */
export function ListaMedicacoes() {
  const { t, idioma } = usePreferences();
  const router = useRouter();
  const { medicacoes } = useMedicacoes();

  const formatar = (d: Date) => {
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (d.toDateString() === hoje.toDateString()) return t('med.hojeAs', { h: hora });
    if (d.toDateString() === amanha.toDateString()) return t('med.amanhaAs', { h: hora });
    try {
      return d.toLocaleString(idioma, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return hora;
    }
  };

  function descricao(m: Medicacao) {
    if (m.uso === 'esporadico') return t('med.esporadico');
    if (m.uso === 'tratamento') {
      const prox = proximaDose(m);
      const fim = fimDoTratamento(m);
      if (!prox) return t('med.tratamentoConcluido');
      return `${t('med.proxima', { quando: formatar(prox) })} · ${t('med.ate', { fim: fim ? formatar(fim) : '' })}`;
    }
    const prox = proximaDose(m);
    return prox ? t('med.proxima', { quando: formatar(prox) }) : t('med.continuo');
  }

  // contínuos e tratamentos em andamento primeiro, depois pela próxima dose
  const ordenadas = [...medicacoes].sort((a, b) => {
    const pa = proximaDose(a)?.getTime() ?? Infinity;
    const pb = proximaDose(b)?.getTime() ?? Infinity;
    return pa - pb || a.nome.localeCompare(b.nome);
  });

  return (
    <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
      <View style={styles.cabecalho}>
        <Pill size={20} color={colors.primary} strokeWidth={2} />
        <ThemedText variant="subheading" color="text" style={{ flex: 1, marginLeft: spacing.xs }}>
          {t('med.titulo')}
        </ThemedText>
        <Pressable onPress={() => router.push('/medicacao')} style={styles.adicionar} hitSlop={8}>
          <Plus size={16} color={colors.primary} strokeWidth={2.5} />
          <ThemedText variant="small" color="primary" style={{ marginLeft: 2 }}>{t('med.adicionar')}</ThemedText>
        </Pressable>
      </View>

      {ordenadas.length === 0 ? (
        <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
          {t('med.vazio')}
        </ThemedText>
      ) : (
        ordenadas.map((m) => (
          <Pressable key={m.id} onPress={() => router.push({ pathname: '/medicacao', params: { id: m.id } })} style={styles.item}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="body" color="text">
                {m.nome}
                {m.dose ? <ThemedText variant="small" color="textSecondary">{`  ${m.dose} ${rotuloUnidade(m.unidade, idioma)}`}</ThemedText> : null}
              </ThemedText>
              <ThemedText variant="caption" color={m.uso === 'esporadico' ? 'textSecondary' : 'primary'}>
                {descricao(m)}
              </ThemedText>
            </View>
            {m.lembretes && m.notificationIds.length > 0 && <Bell size={14} color={colors.textSecondary} strokeWidth={2} />}
            {m.calendario && m.calendarEventIds.length > 0 && (
              <CalendarDays size={14} color={colors.textSecondary} strokeWidth={2} style={{ marginLeft: 6 }} />
            )}
            <ChevronRight size={18} color={colors.textSecondary} strokeWidth={2} style={{ marginLeft: spacing.xs }} />
          </Pressable>
        ))
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
  cabecalho: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  adicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
}));
