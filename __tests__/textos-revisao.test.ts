import { TEXTOS } from '../worker/src/textos';
import { FAQ } from '../worker/src/faq';

const T: any = TEXTOS;

function todosOsTextos(idioma: string): string[] {
  const t = T[idioma];
  const textos: string[] = [];
  for (const valor of Object.values(t)) {
    if (typeof valor === 'string') textos.push(valor);
    else if (Array.isArray(valor)) textos.push(...(valor as string[]));
    else if (typeof valor === 'function') {
      const fn = valor as (...a: any[]) => unknown;
      const r = fn('Maria', ['a', 'b', 'c', 'd', 'e', 'f'], 3);
      if (typeof r === 'string') textos.push(r);
    }
  }
  textos.push(...Object.values((FAQ as any)[idioma] as Record<string, string>));
  return textos;
}

describe('revisão dos textos do LEVI', () => {
  test('pt-PT não usa "libertar" para acesso (em Portugal quer dizer soltar): diz-se ativar', () => {
    for (const texto of todosOsTextos('pt-PT')) expect(texto).not.toMatch(/libert/i);
  });

  test('espanhol diz "número de serie" (serial em espanhol também é série de TV), mantendo o comando SERIAL', () => {
    for (const texto of todosOsTextos('es')) {
      const semComando = texto.replace(/\*SERIAL\*/g, '');
      expect(semComando).not.toMatch(/\bserial\b/i);
    }
    expect(T.es.serialIntro('Maria')).toContain('número de serie');
  });

  test('o texto de erro citado no FAQ é o mesmo que o app mostra (pt-PT e espanhol)', () => {
    const fs = require('fs');
    const pt = fs.readFileSync('src/i18n/traducoes/pt-PT.ts', 'utf8');
    const es = fs.readFileSync('src/i18n/traducoes/es.ts', 'utf8');
    expect(pt).toContain('Este dispositivo já está associado a outro número de série');
    expect((FAQ as any)['pt-PT'].problemas_comuns).toContain('Este dispositivo já está associado a outro número de série');
    expect(es).toContain('Este dispositivo ya está vinculado a otro número de serie');
    expect((FAQ as any).es.problemas_comuns).toContain('Este dispositivo ya está vinculado a otro número de serie');
  });

  test('a tela de ativar está traduzida nos idiomas do atendimento (nada em inglês no pt, es, it)', () => {
    const fs = require('fs');
    for (const arquivo of ['pt-BR', 'pt-PT', 'es', 'it']) {
      const src: string = fs.readFileSync(`src/i18n/traducoes/${arquivo}.ts`, 'utf8');
      const linhas = src.split('\n').filter((l) => l.includes('"ativar.'));
      expect(linhas.length).toBe(18);
      for (const l of linhas) {
        expect(l).not.toMatch(/Activate|Your access|Done!|Enter the serial|Too many attempts|No internet|Don't have|Invalid or expired|already (linked|active)/);
      }
    }
  });

  test('o objetivo de GLP-1 em inglês é "acompanhar" (track), não "seguir"', () => {
    expect(T.en.objetivos[2]).toBe('Track my GLP-1 treatment');
  });
});
