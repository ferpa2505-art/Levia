import { enviarLembretesTeste, montarEmailTeste, diasRestantes } from '../worker/src/lembreteTeste';
import { hmacHex } from '../worker/src/cripto';

const CHAVE = 'synthetic-phone-hmac-key';
const AGORA = Date.UTC(2026, 10, 25, 12, 0, 0);
const DIA = 24 * 60 * 60 * 1000;

function criarBanco({ leads, optouts, contaPorHash }: {
  leads: Array<{ phone: string; email: string }>;
  optouts: string[];
  contaPorHash: Record<string, { conta_id: string; fim: string }>;
}) {
  const db = {
    prepare(sql: string) {
      let args: unknown[] = [];
      const stmt = {
        bind(...valores: unknown[]) { args = valores; return stmt; },
        async all() {
          if (sql.includes('FROM leads')) return { results: leads };
          if (sql.includes('FROM wa_optout')) return { results: optouts.map((phone) => ({ phone })) };
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM accounts')) return contaPorHash[String(args[0])] ?? null;
          return null;
        },
      };
      return stmt;
    },
  };
  return db;
}

const envDe = (db: unknown, extra: Record<string, unknown> = {}) => ({
  LEVIA_DB: db,
  TYPEBOT_PHONE_HMAC_KEY: CHAVE,
  RESEND_API_KEY: 'synthetic-resend-key',
  ...extra,
});

describe('e-mail do lembrete', () => {
  it('mostra os dias restantes, o link dos planos e o aviso de saída', () => {
    const e = montarEmailTeste(3);
    expect(e.assunto).toContain('Faltam 3 dias');
    expect(e.texto).toContain('termina em 3 dias');
    expect(e.texto).toContain('https://www.leviapp.org/#planos');
    expect(e.texto).toContain('Responda SAIR');
    expect(e.html).toContain('https://www.leviapp.org/#planos');
  });

  it('no último dia diz que termina amanhã', () => {
    expect(montarEmailTeste(1).texto).toContain('termina amanhã');
    expect(montarEmailTeste(1).assunto).toContain('Último dia');
  });

  it('o preço citado é "menos de R$ 1 por dia" (verdadeiro para mensal e anual)', () => {
    expect(montarEmailTeste(2).texto).toContain('menos de R$ 1 por dia');
  });

  it('arredonda os dias restantes para cima', () => {
    expect(diasRestantes(new Date(AGORA + 2.5 * DIA).toISOString(), AGORA)).toBe(3);
  });
});

describe('enviarLembretesTeste', () => {
  it('envia para quem está no teste ativo', async () => {
    const email = 'cliente@exemplo.com';
    const phone = '+5516999999999';
    const hash = await hmacHex(CHAVE, phone);
    const db = criarBanco({
      leads: [{ phone, email }],
      optouts: [],
      contaPorHash: { [hash]: { conta_id: 'c1', fim: new Date(AGORA + 2.5 * DIA).toISOString() } },
    });
    const enviados: Array<{ para: string; assunto: string }> = [];
    const envio = async (_env: unknown, para: string, e: { assunto: string }) => { enviados.push({ para, assunto: e.assunto }); return true; };

    const r = await enviarLembretesTeste(envDe(db) as never, AGORA, envio as never);

    expect(r.enviados).toBe(1);
    expect(enviados[0].para).toBe(email);
    expect(enviados[0].assunto).toContain('Faltam 3 dias');
  });

  it('não envia para quem respondeu PARAR', async () => {
    const phone = '+5516999999999';
    const hash = await hmacHex(CHAVE, phone);
    const db = criarBanco({
      leads: [{ phone, email: 'cliente@exemplo.com' }],
      optouts: [phone],
      contaPorHash: { [hash]: { conta_id: 'c1', fim: new Date(AGORA + 2 * DIA).toISOString() } },
    });
    const envio = jest.fn(async () => true);

    const r = await enviarLembretesTeste(envDe(db) as never, AGORA, envio as never);

    expect(r.enviados).toBe(0);
    expect(envio).not.toHaveBeenCalled();
  });

  it('não envia para quem não tem teste ativo', async () => {
    const db = criarBanco({ leads: [{ phone: '+5511988887777', email: 'x@exemplo.com' }], optouts: [], contaPorHash: {} });
    const envio = jest.fn(async () => true);

    const r = await enviarLembretesTeste(envDe(db) as never, AGORA, envio as never);

    expect(r.enviados).toBe(0);
    expect(envio).not.toHaveBeenCalled();
  });

  it('ignora e-mail inválido', async () => {
    const phone = '+5516999999999';
    const hash = await hmacHex(CHAVE, phone);
    const db = criarBanco({
      leads: [{ phone, email: 'isto-nao-e-email' }],
      optouts: [],
      contaPorHash: { [hash]: { conta_id: 'c1', fim: new Date(AGORA + 2 * DIA).toISOString() } },
    });
    const envio = jest.fn(async () => true);

    await enviarLembretesTeste(envDe(db) as never, AGORA, envio as never);

    expect(envio).not.toHaveBeenCalled();
  });

  it('não faz nada sem a chave do Resend', async () => {
    const r = await enviarLembretesTeste(envDe(criarBanco({ leads: [], optouts: [], contaPorHash: {} }), { RESEND_API_KEY: undefined }) as never, AGORA);
    expect(r.enviados).toBe(0);
  });
});
