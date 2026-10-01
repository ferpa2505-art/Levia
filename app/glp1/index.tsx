import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import {
  Syringe,
  Calendar,
  Bell,
  MapPin,
  Activity,
  RotateCw,
  Info,
  X,
  Utensils,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useGlp1 } from '@context/Glp1Context';
import { isExpoGo } from '@utils/glp1Notifications';
import {
  LOCAIS_APLICACAO,
  SINTOMAS_COMUNS,
  NIVEIS_INTENSIDADE_SINTOMA,
  MEDICAMENTOS_GLP1,
  FREQUENCIAS_LEMBRETE,
} from '@constants/glp1';
import { NivelIntensidadeSintoma } from '@models/glp1';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';
import { usePreferences } from '@context/PreferencesContext';

type Tradutor = ReturnType<typeof usePreferences>['t'];

function formatarDiasRestantes(dias: number | null, t: Tradutor): string {
  if (dias === null) return t('g.primeira');
  if (dias === 0) return t('g.hoje');
  if (dias === 1) return t('g.amanha');
  if (dias > 1) return t('g.emDias', { n: dias });
  if (dias === -1) return t('g.atrasada1');
  return t('g.atrasadaN', { n: Math.abs(dias) });
}

function formatarDataCurta(data: Date | null, idioma: string): string {
  if (!data) return '--';
  try {
    return data.toLocaleDateString(idioma, { day: '2-digit', month: '2-digit' });
  } catch {
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}

/** Data salva como "AAAA-MM-DD" → formato do idioma escolhido */
function formatarDataRegistro(dataIso: string, idioma: string): string {
  const [a, m, d] = dataIso.split('-').map(Number);
  const data = new Date(a, (m || 1) - 1, d || 1);
  if (isNaN(data.getTime())) return dataIso.split('-').reverse().join('/');
  try {
    return data.toLocaleDateString(idioma, { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dataIso.split('-').reverse().join('/');
  }
}

export default function Glp1Screen() {
  const { t, tc, idioma } = usePreferences();
  const router = useRouter();
  // separador decimal do exemplo: vírgula ou ponto, conforme o idioma
  const exemploDecimal = (0.5).toLocaleString(idioma);
  const {
    doses,
    sintomas,
    configCaneta,
    configLembrete,
    ultimaDose,
    proximaDoseData,
    diasAteProximaDose,
    localSugerido,
    adicionarDose,
    removerDose,
    adicionarSintoma,
    removerSintoma,
    atualizarConfigCaneta,
    atualizarConfigLembrete,
  } = useGlp1();

  // --- Registrar dose ---
  const [mostrarFormDose, setMostrarFormDose] = useState(false);
  const [medicamento, setMedicamento] = useState(MEDICAMENTOS_GLP1[0]);
  const [dosagemTexto, setDosagemTexto] = useState('');
  const [local, setLocal] = useState<string | null>(null);
  const [observacoesDose, setObservacoesDose] = useState('');

  function abrirFormDose() {
    setMedicamento(ultimaDose?.medicamento ?? MEDICAMENTOS_GLP1[0]);
    setDosagemTexto('');
    setLocal(localSugerido);
    setObservacoesDose('');
    setMostrarFormDose(true);
  }

  const dosagemNum = parseFloat(dosagemTexto.replace(',', '.'));
  const doseValida = !isNaN(dosagemNum) && dosagemNum > 0 && !!local;

  async function handleSalvarDose() {
    if (!doseValida || !local) return;
    await adicionarDose(medicamento, dosagemNum, local, observacoesDose);
    setMostrarFormDose(false);
  }

  // --- Sintomas ---
  const [mostrarFormSintoma, setMostrarFormSintoma] = useState(false);
  const [sintomaSelecionado, setSintomaSelecionado] = useState(SINTOMAS_COMUNS[0]);
  const [intensidade, setIntensidade] = useState<NivelIntensidadeSintoma>('Leve');
  const [observacoesSintoma, setObservacoesSintoma] = useState('');

  function abrirFormSintoma() {
    setSintomaSelecionado(SINTOMAS_COMUNS[0]);
    setIntensidade('Leve');
    setObservacoesSintoma('');
    setMostrarFormSintoma(true);
  }

  async function handleSalvarSintoma() {
    await adicionarSintoma(sintomaSelecionado, intensidade, observacoesSintoma);
    setMostrarFormSintoma(false);
  }

  // --- Calculadora de cliques ---
  const [mgCanetaTexto, setMgCanetaTexto] = useState(
    configCaneta.mgTotalCaneta != null ? String(configCaneta.mgTotalCaneta) : ''
  );
  const [cliquesCanetaTexto, setCliquesCanetaTexto] = useState(
    configCaneta.cliquesTotaisCaneta != null ? String(configCaneta.cliquesTotaisCaneta) : ''
  );
  const [doseDesejadaTexto, setDoseDesejadaTexto] = useState('');

  const mgCanetaNum = parseFloat(mgCanetaTexto.replace(',', '.'));
  const cliquesCanetaNum = parseInt(cliquesCanetaTexto, 10);
  const doseDesejadaNum = parseFloat(doseDesejadaTexto.replace(',', '.'));

  const configCanetaValida = !isNaN(mgCanetaNum) && mgCanetaNum > 0 && !isNaN(cliquesCanetaNum) && cliquesCanetaNum > 0;
  const cliquesCalculados =
    configCanetaValida && !isNaN(doseDesejadaNum) && doseDesejadaNum > 0
      ? Math.round((doseDesejadaNum / mgCanetaNum) * cliquesCanetaNum)
      : null;

  async function handleSalvarConfigCaneta() {
    if (!configCanetaValida) return;
    await atualizarConfigCaneta(mgCanetaNum, cliquesCanetaNum);
  }

  // --- Lembrete ---
  async function handleAlternarLembrete() {
    await atualizarConfigLembrete(!configLembrete.ativo, configLembrete.frequenciaDias);
  }

  async function handleEscolherFrequencia(dias: number) {
    await atualizarConfigLembrete(configLembrete.ativo, dias);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="heading" color="text">{t('titulos.glp1')}</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            {t('g.sub')}
          </ThemedText>
        </View>

        <Pressable onPress={() => router.push('/apetite')}>
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow, styles.atalhoRow]}>
            <Utensils size={18} color={colors.primary} strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <ThemedText variant="subheading" color="text">{t('titulos.apetite')}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{t('g.apetiteDesc')}</ThemedText>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </ThemedView>
        </Pressable>

        {/* Próxima dose */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.cardTituloRow}>
            <Calendar size={18} color={colors.primary} strokeWidth={2} />
            <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
              {t('g.proxima')}
            </ThemedText>
          </View>

          {ultimaDose ? (
            <>
              <ThemedText variant="title" color="primary" style={{ marginTop: spacing.sm }}>
                {formatarDataCurta(proximaDoseData, idioma)}
              </ThemedText>
              <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
                {formatarDiasRestantes(diasAteProximaDose, t)}
              </ThemedText>
              <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
                {t('g.ultima', { med: tc(ultimaDose.medicamento), mg: ultimaDose.dosagemMg, local: tc(ultimaDose.local) })}
              </ThemedText>
            </>
          ) : (
            <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.sm }}>
              {formatarDiasRestantes(null, t)}
            </ThemedText>
          )}
{configLembrete.ativo && isExpoGo && (
  <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
    {t('g.expoGo')}
  </ThemedText>
)}
          <View style={styles.lembreteRow}>
            <View style={styles.lembreteTituloRow}>
              <Bell size={16} color={colors.textSecondary} strokeWidth={2} />
              <ThemedText variant="small" color="textSecondary" style={{ marginLeft: spacing.xs }}>
                {t('g.lembrete')}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleAlternarLembrete}
              style={[styles.toggle, configLembrete.ativo && styles.toggleAtivo]}
            >
              <ThemedText variant="small" color={configLembrete.ativo ? 'primary' : 'textSecondary'}>
                {configLembrete.ativo ? t('g.ativado') : t('g.desativado')}
              </ThemedText>
            </Pressable>
          </View>

          {configLembrete.ativo && (
            <View style={styles.chipsRow}>
              {FREQUENCIAS_LEMBRETE.map((f) => {
                const selecionada = configLembrete.frequenciaDias === f.dias;
                return (
                  <Pressable
                    key={f.dias}
                    style={[styles.chip, selecionada && styles.chipSelecionado]}
                    onPress={() => handleEscolherFrequencia(f.dias)}
                  >
                    <ThemedText variant="small" color={selecionada ? 'primary' : 'textSecondary'}>
                      {tc(f.label)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ThemedView>

        {/* Registrar dose */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.cardHeaderComBotao}>
            <View style={styles.cardTituloRow}>
              <Syringe size={18} color={colors.primary} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                {t('g.registrarDose')}
              </ThemedText>
            </View>
            {!mostrarFormDose && (
              <Button label={t('g.registrar')} variant="outline" size="sm" onPress={abrirFormDose} />
            )}
          </View>

          {mostrarFormDose && (
            <View style={styles.form}>
              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('g.medicamento')}
              </ThemedText>
              <View style={styles.chipsRow}>
                {MEDICAMENTOS_GLP1.map((m) => {
                  const selecionado = medicamento === m;
                  return (
                    <Pressable
                      key={m}
                      style={[styles.chip, selecionado && styles.chipSelecionado]}
                      onPress={() => setMedicamento(m)}
                    >
                      <ThemedText variant="small" color={selecionado ? 'primary' : 'textSecondary'}>
                        {tc(m)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('g.dosagem')}
              </ThemedText>
              <Input
                value={dosagemTexto}
                onChangeText={setDosagemTexto}
                placeholder={t('g.exemplo', { v: exemploDecimal })}
                keyboardType="decimal-pad"
                style={styles.formInput}
              />

              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('g.local')}
              </ThemedText>
              <View style={styles.chipsRow}>
                {LOCAIS_APLICACAO.map((opcao) => {
                  const selecionado = local === opcao;
                  const sugerido = localSugerido === opcao;
                  return (
                    <Pressable
                      key={opcao}
                      style={[styles.chip, selecionado && styles.chipSelecionado]}
                      onPress={() => setLocal(opcao)}
                    >
                      <View style={styles.localChipConteudo}>
                        <MapPin
                          size={12}
                          color={selecionado ? colors.primary : colors.textSecondary}
                          strokeWidth={2}
                        />
                        <ThemedText
                          variant="small"
                          color={selecionado ? 'primary' : 'textSecondary'}
                          style={{ marginLeft: 4 }}
                        >
                          {tc(opcao)}{sugerido ? ` · ${t('g.sugerido')}` : ''}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('g.obs')}
              </ThemedText>
              <Input
                value={observacoesDose}
                onChangeText={setObservacoesDose}
                placeholder={t('g.obsDosePh')}
                style={[styles.formInput, { textAlign: 'left' }]}
              />

              <View style={styles.formButtons}>
                <Button
                  label={t('comum.cancelar')}
                  variant="outline"
                  size="sm"
                  onPress={() => setMostrarFormDose(false)}
                  style={{ marginRight: spacing.sm }}
                />
                <Button label={t('comum.salvar')} variant="primary" size="sm" onPress={handleSalvarDose} disabled={!doseValida} />
              </View>
            </View>
          )}

          {doses.length > 0 && (
            <View style={styles.lista}>
              {doses.slice(0, 5).map((d) => (
                <View key={d.id} style={styles.itemLista}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">
                      {tc(d.medicamento)} · {d.dosagemMg} mg
                    </ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {formatarDataRegistro(d.data, idioma)} · {d.horario} · {tc(d.local)}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerDose(d.id)} style={styles.removerBotao}>
                    <X size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Calculadora de cliques */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.cardTituloRow}>
            <RotateCw size={18} color={colors.primary} strokeWidth={2} />
            <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
              {t('g.calc')}
            </ThemedText>
          </View>
          <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
            {t('g.calcSub')}
          </ThemedText>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('g.mgCaneta')}
              </ThemedText>
              <Input
                value={mgCanetaTexto}
                onChangeText={setMgCanetaTexto}
                placeholder={t('g.exemplo', { v: 5 })}
                keyboardType="decimal-pad"
                style={styles.formInput}
              />
            </View>
            <View style={styles.formCol}>
              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('g.cliquesCaneta')}
              </ThemedText>
              <Input
                value={cliquesCanetaTexto}
                onChangeText={setCliquesCanetaTexto}
                placeholder={t('g.exemplo', { v: 60 })}
                keyboardType="number-pad"
                style={styles.formInput}
              />
            </View>
          </View>

          <Button
            label={t('g.salvarCaneta')}
            variant="outline"
            size="sm"
            onPress={handleSalvarConfigCaneta}
            disabled={!configCanetaValida}
            style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
          />

          <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
            {t('g.doseDesejada')}
          </ThemedText>
          <Input
            value={doseDesejadaTexto}
            onChangeText={setDoseDesejadaTexto}
            placeholder={t('g.exemplo', { v: exemploDecimal })}
            keyboardType="decimal-pad"
            style={styles.formInput}
            editable={configCanetaValida}
          />

          {cliquesCalculados !== null && (
            <ThemedText variant="title" color="primary" style={{ marginTop: spacing.md }}>
              {t('g.cliques', { n: cliquesCalculados })}
            </ThemedText>
          )}

          <View style={styles.avisoBox}>
            <Info size={14} color={colors.textSecondary} strokeWidth={2} />
            <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: spacing.xs, flex: 1 }}>
              {t('g.aviso')}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Sintomas */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.cardHeaderComBotao}>
            <View style={styles.cardTituloRow}>
              <Activity size={18} color={colors.primary} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                {t('g.sintomas')}
              </ThemedText>
            </View>
            {!mostrarFormSintoma && (
              <Button label={t('g.registrar')} variant="outline" size="sm" onPress={abrirFormSintoma} />
            )}
          </View>

          {mostrarFormSintoma && (
            <View style={styles.form}>
              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('g.sintoma')}
              </ThemedText>
              <View style={styles.chipsRow}>
                {SINTOMAS_COMUNS.map((s) => {
                  const selecionado = sintomaSelecionado === s;
                  return (
                    <Pressable
                      key={s}
                      style={[styles.chip, selecionado && styles.chipSelecionado]}
                      onPress={() => setSintomaSelecionado(s)}
                    >
                      <ThemedText variant="small" color={selecionado ? 'primary' : 'textSecondary'}>
                        {tc(s)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('e.intensidade')}
              </ThemedText>
              <View style={styles.chipsRow}>
                {NIVEIS_INTENSIDADE_SINTOMA.map((nivel) => {
                  const selecionado = intensidade === nivel;
                  return (
                    <Pressable
                      key={nivel}
                      style={[styles.chip, selecionado && styles.chipSelecionado]}
                      onPress={() => setIntensidade(nivel)}
                    >
                      <ThemedText variant="small" color={selecionado ? 'primary' : 'textSecondary'}>
                        {tc(nivel)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText variant="small" color="textSecondary" style={styles.rotulo}>
                {t('g.obs')}
              </ThemedText>
              <Input
                value={observacoesSintoma}
                onChangeText={setObservacoesSintoma}
                placeholder={t('g.obsSintPh')}
                style={[styles.formInput, { textAlign: 'left' }]}
              />

              <View style={styles.formButtons}>
                <Button
                  label={t('comum.cancelar')}
                  variant="outline"
                  size="sm"
                  onPress={() => setMostrarFormSintoma(false)}
                  style={{ marginRight: spacing.sm }}
                />
                <Button label={t('comum.salvar')} variant="primary" size="sm" onPress={handleSalvarSintoma} />
              </View>
            </View>
          )}

          {sintomas.length === 0 && !mostrarFormSintoma ? (
            <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
              {t('g.semSintomas')}
            </ThemedText>
          ) : (
            <View style={styles.lista}>
              {sintomas.slice(0, 5).map((s) => (
                <View key={s.id} style={styles.itemLista}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text">
                      {tc(s.sintoma)} · {tc(s.intensidade)}
                    </ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {formatarDataRegistro(s.data, idioma)} · {s.horario}
                      {s.observacoes ? ` · ${s.observacoes}` : ''}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removerSintoma(s.id)} style={styles.removerBotao}>
                    <X size={16} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1 },
  header: { marginBottom: spacing['2xl'] },
  card: { padding: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xl },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTituloRow: { flexDirection: 'row', alignItems: 'center' },
  atalhoRow: { flexDirection: 'row', alignItems: 'center' },
  cardHeaderComBotao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lembreteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lembreteTituloRow: { flexDirection: 'row', alignItems: 'center' },
  toggle: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  toggleAtivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  form: { marginTop: spacing.md },
  rotulo: { marginTop: spacing.md, marginBottom: spacing.xs },
  formInput: { textAlign: 'left', marginBottom: spacing.sm },
  formRow: { flexDirection: 'row', gap: spacing.sm },
  formCol: { flex: 1 },
  formButtons: { flexDirection: 'row', marginTop: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelecionado: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  localChipConteudo: { flexDirection: 'row', alignItems: 'center' },
  avisoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  lista: { marginTop: spacing.md },
  itemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  removerBotao: { padding: spacing.sm },
}));
