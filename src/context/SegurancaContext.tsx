import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import {
  ConfigSeguranca,
  configSegurancaPadrao,
  carregarConfigSeguranca,
  salvarConfigSeguranca,
  temSenha as lerTemSenha,
  salvarSenha,
  conferirSenha,
  biometriaDisponivel,
  autenticarBiometria,
  TipoBiometria,
  MAX_TENTATIVAS,
  ESPERA_BLOQUEIO_MS,
} from '@utils/seguranca';
import { agendarAvisosRelatorio, enviarRelatorioPorEmail, TIPO_NOTIF_RELATORIO } from '@utils/relatorioEmail';
import { getNotifications } from '@utils/glp1Notifications';
import { useProfile } from '@context/ProfileContext';
import { suspenderBloqueio, consumirSuspensao, bloqueioEstaSuspenso } from '@utils/bloqueioSuspenso';
import { traduzirAtual as t } from '@/i18n';

export { suspenderBloqueio } from '@utils/bloqueioSuspenso';

interface SegurancaValue {
  carregado: boolean;
  temSenha: boolean;
  bloqueado: boolean;
  config: ConfigSeguranca;
  biometria: TipoBiometria;
  /** ms restantes de espera depois de muitas tentativas erradas (0 = liberado) */
  esperaMs: number;
  desbloquearComSenha: (pin: string) => Promise<boolean>;
  desbloquearComBiometria: () => Promise<boolean>;
  definirSenha: (pin: string) => Promise<void>;
  atualizarConfig: (mudancas: Partial<ConfigSeguranca>) => Promise<void>;
  /** Para "Esqueci a senha": confirma pela biometria e libera criar outra */
  redefinirComBiometria: () => Promise<boolean>;
  /** Trocar a senha: confere a atual e abre a tela de nova senha */
  iniciarTrocaSenha: (pinAtual: string) => Promise<boolean>;
  redefinindo: boolean;
}

const SegurancaContext = createContext<SegurancaValue | undefined>(undefined);

export function SegurancaProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const [carregado, setCarregado] = useState(false);
  const [temSenha, setTemSenha] = useState(false);
  const [bloqueado, setBloqueado] = useState(true);
  const [config, setConfig] = useState<ConfigSeguranca>(configSegurancaPadrao);
  const [biometria, setBiometria] = useState<TipoBiometria>(null);
  const [redefinindo, setRedefinindo] = useState(false);
  const [esperaAte, setEsperaAte] = useState(0);
  const [agora, setAgora] = useState(Date.now());
  const tentativas = useRef(0);
  const saiuEm = useRef<number | null>(null);
  const configRef = useRef(config);
  const relatorioPendente = useRef<number | null>(null);
  const [pendenteVersao, setPendenteVersao] = useState(0);

  // carregar
  useEffect(() => {
    (async () => {
      const [tem, c, bio] = await Promise.all([lerTemSenha(), carregarConfigSeguranca(), biometriaDisponivel()]);
      configRef.current = c;
      setConfig(c);
      setTemSenha(tem);
      setBloqueado(tem);
      setBiometria(bio);
      setCarregado(true);
      // reagenda os avisos de relatório (podem ter sido perdidos numa restauração ou reinstalação);
      // antes da configuração inicial não pede permissão de notificação
      if (!tem) return;
      const ids = await agendarAvisosRelatorio(c.relatorioSemanal, c.relatorioMensal, c.relatorioIds ?? []);
      const nova = { ...c, relatorioIds: ids };
      configRef.current = nova;
      setConfig(nova);
      await salvarConfigSeguranca(nova);
    })();
  }, []);

  // bloquear ao voltar para o app depois do tempo escolhido
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') {
        saiuEm.current = Date.now();
        // "imediatamente": já bloqueia ao sair, para o conteúdo não aparecer na volta
        if (temSenha && configRef.current.bloquearAposSeg === 0 && !bloqueioEstaSuspenso()) setBloqueado(true);
      } else if (estado === 'active' && saiuEm.current != null) {
        const fora = (Date.now() - saiuEm.current) / 1000;
        saiuEm.current = null;
        if (consumirSuspensao()) return;
        if (temSenha && fora >= configRef.current.bloquearAposSeg) setBloqueado(true);
        biometriaDisponivel().then(setBiometria);
      }
    });
    return () => sub.remove();
  }, [temSenha]);

  // contador da espera depois de tentativas erradas
  useEffect(() => {
    if (esperaAte <= Date.now()) return;
    const id = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(id);
  }, [esperaAte]);

  // toque na notificação de relatório (com o app aberto ou abrindo por ela)
  useEffect(() => {
    const N = getNotifications();
    if (!N) return;
    const tratar = (data: unknown) => {
      const d = data as { tipo?: string; dias?: number } | undefined;
      if (d?.tipo === TIPO_NOTIF_RELATORIO) {
        relatorioPendente.current = d.dias ?? 7;
        setPendenteVersao((v) => v + 1);
      }
    };
    N.getLastNotificationResponseAsync()
      .then((r) => r && tratar(r.notification.request.content.data))
      .catch(() => {});
    const sub = N.addNotificationResponseReceivedListener((r) => tratar(r.notification.request.content.data));
    return () => sub.remove();
  }, []);

  // quando o app estiver desbloqueado, abre o e-mail do relatório pendente
  useEffect(() => {
    if (!carregado || bloqueado || relatorioPendente.current == null || !profile.email) return;
    const dias = relatorioPendente.current;
    relatorioPendente.current = null;
    suspenderBloqueio();
    enviarRelatorioPorEmail(dias, profile.email).catch(() => {});
  }, [carregado, bloqueado, pendenteVersao, profile.email]);

  const esperaMs = Math.max(0, esperaAte - agora);

  async function desbloquearComSenha(pin: string) {
    if (Date.now() < esperaAte) return false;
    const ok = await conferirSenha(pin);
    if (ok) {
      tentativas.current = 0;
      setBloqueado(false);
      return true;
    }
    tentativas.current += 1;
    if (tentativas.current >= MAX_TENTATIVAS) {
      tentativas.current = 0;
      setEsperaAte(Date.now() + ESPERA_BLOQUEIO_MS);
      setAgora(Date.now());
    }
    return false;
  }

  async function desbloquearComBiometria() {
    if (!configRef.current.biometria || !biometria) return false;
    const ok = await autenticarBiometria(t('seg.biometriaPrompt'), t('seg.usarSenha'));
    if (ok) {
      tentativas.current = 0;
      setBloqueado(false);
    }
    return ok;
  }

  async function redefinirComBiometria() {
    if (!biometria) return false;
    const ok = await autenticarBiometria(t('seg.confirmeIdentidade'), t('comum.cancelar'));
    if (ok) setRedefinindo(true);
    return ok;
  }

  async function iniciarTrocaSenha(pinAtual: string) {
    const ok = await conferirSenha(pinAtual);
    if (ok) setRedefinindo(true);
    return ok;
  }

  async function definirSenha(pin: string) {
    const primeiraVez = !temSenha;
    await salvarSenha(pin);
    setTemSenha(true);
    if (primeiraVez) {
      const c = configRef.current;
      const ids = await agendarAvisosRelatorio(c.relatorioSemanal, c.relatorioMensal, c.relatorioIds ?? []);
      configRef.current = { ...c, relatorioIds: ids };
      setConfig(configRef.current);
      await salvarConfigSeguranca(configRef.current);
    }
    setRedefinindo(false);
    setBloqueado(false);
  }

  async function atualizarConfig(mudancas: Partial<ConfigSeguranca>) {
    let nova = { ...configRef.current, ...mudancas };
    if ('relatorioSemanal' in mudancas || 'relatorioMensal' in mudancas) {
      const ids = await agendarAvisosRelatorio(nova.relatorioSemanal, nova.relatorioMensal, configRef.current.relatorioIds ?? []);
      nova = { ...nova, relatorioIds: ids };
    }
    configRef.current = nova;
    setConfig(nova);
    await salvarConfigSeguranca(nova);
  }

  return (
    <SegurancaContext.Provider
      value={{
        carregado,
        temSenha,
        bloqueado: temSenha && bloqueado && !redefinindo,
        config,
        biometria,
        esperaMs,
        desbloquearComSenha,
        desbloquearComBiometria,
        definirSenha,
        atualizarConfig,
        redefinirComBiometria,
        iniciarTrocaSenha,
        redefinindo,
      }}
    >
      {children}
    </SegurancaContext.Provider>
  );
}

export function useSeguranca() {
  const ctx = useContext(SegurancaContext);
  if (!ctx) throw new Error('useSeguranca precisa estar dentro de SegurancaProvider');
  return ctx;
}
