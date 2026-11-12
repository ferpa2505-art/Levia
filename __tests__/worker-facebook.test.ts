import {
  chamarPagina, publicarPost, obterPagina, obterInsights,
  ErroPagina, ErroTokenPagina, ehTokenInvalido, VERSAO_GRAPH,
} from '../worker/src/facebook';

function ambiente(extra: Record<string, unknown> = {}) {
  return { FB_PAGE_ID: '1234567890', FB_PAGE_TOKEN: 'token-secreto-da-pagina', ...extra } as any;
}

function resposta(corpo: unknown, status = 200, ok = true) {
  return { ok, status, json: async () => corpo };
}

function interceptar(corpo: unknown, status = 200, ok = true) {
  const chamadas: { url: string; init: any }[] = [];
  const original = global.fetch;
  (global as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string, init: any) => {
    chamadas.push({ url: String(url), init });
    return resposta(corpo, status, ok);
  });
  return {
    chamadas,
    restaurar() { (global as unknown as { fetch: unknown }).fetch = original; },
  };
}

afterEach(() => jest.restoreAllMocks());

describe('cliente da Pages API', () => {
  test('usa a versão fixa v27.0 e manda o token no header, nunca na URL', async () => {
    const rede = interceptar({ id: '1234567890', name: 'Leviã' });
    try {
      await obterPagina(ambiente());
    } finally {
      rede.restaurar();
    }
    expect(VERSAO_GRAPH).toBe('v27.0');
    const url = new URL(rede.chamadas[0].url);
    expect(url.origin + url.pathname).toBe(`https://graph.facebook.com/v27.0/1234567890`);
    expect(url.searchParams.get('fields')).toBe('id,name,about,fan_count');
    expect(rede.chamadas[0].url).not.toContain('token-secreto-da-pagina');
    expect(rede.chamadas[0].init.headers.Authorization).toBe('Bearer token-secreto-da-pagina');
  });

  test('erro 190 vira ErroTokenPagina e é reconhecido por ehTokenInvalido', async () => {
    const rede = interceptar({
      error: { message: 'Error validating access token', type: 'OAuthException', code: 190, error_subcode: 463, fbtrace_id: 'abc123' },
    }, 400, false);
    let capturado: unknown;
    try {
      await chamarPagina(ambiente(), '');
    } catch (e) {
      capturado = e;
    } finally {
      rede.restaurar();
    }
    expect(capturado).toBeInstanceOf(ErroTokenPagina);
    expect(ehTokenInvalido(capturado)).toBe(true);
    expect((capturado as ErroPagina).codigo).toBe(190);
    expect((capturado as ErroPagina).subcodigo).toBe(463);
    expect((capturado as ErroPagina).traceId).toBe('abc123');
    expect(String((capturado as Error).message)).not.toContain('token-secreto-da-pagina');
  });

  test('outros erros da Graph não são confundidos com token inválido', async () => {
    const rede = interceptar({ error: { message: 'Unsupported get request', type: 'GraphMethodException', code: 100 } }, 400, false);
    let capturado: any;
    try {
      await chamarPagina(ambiente(), '/feed');
    } catch (e) {
      capturado = e;
    } finally {
      rede.restaurar();
    }
    expect(capturado).toBeInstanceOf(ErroPagina);
    expect(capturado).not.toBeInstanceOf(ErroTokenPagina);
    expect(ehTokenInvalido(capturado)).toBe(false);
    expect(capturado.codigo).toBe(100);
  });

  test('sem token configurado falha antes de chamar a rede', async () => {
    const original = global.fetch;
    const espia = jest.fn();
    (global as unknown as { fetch: unknown }).fetch = espia;
    let capturado: any;
    try {
      await chamarPagina({ FB_PAGE_ID: '1234567890' } as any, '');
    } catch (e) {
      capturado = e;
    } finally {
      (global as unknown as { fetch: unknown }).fetch = original;
    }
    expect(capturado).toBeInstanceOf(ErroPagina);
    expect(capturado.codigo).toBe('nao_configurado');
    expect(espia).not.toHaveBeenCalled();
  });

  test('publica com corpo form-encoded e published=true', async () => {
    const rede = interceptar({ id: '1234567890_999' });
    try {
      await publicarPost(ambiente(), { mensagem: 'Olá da Leviã', link: 'https://leviapp.org' });
    } finally {
      rede.restaurar();
    }
    const { url, init } = rede.chamadas[0];
    expect(new URL(url).pathname).toBe('/v27.0/1234567890/feed');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    const form = new URLSearchParams(init.body.toString());
    expect(form.get('message')).toBe('Olá da Leviã');
    expect(form.get('published')).toBe('true');
    expect(form.get('link')).toBe('https://leviapp.org');
    expect(init.body.toString()).not.toContain('token-secreto-da-pagina');
  });

  test('agendar exige timestamp e envia published=false', async () => {
    await expect(publicarPost(ambiente(), { mensagem: 'Amanhã', publicado: false }))
      .rejects.toMatchObject({ codigo: 'parametro' });

    const rede = interceptar({ id: '1234567890_1000' });
    try {
      await publicarPost(ambiente(), { mensagem: 'Amanhã', publicado: false, agendarPara: 1780000000 });
    } finally {
      rede.restaurar();
    }
    const form = new URLSearchParams(rede.chamadas[0].init.body.toString());
    expect(form.get('published')).toBe('false');
    expect(form.get('scheduled_publish_time')).toBe('1780000000');
  });

  test('insights usam as métricas que substituíram page_impressions e page_fans', async () => {
    const rede = interceptar({ data: [] });
    try {
      await obterInsights(ambiente());
    } finally {
      rede.restaurar();
    }
    const params = new URL(rede.chamadas[0].url).searchParams;
    expect(params.get('metric')).toBe('page_media_view,page_follows');
    expect(params.get('period')).toBe('day');
  });

  test('HTTP sem corpo JSON vira ErroPagina com o status', async () => {
    const original = global.fetch;
    (global as unknown as { fetch: unknown }).fetch = jest.fn(async () => ({
      ok: false, status: 502, json: async () => { throw new Error('sem json'); },
    }));
    let capturado: any;
    try {
      await chamarPagina(ambiente(), '');
    } catch (e) {
      capturado = e;
    } finally {
      (global as unknown as { fetch: unknown }).fetch = original;
    }
    expect(capturado).toBeInstanceOf(ErroPagina);
    expect(capturado.status).toBe(502);
  });
});
