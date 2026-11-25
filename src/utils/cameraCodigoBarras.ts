/**
 * Decide se o leitor de código de barras pode abrir a câmera.
 * No app instalado, sempre. Na PWA, só quando o navegador tem o leitor nativo (BarcodeDetector,
 * presente no Chrome do Android). Sem ele, o expo-camera baixaria um leitor de um servidor externo,
 * que a política de segurança do site (public/_headers) não permite; nesse caso a pessoa digita o código.
 */
export function podeLerComCamera(plataforma: string, ambiente: object = globalThis): boolean {
  if (plataforma !== 'web') return true;
  return typeof (ambiente as { BarcodeDetector?: unknown }).BarcodeDetector === 'function';
}
