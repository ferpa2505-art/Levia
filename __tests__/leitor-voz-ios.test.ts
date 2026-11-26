import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { podeLerComCamera } from '../src/utils/cameraCodigoBarras';
import { CAMINHO_WASM_LEITOR, localizarArquivoLeitor, ehIOS } from '../src/utils/leitorWeb';

const raiz = path.join(__dirname, '..');
const sha = (arquivo: string) => crypto.createHash('sha256').update(fs.readFileSync(arquivo)).digest('hex');

describe('leitor de código de barras no iPhone (Safari não tem BarcodeDetector)', () => {
  test('na PWA, basta o navegador ter câmera: o leitor próprio cobre a falta do BarcodeDetector', () => {
    const comCamera = { navigator: { mediaDevices: { getUserMedia: () => undefined } } };
    expect(podeLerComCamera('web', comCamera)).toBe(true);
    expect(podeLerComCamera('web', {})).toBe(false);
  });

  test('o arquivo do leitor vem do próprio leviapp.org, nunca de um CDN externo', () => {
    expect(localizarArquivoLeitor('zxing_reader.wasm', 'https://fastly.jsdelivr.net/npm/zxing-wasm/dist/reader/')).toBe(CAMINHO_WASM_LEITOR);
    expect(CAMINHO_WASM_LEITOR).toBe('/wasm/zxing_reader.wasm');
    expect(localizarArquivoLeitor('outro.js', '/base/')).toBe('/base/outro.js');
  });

  test('a cópia em public/wasm é idêntica à da versão instalada do zxing-wasm', () => {
    const publicado = path.join(raiz, 'public', 'wasm', 'zxing_reader.wasm');
    const instalado = path.join(raiz, 'node_modules', 'zxing-wasm', 'dist', 'reader', 'zxing_reader.wasm');
    expect(fs.existsSync(publicado)).toBe(true);
    expect(sha(publicado)).toBe(sha(instalado));
  });

  test('a CSP libera só WebAssembly (wasm-unsafe-eval), nunca eval de JavaScript', () => {
    const csp = fs.readFileSync(path.join(raiz, 'public', '_headers'), 'utf8').split('\n').find((l) => l.includes('Content-Security-Policy')) ?? '';
    const scriptSrc = /script-src([^;]*)/.exec(csp)?.[1] ?? '';
    expect(scriptSrc).toContain("'wasm-unsafe-eval'");
    expect(scriptSrc).not.toMatch(/'unsafe-eval'/);
  });
});

describe('detecção de iPhone/iPad para o botão Falar', () => {
  test.each([
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15', 0, true],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', 5, true],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', 0, false],
    ['Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36', 5, false],
  ])('%s (toques=%s) → %s', (userAgent, maxTouchPoints, esperado) => {
    expect(ehIOS({ userAgent, maxTouchPoints })).toBe(esperado);
  });
});
