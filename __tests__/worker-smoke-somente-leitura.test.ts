const { executarSmoke, formatar, lerArgumentos, criarCliente } = require('../scripts/smoke.cjs');

const SHA = 'a'.repeat(40);
const ALVOS = { worker: 'https://w.test', app: 'https://app.test', landing: 'https://land.test' };
const PERMITIDAS = ['https://leviapp.org', 'https://www.leviapp.org'];

type Resposta = { status: number; headers?: Record<string, string>; corpo?: string };

function falsa(r: Resposta) {
  const cabecalhos = new Map(Object.entries(r.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    status: r.status,
    headers: { get: (k: string) => cabecalhos.get(k.toLowerCase()) ?? null },
    text: async () => r.corpo ?? '',
  };
}

const CSP = "default-src 'self'; object-src 'none'; frame-ancestors 'none'";

/** Servidor falso saudável; `ajustes` troca respostas pontuais por "METODO url". */
function servidor(ajustes: Record<string, Resposta> = {}) {
  const chamadas: { metodo: string; url: string }[] = [];
  const fetchFalso = jest.fn(async (url: string, init: any) => {
    const metodo = init.method;
    chamadas.push({ metodo, url });
    const chave = `${metodo} ${url}`;
    if (ajustes[chave]) return falsa(ajustes[chave]);
    const origem = init.headers?.Origin;
    if (url === 'https://w.test/health') return falsa({ status: 200, corpo: '{"ok":true}' });
    if (url === 'https://w.test/versao') return falsa({ status: 200, corpo: JSON.stringify({ commit: SHA }) });
    if (url === 'https://w.test/rota-que-nao-existe') return falsa({ status: 404, corpo: '{"erro":"nao_encontrado"}' });
    if (url === 'https://w.test/v1/turnstile/sitekey') {
      return falsa({ status: 200, corpo: '{"sitekey":"pub"}', headers: { 'Access-Control-Allow-Origin': origem } });
    }
    if (url === 'https://w.test/v1/ativar' && metodo === 'OPTIONS') {
      return PERMITIDAS.includes(origem)
        ? falsa({ status: 204, headers: { 'Access-Control-Allow-Origin': origem, Vary: 'Origin' } })
        : falsa({ status: 204 });
    }
    if (url === 'https://app.test/' && metodo === 'HEAD') {
      return falsa({ status: 200, headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin', 'Content-Security-Policy': CSP } });
    }
    if (url === 'https://app.test/' || url === 'https://app.test/ativar') return falsa({ status: 200, corpo: '<title>Leviã</title>' });
    if (url === 'https://app.test/manifest.webmanifest') return falsa({ status: 200, corpo: '{"short_name":"Leviã"}' });
    if (url === 'https://app.test/sw.js') {
      return falsa({ status: 200, corpo: `const CACHE = 'levia-v2-${SHA.slice(0, 7)}';`, headers: { 'Cache-Control': 'no-cache' } });
    }
    if (url.startsWith('https://app.test/icons/')) return falsa({ status: 200, headers: { 'Content-Type': 'image/png' } });
    if (url === 'https://land.test/') return falsa({ status: 200, corpo: '<html></html>' });
    if (url === 'https://land.test/versao.json') return falsa({ status: 200, corpo: JSON.stringify({ commit: SHA }) });
    return falsa({ status: 599 });
  });
  return { fetchFalso, chamadas };
}

async function rodar(ajustes: Record<string, Resposta> = {}, sha: string | null = null) {
  const { fetchFalso, chamadas } = servidor(ajustes);
  const resultados = await executarSmoke({ fetchImpl: fetchFalso, alvos: ALVOS, sha });
  return { resultados, chamadas };
}

const falhas = (r: { ok: boolean; nome: string }[]) => r.filter((x) => !x.ok).map((x) => x.nome);

describe('smoke test somente leitura', () => {
  test('tudo saudável: todas as checagens passam', async () => {
    const { resultados } = await rodar({}, SHA);
    expect(falhas(resultados)).toEqual([]);
    expect(resultados.length).toBeGreaterThanOrEqual(18);
  });

  test('só usa GET, HEAD e OPTIONS e nunca manda credencial', async () => {
    const { chamadas } = await rodar();
    expect(chamadas.length).toBeGreaterThan(10);
    for (const c of chamadas) expect(['GET', 'HEAD', 'OPTIONS']).toContain(c.metodo);
    expect(chamadas.some((c) => c.url.includes('/admin/'))).toBe(false);
  });

  test('o cliente recusa qualquer método que escreve, antes de sair da máquina', async () => {
    const fetchFalso = jest.fn();
    const requisitar = criarCliente(fetchFalso);
    for (const metodo of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      await expect(requisitar('https://w.test/x', { metodo })).rejects.toThrow(/somente leitura/);
    }
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  test('commit diferente do esperado reprova Worker e app', async () => {
    const { resultados } = await rodar({}, 'b'.repeat(7));
    expect(falhas(resultados)).toEqual([
      '/versao informa o commit publicado',
      'sw.js carimbado com o commit e sem cache',
    ]);
  });

  test('Worker sem commit injetado ("desconhecido") reprova', async () => {
    const { resultados } = await rodar({ 'GET https://w.test/versao': { status: 200, corpo: '{"commit":"desconhecido"}' } });
    expect(falhas(resultados)).toContain('/versao informa o commit publicado');
  });

  test('CORS com curinga ou que aceita origem estranha reprova', async () => {
    const curinga = await rodar({
      'OPTIONS https://w.test/v1/ativar': { status: 204, headers: { 'Access-Control-Allow-Origin': '*', Vary: 'Origin' } },
    });
    const ruins = falhas(curinga.resultados);
    expect(ruins).toContain('preflight aceita https://leviapp.org');
    expect(ruins).toContain('preflight recusa https://evil.example');
  });

  test('CORS com credenciais permitidas reprova', async () => {
    const { fetchFalso } = servidor();
    const comCredenciais = jest.fn(async (url: string, init: any) => {
      const r = await fetchFalso(url, init);
      if (url === 'https://w.test/v1/ativar' && PERMITIDAS.includes(init.headers?.Origin)) {
        return falsa({ status: 204, headers: { 'Access-Control-Allow-Origin': init.headers.Origin, Vary: 'Origin', 'Access-Control-Allow-Credentials': 'true' } });
      }
      return r;
    });
    const resultados = await executarSmoke({ fetchImpl: comCredenciais, alvos: ALVOS });
    expect(falhas(resultados)).toContain('preflight aceita https://leviapp.org');
  });

  test('app sem cabeçalhos de segurança, sem manifesto ou fora do ar reprova', async () => {
    const { resultados } = await rodar({
      'HEAD https://app.test/': { status: 200 },
      'GET https://app.test/manifest.webmanifest': { status: 500 },
      'GET https://app.test/ativar': { status: 502 },
    });
    expect(falhas(resultados)).toEqual(expect.arrayContaining([
      'cabeçalhos de segurança presentes', 'manifesto PWA válido', '/ativar carrega (título Leviã)',
    ]));
  });

  test('erro de rede em uma checagem vira falha, não derruba as outras', async () => {
    const { fetchFalso } = servidor();
    const queda = jest.fn(async (url: string, init: any) => {
      if (url === 'https://w.test/health') throw new Error('rede fora');
      return fetchFalso(url, init);
    });
    const resultados = await executarSmoke({ fetchImpl: queda, alvos: ALVOS });
    expect(falhas(resultados)).toEqual(['/health responde {"ok":true}']);
    expect(resultados.find((r: any) => !r.ok).detalhe).toMatch(/rede fora/);
  });

  test('--sha inválido é recusado e a saída formatada resume o resultado', async () => {
    await expect(executarSmoke({ fetchImpl: jest.fn(), alvos: ALVOS, sha: 'zzz' })).rejects.toThrow(/hexadecimais/);
    const { resultados } = await rodar();
    expect(formatar(resultados)).toMatch(/\d+ de \d+ checagens passaram\./);
  });

  test('argumentos: só https, sem argumento desconhecido', () => {
    expect(lerArgumentos(['--sha', 'abc1234', '--json']).sha).toBe('abc1234');
    expect(() => lerArgumentos(['--app-url', 'http://x.com'])).toThrow(/https/);
    expect(() => lerArgumentos(['--apagar'])).toThrow(/desconhecido/);
    expect(() => lerArgumentos(['--sha'])).toThrow(/valor/);
  });
});
