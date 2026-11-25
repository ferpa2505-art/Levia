import { criarEntregaUnica } from '../src/utils/entregaUnica';

describe('criarEntregaUnica (leitor de código de barras)', () => {
  it('entrega só a primeira leitura de cada abertura (a câmera lê o mesmo código várias vezes)', () => {
    const entrega = criarEntregaUnica();
    const lidos: string[] = [];
    entrega.entregar('7790070336965', (c) => lidos.push(c));
    entrega.entregar('7790070336965', (c) => lidos.push(c));
    expect(lidos).toEqual(['7790070336965']);
  });

  it('depois de reabrir o leitor, a nova leitura chega (antes ficava travada até tocar em Fechar)', () => {
    const entrega = criarEntregaUnica();
    const lidos: string[] = [];
    entrega.entregar('7790070336965', (c) => lidos.push(c));
    entrega.reabrir();
    entrega.entregar('7894900011517', (c) => lidos.push(c));
    expect(lidos).toEqual(['7790070336965', '7894900011517']);
  });

  it('ignora leitura vazia sem travar a próxima', () => {
    const entrega = criarEntregaUnica();
    const lidos: string[] = [];
    entrega.entregar('  ', (c) => lidos.push(c));
    entrega.entregar('7894900011517', (c) => lidos.push(c));
    expect(lidos).toEqual(['7894900011517']);
  });
});
