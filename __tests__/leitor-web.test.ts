import { escolherFormatos, primeiroCodigo } from '../src/utils/leitorWeb';

describe('escolherFormatos', () => {
  it('usa só os formatos de embalagem que o aparelho diz que lê', () => {
    expect(escolherFormatos(['qr_code', 'ean_13', 'code_128', 'upc_a'])).toEqual(['ean_13', 'upc_a']);
  });

  it('sem nenhum formato de embalagem suportado devolve lista vazia (o leitor avisa e fica a digitação)', () => {
    expect(escolherFormatos(['qr_code'])).toEqual([]);
  });
});

describe('primeiroCodigo', () => {
  it('pega o primeiro código com números', () => {
    expect(primeiroCodigo([{ rawValue: '' }, { rawValue: ' 7790070336965 ' }])).toBe('7790070336965');
  });

  it('sem leitura devolve null', () => {
    expect(primeiroCodigo([])).toBeNull();
    expect(primeiroCodigo([{ rawValue: undefined }])).toBeNull();
  });
});
