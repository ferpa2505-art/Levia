import worker from '../worker/src/index';
import { reservarCotaFoto } from '../worker/src/cotas';
import { createHmac } from 'node:crypto';

const SEGREDO = 'segredo-de-teste';

function assinar(corpo: string, carimbo = String(Date.now()), segredo = SEGREDO) {
  return { 'x-timestamp': carimbo, 'x-signature': createHmac('sha256', segredo).update(`${carimbo}.${corpo}`).digest('hex') };
}

function webhook(corpo: string, headers: Record<string, string> = {}) {
  return new Request('https://worker.test/api/wa/inbound', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: corpo,
  });
}

describe('webhook do WhatsApp', () => {
  const corpo = JSON.stringify({ messages: [{ id: 'm1', from: '5511999999999', body: 'oi' }] });

  test('fica fechado sem segredo configurado', async () => {
    const r = await worker.fetch(webhook(corpo, assinar(corpo)), {} as any);
    expect(r.status).toBe(503);
  });

  test('recusa requisição sem assinatura', async () => {
    const r = await worker.fetch(webhook(corpo), { WHATSAPP_WEBHOOK_SECRET: SEGREDO } as any);
    expect(r.status).toBe(401);
  });

  test('recusa assinatura feita com outro segredo', async () => {
    const r = await worker.fetch(webhook(corpo, assinar(corpo, undefined, 'outro')), { WHATSAPP_WEBHOOK_SECRET: SEGREDO } as any);
    expect(r.status).toBe(401);
  });

  test('recusa corpo alterado depois de assinado', async () => {
    const r = await worker.fetch(webhook(corpo.replace('oi', 'tchau'), assinar(corpo)), { WHATSAPP_WEBHOOK_SECRET: SEGREDO } as any);
    expect(r.status).toBe(401);
  });

  test('recusa mensagem antiga reenviada (replay)', async () => {
    const velho = String(Date.now() - 10 * 60 * 1000);
    const r = await worker.fetch(webhook(corpo, assinar(corpo, velho)), { WHATSAPP_WEBHOOK_SECRET: SEGREDO } as any);
    expect(r.status).toBe(401);
  });

  test('aceita assinatura válida e processa (sem erro de escopo)', async () => {
    const r = await worker.fetch(webhook(corpo, assinar(corpo)), { WHATSAPP_WEBHOOK_SECRET: SEGREDO } as any);
    expect(r.status).toBe(200);
    const dados = await r.json();
    expect(dados.processados).toBe(1);
  });

  test('não devolve mensagem de erro interna ao chamador', async () => {
    const r = await worker.fetch(webhook(corpo, assinar(corpo)), { WHATSAPP_WEBHOOK_SECRET: SEGREDO } as any);
    expect(JSON.stringify(await r.json())).not.toMatch(/Cannot|undefined|prepare/);
  });
});

describe('cota atômica no D1 (SQLite real)', () => {
  // node:sqlite só existe no Node 22.13+; sem ele o teste é pulado
  const sqlite = (process as any).getBuiltinModule?.('node:sqlite');
  const teste = sqlite ? test : test.skip;

  function bancoD1() {
    const db = new sqlite.DatabaseSync(':memory:');
    db.exec(`CREATE TABLE cotas_uso (id INTEGER PRIMARY KEY AUTOINCREMENT, chave TEXT NOT NULL, ts INTEGER NOT NULL);`);
    return {
      prepare(sql: string) {
        const stmt = db.prepare(sql);
        let args: unknown[] = [];
        const api = {
          bind(...a: unknown[]) { args = a; return api; },
          async run() { const r = stmt.run(...args); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
          async first() { return stmt.get(...args) ?? null; },
        };
        return api;
      },
    };
  }

  teste('instalação não passa do limite mesmo com pedidos simultâneos', async () => {
    const env = { LEVIA_DB: bancoD1(), FOTOS_GRATIS_7D: 2 } as any;
    const pedidos = Array.from({ length: 10 }, () => reservarCotaFoto(env, { instalacao: 'inst-1', ip: '1.1.1.1' }));
    const resultados = await Promise.all(pedidos);
    expect(resultados.filter((r) => r.ok)).toHaveLength(2);
    const recusado = resultados.find((r) => !r.ok) as any;
    expect(recusado.status).toBe(402);
    expect(recusado.corpo.erro).toBe('cota_esgotada');
  });

  teste('limite por IP vale para instalações diferentes', async () => {
    const env = { LEVIA_DB: bancoD1(), FOTOS_GRATIS_7D: 2, MAX_FOTOS_IP_HORA: 3 } as any;
    const rs = [];
    for (let i = 0; i < 5; i++) rs.push(await reservarCotaFoto(env, { instalacao: `inst-${i}`, ip: '9.9.9.9' }));
    expect(rs.filter((r) => r.ok)).toHaveLength(3);
    expect((rs[4] as any).corpo.erro).toBe('muitas_tentativas');
  });

  teste('pedido recusado devolve as reservas que já tinha feito', async () => {
    const env = { LEVIA_DB: bancoD1(), FOTOS_GRATIS_7D: 5, MAX_FOTOS_DIA: 1 } as any;
    await reservarCotaFoto(env, { instalacao: 'a', ip: '1.1.1.1' });
    const r = await reservarCotaFoto(env, { instalacao: 'b', ip: '2.2.2.2' });
    expect(r.ok).toBe(false);
    const ok = await reservarCotaFoto({ ...env, MAX_FOTOS_DIA: 10 }, { instalacao: 'b', ip: '2.2.2.2' });
    expect(ok.ok).toBe(true);
    expect((ok as any).restantes).toBe(4);
  });
});
