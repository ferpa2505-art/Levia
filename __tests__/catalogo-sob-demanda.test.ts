/**
 * Catálogo estendido sob demanda (PWA): enquanto o arquivo não chega, a busca usa só o banco curado;
 * quando chega, a tela é avisada e a busca passa a achar os produtos. Se o download falhar, tenta de novo.
 */
const mockLer = jest.fn();

jest.mock('@constants/estendidoFonte', () => ({
  bancoEstendidoImediato: () => null, // como na PWA: nada vem junto com o app
  lerBancoEstendido: () => mockLer(),
}));

const BANCO = {
  itens: [['O7790070336965', 'doces', 520, 18, 50, 28, 4, 25, 'Paçoquita de teste (Marca X)', 'BR']],
};

function modulo() {
  let m: typeof import('../src/constants/alimentosGlobais') | undefined;
  jest.isolateModules(() => { m = require('../src/constants/alimentosGlobais'); });
  return m!;
}

beforeEach(() => mockLer.mockReset());

test('antes de carregar, a busca não acha o produto e não trava', () => {
  mockLer.mockReturnValue(new Promise(() => {}));
  const m = modulo();
  expect(m.buscarAlimentoPorId('O7790070336965')).toBeUndefined();
  expect(m.estendidoCarregado()).toBe(false);
});

test('depois de carregar, avisa a tela e acha o produto pelo nome e pelo código', async () => {
  mockLer.mockResolvedValue(BANCO);
  const m = modulo();
  const aviso = jest.fn();
  m.aoCarregarEstendido(aviso);
  await m.carregarEstendido();
  expect(aviso).toHaveBeenCalledTimes(1);
  expect(m.buscarAlimentoPorId('O7790070336965')?.nome).toContain('Paçoquita');
  expect(m.buscarAlimentosGlobais('pacoquita de teste', 5).map((a) => a.id)).toContain('O7790070336965');
});

test('se o download falhar, a próxima tentativa baixa de novo', async () => {
  mockLer.mockRejectedValueOnce(new Error('sem internet')).mockResolvedValueOnce(BANCO);
  const m = modulo();
  await m.carregarEstendido();
  expect(m.estendidoCarregado()).toBe(false);
  await m.carregarEstendido();
  expect(m.estendidoCarregado()).toBe(true);
  expect(mockLer).toHaveBeenCalledTimes(2);
});
