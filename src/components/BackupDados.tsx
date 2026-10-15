import { useState } from 'react';
import { View, Modal, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { Lock } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { usePreferences } from '@context/PreferencesContext';
import { exportarBackup, escolherBackup, aplicarBackup, abrirBackupCifrado } from '@utils/backup';
import type { DadosCifrados } from '@utils/cifraBackup';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const SENHA_MIN = 6;

type Pedido =
  | { tipo: 'exportar' }
  | { tipo: 'importar'; cifrado: DadosCifrados; exportadoEm: string };

/**
 * Exportar / importar backup, com senha opcional. Usado na aba Saúde e no menu ⋮.
 * Devolve as ações e o `modal` (pedido de senha), que a tela precisa renderizar.
 */
export function useBackupDados() {
  const { t, idioma } = usePreferences();
  const [ocupado, setOcupado] = useState<null | 'backup' | 'restaurar'>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [trabalhando, setTrabalhando] = useState(false);

  function fecharPedido() {
    setPedido(null);
    setSenha('');
    setSenha2('');
    setErro(null);
    setTrabalhando(false);
  }

  function dataLegivel(iso: string) {
    try {
      return new Date(iso).toLocaleString(idioma, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }

  async function gerar(comSenha?: string) {
    setOcupado('backup');
    try {
      if (!(await exportarBackup(t('dados.backup'), comSenha))) Alert.alert(t('dados.erro'));
    } catch {
      Alert.alert(t('dados.erro'));
    } finally {
      setOcupado(null);
    }
  }

  function confirmarRestauracao(dados: Record<string, string>, exportadoEm: string) {
    Alert.alert(t('dados.confirmarTitulo'), t('dados.confirmarMsg', { d: dataLegivel(exportadoEm) }), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('dados.restaurarAgora'),
        style: 'destructive',
        onPress: async () => {
          await aplicarBackup(dados);
          // recarrega o app para todas as telas lerem os dados restaurados
          await Updates.reloadAsync().catch(() => Alert.alert(t('dados.reabra')));
        },
      },
    ]);
  }

  /** Pergunta se quer senha antes de gerar o arquivo */
  function exportar() {
    setPedido({ tipo: 'exportar' });
  }

  async function importar() {
    setOcupado('restaurar');
    const lido = await escolherBackup().catch(() => ({ ok: false as const, motivo: 'invalido' as const }));
    setOcupado(null);
    if (!lido.ok) {
      if (lido.motivo === 'invalido') Alert.alert(t('dados.arquivoInvalido'));
      return;
    }
    if ('cifrado' in lido) {
      setPedido({ tipo: 'importar', cifrado: lido.cifrado, exportadoEm: lido.exportadoEm });
      return;
    }
    confirmarRestauracao(lido.dados, lido.exportadoEm);
  }

  async function confirmarPedido() {
    if (!pedido) return;
    if (pedido.tipo === 'exportar') {
      if (senha.length < SENHA_MIN) return setErro(t('bkp.senhaCurta', { n: SENHA_MIN }));
      if (senha !== senha2) return setErro(t('bkp.senhasDiferentes'));
      const s = senha;
      fecharPedido();
      await gerar(s);
      return;
    }
    setTrabalhando(true);
    const dados = await abrirBackupCifrado(pedido.cifrado, senha);
    setTrabalhando(false);
    if (!dados) return setErro(t('bkp.senhaErrada'));
    const quando = pedido.exportadoEm;
    fecharPedido();
    confirmarRestauracao(dados, quando);
  }

  const modal = (
    <Modal visible={!!pedido} transparent animationType="fade" onRequestClose={fecharPedido}>
      <View style={styles.fundo}>
        <View style={styles.caixa}>
          <View style={styles.linha}>
            <Lock size={20} color={colors.primary} strokeWidth={2} />
            <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs, flex: 1 }}>
              {pedido?.tipo === 'importar' ? t('bkp.tituloAbrir') : t('bkp.tituloProteger')}
            </ThemedText>
          </View>
          <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
            {pedido?.tipo === 'importar' ? t('bkp.descAbrir') : t('bkp.descProteger')}
          </ThemedText>
          <Input
            value={senha}
            onChangeText={(v) => {
              setSenha(v);
              setErro(null);
            }}
            placeholder={t('bkp.senha')}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          {pedido?.tipo === 'exportar' && (
            <Input
              value={senha2}
              onChangeText={(v) => {
                setSenha2(v);
                setErro(null);
              }}
              placeholder={t('bkp.repetir')}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          )}
          {erro && (
            <ThemedText variant="small" color="error" style={{ marginTop: spacing.sm }}>{erro}</ThemedText>
          )}
          {pedido?.tipo === 'exportar' && (
            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
              {t('bkp.aviso')}
            </ThemedText>
          )}
          <View style={[styles.linha, { marginTop: spacing.lg, justifyContent: 'flex-end', gap: spacing.sm }]}>
            {trabalhando ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Button label={t('comum.cancelar')} variant="outline" size="sm" onPress={fecharPedido} />
                <Button
                  label={pedido?.tipo === 'importar' ? t('bkp.abrir') : t('bkp.protegerGerar')}
                  size="sm"
                  onPress={confirmarPedido}
                  disabled={!senha}
                />
              </>
            )}
          </View>
          {pedido?.tipo === 'exportar' && (
            <Pressable
              onPress={() => {
                fecharPedido();
                gerar();
              }}
              style={{ marginTop: spacing.md, alignSelf: 'center' }}
              hitSlop={8}
            >
              <ThemedText variant="small" color="textSecondary">{t('bkp.semSenha')}</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );

  return { exportar, importar, ocupado, modal };
}

const styles = estilosTema(() => ({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg },
  caixa: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  linha: { flexDirection: 'row', alignItems: 'center' },
  input: { textAlign: 'left', marginTop: spacing.md },
}));
