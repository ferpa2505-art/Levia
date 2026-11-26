/**
 * Decide se o leitor de código de barras pode abrir a câmera.
 * No app instalado, sempre. Na PWA, quando o navegador tem o leitor nativo (BarcodeDetector, do Chrome
 * do Android) ou pelo menos acesso à câmera: aí entra o leitor próprio (zxing-wasm servido pelo
 * leviapp.org, ver leitorWeb.ts), que cobre o Safari do iPhone. Sem câmera, a pessoa digita o código.
 */
export function podeLerComCamera(plataforma: string, ambiente: object = globalThis): boolean {
  if (plataforma !== 'web') return true;
  const amb = ambiente as { BarcodeDetector?: unknown; navigator?: { mediaDevices?: { getUserMedia?: unknown } } };
  return typeof amb.BarcodeDetector === 'function' || typeof amb.navigator?.mediaDevices?.getUserMedia === 'function';
}
