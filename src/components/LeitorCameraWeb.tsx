import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { usePreferences } from '@context/PreferencesContext';
import { escolherFormatos, primeiroCodigo } from '@utils/leitorWeb';
import { colors, radius, spacing } from '@constants/colors';

/** O pedaço do navegador usado aqui (o projeto não carrega os tipos do DOM). */
interface Resultado { rawValue?: string }
interface Detector { detect(fonte: unknown): Promise<Resultado[]> }
interface ClasseDetector { new (opcoes: { formats: string[] }): Detector; getSupportedFormats(): Promise<string[]> }
interface Trilha { stop(): void }
interface Fluxo { getTracks(): Trilha[] }
interface Video {
  srcObject: unknown;
  muted: boolean;
  playsInline: boolean;
  autoplay: boolean;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  style: Record<string, string>;
  setAttribute(nome: string, valor: string): void;
  play(): Promise<void>;
  remove(): void;
}
interface Entrada {
  type: string;
  accept: string;
  files: ArrayLike<unknown> | null;
  style: { display: string };
  setAttribute(nome: string, valor: string): void;
  addEventListener(evento: 'change' | 'cancel', fn: () => void): void;
  click(): void;
  remove(): void;
}
interface Navegador {
  BarcodeDetector?: ClasseDetector;
  navigator: { mediaDevices?: { getUserMedia(restricoes: unknown): Promise<Fluxo> } };
  document: { createElement(nome: 'video'): Video; createElement(nome: 'input'): Entrada; body: { appendChild(e: unknown): void } };
  createImageBitmap(fonte: unknown): Promise<{ close(): void }>;
}
const navegador = () => globalThis as unknown as Navegador;

const INTERVALO_MS = 250;
const VIDEO_PRONTO = 4; // HTMLMediaElement.HAVE_ENOUGH_DATA
const TAMANHO_MAX_DIAG = 160;

const textoErro = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : 'erro').slice(0, 80);

/**
 * Leitor por câmera na PWA. Usa o leitor de códigos do próprio navegador (BarcodeDetector) sobre vídeo
 * em alta resolução da câmera traseira, e oferece "Tirar foto do código" (foto parada, mais nítida).
 * A linha de diagnóstico mostra só formatos, resolução, tentativas e erro técnico: nenhuma imagem é guardada.
 */
export function LeitorCameraWeb({ ativo, onCodigo }: { ativo: boolean; onCodigo: (codigo: string) => void }) {
  const { t } = usePreferences();
  const caixa = useRef<ComponentRef<typeof View>>(null);
  const detector = useRef<Detector | null>(null);
  const aoLer = useRef(onCodigo);
  aoLer.current = onCodigo;
  const [estado, setEstado] = useState<'abrindo' | 'procurando' | 'erro'>('abrindo');
  const [podeFoto, setPodeFoto] = useState(false);
  const [diagnostico, setDiagnostico] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (!ativo) return undefined;
    const nav = navegador();
    let parado = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let fluxo: Fluxo | null = null;
    let video: Video | null = null;
    let tentativas = 0;
    let ultimoErro = '';

    (async () => {
      try {
        const Classe = nav.BarcodeDetector;
        if (!Classe) throw new Error('navegador sem leitor de código');
        const formatos = escolherFormatos(await Classe.getSupportedFormats());
        if (!formatos.length) throw new Error('aparelho não lê códigos de embalagem');
        detector.current = new Classe({ formats: formatos });
        setPodeFoto(true);
        if (!nav.navigator.mediaDevices) throw new Error('navegador sem acesso à câmera');
        fluxo = await nav.navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (parado) {
          fluxo.getTracks().forEach((trilha) => trilha.stop());
          return;
        }
        video = nav.document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.setAttribute('playsinline', '');
        Object.assign(video.style, { width: '100%', height: '100%', objectFit: 'cover' });
        video.srcObject = fluxo;
        (caixa.current as unknown as { appendChild(e: unknown): void }).appendChild(video);
        await video.play();
        setEstado('procurando');

        const ler = async () => {
          if (parado || !video || !detector.current) return;
          try {
            if (video.readyState >= VIDEO_PRONTO) {
              tentativas += 1;
              const codigo = primeiroCodigo(await detector.current.detect(video));
              if (codigo) {
                aoLer.current(codigo);
                return;
              }
            }
          } catch (e) {
            ultimoErro = textoErro(e);
          }
          setDiagnostico(
            `formatos=${formatos.join(',')} · imagem=${video.videoWidth}x${video.videoHeight} · tentativas=${tentativas}${ultimoErro ? ` · erro=${ultimoErro}` : ''}`.slice(0, TAMANHO_MAX_DIAG),
          );
          timer = setTimeout(ler, INTERVALO_MS);
        };
        ler();
      } catch (e) {
        if (parado) return;
        setEstado('erro');
        setDiagnostico(textoErro(e));
      }
    })();

    return () => {
      parado = true;
      if (timer) clearTimeout(timer);
      fluxo?.getTracks().forEach((trilha) => trilha.stop());
      video?.remove();
      setEstado('abrindo');
      setAviso('');
    };
  }, [ativo]);

  /** Foto parada do código: mais nítida que o vídeo, ajuda com código pequeno ou amassado. */
  function tirarFoto() {
    const nav = navegador();
    setAviso('');
    const entrada = nav.document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/*';
    entrada.setAttribute('capture', 'environment');
    entrada.style.display = 'none';
    nav.document.body.appendChild(entrada);
    entrada.addEventListener('change', async () => {
      const arquivo = entrada.files?.[0];
      entrada.remove();
      if (!arquivo || !detector.current) return;
      try {
        const imagem = await nav.createImageBitmap(arquivo);
        const codigo = primeiroCodigo(await detector.current.detect(imagem));
        imagem.close();
        if (codigo) aoLer.current(codigo);
        else setAviso(t('ref.codigo.naoAchouFoto'));
      } catch (e) {
        setAviso(t('ref.codigo.naoAchouFoto'));
        setDiagnostico(`foto · erro=${textoErro(e)}`);
      }
    });
    entrada.click();
  }

  return (
    <View style={styles.bloco}>
      <View ref={caixa} style={styles.video} />
      <ThemedText variant="small" color="textSecondary">
        {estado === 'erro' ? t('ref.codigo.erroCamera') : t('ref.codigo.procurando')}
      </ThemedText>
      {aviso ? <ThemedText variant="small" color="accent">{aviso}</ThemedText> : null}
      <Button label={t('ref.codigo.fotoCodigo')} variant="outline" onPress={tirarFoto} disabled={!podeFoto} />
      {diagnostico ? <ThemedText variant="caption" color="textSecondary">{diagnostico}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: spacing.sm },
  video: { height: 260, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.border },
});
