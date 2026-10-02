import { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Droplet, FileText, Plus, Trash2, AlertTriangle } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { CartaoGlicemia } from '@components/diabetes/CartaoGlicemia';
import { ConfigGlicemia } from '@components/diabetes/ConfigGlicemia';
import { SeletorHorario, agoraHHMM } from '@components/forms/SeletorHorario';
import { MensagemErro } from '@components/forms/MensagemErro';
import { useDiabetes } from '@context/DiabetesContext';
import { usePreferences } from '@context/PreferencesContext';
import { dataDeHoje } from '@utils/recordsStorage';
import { valorMgDl } from '@utils/glicemia';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

type Unidade = 'mg/dL' | 'mmol/L';
/** Faixa aceita para não registrar valor digitado errado */
const LIMITES: Record<Unidade, [number, number]> = { 'mg/dL': [20, 600], 'mmol/L': [1.1, 33.3] };
/** Abaixo disso: hipoglicemia (alerta). Acima de ALTA: alerta de glicemia alta. Em mg/dL. */
const HIPO = 70;
const ALTA = 250;

export default function DiabetesScreen() {
  const { t } = usePreferences();
  const { glicemias, config, adicionarGlicemia, removerGlicemia, notas, adicionarNota, removerNota } = useDiabetes();
  const hoje = dataDeHoje();
  const glicemiasHoje = glicemias.filter((g) => g.data === hoje).sort((a, b) => b.horario.localeCompare(a.horario));
  const notasHoje = notas.filter((n) => n.data === hoje);

  // registro de glicemia
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState('');
  const [unidade, setUnidade] = useState<Unidade>('mg/dL');
  const [horario, setHorario] = useState(agoraHHMM());
  const [obs, setObs] = useState('');

  // nota do dia
  const [notaAberta, setNotaAberta] = useState(false);
  const [nota, setNota] = useState('');

  const numero = parseFloat(valor.replace(',', '.'));
  const [min, max] = LIMITES[unidade];
  const erroValor = valor.trim() && !(numero >= min && numero <= max) ? t('dia.erroValor', { min, max, u: unidade }) : null;

  function abrirRegistro() {
    setHorario(agoraHHMM());
    setAberto(true);
  }

  async function salvarGlicemia() {
    if (!valor.trim() || erroValor) return;
    await adicionarGlicemia(numero, unidade, obs.trim() || undefined, horario);
    setValor('');
    setObs('');
    setAberto(false);
    const mg = unidade === 'mmol/L' ? Math.round(numero * 18) : numero;
    if (mg < HIPO) Alert.alert(t('dia.hipoTitulo', { v: mg }), t('dia.hipoMsg'));
    else if (mg > ALTA) Alert.alert(t('dia.altaTitulo', { v: mg }), t('dia.altaMsg'));
  }

  async function salvarNota() {
    if (!nota.trim()) return;
    await adicionarNota(nota.trim());
    setNota('');
    setNotaAberta(false);
  }

  const corDoValor = (mg: number) => (mg < config.alvoMinMgDl ? 'error' : mg > config.alvoMaxMgDl ? 'warning' : 'primary');

  return (
    <TelaRolavel>
      <CartaoGlicemia />

      {/* Registrar glicemia */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <View style={styles.cabecalho}>
          <Droplet size={20} color={colors.primary} strokeWidth={2} />
          <ThemedText variant="subheading" color="text" style={styles.titulo}>{t('dia.medicoesHoje')}</ThemedText>
          {!aberto && (
            <Pressable onPress={abrirRegistro} style={styles.adicionar} hitSlop={8}>
              <Plus size={16} color={colors.primary} strokeWidth={2.5} />
              <ThemedText variant="small" color="primary" style={{ marginLeft: 2 }}>{t('dia.registrar')}</ThemedText>
            </Pressable>
          )}
        </View>

        {aberto && (
          <View style={styles.formulario}>
            <View style={styles.linha}>
              <Input
                value={valor}
                onChangeText={setValor}
                keyboardType="decimal-pad"
                placeholder={unidade === 'mg/dL' ? '110' : '6,1'}
                autoFocus
                style={[styles.input, { flex: 1 }, erroValor && { borderColor: colors.error }]}
              />
              {(['mg/dL', 'mmol/L'] as Unidade[]).map((u) => (
                <Pressable key={u} onPress={() => setUnidade(u)} style={[styles.chip, unidade === u && styles.chipAtivo]}>
                  <ThemedText variant="small" color={unidade === u ? 'primary' : 'textSecondary'}>{u}</ThemedText>
                </Pressable>
              ))}
            </View>
            <MensagemErro texto={erroValor} />

            <ThemedText variant="small" color="text" style={styles.rotulo}>{t('dia.horario')}</ThemedText>
            <SeletorHorario valor={horario} onChange={setHorario} />

            <Input value={obs} onChangeText={setObs} placeholder={t('dia.obsPh')} style={[styles.input, { marginTop: spacing.md }]} />

            <View style={styles.botoes}>
              <Button label={t('comum.cancelar')} variant="outline" size="sm" onPress={() => setAberto(false)} style={{ marginRight: spacing.sm }} />
              <Button label={t('comum.salvar')} size="sm" onPress={salvarGlicemia} disabled={!valor.trim() || !!erroValor} />
            </View>
          </View>
        )}

        {glicemiasHoje.length === 0 && !aberto ? (
          <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>{t('dia.semMedicoes')}</ThemedText>
        ) : (
          glicemiasHoje.map((g) => (
            <View key={g.id} style={styles.item}>
              <ThemedText variant="small" color="textSecondary" style={styles.hora}>{g.horario}</ThemedText>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {(valorMgDl(g) < HIPO || valorMgDl(g) > ALTA) && (
                    <AlertTriangle size={14} color={valorMgDl(g) < HIPO ? colors.error : colors.warning} strokeWidth={2.5} style={{ marginRight: 4 }} />
                  )}
                  <ThemedText variant="subheading" color={corDoValor(valorMgDl(g))}>
                    {g.valor} <ThemedText variant="caption" color="textSecondary">{g.unidade}</ThemedText>
                  </ThemedText>
                </View>
                {g.notas ? <ThemedText variant="caption" color="textSecondary">{g.notas}</ThemedText> : null}
              </View>
              <Pressable onPress={() => removerGlicemia(g.id)} hitSlop={8}>
                <Trash2 size={16} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          ))
        )}
      </ThemedView>

      <ConfigGlicemia />

      {/* Notas do dia */}
      <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
        <View style={styles.cabecalho}>
          <FileText size={20} color={colors.primary} strokeWidth={2} />
          <ThemedText variant="subheading" color="text" style={styles.titulo}>{t('dia.notas')}</ThemedText>
          {!notaAberta && (
            <Pressable onPress={() => setNotaAberta(true)} style={styles.adicionar} hitSlop={8}>
              <Plus size={16} color={colors.primary} strokeWidth={2.5} />
              <ThemedText variant="small" color="primary" style={{ marginLeft: 2 }}>{t('med.adicionar')}</ThemedText>
            </Pressable>
          )}
        </View>
        {notaAberta && (
          <View style={styles.formulario}>
            <Input value={nota} onChangeText={setNota} placeholder={t('dia.notaPh')} multiline autoFocus style={[styles.input, { minHeight: 80 }]} />
            <View style={styles.botoes}>
              <Button label={t('comum.cancelar')} variant="outline" size="sm" onPress={() => setNotaAberta(false)} style={{ marginRight: spacing.sm }} />
              <Button label={t('comum.salvar')} size="sm" onPress={salvarNota} disabled={!nota.trim()} />
            </View>
          </View>
        )}
        {notasHoje.length === 0 && !notaAberta ? (
          <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>{t('dia.semNotas')}</ThemedText>
        ) : (
          notasHoje.map((n) => (
            <View key={n.id} style={styles.item}>
              <ThemedText variant="small" color="textSecondary" style={styles.hora}>{n.timestamp}</ThemedText>
              <ThemedText variant="body" color="text" style={{ flex: 1 }}>{n.conteudo}</ThemedText>
              <Pressable onPress={() => removerNota(n.id)} hitSlop={8}>
                <Trash2 size={16} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          ))
        )}
      </ThemedView>
    </TelaRolavel>
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
  titulo: { flex: 1, marginLeft: spacing.xs },
  adicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  formulario: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: { textAlign: 'left' },
  rotulo: { marginTop: spacing.md, marginBottom: spacing.xs },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: { borderColor: colors.primary },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  hora: { width: 44 },
}));
