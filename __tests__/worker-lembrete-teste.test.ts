import { enviarLembretesTeste, montarTextoLembrete, diasRestantes } from '../worker/src/lembreteTeste';
import { hmacHex } from '../worker/src/cripto';

const CHAVE = 'synthetic-phone-hmac-key';
const AGORA = Date.UTC(2026, 10, 25, 12, 0, 0);
const DIA = 24 * 60 * 60 * 1000;

function criarBanco({ leads, optouts, contaPorHash }: {
  leads: string[];
  optouts: string[];
  contaPorHash: Record<string, { conta_id: string; fim: string }>;
}) {
  const inseridos: Array<{ id: string; phone: string; texto: string }> = [];
  const db = {
    inseridos,
    prepare(sql: string) {
      let args: unknown[] = [];
      const stmt = {
        bind(...valores: unknown[]) { args = valores; return stmt; },
        async all() {
          if (sql.includes('FROM leads')) return { results: leads.map((phone) => ({ phone })) };
          if (sql.includes('FROM wa_optout')) return { results: optouts.map((phone) => ({ phone })) };
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM accounts')) return contaPorHash[String(args[0])] ?? null;
          return null;
        },
        async run() {
          if (sql.includes('INSERT OR IGNORE INTO wa_outbox')) {
            inseridos.push({ id: String(args[0]), phone: String(args[1]), texto: String(args[2]) });
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
      };
      return stmt;
    },
  };
  return db;
}

describe('texto e dias do lembrete', () => {
  it('mostra os dias restantes e o link dos planos', () => {
    const texto = montarTextoLembrete(3);
    expect(texto).toContain('termina em 3 dias');
    expect(texto).toContain('https://www.leviapp.org/#planos');
    expect(texto).toContain('responda PARAR');
  });

  it('no último dia diz que termina amanhã', () => {
    expect(montarTextoLembrete(1)).toContain('termina amanhã');
  });

  it('arredonda os dias restantes para cima', () => {
    expect(diasRestantes(new Date(AGORA + 2.5 * DIA).toISOString(), AGORA)).toBe(3);
  });
});

describe('enviarLembretesTeste', () => {
  it('enfileira um lembrete para quem está no teste ativo', async () => {
    const phone = '+5516999999999';
    const hash = await hmacHex(CHAVE, phone);
    const db = criarBanco({
      leads: [phone],
      optouts: [],
      contaPorHash: { [hash]: { conta_id: 'c1', fim: new Date(AGORA + 2.5 * DIA).toISOString() } },
    });
    const env = { LEVIA_DB: db, TYPEBOT_PHONE_HMAC_KEY: CHAVE };

    const r = await enviarLembretesTeste(env as never, AGORA);

    expect(r.enfileirados).toBe(1);
    expect(db.inseridos[0].phone).toBe(phone);
    expect(db.inseridos[0].texto).toContain('termina em 3 dias');
    expect(db.inseridos[0].id.startsWith('teste-')).toBe(true);
  });

  it('não envia para quem respondeu PARAR', async () => {
    const phone = '+5516999999999';
    const hash = await hmacHex(CHAVE, phone);
    const db = criarBanco({
      leads: [phone],
      optouts: [phone],
      contaPorHash: { [hash]: { conta_id: 'c1', fim: new Date(AGORA + 2 * DIA).toISOString() } },
    });

    const r = await enviarLembretesTeste({ LEVIA_DB: db, TYPEBOT_PHONE_HMAC_KEY: CHAVE } as never, AGORA);

    expect(r.enfileirados).toBe(0);
    expect(db.inseridos).toHaveLength(0);
  });

  it('não envia para quem não tem teste ativo (ex.: plano pago ou teste vencido)', async () => {
    const db = criarBanco({ leads: ['+5511988887777'], optouts: [], contaPorHash: {} });

    const r = await enviarLembretesTeste({ LEVIA_DB: db, TYPEBOT_PHONE_HMAC_KEY: CHAVE } as never, AGORA);

    expect(r.enfileirados).toBe(0);
  });

  it('não faz nada sem a chave do telefone configurada', async () => {
    const r = await enviarLembretesTeste({ LEVIA_DB: criarBanco({ leads: [], optouts: [], contaPorHash: {} }) } as never, AGORA);
    expect(r.enfileirados).toBe(0);
  });
});
