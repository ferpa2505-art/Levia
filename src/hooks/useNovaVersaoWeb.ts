import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { bundleDaPagina, haNovaVersao } from '@utils/novaVersao';

/** Não pergunta ao servidor mais de uma vez nesse intervalo */
const INTERVALO_MINIMO = 30 * 60_000;
/** Dá um tempo para o app abrir antes da primeira conferência */
const ESPERA_INICIAL = 20_000;

/**
 * No app instalado pelo navegador (PWA), confere se saiu versão nova: ao abrir, ao voltar para o app e a cada
 * 30 minutos com ele aberto. Devolve true quando há uma versão esperando; a pessoa decide quando recarregar.
 * (No Android/iOS de loja quem atualiza é o expo-updates, ver useVerificarAtualizacao.)
 */
export function useNovaVersaoWeb(ativo: boolean): boolean {
  const [disponivel, setDisponivel] = useState(false);
  const ultima = useRef(0);

  useEffect(() => {
    // no navegador; o projeto não carrega os tipos do DOM, então a página é acessada sem tipo
    const g: any = globalThis;
    const doc: any = g.document;
    if (!ativo || Platform.OS !== 'web' || !doc) return;

    const rodando = bundleDaPagina(
      Array.from(doc.querySelectorAll('script[src]') as ArrayLike<any>).map((el: any) => String(el.src)).join(' '),
    );
    if (!rodando) return;

    async function conferir() {
      if (Date.now() - ultima.current < INTERVALO_MINIMO) return;
      ultima.current = Date.now();
      try {
        // pede o service worker para procurar a versão dele também (mantém o cache em dia)
        g.navigator?.serviceWorker?.getRegistration?.().then((r: any) => r?.update?.()).catch(() => {});
        const resposta = await fetch('/', { cache: 'no-store', headers: { Accept: 'text/html' } } as any);
        if (!resposta.ok) return;
        if (haNovaVersao(rodando, await resposta.text())) setDisponivel(true);
      } catch {
        // sem internet: tenta de novo mais tarde
      }
    }

    const espera = setTimeout(conferir, ESPERA_INICIAL);
    const voltou = () => { if (doc.visibilityState === 'visible') conferir(); };
    doc.addEventListener('visibilitychange', voltou);
    const relogio = setInterval(conferir, INTERVALO_MINIMO);
    return () => {
      clearTimeout(espera);
      clearInterval(relogio);
      doc.removeEventListener('visibilitychange', voltou);
    };
  }, [ativo]);

  return disponivel;
}
