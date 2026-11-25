import { podeLerComCamera } from '../src/utils/cameraCodigoBarras';

describe('podeLerComCamera', () => {
  it('usa a câmera no app instalado', () => {
    expect(podeLerComCamera('android', {})).toBe(true);
    expect(podeLerComCamera('ios', {})).toBe(true);
  });

  it('na PWA usa a câmera quando o navegador tem leitor nativo', () => {
    expect(podeLerComCamera('web', { BarcodeDetector: function BarcodeDetector() {} })).toBe(true);
  });

  it('na PWA sem leitor nativo fica só a digitação (o leitor extra seria barrado pela segurança do site)', () => {
    expect(podeLerComCamera('web', {})).toBe(false);
  });
});
