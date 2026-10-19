import worker from '../worker/src/index';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://worker.test/v1/teste/iniciar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('rota de início do teste', () => {
  test('recusa chamadas sem o segredo do Typebot', async () => {
    const response = await worker.fetch(request({ email: 'teste@example.com', telefone: '+5511999999999' }), {
      LEVIA_DB: {},
      LEVIA_COTAS: {},
      TYPEBOT_SHARED_SECRET: 'segredo',
    } as any);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ erro: 'nao_autorizado' });
  });

  test('não inicia sem a configuração de e-mail e criptografia', async () => {
    const response = await worker.fetch(
      request(
        { email: 'teste@example.com', telefone: '+5511999999999', consentimento_contato: true },
        { 'x-levia-typebot': 'segredo' },
      ),
      { LEVIA_DB: {}, LEVIA_COTAS: {}, TYPEBOT_SHARED_SECRET: 'segredo' } as any,
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ erro: 'nao_configurado' });
  });
});
