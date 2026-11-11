import { randomBytes } from 'node:crypto';
import {
  CHAVE_SAL, CofreBloqueado, criarCofre, PREFIXO_ENVELOPE, estaCifrado, ArmazenamentoBruto,
} from '../src/utils/cofreDados';

// scrypt leve nos testes; o custo real (2^15) é usado no app
const LEVE = { N: 2 ** 10, r: 8, p: 1 };
const aleatorio = (n: number) => new Uint8Array(randomBytes(n));

function armazenamentoFalso(inicial: Record<string, string> = {}) {
  const mapa = new Map<string, string>(Object.entries(inicial));
  const bruto: ArmazenamentoBruto & { mapa: Map<string, string>; multiSets: number } = {
    mapa,
    multiSets: 0,
    getItem: async (c) => mapa.get(c) ?? null,
    setItem: async (c, v) => { mapa.set(c, v); },
    removeItem: async (c) => { mapa.delete(c); },
    multiSet: async (pares) => { bruto.multiSets += 1; for (const [c, v] of pares) mapa.set(c, v); },
  };
  return bruto;
}

const cofre = (armazenamento: ArmazenamentoBruto) => criarCofre({ armazenamento, aleatorio, scrypt: LEVE });

describe('cofre de dados de saúde', () => {
  test('grava cifrado e lê de volta com o cofre aberto', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    await c.gravarDado('levia:diabetes', '{"glicemias":[98]}');
    const cru = arm.mapa.get('levia:diabetes')!;
    expect(estaCifrado(cru)).toBe(true);
    expect(cru).not.toContain('glicemias');
    expect(await c.lerDado('levia:diabetes')).toBe('{"glicemias":[98]}');
  });

  test('com o cofre bloqueado, ler ou gravar um dado sensível falha (nunca devolve vazio)', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    await c.gravarDado('levia:glp1', 'dados');
    const envelope = arm.mapa.get('levia:glp1');
    c.bloquear();
    await expect(c.lerDado('levia:glp1')).rejects.toBeInstanceOf(CofreBloqueado);
    await expect(c.gravarDado('levia:glp1', 'vazio')).rejects.toBeInstanceOf(CofreBloqueado);
    expect(arm.mapa.get('levia:glp1')).toBe(envelope); // o envelope não foi sobrescrito
    await c.desbloquear('1234');
    expect(await c.lerDado('levia:glp1')).toBe('dados');
  });

  test('chave que não é de sal ou PIN errado não abre os dados', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    await c.gravarDado('levia:records', 'peso 80');
    c.bloquear();
    await expect(cofre(arm).desbloquear('9999')).rejects.toBeInstanceOf(CofreBloqueado);
  });

  test('chaves que não são sensíveis passam direto, sem cifrar', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    await c.gravarDado('levia:consentimentoIA', 'sim');
    expect(arm.mapa.get('levia:consentimentoIA')).toBe('sim');
    c.bloquear();
    expect(await c.lerDado('levia:consentimentoIA')).toBe('sim');
  });

  test('migra dados que estavam em texto puro no primeiro desbloqueio', async () => {
    const arm = armazenamentoFalso({ 'levia:diabetes': '{"antigo":true}' });
    const c = cofre(arm);
    await c.desbloquear('1234');
    expect(estaCifrado(arm.mapa.get('levia:diabetes')!)).toBe(true);
    expect(await c.lerDado('levia:diabetes')).toBe('{"antigo":true}');
    expect(arm.mapa.get(CHAVE_SAL)).toBeTruthy();
  });

  test('trocar o PIN regrava tudo em uma única gravação e a nova senha abre', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    await c.gravarDado('levia:medicacoes', 'lista');
    await c.gravarDado('levia:userProfile', 'perfil');
    const antes = arm.multiSets;
    await c.trocarPin('567890');
    expect(arm.multiSets).toBe(antes + 1);
    expect(await c.lerDado('levia:medicacoes')).toBe('lista');
    c.bloquear();
    await expect(cofre(arm).desbloquear('1234')).rejects.toBeInstanceOf(CofreBloqueado);
    const nova = cofre(arm);
    await nova.desbloquear('567890');
    expect(await nova.lerDado('levia:userProfile')).toBe('perfil');
  });

  test('o envelope usa o prefixo versionado', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    await c.gravarDado('levia:fitness', 'x');
    expect(arm.mapa.get('levia:fitness')!.startsWith(PREFIXO_ENVELOPE)).toBe(true);
  });

  test('antes de existir cofre (onboarding), lê e grava em texto puro; o PIN cifra tudo depois', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.gravarDado('levia:userProfile', '{"nome":"Ana"}');
    expect(arm.mapa.get('levia:userProfile')).toBe('{"nome":"Ana"}');
    expect(await c.lerDado('levia:userProfile')).toBe('{"nome":"Ana"}');
    await c.desbloquear('1234');
    expect(estaCifrado(arm.mapa.get('levia:userProfile')!)).toBe(true);
    expect(await c.lerDado('levia:userProfile')).toBe('{"nome":"Ana"}');
  });

  test('depois que o cofre existe, texto puro não é lido com o app bloqueado', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    arm.mapa.set('levia:records', 'vazado');
    c.bloquear();
    await expect(c.lerDado('levia:records')).rejects.toBeInstanceOf(CofreBloqueado);
  });

  test('avisa quando o cofre abre e fecha', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    const estados: boolean[] = [];
    const parar = c.ouvir((d) => estados.push(d));
    await c.desbloquear('1234');
    c.bloquear();
    parar();
    await c.desbloquear('1234');
    expect(estados).toEqual([true, false]);
  });

  test('desbloqueia com a chave guardada (biometria) sem o PIN', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    await c.gravarDado('levia:glp1', 'glp');
    const chave = c.obterChave()!;
    c.bloquear();
    expect(c.obterChave()).toBeNull();
    await c.desbloquearComChave(chave);
    expect(await c.lerDado('levia:glp1')).toBe('glp');
  });

  test('chave errada não desbloqueia por biometria', async () => {
    const arm = armazenamentoFalso();
    const c = cofre(arm);
    await c.desbloquear('1234');
    await c.gravarDado('levia:glp1', 'glp');
    c.bloquear();
    await expect(c.desbloquearComChave(new Uint8Array(32).fill(7))).rejects.toBeInstanceOf(CofreBloqueado);
    expect(c.estaDesbloqueado()).toBe(false);
  });
});
