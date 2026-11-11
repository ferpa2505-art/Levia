import * as fs from 'fs';
import { conviteDispensadoHoje, DIAS_DO_CONVITE, estadoDoTeste } from '../src/utils/teste';

const DIA = 24 * 3600 * 1000;
const AGORA = Date.UTC(2026, 10, 10, 15, 0, 0);
const teste = (restanteMs: number) => ({ plano: 'teste', acessoAte: new Date(AGORA + restanteMs).toISOString() });

describe('estado do teste grátis', () => {
  test('sem licença, assinatura ou data inválida: nenhum aviso', () => {
    expect(estadoDoTeste(null, AGORA).estado).toBe('nenhum');
    expect(estadoDoTeste(undefined, AGORA).estado).toBe('nenhum');
    expect(estadoDoTeste({ plano: 'assinatura', acessoAte: new Date(AGORA + 5 * DIA).toISOString() }, AGORA).estado).toBe('nenhum');
    expect(estadoDoTeste({ plano: 'teste', acessoAte: '' }, AGORA).estado).toBe('nenhum'); // vitalício/sem fim
    expect(estadoDoTeste({ plano: 'teste', acessoAte: 'lixo' }, AGORA).estado).toBe('nenhum');
  });

  test('dias restantes arredondam para cima e o aviso fica mais forte só nos últimos 3 dias', () => {
    expect(estadoDoTeste(teste(7 * DIA), AGORA)).toEqual({ estado: 'normal', dias: 7 });
    expect(estadoDoTeste(teste(4 * DIA - 1000), AGORA)).toEqual({ estado: 'normal', dias: 4 });
    expect(estadoDoTeste(teste(3 * DIA), AGORA)).toEqual({ estado: 'ultimosDias', dias: 3 });
    expect(estadoDoTeste(teste(2 * DIA - 1000), AGORA)).toEqual({ estado: 'ultimosDias', dias: 2 });
    expect(estadoDoTeste(teste(DIA), AGORA)).toEqual({ estado: 'ultimoDia', dias: 1 });
    expect(estadoDoTeste(teste(1000), AGORA)).toEqual({ estado: 'ultimoDia', dias: 1 });
    expect(DIAS_DO_CONVITE).toBe(3);
  });

  test('vencido quando a data já passou (e exatamente no fim)', () => {
    expect(estadoDoTeste(teste(0), AGORA)).toEqual({ estado: 'vencido', dias: 0 });
    expect(estadoDoTeste(teste(-5 * DIA), AGORA)).toEqual({ estado: 'vencido', dias: 0 });
  });

  test('dispensar vale só para o dia de hoje', () => {
    expect(conviteDispensadoHoje('2026-11-10', '2026-11-10')).toBe(true);
    expect(conviteDispensadoHoje('2026-11-09', '2026-11-10')).toBe(false);
    expect(conviteDispensadoHoje(null, '2026-11-10')).toBe(false);
    expect(conviteDispensadoHoje('', '2026-11-10')).toBe(false);
  });
});

describe('textos do aviso do teste', () => {
  const arquivos = fs.readdirSync('src/i18n/traducoes').filter((f) => f.endsWith('.ts'));
  const chaves = ['restamUm', 'restam', 'ultimoDia', 'terminou', 'convite', 'conviteFim', 'verPlanos', 'dispensar'];

  test('existe nos 20 idiomas, com {dias} no plural', () => {
    expect(arquivos).toHaveLength(20);
    for (const arq of arquivos) {
      const src = fs.readFileSync(`src/i18n/traducoes/${arq}`, 'utf8');
      for (const k of chaves) expect(src).toMatch(new RegExp(`"teste\\.${k}": "[^"]+"`));
      expect(src).toMatch(/"teste\.restam": "[^"]*\{dias\}[^"]*"/);
    }
  });

  test('os idiomas do atendimento estão traduzidos', () => {
    const lerChave = (arq: string, k: string) => {
      const src = fs.readFileSync(`src/i18n/traducoes/${arq}.ts`, 'utf8');
      return (src.match(new RegExp(`"teste\\.${k}": "([^"]+)"`)) ?? [])[1];
    };
    expect(lerChave('pt-BR', 'verPlanos')).toBe('Ver planos');
    expect(lerChave('pt-PT', 'terminou')).toBe('O seu teste grátis terminou');
    expect(lerChave('es', 'verPlanos')).toBe('Ver planes');
    expect(lerChave('it', 'verPlanos')).toBe('Vedi i piani');
    expect(lerChave('en-US', 'terminou')).toBe('Your free trial has ended');
  });

  test('a faixa não promete o que não é verdade: só fala em análise de fotos com IA e planos', () => {
    const src = fs.readFileSync('src/i18n/traducoes/pt-BR.ts', 'utf8');
    const convite = (src.match(/"teste\.conviteFim": "([^"]+)"/) ?? [])[1];
    expect(convite).toContain('fotos');
    expect(convite).not.toMatch(/bloquead|perder|apagad/i);
  });
});
