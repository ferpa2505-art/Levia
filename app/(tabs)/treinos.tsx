import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Activity,
  CalendarDays,
  Library,
  History,
  Play,
  Scale,
  Settings,
  Dumbbell,
  ChevronRight,
} from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { dataISO, diasComTreinoDesde, indicePlano, inicioDaSemanaISO, nomeDiaSemana, seriesPorGrupo } from '@utils/fitnessLogica';
import { MapaMuscular } from '@components/fitness/MapaMuscular';
import { useProfile } from '@context/ProfileContext';

export default function TreinosTab() {
  const { t, idioma } = usePreferences();
  const router = useRouter();
  const { rotinas, plano, loading, sessoes, grupoDe, config } = useFitness();
  const { profile } = useProfile();
  const sexo = profile.sexoBiologico ?? 'masculino';
  const inicioSemana = inicioDaSemanaISO(new Date(), config.inicioSemana);
  const diasTreinados = diasComTreinoDesde(sessoes, inicioSemana);
  const seriesSemana = seriesPorGrupo(sessoes, grupoDe, inicioSemana);
  const totalSeries = Object.values(seriesSemana).reduce((a, b) => a + (b ?? 0), 0);
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const base = new Date(inicioSemana + 'T12:00:00');
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    return { iso: dataISO(d), indice: indicePlano(d), dia: d.getDate(), hoje: dataISO(d) === dataISO(new Date()) };
  });

  const hoje = new Date();
  const rotinaDeHoje = rotinas.find((r) => r.id === plano.semana[indicePlano(hoje)]);

  // próximo dia com treino, para o cartão de descanso
  let proximo: { dia: string; nome: string } | undefined;
  for (let i = 1; i <= 7 && !proximo; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    const r = rotinas.find((x) => x.id === plano.semana[indicePlano(d)]);
    if (r) proximo = { dia: nomeDiaSemana(indicePlano(d), idioma, 'long'), nome: r.nome };
  }

  const semPlano = !loading && rotinas.length === 0;

  const atalhos = [
    { rota: '/fitness/exercicios', rotulo: t('abas.exercicios'), icone: Activity },
    { rota: '/fitness/plano', rotulo: t('fitness.planoSemanal'), icone: CalendarDays },
    { rota: '/fitness/biblioteca', rotulo: t('fitness.biblioteca'), icone: Library },
    { rota: '/fitness/historico', rotulo: t('fitness.historico'), icone: History },
    { rota: '/fitness/peso', rotulo: t('fitness.peso'), icone: Scale },
    { rota: '/fitness/estatisticas', rotulo: t('fitness.estatisticas'), icone: BarChart3 },
    { rota: '/fitness/configuracoes', rotulo: t('fitness.configuracoes'), icone: Settings },
  ] as const;

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedText variant="caption" color="textSecondary">
          {nomeDiaSemana(indicePlano(hoje), idioma, 'long')} · {dataISO(hoje)}
        </ThemedText>

        <ThemedView variant="surface" style={styles.card}>
          <View style={styles.semana}>
            {diasSemana.map((d) => (
              <View key={d.iso} style={styles.diaSemana}>
                <ThemedText variant="small" color="textSecondary">{nomeDiaSemana(d.indice, idioma, 'short')}</ThemedText>
                <View style={[styles.numeroDia, d.hoje && { backgroundColor: colors.primary }]}>
                  <ThemedText variant="body" color={d.hoje ? 'surface' : 'text'}>{d.dia}</ThemedText>
                </View>
                <View style={[styles.ponto, diasTreinados.has(d.iso) && { backgroundColor: colors.primary }]} />
              </View>
            ))}
          </View>
          <ThemedText variant="small" color="textSecondary">{t('fitness.seriesDaSemana', { n: totalSeries })}</ThemedText>
          <MapaMuscular sexo={sexo} series={seriesSemana} />
        </ThemedView>

        {semPlano ? (
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="subheading" color="text">{t('fitness.semPlano')}</ThemedText>
            <ThemedText variant="small" color="textSecondary">{t('fitness.escolherPlano')}</ThemedText>
            <Button label={t('fitness.planoSemanal')} onPress={() => router.push('/fitness/plano')} />
          </ThemedView>
        ) : rotinaDeHoje ? (
          <ThemedView variant="surface" style={styles.card}>
            <View style={styles.linha}>
              <View style={styles.iconeCirculo}>
                <Dumbbell size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ThemedText variant="small" color="textSecondary">{t('fitness.hoje')}</ThemedText>
                <ThemedText variant="subheading" color="text">{rotinaDeHoje.nome}</ThemedText>
                <ThemedText variant="small" color="textSecondary">
                  {rotinaDeHoje.exercicios.length} {t('fitness.exercicios')}
                </ThemedText>
              </View>
            </View>
            <Button
              label={t('fitness.iniciar')}
              icon={<Play size={16} color={colors.background} strokeWidth={2} />}
              onPress={() => router.push(`/fitness/executar/${rotinaDeHoje.id}`)}
            />
          </ThemedView>
        ) : (
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="subheading" color="text">{t('fitness.diaDescanso')}</ThemedText>
            {proximo ? (
              <ThemedText variant="small" color="textSecondary">
                {t('fitness.proximoTreino')} {proximo.dia} · {proximo.nome}
              </ThemedText>
            ) : null}
          </ThemedView>
        )}

        <Button
          label={t('fitness.treinoLivre')}
          variant="outline"
          onPress={() => router.push('/fitness/executar/livre')}
        />

        <View style={styles.grade}>
          {atalhos.map((a) => {
            const Icone = a.icone;
            return (
              <Pressable key={a.rota} onPress={() => router.push(a.rota)} style={styles.atalho} accessibilityRole="button">
                <ThemedView variant="surface" style={styles.atalhoInterno}>
                  <Icone size={22} color={colors.primary} strokeWidth={2} />
                  <ThemedText variant="small" color="text" style={{ marginTop: spacing.sm }}>{a.rotulo}</ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => router.push('/fitness/rotina/novo')} style={styles.linkRotina} accessibilityRole="button">
          <ThemedText variant="body" color="primary">{t('fitness.novaRotina')}</ThemedText>
          <ChevronRight size={18} color={colors.primary} strokeWidth={2} />
        </Pressable>
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  linha: { flexDirection: 'row', alignItems: 'center' },
  iconeCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  semana: { flexDirection: 'row', justifyContent: 'space-between' },
  diaSemana: { alignItems: 'center', gap: 4 },
  numeroDia: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  ponto: { width: 5, height: 5, borderRadius: 3 },
  atalho: { width: '48%' },
  atalhoInterno: { borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  linkRotina: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
});
