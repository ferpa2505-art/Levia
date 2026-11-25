import { dimensoesReduzidas } from '../src/utils/dimensoesFoto';

describe('dimensoesReduzidas', () => {
  it('reduz uma foto deitada pelo lado maior, mantendo a proporção', () => {
    expect(dimensoesReduzidas(8000, 6000, 512)).toEqual({ largura: 512, altura: 384 });
  });

  it('reduz uma foto em pé pelo lado maior', () => {
    expect(dimensoesReduzidas(6000, 8000, 512)).toEqual({ largura: 384, altura: 512 });
  });

  it('não aumenta uma foto menor que o limite', () => {
    expect(dimensoesReduzidas(300, 200, 512)).toEqual({ largura: 300, altura: 200 });
  });

  it('nunca devolve um lado zerado', () => {
    expect(dimensoesReduzidas(10000, 4, 512)).toEqual({ largura: 512, altura: 1 });
  });

  it('recusa uma imagem sem medidas (formato que o navegador não abriu)', () => {
    expect(() => dimensoesReduzidas(0, 0, 512)).toThrow();
  });
});
