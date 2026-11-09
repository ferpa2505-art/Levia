import * as fs from 'fs';
import { bundleDaPagina, haNovaVersao } from '../src/utils/novaVersao';
import { CHECKOUT_ANUAL, CHECKOUT_MENSAL, linkDoPlano, PRECO_ANUAL, PRECO_MENSAL } from '../src/constants/planos';

describe('planos: links de pagamento da Hotmart', () => {
  test('mensal e anual são os checkouts aprovados, iguais aos da landing', () => {
    expect(CHECKOUT_MENSAL).toBe('https://pay.hotmart.com/M108322229J');
    expect(CHECKOUT_ANUAL).toBe('https://pay.hotmart.com/T108322944O');
    expect(linkDoPlano('mensal')).toBe(CHECKOUT_MENSAL);
    expect(linkDoPlano('anual')).toBe(CHECKOUT_ANUAL);
    const landing = fs.readFileSync('site/landing/src/config.ts', 'utf8');
    expect(landing).toContain(CHECKOUT_MENSAL);
    expect(landing).toContain(CHECKOUT_ANUAL);
  });

  test('os preços de referência são os do worker (R$ 19,97 e R$ 191,71)', () => {
    expect(PRECO_MENSAL).toBe('R$ 19,97');
    expect(PRECO_ANUAL).toBe('R$ 191,71');
    const wrangler = fs.readFileSync('worker/wrangler.toml', 'utf8');
    expect(wrangler).toContain('PAYT_VALOR_MENSAL_CENTAVOS = "1997"');
    expect(wrangler).toContain('PAYT_VALOR_ANUAL_CENTAVOS = "19171"');
  });

  test('"Ver planos" abre a tela de planos do app (não a página de vendas) e a tela está registrada', () => {
    expect(fs.readFileSync('src/components/FaixaTeste.tsx', 'utf8')).toContain("router.push('/planos')");
    expect(fs.readFileSync('app/ativar.tsx', 'utf8')).toContain("router.push('/planos')");
    expect(fs.readFileSync('app/_layout.tsx', 'utf8')).toContain('name="planos"');
    const tela = fs.readFileSync('app/planos.tsx', 'utf8');
    expect(tela).toContain("abrir('mensal')");
    expect(tela).toContain("abrir('anual')");
    expect(tela).toContain('linkDoPlano(plano)');
  });

  test('a tela de planos e o aviso de versão estão traduzidos nos 20 idiomas', () => {
    const chaves = ['planos.titulo', 'planos.intro', 'planos.mensal', 'planos.anual', 'planos.assinarMensal', 'planos.assinarAnual', 'planos.nota',
      'planos.moeda', 'planos.economia', 'planos.porMes', 'planos.porAno', 'planos.mensalDetalhe', 'planos.anualDetalhe', 'planos.maisDetalhes',
      'atu.webTitulo', 'atu.webMsg', 'atu.webBotao'];
    const arquivos = fs.readdirSync('src/i18n/traducoes').filter((f) => f.endsWith('.ts'));
    expect(arquivos).toHaveLength(20);
    for (const arq of arquivos) {
      const src = fs.readFileSync(`src/i18n/traducoes/${arq}`, 'utf8');
      for (const k of chaves) expect(src).toMatch(new RegExp(`"${k.replace('.', '\\.')}": "[^"]+"`));
    }
    const es = fs.readFileSync('src/i18n/traducoes/es.ts', 'utf8');
    expect(es).toContain('"planos.titulo": "Elige tu plan"');
  });
});

describe('atualização do app instalado (PWA)', () => {
  const html = (hash: string) => `<!DOCTYPE html><html><head><script src="/registrar-sw.js"></script></head><body><script src="/_expo/static/js/web/entry-${hash}.js" defer></script></body></html>`;

  test('acha o arquivo de código da página e só avisa quando é diferente', () => {
    expect(bundleDaPagina(html('abc123'))).toBe('/_expo/static/js/web/entry-abc123.js');
    const rodando = bundleDaPagina(html('abc123'));
    expect(haNovaVersao(rodando, html('abc123'))).toBe(false);
    expect(haNovaVersao(rodando, html('def456'))).toBe(true);
    expect(bundleDaPagina('https://leviapp.org/_expo/static/js/web/entry-9f9f.js')).toBe('/_expo/static/js/web/entry-9f9f.js');
  });

  test('na dúvida não avisa: sem arquivo conhecido, página de erro ou resposta vazia', () => {
    expect(haNovaVersao(null, html('def456'))).toBe(false);
    expect(haNovaVersao('/_expo/static/js/web/entry-abc123.js', '<html>erro 500</html>')).toBe(false);
    expect(haNovaVersao('/_expo/static/js/web/entry-abc123.js', '')).toBe(false);
    expect(haNovaVersao('/_expo/static/js/web/entry-abc123.js', null)).toBe(false);
    expect(bundleDaPagina(undefined)).toBeNull();
  });

  test('o service worker deixa a conferência passar direto para a internet (senão veria sempre a página guardada)', () => {
    const sw = fs.readFileSync('public/sw.js', 'utf8');
    expect(sw).toMatch(/req\.cache === 'no-store'/);
    // e o hook faz o pedido com no-store
    expect(fs.readFileSync('src/hooks/useNovaVersaoWeb.ts', 'utf8')).toContain("cache: 'no-store'");
  });

  test('o deploy carimba o cache do service worker com o commit, e o carimbo casa com a linha do sw.js', () => {
    const sw = fs.readFileSync('public/sw.js', 'utf8');
    const linha = "const CACHE = 'levia-v2';";
    expect(sw).toContain(linha);
    const wf = fs.readFileSync('.github/workflows/deploy-app-cloudflare.yml', 'utf8');
    expect(wf).toContain("s/const CACHE = 'levia-v2';/const CACHE = 'levia-v2-${GITHUB_SHA::7}';/");
    expect(wf).toContain('cache do sw.js não foi carimbado');
    // a conferência pós-deploy continua achando "levia-v" no sw.js
    expect(wf).toContain("grep -q 'levia-v'");
    expect(fs.readFileSync('public/_headers', 'utf8')).toMatch(/\/sw\.js\s+Cache-Control: no-cache/);
  });

  test('o aviso de versão fica no layout raiz e só no navegador', () => {
    expect(fs.readFileSync('app/_layout.tsx', 'utf8')).toContain('<AvisoNovaVersao ativo={!loading} />');
    expect(fs.readFileSync('src/components/AvisoNovaVersao.tsx', 'utf8')).toContain("Platform.OS !== 'web'");
    expect(fs.readFileSync('src/hooks/useNovaVersaoWeb.ts', 'utf8')).toContain("Platform.OS !== 'web'");
  });
});
