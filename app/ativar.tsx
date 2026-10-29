import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { usePreferences } from '@context/PreferencesContext';
import { ativarSerial, lerLicenca, Licenca } from '@utils/licenca';
import { spacing } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

/** Tela para digitar o serial recebido no WhatsApp (ou abrir o link do e-mail, que traz ?token=). */
export default function Ativar() {
  const { t, idioma } = usePreferences();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [serial, setSerial] = useState(typeof token === 'string' ? token : '');
  const [ativando, setAtivando] = useState(false);
  const [erro, setErro] = useState('');
  const [licenca, setLicenca] = useState<Licenca | null>(null);
  const [recemAtivado, setRecemAtivado] = useState(false);

  useEffect(() => { lerLicenca().then(setLicenca); }, []);

  const data = (iso: string) => {
    try { return new Date(iso).toLocaleDateString(idioma, { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return ''; }
  };

  async function ativar() {
    if (ativando || serial.trim().length === 0) return;
    setAtivando(true);
    setErro('');
    const r = await ativarSerial(serial);
    setAtivando(false);
    if (!r.ok) {
      setErro(t(`ativar.erro.${r.motivo}` as never));
      return;
    }
    setSerial('');
    setLicenca({ licenca: '', plano: r.plano, acessoAte: r.acessoAte });
    setRecemAtivado(true);
  }

  function continuar() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        {licenca && (
          <ThemedText variant="body" color="primary" style={{ marginBottom: spacing.md }}>
            {recemAtivado ? t('ativar.ok', { data: data(licenca.acessoAte) }) : t('ativar.ativoAte', { data: data(licenca.acessoAte) })}
          </ThemedText>
        )}

        {recemAtivado ? (
          <Button label={t('ativar.continuar')} onPress={continuar} />
        ) : (
          <>
            <ThemedText variant="body" color="textSecondary" style={{ marginBottom: spacing.md }}>
              {t('ativar.explica')}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.xs }}>{t('ativar.campo')}</ThemedText>
            <Input
              value={serial}
              onChangeText={(v) => { setSerial(v); setErro(''); }}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              maxLength={64}
              returnKeyType="done"
              onSubmitEditing={ativar}
            />
            {erro !== '' && (
              <ThemedText variant="small" color="accent" style={{ marginTop: spacing.sm }}>{erro}</ThemedText>
            )}
            <Button
              label={ativando ? t('ativar.ativando') : t('ativar.botao')}
              onPress={ativar}
              disabled={ativando || serial.trim().length === 0}
              style={{ marginTop: spacing.lg }}
            />
            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.lg }}>
              {t('ativar.semSerial')}
            </ThemedText>
          </>
        )}
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1, paddingTop: spacing.md },
}));
