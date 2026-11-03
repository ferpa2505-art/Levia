import { createHmac } from 'node:crypto';
import worker from '../worker/src/index';
import { emitirSerial, normalizarCodigo } from '../worker/src/serial';
import { processarMensagemWhatsApp } from '../worker/src/fluxo';
import { diaSeguinteAs19, fusoDoTelefone, puxarVencidos } from '../worker/src/lembretes';
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
    await falar(env, '1'); // idioma: português (Brasil)
    await falar(env, '1'); // consentimento
    await falar(env, 'Maria Silva');
    await falar(env, '2'); // e-mail: pular
    return falar(env, '3'); // objetivo
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

describe('LEVI: idioma, conversa, consentimento e lembretes', () => {
  let n = 0;
  const TEL_BR = '5511987654321';
  const falar = (env: any, texto: string, agora?: number, tel = TEL_BR) =>
    processarMensagemWhatsApp(env, tel, texto, `lv-${++n}`, agora) as Promise<any>;
  const pendentes = (db: any, tel = '+' + TEL_BR) =>
    db.sql('SELECT texto, enviar_em FROM wa_outbox WHERE phone = ? AND enviado_em IS NULL AND cancelado_em IS NULL ORDER BY enviar_em', tel) as any[];
  const contar = (db: any, tabela: string) => (db.sql(`SELECT COUNT(*) AS n FROM ${tabela}`)[0] as any).n;
  /** o 3º erro seguido passa para um atendente (handoff); testes que erram muitas vezes zeram o contador. */
  const zerarTentativas = (db: any) => db.sql("UPDATE wa_sessions SET data_json = json_set(data_json, '$.tentativasInvalidas', 0)");
  /** oi → idioma → consentimento: deixa a conversa pronta para o nome. */
  const ate_o_nome = async (env: any, idioma = '1') => {
    await falar(env, 'oi');
    await falar(env, idioma);
    return falar(env, '1');
  };

  teste('a primeira pergunta é o idioma, com o LEVI se apresentando, e nada é guardado ainda', async () => {
    const { db, env } = ambiente();
    const r = await falar(env, 'oi');
    expect(r.tipo).toBe('pergunta_idioma');
    expect(r.resposta).toContain('LEVI');
    for (const opcao of ['🇧🇷 Português (Brasil)', '🇵🇹 Português (Portugal)', '🇬🇧 English', '🇪🇸 Español', '🇮🇹 Italiano']) {
      expect(r.resposta).toContain(opcao);
    }
    expect(contar(db, 'leads')).toBe(0);
  });

  teste('cada idioma recebe o consentimento no seu idioma, com LEVI, a política e 1 = SIM / 2 = NÃO', async () => {
    const esperado: Record<string, string[]> = {
      '1': ['assistente virtual', 'DIGITE *1* PARA *SIM', 'DIGITE *2* PARA *NÃO*'],
      '2': ['assistente virtual', 'ESCREVA *1* PARA *SIM', 'telemóvel'],
      '3': ["virtual assistant", 'TYPE *1* FOR *YES', 'TYPE *2* FOR *NO*'],
      '4': ['asistente virtual', 'ESCRIBE *1* PARA *SÍ', 'ESCRIBE *2* PARA *NO*'],
      '5': ['assistente virtuale', 'SCRIVI *1* PER *SÌ', 'SCRIVI *2* PER *NO*'],
    };
    for (const [numero, trechos] of Object.entries(esperado)) {
      const { db, env } = ambiente();
      await falar(env, 'oi', undefined, `5511${numero}0000000`);
      const r = await falar(env, numero, undefined, `5511${numero}0000000`);
      expect(r.tipo).toBe('pergunta_consentimento');
      expect(r.resposta).toContain('LEVI');
      expect(r.resposta).toContain('levia-policies/privacidade.html');
      for (const trecho of trechos) expect(r.resposta).toContain(trecho);
      expect(contar(db, 'leads')).toBe(0);
    }
  });

  teste('o idioma também vale por palavra e o menu repete se a resposta não for uma opção', async () => {
    const { env } = ambiente();
    await falar(env, 'oi');
    const nao = await falar(env, 'banana');
    expect(nao.tipo).toBe('idioma_invalido');
    expect(nao.resposta).toContain('🇮🇹 Italiano');
    const ok = await falar(env, 'English');
    expect(ok.resposta).toContain('virtual assistant');
  });

  teste('responder NÃO (em inglês, 2) encerra sem guardar nada nem agendar lembretes', async () => {
    const { db, env } = ambiente();
    await falar(env, 'oi');
    await falar(env, '3');
    const r = await falar(env, '2');
    expect(r.tipo).toBe('cancelado');
    expect(r.resposta).toContain('Nothing was saved');
    expect(contar(db, 'wa_sessions')).toBe(0);
    expect(contar(db, 'leads')).toBe(0);
    expect(pendentes(db)).toHaveLength(0);
  });

  teste('cumprimentos não viram nome; "oi, sou a Renata" vira Renata', async () => {
    const { db, env } = ambiente();
    await ate_o_nome(env);
    for (const saudacao of ['Oi', 'olá', 'HELLO', 'hi', 'Bom dia', 'oiii!!', 'tudo bem?', 'ciao', 'buenos días']) {
      zerarTentativas(db);
      const r = await falar(env, saudacao);
      expect(r.tipo).toBe('nome_invalido');
      expect(r.resposta).toContain('cumprimento');
    }
    zerarTentativas(db);
    const ok = await falar(env, 'oi, sou a renata da silva');
    expect(ok.tipo).toBe('pergunta_email');
    expect(ok.resposta).toContain('Renata da Silva');
    expect(contar(db, 'leads')).toBe(0);
  });

  teste('a 3ª resposta inválida seguida passa para um atendente e encerra a conversa', async () => {
    const { db, env } = ambiente();
    await ate_o_nome(env);
    expect((await falar(env, 'Oi')).tipo).toBe('nome_invalido');
    expect((await falar(env, 'Oi')).tipo).toBe('nome_invalido');
    expect((await falar(env, 'Oi')).tipo).toBe('handoff_humano');
    expect(contar(db, 'wa_sessions')).toBe(0);
  });

  teste('em inglês as perguntas e o aviso do nome vêm em inglês e o objetivo grava em português', async () => {
    const { db, env } = ambiente();
    const nome = await ate_o_nome(env, '3');
    expect(nome.resposta).toContain('What should I call you');
    const saudacao = await falar(env, 'hello');
    expect(saudacao.resposta).toContain('greeting');
    const email = await falar(env, 'My name is john smith');
    expect(email.tipo).toBe('pergunta_email');
    expect(email.resposta).toContain('John Smith');
    expect(email.resposta).toContain("What's your email");
    const objetivo = await falar(env, '2'); // pular o e-mail
    expect(objetivo.resposta).toContain('6️⃣ All of the above');
    const fim = await falar(env, '4');
    expect(fim.tipo).toBe('finalizado');
    expect(fim.resposta).toContain('Done, John Smith');
    expect(db.sql('SELECT name, pain_point FROM leads')[0]).toMatchObject({ name: 'John Smith', pain_point: 'Ganhar massa muscular' });
  });

  teste('o objetivo é escolhido por número (6 = todos) e vira texto fixo no cadastro', async () => {
    const { db, env } = ambiente();
    await ate_o_nome(env);
    await falar(env, 'Ana');
    await falar(env, '2'); // e-mail: pular
    const invalido = await falar(env, 'sei lá');
    expect(invalido.tipo).toBe('objetivo_invalido');
    expect(invalido.resposta).toContain('Todos os acima');
    const r = await falar(env, '6');
    expect(r.tipo).toBe('finalizado');
    expect(db.sql('SELECT name, pain_point FROM leads')[0]).toMatchObject({ name: 'Ana', pain_point: 'Todos os acima' });
    expect((db.sql('SELECT consent_at FROM leads')[0] as any).consent_at).toBeTruthy();
  });

  teste('a pergunta agenda 30 s, 3 min e o dia seguinte às 19:00 do país; responder cancela', async () => {
    const { db, env } = ambiente();
    const agora = Date.UTC(2026, 9, 29, 20, 0, 0); // 29/10/2026 20:00 UTC
    await falar(env, 'oi', agora);
    const fila = pendentes(db);
    expect(fila).toHaveLength(3);
    expect(fila[0].enviar_em).toBe(agora + 30_000);
    expect(fila[1].enviar_em).toBe(agora + 180_000);
    expect(fila[2].enviar_em).toBe(Date.UTC(2026, 9, 30, 22, 0, 0)); // 19:00 em Brasília (UTC-3)
    expect(fila[2].texto).toContain('LEVI');
    expect(fila[2].texto).toContain('🇮🇹 Italiano'); // a pergunta pendente (idioma) vai junto
    await falar(env, '1', agora + 10_000); // respondeu o idioma: cancela os antigos e agenda os da nova pergunta
    const nova = pendentes(db);
    expect(nova).toHaveLength(3);
    expect(nova[0].texto).toContain('Ainda por aí');
    expect(nova[2].texto).toContain('PARAR');
    expect(nova[2].texto).toContain('DIGITE *1* PARA *SIM');
  });

  teste('os lembretes saem no idioma escolhido', async () => {
    const { db, env } = ambiente();
    const agora = Date.UTC(2026, 9, 29, 20, 0, 0);
    await falar(env, 'oi', agora);
    await falar(env, '5', agora + 1000); // italiano
    const fila = pendentes(db);
    expect(fila[0].texto).toContain('Ci sei?');
    expect(fila[1].texto).toContain('STOP');
    expect(fila[2].texto).toContain('Ieri hai iniziato');
  });

  teste('o dia seguinte usa o fuso do país do número', () => {
    const agora = Date.UTC(2026, 9, 29, 20, 0, 0);
    expect(fusoDoTelefone('+356 9900 1234')).toBe('Europe/Malta');
    expect(fusoDoTelefone('351912345678')).toBe('Europe/Lisbon');
    expect(fusoDoTelefone('5516996034777')).toBe('America/Sao_Paulo');
    expect(diaSeguinteAs19(agora, 'Europe/Malta')).toBe(Date.UTC(2026, 9, 30, 18, 0, 0)); // UTC+1 depois de 25/10
    expect(diaSeguinteAs19(agora, 'Europe/Lisbon')).toBe(Date.UTC(2026, 9, 30, 19, 0, 0)); // UTC+0
    // vira o horário de verão no meio do caminho: 24/10 à noite em Malta (UTC+2), 25/10 19:00 já é UTC+1
    const noite = Date.UTC(2026, 9, 24, 21, 0, 0);
    expect(diaSeguinteAs19(noite, 'Europe/Malta')).toBe(Date.UTC(2026, 9, 25, 18, 0, 0));
  });

  teste('o gateway só recebe o que venceu, uma vez, e só de quem ainda tem conversa aberta', async () => {
    const { db, env } = ambiente();
    const agora = Date.UTC(2026, 9, 29, 20, 0, 0);
    await falar(env, 'oi', agora);
    expect(await puxarVencidos(env, agora + 10_000)).toHaveLength(0);
    const primeiro = await puxarVencidos(env, agora + 31_000);
    expect(primeiro).toHaveLength(1);
    expect(primeiro[0]).toMatchObject({ telefone: TEL_BR });
    expect(primeiro[0].texto).toContain('Ainda por aí');
    expect(await puxarVencidos(env, agora + 31_000)).toHaveLength(0); // não repete
    await falar(env, 'parar', agora + 40_000);
    expect(await puxarVencidos(env, agora + 4 * 60_000)).toHaveLength(0); // PARAR cancela o resto
    expect(contar(db, 'wa_sessions')).toBe(0);
  });

  teste('PARAR (e STOP) encerram e o LEVI não escreve mais', async () => {
    const { db, env } = ambiente();
    await falar(env, 'oi');
    const r = await falar(env, 'PARAR');
    expect(r.tipo).toBe('parou');
    expect(pendentes(db)).toHaveLength(0);
    await falar(env, 'oi');
    await falar(env, '3');
    expect((await falar(env, 'stop')).resposta).toContain("won't message you anymore");
  });

  teste('APAGAR pede confirmação e então exclui cadastro, conta e serial', async () => {
    const { db, env } = ambiente();
    await ate_o_nome(env);
    await falar(env, 'Maria Silva');
    await falar(env, '2'); // e-mail: pular
    const fim = await falar(env, '3');
    const serial = fim.resposta.match(/[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}/)![0];
    expect(contar(db, 'accounts')).toBe(1);

    const pedido = await falar(env, 'apagar');
    expect(pedido.tipo).toBe('confirmar_apagar');
    expect(contar(db, 'leads')).toBe(1); // ainda não apagou

    const desistiu = await falar(env, '2');
    expect(desistiu.tipo).toBe('apagar_cancelado');
    expect(contar(db, 'leads')).toBe(1);

    await falar(env, 'APAGAR');
    const feito = await falar(env, '1');
    expect(feito.tipo).toBe('apagado');
    for (const tabela of ['leads', 'accounts', 'activation_codes', 'wa_sessions', 'wa_outbox']) {
      expect(contar(db, tabela)).toBe(0);
    }
    expect((await ativar(env, serial, A)).status).toBe(403); // o serial deixou de valer
  });

  teste('quem já se cadastrou é atendido no idioma do país do número (Itália → italiano)', async () => {
    const { env } = ambiente();
    const tel = '393331234567';
    await falar(env, 'oi', undefined, tel);
    await falar(env, '5', undefined, tel);
    await falar(env, '1', undefined, tel);
    await falar(env, 'Giulia', undefined, tel);
    await falar(env, 'giulia@exemplo.it', undefined, tel);
    const fim = await falar(env, '2', undefined, tel);
    expect(fim.resposta).toContain('Fatto, Giulia');
    const outra = await falar(env, 'ciao', undefined, tel);
    expect(outra.tipo).toBe('ja_finalizado');
    expect(outra.resposta).toContain('Hai già completato');
    const novo = await falar(env, 'SERIAL', undefined, tel);
    expect(novo.resposta).toContain('nuovo seriale');
  });

  teste('o e-mail é pedido depois do nome: válido é guardado, inválido pede de novo, 2 pula', async () => {
    const { db, env } = ambiente();
    await ate_o_nome(env);
    const pedido = await falar(env, 'Renata');
    expect(pedido.tipo).toBe('pergunta_email');
    expect(pedido.resposta).toContain('Renata');
    expect(pedido.resposta).toContain('e-mail');
    for (const ruim of ['renata', 'renata@', 'renata@exemplo', 'a b@c.com']) {
      zerarTentativas(db);
      const r = await falar(env, ruim);
      expect(r.tipo).toBe('email_invalido');
    }
    zerarTentativas(db);
    const ok = await falar(env, '  Renata.Silva@Exemplo.COM ');
    expect(ok.tipo).toBe('pergunta_objetivo');
    await falar(env, '1');
    expect(db.sql('SELECT email FROM leads')[0]).toEqual({ email: 'renata.silva@exemplo.com' });

    // quem pula fica sem e-mail
    const outro = '5511912340000';
    await falar(env, 'oi', undefined, outro);
    await falar(env, '1', undefined, outro);
    await falar(env, '1', undefined, outro);
    await falar(env, 'Beto', undefined, outro);
    await falar(env, 'pular', undefined, outro);
    await falar(env, '2', undefined, outro);
    expect(db.sql("SELECT email FROM leads WHERE name = 'Beto'")[0]).toEqual({ email: null });
  });

  teste('o serial vai em mensagens separadas: explicação, serial sozinho, como usar e vídeo', async () => {
    const { env } = ambiente();
    await ate_o_nome(env);
    await falar(env, 'Maria Silva');
    await falar(env, '2');
    const r = await falar(env, '3');
    expect(r.tipo).toBe('finalizado');
    expect(r.respostas).toHaveLength(4);
    expect(r.respostas[0]).toContain('Maria Silva');
    expect(r.respostas[0]).toContain('próxima mensagem');
    expect(r.respostas[0]).not.toMatch(/[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}/); // o serial NÃO vem junto
    expect(r.respostas[1]).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/); // sozinho, sem formatação
    expect(r.respostas[2]).toContain('/ativar');
    expect(r.respostas[3]).toMatchObject({ midia: 'video' });
    expect(r.respostas[3].texto).toContain('Maria Silva');
    expect((await ativar(env, r.respostas[1], A)).status).toBe(200);

    const novo = await falar(env, 'SERIAL');
    expect(novo.respostas).toHaveLength(3);
    expect(novo.respostas[1]).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/);
  });

  teste('os lembretes chamam a pessoa pelo nome e o do dia seguinte leva o vídeo, mas só depois do consentimento', async () => {
    const { db, env } = ambiente();
    const agora = Date.UTC(2026, 9, 29, 20, 0, 0);
    // antes do consentimento: só texto, sem nome
    await falar(env, 'oi', agora);
    await falar(env, '1', agora + 1000);
    const antes = pendentes(db);
    expect(antes[2].texto.startsWith('{')).toBe(false);
    expect(antes[1].texto).not.toContain('Renata');
    // depois de consentir e dizer o nome
    await falar(env, '1', agora + 2000);
    await falar(env, 'Renata', agora + 3000); // agora a pergunta aberta é o e-mail
    const depois = pendentes(db);
    expect(depois[0].texto).toContain('Renata, ainda por aí');
    expect(depois[1].texto).toContain('Renata, falta pouquinho');
    const diaSeguinte = JSON.parse(depois[2].texto);
    expect(diaSeguinte.midia).toBe('video');
    expect(diaSeguinte.texto).toContain('Oi, Renata!');
    expect(diaSeguinte.texto).toContain('PARAR');
    expect(diaSeguinte.texto).toContain('e-mail'); // repete a pergunta pendente
  });

  teste('o gateway recebe a mídia do lembrete e o texto sem o JSON', async () => {
    const { env } = ambiente();
    const agora = Date.UTC(2026, 9, 29, 20, 0, 0);
    await falar(env, 'oi', agora);
    await falar(env, '1', agora);
    await falar(env, '1', agora);
    await falar(env, 'Renata', agora);
    const entregues = await puxarVencidos(env, agora + 2 * 24 * 3600 * 1000);
    const comVideo = entregues.find((m: any) => m.midia === 'video');
    expect(comVideo).toBeTruthy();
    expect(comVideo.texto).toContain('Renata');
    expect(comVideo.texto.startsWith('{')).toBe(false);
    expect(entregues.filter((m: any) => !m.midia)).toHaveLength(2);
  });

  teste('sem a tabela de lembretes (migration 0006 pendente) a conversa continua funcionando', async () => {
    const { db, env } = ambiente();
    db.sql('DROP TABLE wa_outbox');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const r = await falar(env, 'oi');
    expect(r.resposta).toContain('LEVI');
    expect((await falar(env, '1')).tipo).toBe('pergunta_consentimento');
  });
});
