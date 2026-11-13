import { randomBytes } from 'node:crypto';
import {
  ARGON2_WEB,
  CHAVE_CABECALHO, CHAVE_SAL, CHAVES_SENSIVEIS, CofreBloqueado, ArmazenamentoBruto, ProvedorChaveSistema,
  cifrarTexto, cifrarTextoV2, criarCofre, decifrarTextoV2, derivarChave, estaCifrado,
  PREFIXO_ENVELOPE, PREFIXO_ENVELOPE_V2,
} from '../src/utils/cofreDados';
import { paraBase64 } from '../src/utils/cifraBackup';

// Só dados SINTÉTICOS. KDFs leves nos testes (o custo real é o do app).
const LEVE = { N: 2 ** 10, r: 8, p: 1 };
const ARGON_LEVE = { m: 64, t: 1, p: 1 };
const aleatorio = (n: number) => new Uint8Array(randomBytes(n));

function armazenamentoFalso(inicial: Record<string, string> = {}) {
  const mapa = new Map<string, string>(Object.entries(inicial));
  const bruto: ArmazenamentoBruto & { mapa: Map<string, string>; falharMultiSet: boolean; multiSets: number } = {
    mapa, falharMultiSet: false, multiSets: 0,
    getItem: async (c) => mapa.get(c) ?? null,
    setItem: async (c, v) => { mapa.set(c, v); },
    removeItem: async (c) => { mapa.delete(c); },
    multiSet: async (pares) => {
      bruto.multiSets += 1;
      if (bruto.falharMultiSet) throw new Error('disco cheio (simulado)');
      for (const [c, v] of pares) mapa.set(c, v);
    },
  };
  return bruto;
}

function sistemaFalso(inicial: Uint8Array | null = null) {
  let guardada = inicial;
  const p: ProvedorChaveSistema & { estado: () => Uint8Array | null; quebrar: boolean; perder: () => void } = {
    quebrar: false,
    estado: () => guardada,
    perder: () => { guardada = null; },
    ler: async () => { if (p.quebrar) throw new Error('keystore indisponível'); return guardada; },
    gravar: async (k) => { if (p.quebrar) throw new Error('keystore indisponível'); guardada = k; },
  };
  return p;
}

const web = (arm: ArmazenamentoBruto) => criarCofre({ armazenamento: arm, aleatorio, scrypt: LEVE, argon2: ARGON_LEVE });
const nativo = (arm: ArmazenamentoBruto, sis: ProvedorChaveSistema) =>
  criarCofre({ armazenamento: arm, aleatorio, scrypt: LEVE, argon2: ARGON_LEVE, chaveSistema: sis });

/** Constrói um armazenamento no formato v1 (chave = scrypt(PIN), envelope LEVIA-ENC1), como o app antigo gravava. */
async function cofreV1(pin: string, dados: Record<string, string>) {
  const sal = aleatorio(16);
  const k1 = await derivarChave(pin, sal, LEVE);
  const inicial: Record<string, string> = { [CHAVE_SAL]: paraBase64(sal) };
  for (const [c, v] of Object.entries(dados)) inicial[c] = cifrarTexto(v, k1, aleatorio);
  return { arm: armazenamentoFalso(inicial), k1 };
}

const DADOS = {
  'levia:diabetes': '{"glicemias":[{"v":98,"quando":"2026-01-01T08:00"}]}',
  'levia:userProfile': '{"nome":"Pessoa Ficticia","pesoKg":80}',
  'levia:records': '[{"peso":80.1}]',
};

describe('cofre v2: formato', () => {
  test('o envelope v2 amarra o dado ao nome da chave (AAD): copiar para outra chave não abre', async () => {
    const arm = armazenamentoFalso();
    const c = web(arm);
    await c.desbloquear('senha-longa-e-sintetica');
    await c.gravarDado('levia:glp1', 'dose ficticia');
    const envelope = arm.mapa.get('levia:glp1')!;
    expect(envelope.startsWith(PREFIXO_ENVELOPE_V2)).toBe(true);
    arm.mapa.set('levia:medicacoes', envelope); // um atacante troca o envelope de lugar
    await expect(c.lerDado('levia:medicacoes')).rejects.toBeInstanceOf(CofreBloqueado);
    expect(await c.lerDado('levia:glp1')).toBe('dose ficticia');
    expect(decifrarTextoV2(envelope, c.obterChave()!, 'levia:medicacoes')).toBeNull();
  });

  test('um envelope adulterado não abre (autenticação do GCM)', async () => {
    const arm = armazenamentoFalso();
    const c = web(arm);
    await c.desbloquear('senha-longa-e-sintetica');
    await c.gravarDado('levia:records', 'peso 80');
    const e = arm.mapa.get('levia:records')!;
    arm.mapa.set('levia:records', e.slice(0, -4) + (e.endsWith('AAAA') ? 'BBBB' : 'AAAA'));
    await expect(c.lerDado('levia:records')).rejects.toBeInstanceOf(CofreBloqueado);
  });

  test('a DEK nunca é gravada em claro e muda a cada cofre novo (aleatória, não derivada do PIN)', async () => {
    const a = armazenamentoFalso(); const b = armazenamentoFalso();
    const ca = web(a); const cb = web(b);
    await ca.desbloquear('1234'); await cb.desbloquear('1234'); // mesmo PIN, cofres diferentes
    const dekA = ca.obterChave()!; const dekB = cb.obterChave()!;
    expect(Buffer.from(dekA).equals(Buffer.from(dekB))).toBe(false);
    for (const arm of [a, b]) {
      const tudo = [...arm.mapa.values()].join('|');
      for (const dek of [dekA, dekB]) {
        expect(tudo).not.toContain(Buffer.from(dek).toString('base64'));
        expect(tudo).not.toContain(Buffer.from(dek).toString('hex'));
      }
    }
  });

  test('o cabeçalho do navegador guarda os parâmetros do Argon2id; o padrão do app é memória-dura', () => {
    expect(ARGON2_WEB.m).toBeGreaterThanOrEqual(19456); // mínimo OWASP para Argon2id
    expect(ARGON2_WEB.t).toBeGreaterThanOrEqual(2);
  });
});

describe('cofre v2: navegador (sem cofre do sistema)', () => {
  test('só a senha abre; errada falha; sem a senha não há como derivar a chave', async () => {
    const arm = armazenamentoFalso();
    const c = web(arm);
    await c.desbloquear('senha-longa-e-sintetica');
    await c.gravarDado('levia:records', 'peso 80');
    c.bloquear();
    await expect(web(arm).desbloquear('senha-errada')).rejects.toBeInstanceOf(CofreBloqueado);
    const ok = web(arm);
    await ok.desbloquear('senha-longa-e-sintetica');
    expect(await ok.lerDado('levia:records')).toBe('peso 80');
    const cab = JSON.parse(arm.mapa.get(CHAVE_CABECALHO)!);
    expect(cab.slots.senha.kdf.alg).toBe('argon2id');
    expect(cab.slots.sistema).toBeUndefined();
  });

  test('desbloqueio sem nenhum dado gravado também confere a senha (valor de verificação)', async () => {
    const arm = armazenamentoFalso();
    const c = web(arm);
    await c.desbloquear('1234');
    c.bloquear();
    await expect(web(arm).desbloquear('9999')).rejects.toBeInstanceOf(CofreBloqueado);
    await expect(web(arm).desbloquearComChave(new Uint8Array(32).fill(1))).rejects.toBeInstanceOf(CofreBloqueado);
  });

  test('trocar a senha reembrulha a chave: a antiga deixa de abrir, os dados ficam intactos', async () => {
    const arm = armazenamentoFalso();
    const c = web(arm);
    await c.desbloquear('senha-antiga-ficticia');
    await c.gravarDado('levia:diabetes', DADOS['levia:diabetes']);
    const envelope = arm.mapa.get('levia:diabetes');
    await c.trocarPin('senha-nova-ficticia');
    expect(arm.mapa.get('levia:diabetes')).toBe(envelope);
    c.bloquear();
    await expect(web(arm).desbloquear('senha-antiga-ficticia')).rejects.toBeInstanceOf(CofreBloqueado);
    const n = web(arm);
    await n.desbloquear('senha-nova-ficticia');
    expect(await n.lerDado('levia:diabetes')).toBe(DADOS['levia:diabetes']);
  });
});

describe('cofre v2: celular (cofre do sistema)', () => {
  test('o armazenamento copiado sozinho não abre: sem a chave do sistema nem o PIN certo resolve', async () => {
    const arm = armazenamentoFalso();
    const sis = sistemaFalso();
    const c = nativo(arm, sis);
    await c.desbloquear('1234');
    await c.gravarDado('levia:glp1', 'dose ficticia');
    const cab = JSON.parse(arm.mapa.get(CHAVE_CABECALHO)!);
    expect(cab.slots.sistema).toBeDefined();
    expect(cab.slots.senha).toBeUndefined(); // não há slot derivado do PIN para atacar offline
    // atacante: copiou o armazenamento do app (sem o Keystore) para outro aparelho
    const copia = armazenamentoFalso(Object.fromEntries(arm.mapa));
    const outro = nativo(copia, sistemaFalso()); // outro aparelho: sem a chave
    for (const pin of ['1234', '0000', '9999']) await expect(outro.desbloquear(pin)).rejects.toBeInstanceOf(CofreBloqueado);
    // mesmo aparelho: a chave do sistema abre
    c.bloquear();
    await nativo(arm, sis).desbloquear('qualquer-coisa-ja-conferida-pelo-app');
  });

  test('trocar o PIN no celular não mexe nos dados nem no cabeçalho (o PIN é só a trava do app)', async () => {
    const arm = armazenamentoFalso();
    const sis = sistemaFalso();
    const c = nativo(arm, sis);
    await c.desbloquear('1234');
    await c.gravarDado('levia:records', 'x');
    const antes = [arm.mapa.get('levia:records'), arm.mapa.get(CHAVE_CABECALHO)];
    await c.trocarPin('567890');
    expect([arm.mapa.get('levia:records'), arm.mapa.get(CHAVE_CABECALHO)]).toEqual(antes);
  });

  test('se o cofre do sistema falhar na criação, cai para o slot de senha e marca "rebaixado"', async () => {
    const arm = armazenamentoFalso();
    const sis = sistemaFalso();
    sis.quebrar = true;
    const c = nativo(arm, sis);
    await c.desbloquear('1234');
    const cab = JSON.parse(arm.mapa.get(CHAVE_CABECALHO)!);
    expect(cab.rebaixado).toBe(true);
    expect(cab.slots.sistema).toBeUndefined();
    expect(cab.slots.senha).toBeDefined();
    c.bloquear();
    await expect(nativo(arm, sis).desbloquear('9999')).rejects.toBeInstanceOf(CofreBloqueado);
    await nativo(arm, sis).desbloquear('1234');
  });

  test('chave do sistema perdida (ex.: dados restaurados em outro aparelho): falha fechada, sem apagar nada', async () => {
    const arm = armazenamentoFalso();
    const sis = sistemaFalso();
    const c = nativo(arm, sis);
    await c.desbloquear('1234');
    await c.gravarDado('levia:glp1', 'dose ficticia');
    const antes = new Map(arm.mapa);
    c.bloquear();
    sis.perder();
    await expect(nativo(arm, sis).desbloquear('1234')).rejects.toBeInstanceOf(CofreBloqueado);
    expect(new Map(arm.mapa)).toEqual(antes); // nada foi regravado nem apagado
  });
});

describe('migração v1 -> v2 (dados sintéticos)', () => {
  test('migra pelo PIN no navegador: todos os valores abrem, o sal v1 some, o PIN antigo continua valendo', async () => {
    const { arm } = await cofreV1('1234', DADOS);
    const c = web(arm);
    await c.desbloquear('1234');
    for (const [k, v] of Object.entries(DADOS)) {
      expect(arm.mapa.get(k)!.startsWith(PREFIXO_ENVELOPE_V2)).toBe(true);
      expect(await c.lerDado(k)).toBe(v);
    }
    expect(arm.mapa.get(CHAVE_SAL)).toBeUndefined();
    c.bloquear();
    await expect(web(arm).desbloquear('9999')).rejects.toBeInstanceOf(CofreBloqueado);
    const r = web(arm);
    await r.desbloquear('1234');
    expect(await r.lerDado('levia:userProfile')).toBe(DADOS['levia:userProfile']);
  });

  test('migra no celular: passa para o slot do sistema e deixa de existir slot derivado do PIN', async () => {
    const { arm } = await cofreV1('1234', DADOS);
    const sis = sistemaFalso();
    const c = nativo(arm, sis);
    await c.desbloquear('1234');
    const cab = JSON.parse(arm.mapa.get(CHAVE_CABECALHO)!);
    expect(cab.slots.sistema).toBeDefined();
    expect(cab.slots.senha).toBeUndefined();
    for (const [k, v] of Object.entries(DADOS)) expect(await c.lerDado(k)).toBe(v);
    expect(sis.estado()).not.toBeNull();
  });

  test('migra pela biometria (chave v1 guardada): dados intactos e a nova chave é a DEK', async () => {
    const { arm, k1 } = await cofreV1('1234', DADOS);
    const c = web(arm);
    await c.desbloquearComChave(k1);
    for (const [k, v] of Object.entries(DADOS)) expect(await c.lerDado(k)).toBe(v);
    expect(Buffer.from(c.obterChave()!).equals(Buffer.from(k1))).toBe(false);
    // o PIN antigo ainda abre (slot de senha com o descritor scrypt do v1, subido para Argon2id no próximo desbloqueio)
    c.bloquear();
    const r = web(arm);
    await r.desbloquear('1234');
    expect(JSON.parse(arm.mapa.get(CHAVE_CABECALHO)!).slots.senha.kdf.alg).toBe('argon2id');
  });

  test('PIN errado na migração não grava nada e os dados v1 ficam intactos', async () => {
    const { arm } = await cofreV1('1234', DADOS);
    const antes = new Map(arm.mapa);
    await expect(web(arm).desbloquear('0000')).rejects.toBeInstanceOf(CofreBloqueado);
    expect(new Map(arm.mapa)).toEqual(antes);
  });

  test('um valor corrompido impede a migração inteira: nada é gravado, nada é perdido', async () => {
    const { arm } = await cofreV1('1234', DADOS);
    const corrompido = arm.mapa.get('levia:records')!;
    arm.mapa.set('levia:records', corrompido.slice(0, -6) + 'AAAAAA');
    const antes = new Map(arm.mapa);
    await expect(web(arm).desbloquear('1234')).rejects.toBeInstanceOf(CofreBloqueado);
    expect(new Map(arm.mapa)).toEqual(antes);
    expect(arm.mapa.has(CHAVE_CABECALHO)).toBe(false);
  });

  test('falha na gravação (disco cheio) mantém o v1 e a migração funciona na tentativa seguinte', async () => {
    const { arm } = await cofreV1('1234', DADOS);
    arm.falharMultiSet = true;
    const antes = new Map(arm.mapa);
    await expect(web(arm).desbloquear('1234')).rejects.toThrow(/disco cheio/);
    expect(new Map(arm.mapa)).toEqual(antes); // v1 intacto
    arm.falharMultiSet = false;
    const c = web(arm);
    await c.desbloquear('1234');
    for (const [k, v] of Object.entries(DADOS)) expect(await c.lerDado(k)).toBe(v);
  });

  test('texto puro do onboarding antigo (sem cofre) também vira envelope v2', async () => {
    const arm = armazenamentoFalso({ 'levia:diabetes': '{"antigo":true}', 'levia:glp1': 'x' });
    const c = web(arm);
    await c.desbloquear('1234');
    for (const k of ['levia:diabetes', 'levia:glp1']) expect(estaCifrado(arm.mapa.get(k)!)).toBe(true);
    expect(await c.lerDado('levia:diabetes')).toBe('{"antigo":true}');
  });

  test('migrar é idempotente: abrir de novo não recifra nem perde nada', async () => {
    const { arm } = await cofreV1('1234', DADOS);
    const c = web(arm);
    await c.desbloquear('1234');
    const depois = Object.fromEntries(CHAVES_SENSIVEIS.map((k) => [k, arm.mapa.get(k)]));
    c.bloquear();
    const r = web(arm);
    await r.desbloquear('1234');
    for (const k of CHAVES_SENSIVEIS) expect(arm.mapa.get(k)).toBe(depois[k]);
  });

  test('envelope v1 sem PIN conhecido nunca abre por engano com a DEK nova', () => {
    const k = aleatorio(32);
    const v1 = cifrarTexto('x', k, aleatorio);
    expect(v1.startsWith(PREFIXO_ENVELOPE)).toBe(true);
    expect(decifrarTextoV2(v1, k, 'levia:records')).toBeNull();
    expect(cifrarTextoV2('x', k, 'levia:records', aleatorio).startsWith(PREFIXO_ENVELOPE_V2)).toBe(true);
  });
});
