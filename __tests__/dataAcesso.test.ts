import { formatarDataAcesso } from '../src/utils/dataAcesso';

describe('formatarDataAcesso', () => {
  it('devolve vazio quando não há data (acesso vitalício)', () => {
    expect(formatarDataAcesso('', 'pt-BR')).toBe('');
  });

  it('devolve vazio para uma data inválida, sem lançar erro', () => {
    expect(formatarDataAcesso('isto-nao-e-data', 'pt-BR')).toBe('');
  });

  it('formata a data no idioma pedido', () => {
    const texto = formatarDataAcesso('2027-03-15T12:00:00.000Z', 'pt-BR');
    expect(texto).toMatch(/2027/);
    expect(texto).toMatch(/\d{2}\/\d{2}\/2027/);
  });
});
