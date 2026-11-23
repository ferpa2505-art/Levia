import { normalizarCodigo, converterProdutoOFF, buscarNaOpenFoodFacts, buscarProdutoPorCodigo } from '../src/utils/codigoBarras';

const PRODUTO_OK = {
  status: 1,
  product: {
    product_name: 'Biscoito X',
    serving_quantity: 30,
    nutriments: {
      'energy-kcal_100g': 480,
      proteins_100g: 6,
      carbohydrates_100g: 70,
      fat_100g: 20,
      fiber_100g: 3,
    },
  },
};

describe('normalizarCodigo', () => {
  it('aceita EAN-13, EAN-8, UPC-A e GTIN-14 e remove espaços', () => {
    expect(normalizarCodigo('7790070336965')).toBe('7790070336965');
    expect(normalizarCodigo('73513537')).toBe('73513537');
    expect(normalizarCodigo('036000291452')).toBe('036000291452');
    expect(normalizarCodigo(' 7790 0703-36965 ')).toBe('7790070336965');
  });

  it('rejeita tamanhos inválidos e texto sem dígitos', () => {
    expect(normalizarCodigo('12345')).toBeNull();
    expect(normalizarCodigo('abc')).toBeNull();
    expect(normalizarCodigo('')).toBeNull();
  });
});

describe('converterProdutoOFF', () => {
  it('converte produto completo em alimento do app, por 100 g, com porção da API', () => {
    const a = converterProdutoOFF(PRODUTO_OK, '7891000000001');
    expect(a).toMatchObject({
      id: 'OFF7891000000001',
      nome: 'Biscoito X',
      kcalPor100g: 480,
      proteinaGPor100g: 6,
      carboidratoGPor100g: 70,
      gorduraGPor100g: 20,
      fibraGPor100g: 3,
      gramaPadrao: 30,
    });
  });

  it('usa 100 g quando a API não informa a porção', () => {
    const json = { status: 1, product: { product_name: 'X', nutriments: PRODUTO_OK.product.nutriments } };
    expect(converterProdutoOFF(json, '1')?.gramaPadrao).toBe(100);
  });

  it('devolve null quando falta algum macro (não assume zero)', () => {
    const json = { status: 1, product: { product_name: 'X', nutriments: { 'energy-kcal_100g': 100 } } };
    expect(converterProdutoOFF(json, '1')).toBeNull();
  });

  it('devolve null sem nome', () => {
    const json = { status: 1, product: { product_name: '', nutriments: PRODUTO_OK.product.nutriments } };
    expect(converterProdutoOFF(json, '1')).toBeNull();
  });
});

describe('buscarNaOpenFoodFacts', () => {
  const resposta = (status: number, corpo: unknown) => async () => ({ status, json: async () => corpo });

  it('retorna o produto quando a API encontra', async () => {
    const r = await buscarNaOpenFoodFacts('7891000000001', resposta(200, PRODUTO_OK));
    expect(r).toMatchObject({ ok: true, fonte: 'openfoodfacts', alimento: { nome: 'Biscoito X' } });
  });

  it('envia só o código de barras no caminho da URL e identifica o app', async () => {
    const chamadas: Array<{ url: string; headers?: Record<string, string> }> = [];
    const fake = async (url: string, init?: { headers?: Record<string, string> }) => {
      chamadas.push({ url, headers: init?.headers });
      return { status: 404, json: async () => ({}) };
    };
    await buscarNaOpenFoodFacts('7891000000001', fake);
    expect(chamadas[0].url).toBe('https://world.openfoodfacts.org/api/v2/product/7891000000001.json');
    expect(chamadas[0].headers?.['User-Agent']).toBe('Levia-app');
  });

  it('404 vira naoEncontrado', async () => {
    expect(await buscarNaOpenFoodFacts('1', resposta(404, {}))).toEqual({ ok: false, motivo: 'naoEncontrado' });
  });

  it('status 0 da API (produto não existe) vira naoEncontrado', async () => {
    expect(await buscarNaOpenFoodFacts('1', resposta(200, { status: 0 }))).toEqual({ ok: false, motivo: 'naoEncontrado' });
  });

  it('erro de rede vira rede, sem lançar exceção', async () => {
    const falha = async () => { throw new Error('offline'); };
    expect(await buscarNaOpenFoodFacts('1', falha)).toEqual({ ok: false, motivo: 'rede' });
  });

  it('produto sem macros completos vira dadosIncompletos', async () => {
    const json = { status: 1, product: { product_name: 'X', nutriments: {} } };
    expect(await buscarNaOpenFoodFacts('1', resposta(200, json))).toEqual({ ok: false, motivo: 'dadosIncompletos' });
  });
});

describe('buscarProdutoPorCodigo', () => {
  it('encontra produto do banco local sem chamar a rede', async () => {
    const nuncaChamar = jest.fn();
    const r = await buscarProdutoPorCodigo('7790070336965', nuncaChamar);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.fonte).toBe('local');
    expect(nuncaChamar).not.toHaveBeenCalled();
  });

  it('código inválido não consulta nada', async () => {
    const nuncaChamar = jest.fn();
    expect(await buscarProdutoPorCodigo('123', nuncaChamar)).toEqual({ ok: false, motivo: 'invalido' });
    expect(nuncaChamar).not.toHaveBeenCalled();
  });

  it('código fora do banco local cai na Open Food Facts', async () => {
    const fake = async () => ({ status: 200, json: async () => PRODUTO_OK });
    const r = await buscarProdutoPorCodigo('7891000000001', fake);
    expect(r).toMatchObject({ ok: true, fonte: 'openfoodfacts' });
  });
});
