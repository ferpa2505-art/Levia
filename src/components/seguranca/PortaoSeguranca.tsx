import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Switch, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ShieldCheck } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { LeviaPena } from '@components/LeviaPena';
import { MensagemErro } from '@components/forms/MensagemErro';
import { TecladoPin } from '@components/seguranca/TecladoPin';
import { useSeguranca } from '@context/SegurancaContext';
import { useProfile } from '@context/ProfileContext';
import { usePreferences } from '@context/PreferencesContext';
import { PIN_MIN, PIN_MAX, pinValido, tamanhoSenha } from '@utils/seguranca';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Fica por cima do app enquanto falta algo da segurança:
 * 1) e-mail (obrigatório, inclusive para quem já usava o app)
 * 2) criar a senha de 4 a 10 dígitos (e ligar a biometria)
 * 3) desbloquear com senha ou biometria
 */
export function PortaoSeguranca() {
  const { profile, loading } = useProfile();
  const seg = useSeguranca();
  if (loading || !seg.carregado || !profile.onboardingConcluido) return null;
  if (!profile.email) return <Fundo><TelaEmail /></Fundo>;
  if (!seg.temSenha || seg.redefinindo) return <Fundo><TelaCriarSenha /></Fundo>;
  if (seg.bloqueado) return <Fundo><TelaDesbloqueio /></Fundo>;
  return null;
}

function Fundo({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.fundo}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Cabecalho({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: spacing['2xl'] }}>
      <LeviaPena size={56} />
      <ThemedText variant="heading" color="text" style={{ marginTop: spacing.lg, textAlign: 'center' }}>{titulo}</ThemedText>
      {sub ? (
        <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>{sub}</ThemedText>
      ) : null}
    </View>
  );
}

/* --------------------------- 1) E-mail --------------------------- */
function TelaEmail() {
  const { t } = usePreferences();
  const { finalizarOnboarding } = useProfile();
  const [email, setEmail] = useState('');
  const [tocado, setTocado] = useState(false);
  const limpo = email.trim().toLowerCase();
  const erro = (tocado || limpo.length > 5) && !EMAIL_VALIDO.test(limpo) ? t('seg.emailInvalido') : null;

  return (
    <>
      <Cabecalho titulo={t('seg.emailTitulo')} sub={t('seg.emailSub')} />
      <View style={styles.linhaIcone}>
        <Mail size={18} color={colors.primary} strokeWidth={2} />
        <ThemedText variant="small" color="text" style={{ marginLeft: spacing.xs }}>{t('seg.emailRotulo')}</ThemedText>
      </View>
      <Input
        value={email}
        onChangeText={setEmail}
        onBlur={() => setTocado(true)}
        placeholder="nome@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        style={[styles.input, erro && { borderColor: colors.error }]}
      />
      <MensagemErro texto={erro} />
      <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>{t('seg.emailPrivacidade')}</ThemedText>
      <Button
        label={t('comum.continuar')}
        size="lg"
        disabled={!EMAIL_VALIDO.test(limpo)}
        onPress={() => finalizarOnboarding({ email: limpo })}
        style={{ marginTop: spacing['2xl'] }}
      />
    </>
  );
}

/* ------------------------ 2) Criar a senha ------------------------ */
function TelaCriarSenha() {
  const { t } = usePreferences();
  const seg = useSeguranca();
  const [etapa, setEtapa] = useState<'criar' | 'confirmar' | 'biometria'>('criar');
  const [pin, setPin] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [usarBio, setUsarBio] = useState(true);

  useEffect(() => {
    if (etapa !== 'confirmar' || confirmacao.length < pin.length) return;
    if (confirmacao === pin) {
      if (seg.biometria) setEtapa('biometria');
      else seg.definirSenha(pin);
    } else {
      setErro(t('seg.naoConfere'));
      setConfirmacao('');
    }
  }, [confirmacao]);

  if (etapa === 'biometria') {
    const nome = t(seg.biometria === 'rosto' ? 'seg.rosto' : seg.biometria === 'digital_rosto' ? 'seg.digitalRosto' : 'seg.digital');
    return (
      <>
        <Cabecalho titulo={t('seg.bioTitulo', { b: nome })} sub={t('seg.bioSub')} />
        <View style={styles.cartao}>
          <ThemedText variant="body" color="text" style={{ flex: 1 }}>{t('seg.usarBio', { b: nome })}</ThemedText>
          <Switch value={usarBio} onValueChange={setUsarBio} trackColor={{ true: colors.primary, false: colors.border }} />
        </View>
        <Button
          label={t('seg.concluir')}
          size="lg"
          style={{ marginTop: spacing['2xl'] }}
          onPress={async () => {
            await seg.atualizarConfig({ biometria: usarBio });
            await seg.definirSenha(pin);
          }}
        />
      </>
    );
  }

  const confirmando = etapa === 'confirmar';
  return (
    <>
      <Cabecalho
        titulo={confirmando ? t('seg.confirmarTitulo') : seg.redefinindo ? t('seg.novaSenhaTitulo') : t('seg.criarTitulo')}
        sub={confirmando ? t('seg.confirmarSub') : t('seg.criarSub', { min: PIN_MIN, max: PIN_MAX })}
      />
      <TecladoPin
        valor={confirmando ? confirmacao : pin}
        onChange={(v) => {
          setErro(null);
          confirmando ? setConfirmacao(v) : setPin(v);
        }}
        bolinhas={confirmando ? pin.length : undefined}
        erro={!!erro}
      />
      <MensagemErro texto={erro} />
      {!confirmando && (
        <Button
          label={t('comum.continuar')}
          size="lg"
          disabled={!pinValido(pin)}
          onPress={() => setEtapa('confirmar')}
          style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
        />
      )}
      {confirmando && (
        <Pressable onPress={() => { setEtapa('criar'); setPin(''); setConfirmacao(''); }} style={{ marginTop: spacing.lg }}>
          <ThemedText variant="small" color="primary">{t('seg.recomecar')}</ThemedText>
        </Pressable>
      )}
    </>
  );
}

/* -------------------------- 3) Desbloquear ------------------------- */
function TelaDesbloqueio() {
  const { t } = usePreferences();
  const { profile } = useProfile();
  const seg = useSeguranca();
  const [pin, setPin] = useState('');
  const [tamanho, setTamanho] = useState<number | null>(null);
  const [erro, setErro] = useState(false);
  const pediuBio = useRef(false);

  useEffect(() => {
    tamanhoSenha().then(setTamanho);
  }, []);

  // pede a biometria assim que a tela aparece
  useEffect(() => {
    if (pediuBio.current || !seg.config.biometria || !seg.biometria) return;
    pediuBio.current = true;
    seg.desbloquearComBiometria();
  }, [seg.config.biometria, seg.biometria]);

  async function tentar(valor: string) {
    const ok = await seg.desbloquearComSenha(valor);
    if (!ok) {
      setErro(true);
      setTimeout(() => {
        setPin('');
        setErro(false);
      }, 450);
    }
  }

  function aoDigitar(v: string) {
    setPin(v);
    // desbloqueia sozinho quando chega no tamanho da senha
    if (tamanho && v.length === tamanho) tentar(v);
  }

  function esqueci() {
    if (seg.biometria) {
      Alert.alert(t('seg.esqueciTitulo'), t('seg.esqueciBio'), [
        { text: t('comum.cancelar'), style: 'cancel' },
        { text: t('comum.continuar'), onPress: () => seg.redefinirComBiometria() },
      ]);
    } else {
      Alert.alert(t('seg.esqueciTitulo'), t('seg.esqueciSemBio'));
    }
  }

  const aguardando = seg.esperaMs > 0;
  return (
    <>
      <Cabecalho
        titulo={profile.comoChamar ? t('seg.olaNome', { nome: profile.comoChamar }) : t('seg.desbloquearTitulo')}
        sub={aguardando ? t('seg.aguarde', { s: Math.ceil(seg.esperaMs / 1000) }) : t('seg.desbloquearSub')}
      />
      <TecladoPin
        valor={pin}
        onChange={aoDigitar}
        bolinhas={tamanho ?? undefined}
        erro={erro}
        desabilitado={aguardando}
        biometria={seg.config.biometria ? seg.biometria : null}
        onBiometria={() => seg.desbloquearComBiometria()}
      />
      {!tamanho && (
        <Button label={t('seg.entrar')} size="lg" disabled={pin.length < PIN_MIN || aguardando} onPress={() => tentar(pin)} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />
      )}
      <Pressable onPress={esqueci} style={{ marginTop: spacing.xl }}>
        <ThemedText variant="small" color="primary">{t('seg.esqueci')}</ThemedText>
      </Pressable>
      <View style={[styles.linhaIcone, { marginTop: spacing['2xl'] }]}>
        <ShieldCheck size={14} color={colors.textSecondary} strokeWidth={2} />
        <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>{t('seg.protegido')}</ThemedText>
      </View>
    </>
  );
}

const styles = estilosTema(() => ({
  fundo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 100, elevation: 100 },
  conteudo: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  linhaIcone: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  input: { textAlign: 'left', alignSelf: 'stretch', marginTop: spacing.xs },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
