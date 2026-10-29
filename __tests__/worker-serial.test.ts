import { createHmac } from 'node:crypto';
import worker from '../worker/src/index';
import { emitirSerial, normalizarCodigo } from '../worker/src/serial';
import { processarMensagemWhatsApp } from '../worker/src/fluxo';
import { sha256 } from '../worker/src/cripto';
import { criarD1, temSqlite } from '../test-utils/d1';

// node:sqlite só existe no Node 22.13+; sem ele estes testes são pulados (o CI usa Node 22)
const teste = temSqlite ? test : test.skip;

const IMAGEM = `/9j/${'A'.repeat(1392)}/9k=`;
const TEL = '+5511987654321';
const SERIAL_FORMATO = /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/;
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A = uuid(1);
const B = uuid(2);
const C = uuid(3);

function ambiente(extra: Record<string, unknown> = {}) {
  const db = criarD1();
  const env = {
    LEVIA_DB: db, LICENCA_TOKEN_KEY: 'chave-da-licenca', TYPEBOT_PHONE_HMAC_KEY: 'chave-telefone',
    EMAIL_HASH_KEY: 'chave-email', GEMINI_API_KEY: 'gemini', FOTOS_GRATIS_7D: '2', ...extra,
  } as any;
  return { db, env };
}

function post(caminho: string, corpo: unknown, ip = '1.1.1.1') {
  return new Request(`https://worker.test${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip },
    body: JSON.stringify(corpo),
  });
}
const ativar = (env: any, serial: unknown, instalacao: string, ip?: string) =>
  worker.fetch(post('/v1/ativar', { serial, instalacao }, ip), env);
const analisar = (env: any, licenca: unknown, instalacao: string) =>
  worker.fetch(post('/v1/analisar-prato', { imagem: IMAGEM, instalacao, idioma: 'pt', licenca }), env);

/** Emite um serial para o telefone e ativa neste aparelho. */
async function ativado(env: any, instalacao = A, telefone = TEL) {
  const emissao: any = await emitirSerial(env, { telefone });
  expect(emissao.ok).toBe(true);
  const resposta = await ativar(env, emissao.serial, instalacao);
  expect(resposta.status).toBe(200);
  const corpo: any = await resposta.json();
  return { serial: emissao.serial as string, licenca: corpo.licenca as string };
}

let fetchMock: jest.Mock;
const originalFetch = global.fetch;
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  fetchMock = jest.fn(async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify({
      ehComida: true,
      itens: [{ nome: 'Arroz', nomeIngles: 'Rice', unidades: 1, gramas: 100, confianca: 0.9, por100g: { kcal: 130, proteina: 2.5, carboidrato: 28, gordura: 0.3, fibra: 0.4 } }],
    }) }] } }],
  }), { status: 200 }));
  global.fetch = fetchMock as typeof fetch;
});
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

describe('serial: emissão', () => {
  teste('tem o formato combinado e só o hash vai para o banco', async () => {
    const { db, env } = ambiente();
    const r: any = await emitirSerial(env, { telefone: TEL });
    expect(r.ok).toBe(true);
    expect(r.serial).toMatch(SERIAL_FORMATO);
    const linhas = db.sql('SELECT * FROM activation_codes');
    expect(linhas).toHaveLength(1);
    expect((linhas[0] as any).code_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(db.sql('SELECT * FROM activation_codes'))).not.toContain(r.serial.replace(/-/g, ''));
  });

  teste('o mesmo telefone sempre cai na mesma conta', async () => {
    const { db, env } = ambiente();
    await emitirSerial(env, { telefone: TEL });
    await emitirSerial(env, { telefone: TEL });
    expect((db.sql('SELECT COUNT(*) AS n FROM accounts')[0] as any).n).toBe(1);
  });

  teste('um serial novo invalida o anterior', async () => {
    const { env } = ambiente();
    const velho: any = await emitirSerial(env, { telefone: TEL });
    const novo: any = await emitirSerial(env, { telefone: TEL });
    expect((await ativar(env, velho.serial, A)).status).toBe(403);
    expect((await ativar(env, novo.serial, A)).status).toBe(200);
  });

  teste('no máximo 3 emissões por dia', async () => {
    const { env } = ambiente();
    for (let i = 0; i < 3; i++) expect(((await emitirSerial(env, { telefone: TEL })) as any).ok).toBe(true);
    expect(await emitirSerial(env, { telefone: TEL })).toEqual({ ok: false, motivo: 'limite' });
  });

  test('sem as chaves configuradas não emite', async () => {
    expect(await emitirSerial({} as any, { telefone: TEL })).toEqual({ ok: false, motivo: 'nao_configurado' });
  });
});

describe('serial: normalização', () => {
  test('aceita minúsculas, espaços e hífens; recusa o que não tem o formato', () => {
    expect(normalizarCodigo(' abcd-efgh jkmn-pqrs ')).toBe('ABCDEFGHJKMNPQRS');
    expect(normalizarCodigo('ABCDEFGHJKMNPQRS')).toBe('ABCDEFGHJKMNPQRS');
    expect(normalizarCodigo('ABCD-EFGH-IJKL-MNOP')).toBeNull(); // I e O não existem no alfabeto
    expect(normalizarCodigo('ABC')).toBeNull();
    expect(normalizarCodigo(123)).toBeNull();
    expect(normalizarCodigo('')).toBeNull();
  });

  test('mantém o código longo do e-mail exatamente como veio', () => {
    const token = 'aB3_x-9Qz'.repeat(5).slice(0, 43);
    expect(normalizarCodigo(token)).toBe(token);
  });
});

describe('serial: ativação', () => {
  teste('ativa, devolve a licença e começa o teste de 7 dias', async () => {
    const { db, env } = ambiente();
    const e: any = await emitirSerial(env, { telefone: TEL });
    const r = await ativar(env, e.serial, A);
    expect(r.status).toBe(200);
    const corpo: any = await r.json();
    expect(corpo).toMatchObject({ ok: true, plano: 'teste', fotos: 2 });
    expect(corpo.licenca).toMatch(/^v1\.[\w-]+\.[0-9a-f]{64}$/);
    const t: any = db.sql('SELECT * FROM trials')[0];
    const dias = (Date.parse(t.expires_at) - Date.parse(t.started_at)) / 86400000;
    expect(dias).toBeCloseTo(7, 1);
    expect((db.sql('SELECT used_at FROM activation_codes')[0] as any).used_at).toBeTruthy();
  });

  teste('aceita o serial digitado em minúsculas e com espaços', async () => {
    const { env } = ambiente();
    const e: any = await emitirSerial(env, { telefone: TEL });
    expect((await ativar(env, e.serial.toLowerCase().replace(/-/g, ' '), A)).status).toBe(200);
  });

  teste('vale para 2 aparelhos; o 3º é recusado e o 1º continua entrando', async () => {
    const { env } = ambiente();
    const e: any = await emitirSerial(env, { telefone: TEL });
    expect((await ativar(env, e.serial, A)).status).toBe(200);
    expect((await ativar(env, e.serial, B)).status).toBe(200);
    const terceiro = await ativar(env, e.serial, C);
    expect(terceiro.status).toBe(409);
    expect(await terceiro.json()).toEqual({ erro: 'limite_dispositivos' });
    expect((await ativar(env, e.serial, A)).status).toBe(200);
  });

  teste('ativações simultâneas não passam do limite de aparelhos', async () => {
    const { env } = ambiente();
    const e: any = await emitirSerial(env, { telefone: TEL });
    const respostas = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => ativar(env, e.serial, uuid(n))));
    const status = respostas.map((r) => r.status).sort();
    expect(status.filter((s) => s === 200)).toHaveLength(2);
    expect(status.filter((s) => s === 409)).toHaveLength(4);
  });

  teste('serial errado, mal formado ou vencido recebem a mesma resposta', async () => {
    const { env } = ambiente({ SERIAL_VALIDADE_DIAS: '0' });
    const vencido: any = await emitirSerial(env, { telefone: TEL });
    const respostas = await Promise.all([
      ativar(env, 'ABCD-EFGH-JKMN-PQRS', A),
      ativar(env, 'lixo', B),
      ativar(env, vencido.serial, C),
    ]);
    for (const r of respostas) {
      expect(r.status).toBe(403);
      expect(await r.json()).toEqual({ erro: 'serial_invalido' });
    }
  });

  teste('limita tentativas por IP (16ª tentativa em uma hora é barrada)', async () => {
    const { env } = ambiente();
    for (let i = 1; i <= 15; i++) expect((await ativar(env, 'ABCD-EFGH-JKMN-PQRS', uuid(i), '9.9.9.9')).status).toBe(403);
    const barrada = await ativar(env, 'ABCD-EFGH-JKMN-PQRS', uuid(16), '9.9.9.9');
    expect(barrada.status).toBe(429);
    expect(await barrada.json()).toEqual({ erro: 'muitas_tentativas' });
    // outro IP não é afetado
    expect((await ativar(env, 'ABCD-EFGH-JKMN-PQRS', uuid(17), '8.8.8.8')).status).toBe(403);
  });

  teste('o teste não recomeça: depois de vencido, ativar de novo não dá acesso', async () => {
    const { db, env } = ambiente();
    const { serial } = await ativado(env);
    db.sql("UPDATE trials SET expires_at = '2020-01-01T00:00:00.000Z'");
    const r = await ativar(env, serial, A);
    expect(r.status).toBe(402);
    expect(await r.json()).toEqual({ erro: 'acesso_expirado' });
  });

  teste('uma instalação já ligada a outra conta não pode ser reaproveitada', async () => {
    const { env } = ambiente();
    await ativado(env, A, TEL);
    const outro: any = await emitirSerial(env, { telefone: '+5521988887777' });
    const r = await ativar(env, outro.serial, A);
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ erro: 'instalacao_em_uso' });
  });

  teste('conta bloqueada não ativa', async () => {
    const { db, env } = ambiente();
    const e: any = await emitirSerial(env, { telefone: TEL });
    db.sql("UPDATE accounts SET status = 'blocked'");
    expect((await ativar(env, e.serial, A)).status).toBe(403);
  });

  teste('aceita o código longo enviado por e-mail pelo fluxo do Typebot', async () => {
    const { db, env } = ambiente();
    const token = 'k9Zq_w-Tn3yRb7Lm2XcVd5Hs8Jf1Pg4Ua6Ne0OiYtQe';
    expect(token).toHaveLength(43);
    const agora = new Date().toISOString();
    db.sql('INSERT INTO accounts (id, email_hash, created_at, updated_at) VALUES (?, ?, ?, ?)', 'conta-email', 'hash-email', agora, agora);
    db.sql('INSERT INTO activation_codes (id, account_id, code_hash, issued_at, expires_at) VALUES (?, ?, ?, ?, ?)',
      'c1', 'conta-email', await sha256(token), agora, new Date(Date.now() + 60000).toISOString());
    expect((await ativar(env, token, A)).status).toBe(200);
  });

  test('fica fechado sem a chave de assinatura e rejeita instalação inválida', async () => {
    expect((await ativar({ LEVIA_DB: {} } as any, 'ABCD-EFGH-JKMN-PQRS', A)).status).toBe(503);
    expect((await ativar({ LEVIA_DB: {}, LICENCA_TOKEN_KEY: 'k' } as any, 'ABCD-EFGH-JKMN-PQRS', 'nao-e-uuid')).status).toBe(400);
  });
});

describe('serial: licença na análise de foto', () => {
  teste('sem licença não chega ao Gemini', async () => {
    const { env } = ambiente();
    const r = await analisar(env, undefined, A);
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ erro: 'licenca_obrigatoria' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  teste('licença adulterada, de outra chave ou de aparelho não ativado é recusada', async () => {
    const { env } = ambiente();
    const { licenca } = await ativado(env, A);
    const adulterada = licenca.slice(0, -1) + (licenca.endsWith('0') ? '1' : '0');
    expect((await analisar(env, adulterada, A)).status).toBe(403);
    expect((await analisar(env, licenca, B)).status).toBe(403); // B nunca foi ativado
    expect((await analisar({ ...env, LICENCA_TOKEN_KEY: 'outra-chave' }, licenca, A)).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  teste('a licença é presa ao aparelho: a do A não vale no B, mesmo sendo da mesma conta', async () => {
    const { env } = ambiente();
    const { serial, licenca: licencaA } = await ativado(env, A);
    const licencaB = ((await (await ativar(env, serial, B)).json()) as any).licenca;
    const cruzada = await analisar(env, licencaA, B);
    expect(cruzada.status).toBe(403);
    expect(await cruzada.json()).toEqual({ erro: 'licenca_invalida' });
    expect((await analisar(env, licencaB, B)).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  teste('licença com validade vencida é recusada', async () => {
    const { db, env } = ambiente();
    await ativado(env, A);
    const conta = (db.sql('SELECT id FROM accounts')[0] as any).id;
    const corpo = `v1.${Buffer.from(JSON.stringify({ c: conta, i: A, e: 1000 })).toString('base64url')}`;
    const vencida = `${corpo}.${createHmac('sha256', 'chave-da-licenca').update(corpo).digest('hex')}`;
    expect((await analisar(env, vencida, A)).status).toBe(403);
  });

  teste('com licença válida analisa, conta a foto e para na cota', async () => {
    const { env } = ambiente();
    const { licenca } = await ativado(env, A);
    const primeira = await analisar(env, licenca, A);
    expect(primeira.status).toBe(200);
    expect(await primeira.json()).toMatchObject({ ehComida: true, restantes: 1 });
    expect(((await (await analisar(env, licenca, A)).json()) as any).restantes).toBe(0);
    const terceira = await analisar(env, licenca, A);
    expect(terceira.status).toBe(402);
    expect(await terceira.json()).toMatchObject({ erro: 'cota_esgotada', limite: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  teste('a cota é da conta: os dois aparelhos dividem as mesmas fotos', async () => {
    const { env } = ambiente();
    const { serial, licenca: licencaA } = await ativado(env, A);
    const licencaB = ((await (await ativar(env, serial, B)).json()) as any).licenca;
    await analisar(env, licencaA, A);
    await analisar(env, licencaA, A);
    expect((await analisar(env, licencaB, B)).status).toBe(402);
  });

  teste('teste vencido bloqueia a IA', async () => {
    const { db, env } = ambiente();
    const { licenca } = await ativado(env, A);
    db.sql("UPDATE trials SET expires_at = '2020-01-01T00:00:00.000Z'");
    const r = await analisar(env, licenca, A);
    expect(r.status).toBe(402);
    expect(await r.json()).toEqual({ erro: 'acesso_expirado' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  teste('assinatura ativa vale mais que o teste vencido', async () => {
    const { db, env } = ambiente();
    const { licenca } = await ativado(env, A);
    const conta = (db.sql('SELECT id FROM accounts')[0] as any).id;
    const agora = new Date().toISOString();
    db.sql("UPDATE trials SET expires_at = '2020-01-01T00:00:00.000Z'");
    db.sql(
      "INSERT INTO entitlements (id, account_id, plan, status, photo_limit, current_period_end, created_at, updated_at) VALUES ('e1', ?, 'monthly', 'active', 5, ?, ?, ?)",
      conta, new Date(Date.now() + 86400000).toISOString(), agora, agora,
    );
    for (let i = 0; i < 3; i++) expect((await analisar(env, licenca, A)).status).toBe(200);
  });

  teste('aparelho revogado ou conta bloqueada perdem o acesso na hora', async () => {
    const { db, env } = ambiente();
    const { licenca } = await ativado(env, A);
    db.sql("UPDATE installations SET revoked_at = '2026-01-01T00:00:00.000Z'");
    const revogado = await analisar(env, licenca, A);
    expect(revogado.status).toBe(403);
    expect(await revogado.json()).toEqual({ erro: 'licenca_revogada' });

    db.sql('UPDATE installations SET revoked_at = NULL');
    expect((await analisar(env, licenca, A)).status).toBe(200);
    db.sql("UPDATE accounts SET status = 'blocked'");
    expect((await analisar(env, licenca, A)).status).toBe(403);
  });

  teste('falha do Gemini ainda gasta uma foto da cota', async () => {
    const { db, env } = ambiente();
    const { licenca } = await ativado(env, A);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { status: 'FALHA' } }), { status: 500 }));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect((await analisar(env, licenca, A)).status).toBe(502);
    expect((db.sql("SELECT COUNT(*) AS n FROM cotas_uso WHERE chave LIKE 'conta:%'")[0] as any).n).toBe(1);
  });
});

describe('serial: fluxo do WhatsApp', () => {
  let contador = 0;
  const falar = (env: any, texto: string, telefone = '5511987654321') =>
    processarMensagemWhatsApp(env, telefone, texto, `msg-${++contador}`) as Promise<any>;

  async function cadastrar(env: any) {
    await falar(env, 'oi');
    await falar(env, 'Maria Silva');
    await falar(env, 'quero emagrecer');
    return falar(env, 'sim');
  }

  teste('a conversa termina com um serial que ativa o app', async () => {
    const { env } = ambiente();
    const r = await cadastrar(env);
    expect(r.tipo).toBe('finalizado');
    const serial = r.resposta.match(/[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}/)?.[0];
    expect(serial).toBeTruthy();
    expect(r.resposta).toContain('/ativar');
    expect((await ativar(env, serial, A)).status).toBe(200);
  });

  teste('quem já se cadastrou pede um novo serial digitando SERIAL', async () => {
    const { env } = ambiente();
    const primeiro = await cadastrar(env);
    const antigo = primeiro.resposta.match(/[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}/)![0];
    const pedido = await falar(env, 'SERIAL');
    expect(pedido.tipo).toBe('serial_novo');
    const novo = pedido.resposta.match(/[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}/)![0];
    expect(novo).not.toBe(antigo);
    expect((await ativar(env, antigo, A)).status).toBe(403);
    expect((await ativar(env, novo, A)).status).toBe(200);
    expect((await falar(env, 'qualquer coisa')).resposta).toContain('SERIAL');
  });

  teste('sem a configuração do serial o cadastro não se perde e dá para tentar de novo', async () => {
    const { env } = ambiente({ TYPEBOT_PHONE_HMAC_KEY: undefined });
    const r = await cadastrar(env);
    expect(r.tipo).toBe('finalizado_sem_serial');
    expect(r.resposta).not.toMatch(/[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}/);
    expect((await falar(env, 'SERIAL')).tipo).toBe('erro');
  });
});

describe('serial: script manual', () => {
  teste('o serial gerado na mão ativa um aparelho e libera a IA; o banco só guarda o hash', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { montarSql } = require('../worker/scripts/serial-manual.cjs');
    const { db, env } = ambiente();
    const r = montarSql({ nome: 'Testadora Ficticia', dias: 30 });
    for (const linha of r.sql.split('\n').filter(Boolean)) db.sql(linha);

    expect(r.serialFormatado).toMatch(SERIAL_FORMATO);
    expect(normalizarCodigo(r.serialFormatado)).toBe(r.serial);
    expect(JSON.stringify(db.sql('SELECT * FROM activation_codes'))).not.toContain(r.serial);
    expect(JSON.stringify(db.sql('SELECT * FROM accounts'))).not.toContain('Testadora');

    const res = await ativar(env, r.serialFormatado, A);
    expect(res.status).toBe(200);
    const { licenca } = await res.json();
    expect((await analisar(env, licenca, A)).status).toBe(200);
  });
});
