import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { usePreferences } from '@context/PreferencesContext';
import { aoMudarLicenca, ativarSerial, lerLicenca, Licenca } from '@utils/licenca';
import { formatarDataAcesso } from '@utils/dataAcesso';
import { spacing } from '@constants/colors';

/**
 * Serial atual e troca por um novo, dentro do menu ⋮ > Atualizações.
 * Ex.: o teste de 7 dias ganha lugar para o plano pago sem reinstalar o app.
 * A licença guarda só o token assinado, não o serial digitado, então o campo mostra o plano e a validade.
 */
export function TrocaSerial() {
  const { t, idioma } = usePreferences();
  const [licenca, setLicenca] = useState<Licenca | null>(null);
  const [novoSerial, setNovoSerial] = useState('');
  const [ativando, setAtivando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    const recarregar = () => { lerLicenca().then(setLicenca).catch(() => setLicenca(null)); };
    recarregar();
    return aoMudarLicenca(recarregar);
  }, []);

  const dataFim = licenca ? formatarDataAcesso(licenca.acessoAte, idioma) : '';
  const textoAtual = dataFim ? t('ativar.ativoAte', { data: dataFim }) : t('ativar.ativoSemFim');

  async function trocar() {
    const serial = novoSerial.trim();
    if (ativando || serial.length === 0) return;
    setAtivando(true);
    setErro('');
    setSucesso('');
    const resultado = await ativarSerial(serial);
    setAtivando(false);
    if (!resultado.ok) {
      setErro(t(`ativar.erro.${resultado.motivo}` as never));
      return;
    }
    const fim = formatarDataAcesso(resultado.acessoAte, idioma);
    setSucesso(fim ? t('ativar.ok', { data: fim }) : t('ativar.okSemFim'));
    setNovoSerial('');
  }

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.xs }}>{t('ativar.titulo')}</ThemedText>
      {licenca && <ThemedText variant="body" color="primary">{textoAtual}</ThemedText>}

      <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>{t('ativar.campo')}</ThemedText>
      <Input
        value={novoSerial}
        onChangeText={(v) => { setNovoSerial(v); setErro(''); setSucesso(''); }}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={64}
        returnKeyType="done"
        onSubmitEditing={trocar}
      />
      {erro !== '' && <ThemedText variant="small" color="accent" style={{ marginTop: spacing.sm }}>{erro}</ThemedText>}
      {sucesso !== '' && <ThemedText variant="small" color="primary" style={{ marginTop: spacing.sm }}>{sucesso}</ThemedText>}
      <Button
        label={ativando ? t('ativar.ativando') : t('ativar.botao')}
        onPress={trocar}
        disabled={ativando || novoSerial.trim().length === 0}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
}
