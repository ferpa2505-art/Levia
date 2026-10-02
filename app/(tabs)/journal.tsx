import { useState } from 'react';
import { View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, X, BookOpen, Camera } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { useRecords } from '@context/RecordsContext';
import { usePreferences } from '@context/PreferencesContext';
import { Refeicao, TIPOS_REFEICAO, TipoRefeicao } from '@models/records';
import { dataDeHoje } from '@utils/recordsStorage';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const OPCOES_AGUA = [200, 300, 500];

function deslocarData(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(a, m - 1, d + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Aba Alimentação: refeições do dia (por tipo), totais e água */
export default function AlimentacaoScreen() {
  const { t, idioma } = usePreferences();
  const router = useRouter();
  const { refeicoes, aguasHoje, aguaHojeMl, adicionarAgua, removerAgua } = useRecords();
  const hoje = dataDeHoje();
  const [dia, setDia] = useState(hoje);
  const [mostrarListaAgua, setMostrarListaAgua] = useState(false);

  const doDia = refeicoes.filter((r) => r.data === dia).sort((a, b) => a.horario.localeCompare(b.horario));
  const total = {
    kcal: Math.round(doDia.reduce((s, r) => s + r.kcal, 0)),
    prot: Math.round(doDia.reduce((s, r) => s + r.proteinaG, 0) * 10) / 10,
    carb: Math.round(doDia.reduce((s, r) => s + (r.carboidratoG ?? 0), 0)),
  };
  const porTipo = new Map<TipoRefeicao, Refeicao[]>();
  for (const r of doDia) {
    const tp = r.tipo ?? 'outro';
    porTipo.set(tp, [...(porTipo.get(tp) ?? []), r]);
  }

  const rotuloDia = (() => {
    if (dia === hoje) return t('ali.hoje');
    if (dia === deslocarData(hoje, -1)) return t('ali.ontem');
    const [a, m, d] = dia.split('-').map(Number);
    try {
      return new Date(a, m - 1, d).toLocaleDateString(idioma, { weekday: 'short', day: '2-digit', month: '2-digit' });
    } catch {
      return `${d}/${m}`;
    }
  })();

  const novaRefeicao = (tipo?: TipoRefeicao) =>
    router.push({ pathname: '/refeicao', params: { data: dia, ...(tipo ? { tipo } : {}) } });

  return (
    <TelaRolavel>
      {/* Dia */}
      <View style={styles.navDia}>
        <Pressable onPress={() => setDia(deslocarData(dia, -1))} hitSlop={10} style={styles.navBotao}>
          <ChevronLeft size={22} color={colors.primary} strokeWidth={2} />
        </Pressable>
        <ThemedText variant="subheading" color="text" style={{ flex: 1, textAlign: 'center' }}>{rotuloDia}</ThemedText>
        <Pressable onPress={() => setDia(deslocarData(dia, 1))} disabled={dia === hoje} hitSlop={10} style={[styles.navBotao, dia === hoje && { opacity: 0.3 }]}>
          <ChevronRight size={22} color={colors.primary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Totais */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow, styles.totais]}>
        <Total valor={total.kcal} rotulo="kcal" cor="primary" />
        <Total valor={total.prot} rotulo={t('ali.proteina')} cor="secondary" />
        <Total valor={total.carb} rotulo={t('ali.carbo')} cor="accent" />
      </ThemedView>

      <Button label={t('ali.registrar')} size="lg" icon={<Plus size={18} color={colors.background} strokeWidth={2.5} />} onPress={() => novaRefeicao()} style={{ marginBottom: spacing.lg }} />

      {/* Refeições por tipo */}
      {doDia.length === 0 ? (
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="body" color="textSecondary">{t('ali.vazio')}</ThemedText>
          <View style={[styles.chips, { marginTop: spacing.md }]}>
            {TIPOS_REFEICAO.filter((tp) => tp !== 'outro').map((tp) => (
              <Pressable key={tp} onPress={() => novaRefeicao(tp)} style={styles.chip}>
                <Plus size={12} color={colors.primary} strokeWidth={2.5} />
                <ThemedText variant="small" color="primary" style={{ marginLeft: 2 }}>{t(`ref.tipo.${tp}` as never)}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>
      ) : (
        TIPOS_REFEICAO.filter((tp) => porTipo.has(tp)).map((tp) => (
          <ThemedView key={tp} variant="surface" style={[styles.card, styles.cardShadow]}>
            <View style={styles.cabecalhoTipo}>
              <ThemedText variant="subheading" color="text" style={{ flex: 1 }}>{t(`ref.tipo.${tp}` as never)}</ThemedText>
              <ThemedText variant="small" color="textSecondary">
                {Math.round(porTipo.get(tp)!.reduce((s, r) => s + r.kcal, 0))} kcal
              </ThemedText>
            </View>
            {porTipo.get(tp)!.map((r) => (
              <Pressable key={r.id} onPress={() => router.push({ pathname: '/refeicao', params: { id: r.id } })} style={styles.refeicao}>
                {r.fotoUri ? (
                  <Image source={{ uri: r.fotoUri }} style={styles.miniatura} />
                ) : (
                  <View style={[styles.miniatura, styles.semFoto]}>
                    <Camera size={16} color={colors.textSecondary} strokeWidth={1.5} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <ThemedText variant="body" color="text" numberOfLines={2}>
                    {tp === 'outro' && r.tipoPersonalizado ? `${r.tipoPersonalizado}: ` : ''}
                    {r.nome}
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    {r.horario} · {t('ref.macros', { kcal: Math.round(r.kcal), prot: r.proteinaG, carb: r.carboidratoG ?? '–' })}
                  </ThemedText>
                </View>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            ))}
          </ThemedView>
        ))
      )}

      {/* Água (só no dia de hoje) */}
      {dia === hoje && (
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.cabecalhoTipo}>
            <ThemedText variant="subheading" color="text" style={{ flex: 1 }}>{t('d.agua')}</ThemedText>
            {aguasHoje.length > 0 && (
              <Pressable onPress={() => setMostrarListaAgua((v) => !v)}>
                <ThemedText variant="small" color="accent">{mostrarListaAgua ? t('d.ocultar') : t('d.ver')}</ThemedText>
              </Pressable>
            )}
          </View>
          <ThemedText variant="title" color="accent" style={{ marginVertical: spacing.sm }}>{aguaHojeMl} ml</ThemedText>
          <View style={styles.chips}>
            {OPCOES_AGUA.map((ml) => (
              <Pressable key={ml} style={[styles.chip, { borderColor: colors.accent }]} onPress={() => adicionarAgua(ml)}>
                <ThemedText variant="body" color="accent">+{ml} ml</ThemedText>
              </Pressable>
            ))}
          </View>
          {mostrarListaAgua &&
            aguasHoje.map((a) => (
              <View key={a.id} style={styles.itemAgua}>
                <ThemedText variant="body" color="text">{a.horario} · {a.ml} ml</ThemedText>
                <Pressable onPress={() => removerAgua(a.id)} hitSlop={8}>
                  <X size={16} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>
            ))}
        </ThemedView>
      )}

      <Pressable onPress={() => router.push('/recipe-builder')} style={styles.linkReceitas}>
        <BookOpen size={16} color={colors.primary} strokeWidth={2} />
        <ThemedText variant="body" color="primary" style={{ marginLeft: spacing.xs }}>{t('titulos.receitas')}</ThemedText>
      </Pressable>
    </TelaRolavel>
  );
}

function Total({ valor, rotulo, cor }: { valor: number; rotulo: string; cor: 'primary' | 'secondary' | 'accent' }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ThemedText variant="heading" color={cor}>{valor}</ThemedText>
      <ThemedText variant="caption" color="textSecondary">{rotulo}</ThemedText>
    </View>
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
  navDia: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  navBotao: { padding: spacing.xs, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  totais: { flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cabecalhoTipo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  refeicao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  miniatura: { width: 48, height: 48, borderRadius: radius.md },
  semFoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  itemAgua: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkReceitas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
}));
