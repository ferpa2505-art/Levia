import { useState } from 'react';
import { View, Pressable, Switch, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pill, Trash2 } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useMedicacoes } from '@context/MedicacoesContext';
import { usePreferences } from '@context/PreferencesContext';
import { UNIDADES_DOSE, rotuloUnidade, UsoMedicacao, FrequenciaContinua } from '@models/medicacoes';
import { buscarMedicamentos } from '@utils/buscaMedicamentos';
import { horariosDoDia, dosesDoTratamento } from '@utils/agendaMedicacao';
import { SeletorHorario, agoraHHMM } from '@components/forms/SeletorHorario';
import { SeletorData } from '@components/forms/SeletorData';
import { Seletor } from '@components/forms/Seletor';
import { MensagemErro } from '@components/forms/MensagemErro';
import { useCampoTocado } from '@hooks/useCampoTocado';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const INTERVALOS = [4, 6, 8, 12, 24];
const VEZES_POR_DIA = [1, 2, 3, 4, 6];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function MedicacaoScreen() {
  const { t, idioma } = usePreferences();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { medicacoes, salvarMedicacao, removerMedicacao } = useMedicacoes();
  const existente = id ? medicacoes.find((m) => m.id === id) : undefined;

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [principio, setPrincipio] = useState(existente?.principio);
  const [escolheuSugestao, setEscolheuSugestao] = useState(!!existente);
  const [dose, setDose] = useState(existente?.dose ?? '');
  const [unidade, setUnidade] = useState(existente?.unidade ?? 'mg');
  const [continuo, setContinuo] = useState(existente ? existente.uso === 'continuo' : true);
  const [naoContinuo, setNaoContinuo] = useState<'tratamento' | 'esporadico'>(
    existente?.uso === 'esporadico' ? 'esporadico' : 'tratamento'
  );
  const [frequencia, setFrequencia] = useState<FrequenciaContinua>(existente?.frequencia ?? 'horas');
  const [intervalo, setIntervalo] = useState(existente?.intervaloHoras ?? 24);
  const [primeiraDose, setPrimeiraDose] = useState(existente?.primeiraDose ?? agoraHHMM());
  const [dias, setDias] = useState(String(existente?.dias ?? 7));
  const [vezes, setVezes] = useState(existente?.vezesPorDia ?? 1);
  const inicioExistente = existente?.inicio ? new Date(existente.inicio) : null;
  const [dataInicio, setDataInicio] = useState<Date>(inicioExistente ?? new Date());
  const [horaInicio, setHoraInicio] = useState(
    inicioExistente ? `${pad(inicioExistente.getHours())}:${pad(inicioExistente.getMinutes())}` : agoraHHMM()
  );
  const campoNome = useCampoTocado();
  const campoDias = useCampoTocado();
  const [lembretes, setLembretes] = useState(existente?.lembretes ?? true);
  const [calendario, setCalendario] = useState(existente?.calendario ?? false);
  const [obs, setObs] = useState(existente?.observacoes ?? '');
  const [salvando, setSalvando] = useState(false);

  const uso: UsoMedicacao = continuo ? 'continuo' : naoContinuo;
  const sugestoes = escolheuSugestao ? [] : buscarMedicamentos(nome, idioma);

  // --- validação (mostrada enquanto preenche) e prévia ---
  const [hh, mm] = horaInicio.split(':').map(Number);
  const diasNum = parseInt(dias, 10);
  const inicio = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate(), hh, mm);
  const doses = diasNum > 0 ? dosesDoTratamento(inicio, diasNum, vezes) : [];
  const fim = doses[doses.length - 1];

  const erroNome = !nome.trim() ? t('med.erroNome') : null;
  const erroDose = dose.trim() && !/^\d+([.,]\d+)?(\/\d+)?$/.test(dose.trim()) ? t('form.erroNumero') : null;
  const erroDias = uso === 'tratamento' && !(diasNum >= 1 && diasNum <= 365) ? t('form.erroDias') : null;
  const erros = [erroNome, erroDose, erroDias].filter(Boolean) as string[];

  const formatarDataHora = (d: Date) => {
    try {
      return d.toLocaleString(idioma, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  };

  async function handleSalvar() {
    if (erros.length) {
      campoNome.tocar();
      campoDias.tocar();
      return;
    }
    setSalvando(true);
    const iso = `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())}T${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`;
    const r = await salvarMedicacao({
      id: existente?.id,
      nome: nome.trim(),
      principio,
      dose: dose.trim(),
      unidade,
      uso,
      frequencia: uso === 'continuo' ? frequencia : undefined,
      intervaloHoras: uso === 'continuo' && frequencia === 'horas' ? intervalo : undefined,
      primeiraDose: uso === 'continuo' ? primeiraDose : undefined,
      diaSemana: uso === 'continuo' && frequencia === 'semanal' ? new Date().getDay() : undefined,
      dias: uso === 'tratamento' ? diasNum : undefined,
      vezesPorDia: uso === 'tratamento' ? vezes : undefined,
      inicio: uso === 'tratamento' ? iso : undefined,
      observacoes: obs.trim() || undefined,
      lembretes: uso !== 'esporadico' && lembretes,
      calendario: uso !== 'esporadico' && calendario,
    });
    setSalvando(false);
    const partes: string[] = [];
    if (uso !== 'esporadico' && lembretes) {
      partes.push(r.lembretesAgendados > 0 ? t('med.okLembretes') : t('med.semPermissao'));
    }
    if (uso !== 'esporadico' && calendario) {
      partes.push(r.calendarioNegado ? t('med.calendarioNegado') : t('med.okCalendario', { n: r.eventosCriados }));
    }
    Alert.alert(t('med.salva'), partes.join('\n\n') || undefined, [{ text: 'OK', onPress: () => router.back() }]);
  }

  function handleExcluir() {
    if (!existente) return;
    Alert.alert(t('med.excluirTitulo'), t('med.excluirMsg', { nome: existente.nome }), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('med.excluir'),
        style: 'destructive',
        onPress: async () => {
          await removerMedicacao(existente.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <TelaRolavel>
      <ThemedView style={{ flex: 1 }}>
        {/* Nome com sugestões */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <Rotulo texto={t('med.nome')} />
          <Input
            value={nome}
            onChangeText={(v) => {
              setNome(v);
              setPrincipio(undefined);
              setEscolheuSugestao(false);
            }}
            placeholder={t('med.nomePh')}
            onBlur={campoNome.tocar}
            style={[styles.input, campoNome.mostrar(nome, erroNome) && styles.inputErro]}
          />
          <MensagemErro texto={campoNome.mostrar(nome, erroNome)} />
          {sugestoes.length > 0 && (
            <View style={styles.sugestoes}>
              {sugestoes.map((s) => (
                <Pressable
                  key={`${s.nome}-${s.principio ?? ''}`}
                  style={styles.sugestao}
                  onPress={() => {
                    setNome(s.nome);
                    setPrincipio(s.principio);
                    setEscolheuSugestao(true);
                  }}
                >
                  <ThemedText variant="body" color="text">{s.nome}</ThemedText>
                  {s.principio ? (
                    <ThemedText variant="caption" color="textSecondary">{s.principio}</ThemedText>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
          {nome.trim().length > 0 && nome.trim().length < 3 && !escolheuSugestao && (
            <ThemedText variant="caption" color="textSecondary">{t('med.dica3letras')}</ThemedText>
          )}
          {principio ? (
            <ThemedText variant="caption" color="primary" style={{ marginTop: spacing.xs }}>{principio}</ThemedText>
          ) : null}

          <Rotulo texto={t('med.dose')} />
          <View style={styles.linha}>
            <Input
              value={dose}
              onChangeText={setDose}
              placeholder="500"
              keyboardType="decimal-pad"
              style={[styles.input, { width: 110, marginRight: spacing.sm }, erroDose && styles.inputErro]}
            />
            <View style={{ flex: 1 }}>
              <Seletor
                valor={unidade}
                titulo={t('form.unidade')}
                opcoes={UNIDADES_DOSE.map((u) => ({ valor: u.codigo, rotulo: rotuloUnidade(u.codigo, idioma) }))}
                onChange={setUnidade}
              />
            </View>
          </View>
          <MensagemErro texto={erroDose} />
        </ThemedView>

        {/* Tipo de uso */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.switchLinha}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="subheading" color="text">{t('med.continuo')}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">{t('med.continuoDesc')}</ThemedText>
            </View>
            <Switch value={continuo} onValueChange={setContinuo} trackColor={{ true: colors.primary, false: colors.border }} />
          </View>

          {continuo ? (
            <>
              <Rotulo texto={t('med.frequencia')} />
              <View style={styles.chips}>
                {INTERVALOS.map((h) => (
                  <Chip
                    key={h}
                    ativo={frequencia === 'horas' && intervalo === h}
                    texto={h === 24 ? t('med.1xDia') : t('med.cadaH', { h })}
                    onPress={() => {
                      setFrequencia('horas');
                      setIntervalo(h);
                    }}
                  />
                ))}
                <Chip ativo={frequencia === 'semanal'} texto={t('med.1xSemana')} onPress={() => setFrequencia('semanal')} />
              </View>
              <Rotulo texto={t('med.primeiraDose')} />
              <SeletorHorario valor={primeiraDose} onChange={setPrimeiraDose} />
              <ThemedText variant="small" color="primary" style={{ marginTop: spacing.sm }}>
                {frequencia === 'semanal'
                  ? t('med.previaSemanal', { h: primeiraDose })
                  : t('med.previaHorarios', { h: horariosDoDia(primeiraDose, intervalo).join(', ') })}
              </ThemedText>
            </>
          ) : (
            <>
              <View style={[styles.chips, { marginTop: spacing.md }]}>
                <Chip ativo={naoContinuo === 'tratamento'} texto={t('med.tratamento')} onPress={() => setNaoContinuo('tratamento')} />
                <Chip ativo={naoContinuo === 'esporadico'} texto={t('med.esporadico')} onPress={() => setNaoContinuo('esporadico')} />
              </View>
              {naoContinuo === 'tratamento' ? (
                <>
                  <View style={styles.linha}>
                    <View style={{ flex: 1 }}>
                      <Rotulo texto={t('med.dias')} />
                      <Input
                        value={dias}
                        onChangeText={setDias}
                        onBlur={campoDias.tocar}
                        keyboardType="number-pad"
                        maxLength={3}
                        style={[styles.input, { width: 110 }, campoDias.mostrar(dias, erroDias) && styles.inputErro]}
                      />
                      <MensagemErro texto={campoDias.mostrar(dias, erroDias)} />
                    </View>
                  </View>
                  <Rotulo texto={t('med.vezesDia')} />
                  <View style={styles.chips}>
                    {VEZES_POR_DIA.map((v) => (
                      <Chip key={v} ativo={vezes === v} texto={t('med.xVezes', { n: v })} onPress={() => setVezes(v)} />
                    ))}
                  </View>
                  <Rotulo texto={t('med.inicioData')} />
                  <SeletorData valor={dataInicio} onChange={setDataInicio} />
                  <Rotulo texto={t('med.inicioHora')} />
                  <SeletorHorario valor={horaInicio} onChange={setHoraInicio} />
                  {fim && (
                    <ThemedText variant="small" color="primary" style={{ marginTop: spacing.sm }}>
                      {t('med.previaTratamento', { n: doses.length, fim: formatarDataHora(fim) })}
                    </ThemedText>
                  )}
                </>
              ) : (
                <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
                  {t('med.esporadicoDesc')}
                </ThemedText>
              )}
            </>
          )}
        </ThemedView>

        {/* Lembretes e calendário */}
        {uso !== 'esporadico' && (
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
            <View style={styles.switchLinha}>
              <View style={{ flex: 1 }}>
                <ThemedText variant="body" color="text">{t('med.lembretes')}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">{t('med.lembretesDesc')}</ThemedText>
              </View>
              <Switch value={lembretes} onValueChange={setLembretes} trackColor={{ true: colors.primary, false: colors.border }} />
            </View>
            <View style={[styles.switchLinha, { marginTop: spacing.md }]}>
              <View style={{ flex: 1 }}>
                <ThemedText variant="body" color="text">{t('med.calendario')}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">{t('med.calendarioDesc')}</ThemedText>
              </View>
              <Switch value={calendario} onValueChange={setCalendario} trackColor={{ true: colors.primary, false: colors.border }} />
            </View>
          </ThemedView>
        )}

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <Rotulo texto={t('med.obs')} />
          <Input value={obs} onChangeText={setObs} placeholder={t('med.obsPh')} multiline style={[styles.input, { minHeight: 60 }]} />
        </ThemedView>

        <Button label={t('comum.salvar')} variant="primary" size="lg" onPress={handleSalvar} disabled={salvando} />
        {existente && (
          <Pressable onPress={handleExcluir} style={styles.excluir}>
            <Trash2 size={16} color={colors.error} strokeWidth={2} />
            <ThemedText variant="body" color="error" style={{ marginLeft: spacing.xs }}>{t('med.excluir')}</ThemedText>
          </Pressable>
        )}
        <View style={{ height: spacing['2xl'] }} />
      </ThemedView>
    </TelaRolavel>
  );
}

function Rotulo({ texto }: { texto: string }) {
  return (
    <ThemedText variant="small" color="text" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
      {texto}
    </ThemedText>
  );
}

function Chip({ ativo, texto, onPress }: { ativo: boolean; texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]}>
      <ThemedText variant="small" color={ativo ? 'primary' : 'textSecondary'}>{texto}</ThemedText>
    </Pressable>
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
  input: { textAlign: 'left' },
  inputErro: { borderColor: colors.error },
  sugestoes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  sugestao: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  switchLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  linha: { flexDirection: 'row', alignItems: 'flex-end' },
  excluir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
}));
