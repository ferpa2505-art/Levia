import { useState } from 'react';
import { View, Pressable, Switch, Modal, Alert, ActivityIndicator } from 'react-native';
import { Lock, Mail, Send } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Input } from '@components/Input';
import { Button } from '@components/Button';
import { MensagemErro } from '@components/forms/MensagemErro';
import { TecladoPin } from '@components/seguranca/TecladoPin';
import { useSeguranca } from '@context/SegurancaContext';
import { useProfile } from '@context/ProfileContext';
import { usePreferences } from '@context/PreferencesContext';
import { OPCOES_BLOQUEIO, autenticarBiometria, tamanhoSenha } from '@utils/seguranca';
import { enviarRelatorioPorEmail } from '@utils/relatorioEmail';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Aba Saúde: e-mail dos relatórios, senha, biometria, tempo de bloqueio e relatórios automáticos */
export function CartaoSeguranca() {
  const { t } = usePreferences();
  const { profile, finalizarOnboarding } = useProfile();
  const seg = useSeguranca();
  const [editandoEmail, setEditandoEmail] = useState(false);
  const [email, setEmail] = useState(profile.email);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [pinAtual, setPinAtual] = useState('');
  const [tam, setTam] = useState<number | null>(null);
  const [erroPin, setErroPin] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const emailLimpo = email.trim().toLowerCase();
  const erroEmail = emailLimpo && !EMAIL_VALIDO.test(emailLimpo) ? t('seg.emailInvalido') : null;
  const nomeBio = t(seg.biometria === 'rosto' ? 'seg.rosto' : seg.biometria === 'digital_rosto' ? 'seg.digitalRosto' : 'seg.digital');

  const rotuloBloqueio = (s: number) => (s === 0 ? t('seg.imediatamente') : s < 60 ? t('seg.segundos', { n: s }) : t('seg.minutos', { n: s / 60 }));

  async function abrirTroca() {
    setPinAtual('');
    setErroPin(false);
    setTam(await tamanhoSenha());
    setTrocandoSenha(true);
  }

  async function conferirAtual(v: string) {
    setPinAtual(v);
    if (tam && v.length === tam) {
      if (await seg.iniciarTrocaSenha(v)) setTrocandoSenha(false);
      else {
        setErroPin(true);
        setTimeout(() => {
          setPinAtual('');
          setErroPin(false);
        }, 450);
      }
    }
  }

  async function alternarBiometria(ligar: boolean) {
    // para ligar, confirma que a pessoa consegue usar a biometria agora
    if (ligar && !(await autenticarBiometria(t('seg.biometriaPrompt'), t('comum.cancelar')))) return;
    seg.atualizarConfig({ biometria: ligar });
  }

  async function enviarAgora() {
    setEnviando(true);
    const r = await enviarRelatorioPorEmail(7, profile.email).catch(() => 'falhou' as const);
    setEnviando(false);
    if (r === 'falhou') Alert.alert(t('dados.erro'));
  }

  return (
    <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
      <View style={styles.cabecalho}>
        <Lock size={20} color={colors.primary} strokeWidth={2} />
        <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>{t('seg.titulo')}</ThemedText>
      </View>

      {/* E-mail */}
      <View style={styles.linha}>
        <Mail size={18} color={colors.textSecondary} strokeWidth={2} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <ThemedText variant="caption" color="textSecondary">{t('seg.emailRotulo')}</ThemedText>
          {editandoEmail ? (
            <>
              <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={[styles.input, erroEmail && { borderColor: colors.error }]} />
              <MensagemErro texto={erroEmail} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm }}>
                <Button label={t('comum.cancelar')} variant="outline" size="sm" onPress={() => { setEmail(profile.email); setEditandoEmail(false); }} style={{ marginRight: spacing.sm }} />
                <Button label={t('comum.salvar')} size="sm" disabled={!EMAIL_VALIDO.test(emailLimpo)} onPress={async () => { await finalizarOnboarding({ email: emailLimpo }); setEditandoEmail(false); }} />
              </View>
            </>
          ) : (
            <ThemedText variant="body" color="text">{profile.email}</ThemedText>
          )}
        </View>
        {!editandoEmail && (
          <Pressable onPress={() => setEditandoEmail(true)} hitSlop={8}>
            <ThemedText variant="small" color="primary">{t('comum.editar')}</ThemedText>
          </Pressable>
        )}
      </View>

      {/* Senha */}
      <Pressable onPress={abrirTroca} style={styles.linha}>
        <ThemedText variant="body" color="text" style={{ flex: 1 }}>{t('seg.trocarSenha')}</ThemedText>
        <ThemedText variant="small" color="primary">{t('comum.editar')}</ThemedText>
      </Pressable>

      {/* Biometria */}
      {seg.biometria && (
        <View style={styles.linha}>
          <ThemedText variant="body" color="text" style={{ flex: 1 }}>{t('seg.usarBio', { b: nomeBio })}</ThemedText>
          <Switch value={seg.config.biometria} onValueChange={alternarBiometria} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
      )}

      {/* Tempo para bloquear */}
      <View style={[styles.linha, { flexDirection: 'column', alignItems: 'flex-start' }]}>
        <ThemedText variant="body" color="text">{t('seg.bloquearApos')}</ThemedText>
        <View style={styles.chips}>
          {OPCOES_BLOQUEIO.map((s) => (
            <Pressable key={s} onPress={() => seg.atualizarConfig({ bloquearAposSeg: s })} style={[styles.chip, seg.config.bloquearAposSeg === s && styles.chipAtivo]}>
              <ThemedText variant="small" color={seg.config.bloquearAposSeg === s ? 'primary' : 'textSecondary'}>{rotuloBloqueio(s)}</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Relatórios */}
      <View style={styles.linha}>
        <ThemedText variant="body" color="text" style={{ flex: 1 }}>{t('seg.relSemanal')}</ThemedText>
        <Switch value={seg.config.relatorioSemanal} onValueChange={(v) => seg.atualizarConfig({ relatorioSemanal: v })} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>
      <View style={styles.linha}>
        <ThemedText variant="body" color="text" style={{ flex: 1 }}>{t('seg.relMensal')}</ThemedText>
        <Switch value={seg.config.relatorioMensal} onValueChange={(v) => seg.atualizarConfig({ relatorioMensal: v })} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>
      <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>{t('seg.relComoFunciona')}</ThemedText>
      <Pressable onPress={enviarAgora} disabled={enviando} style={styles.enviar}>
        {enviando ? <ActivityIndicator color={colors.primary} /> : <Send size={16} color={colors.primary} strokeWidth={2} />}
        <ThemedText variant="body" color="primary" style={{ marginLeft: spacing.xs }}>{t('seg.enviarAgora')}</ThemedText>
      </Pressable>

      {/* Senha atual para trocar */}
      <Modal visible={trocandoSenha} transparent animationType="fade" onRequestClose={() => setTrocandoSenha(false)}>
        <View style={styles.fundoModal}>
          <ThemedView variant="surface" style={styles.caixaModal}>
            <ThemedText variant="subheading" color="text" style={{ textAlign: 'center', marginBottom: spacing.xl }}>{t('seg.senhaAtual')}</ThemedText>
            <TecladoPin valor={pinAtual} onChange={conferirAtual} bolinhas={tam ?? undefined} erro={erroPin} />
            <Pressable onPress={() => setTrocandoSenha(false)} style={{ alignSelf: 'center', marginTop: spacing.lg }}>
              <ThemedText variant="small" color="textSecondary">{t('comum.cancelar')}</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
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
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: { textAlign: 'left', marginTop: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  chipAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  enviar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: spacing.lg },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  caixaModal: { borderRadius: radius.xl, paddingVertical: spacing.xl, paddingHorizontal: spacing.md, alignItems: 'center' },
}));
