import worker from '../worker/src/index';
import { limparAuditoriaAntiga, diasDeRetencao } from '../worker/src/auditoria';
import { criarD1, temSqlite } from '../test-utils/d1';

const teste = temSqlite ? test : test.skip;
const DIA = 24 * 60 * 60 * 1000;
const AGORA = 1_700_000_000_000;

function inserir(db: any, id: string, criadoEm: number) {
  return db.prepare(
    'INSERT INTO admin_auditoria (id, rota, metodo, ip, status, motivo, detalhe, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).bind(id, '/v1/admin/pagina/post', 'POST', '1.1.1.1', 200, 'ok', null, criadoEm).run();
}

describe('retenção da auditoria', () => {
  teste('apaga só o que passou do prazo padrão de 180 dias', async () => {
    const db = criarD1();
    await inserir(db, 'velho', AGORA - 181 * DIA);
    await inserir(db, 'novo', AGORA - 10 * DIA);
    await inserir(db, 'limite', AGORA - 180 * DIA + 1000);

    const resultado = await limparAuditoriaAntiga({ LEVIA_DB: db }, { agora: AGORA });

    expect(resultado).toMatchObject({ removidos: 1, dias: 180 });
    const restantes = db.sql('SELECT id FROM admin_auditoria ORDER BY id').map((l: any) => l.id);
    expect(restantes).toEqual(['limite', 'novo']);
  });

  teste('o prazo vem de AUDITORIA_RETENCAO_DIAS', async () => {
    const db = criarD1();
    await inserir(db, 'velho', AGORA - 11 * DIA);
    await inserir(db, 'novo', AGORA - 9 * DIA);

    const resultado = await limparAuditoriaAntiga({ LEVIA_DB: db, AUDITORIA_RETENCAO_DIAS: '10' }, { agora: AGORA });

    expect(resultado).toMatchObject({ removidos: 1, dias: 10 });
    expect(db.sql('SELECT id FROM admin_auditoria').map((l: any) => l.id)).toEqual(['novo']);
  });

  test('valor inválido ou fora da faixa cai no padrão', () => {
    expect(diasDeRetencao({})).toBe(180);
    expect(diasDeRetencao({ AUDITORIA_RETENCAO_DIAS: '0' })).toBe(180);
    expect(diasDeRetencao({ AUDITORIA_RETENCAO_DIAS: '-5' })).toBe(180);
    expect(diasDeRetencao({ AUDITORIA_RETENCAO_DIAS: 'abc' })).toBe(180);
    expect(diasDeRetencao({ AUDITORIA_RETENCAO_DIAS: '99999' })).toBe(3650);
    expect(diasDeRetencao({ AUDITORIA_RETENCAO_DIAS: '30' })).toBe(30);
  });

  teste('apaga em lotes quando há mais de 500 registros vencidos', async () => {
    const db = criarD1();
    const comandos = [];
    for (let i = 0; i < 1201; i++) {
      comandos.push(db.prepare(
        'INSERT INTO admin_auditoria (id, rota, metodo, ip, status, motivo, detalhe, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(`v${i}`, '/v1/admin/pagina/insights', 'GET', '2.2.2.2', 200, 'ok', null, AGORA - 200 * DIA));
    }
    await db.batch(comandos);

    const resultado = await limparAuditoriaAntiga({ LEVIA_DB: db }, { agora: AGORA });

    expect(resultado.removidos).toBe(1201);
    expect((await db.prepare('SELECT COUNT(*) AS n FROM admin_auditoria').first()).n).toBe(0);
  });

  teste('o cron do Worker executa a limpeza', async () => {
    const db = criarD1();
    await inserir(db, 'muito-velho', Date.now() - 400 * DIA);
    const espia = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await (worker as any).scheduled({}, { LEVIA_DB: db }, { waitUntil() {} });
    } finally {
      espia.mockRestore();
    }
    expect((await db.prepare('SELECT COUNT(*) AS n FROM admin_auditoria').first()).n).toBe(0);
  });

  teste('sem D1 configurado a rotina não quebra', async () => {
    expect(await limparAuditoriaAntiga({})).toMatchObject({ removidos: 0, ignorado: 'sem_d1' });
  });
});
