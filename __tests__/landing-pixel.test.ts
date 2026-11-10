import * as fs from 'fs';

describe('Meta Pixel da landing', () => {
  const config = fs.readFileSync('site/landing/src/config.ts', 'utf8');
  const pixel = fs.readFileSync('site/landing/src/pixel.ts', 'utf8');

  test('o ID padrão é o do pixel do Leviã e só tem números', () => {
    const achou = config.match(/META_PIXEL_ID = \(import\.meta\.env\.VITE_META_PIXEL_ID \|\| "(\d+)"\)/);
    expect(achou).toBeTruthy();
    expect(achou![1]).toBe('29585283281158838');
    expect(achou![1]).toMatch(/^\d{15,17}$/);
  });

  test('o código de teste da ferramenta Test Events não vai para o código publicado', () => {
    expect(config).not.toMatch(/TEST\d+/);
    expect(pixel).not.toMatch(/TEST\d+/);
  });

  test('o script da Meta só é baixado depois do aceite', () => {
    // carregarPixel é chamado apenas no aceite ou quando a pessoa já tinha aceitado antes
    const chamadas = pixel.match(/(?<!function )carregarPixel\(\)/g) ?? []; // sem contar a definição da função
    expect(chamadas.length).toBe(2); // definirConsentimento("granted") e iniciarPixel()
    expect(pixel).toContain('if (valor === "granted") carregarPixel();');
    expect(pixel).toContain('if (lerConsentimento() === "granted") carregarPixel();');
    expect(pixel).toContain('if (lerConsentimento() !== "granted") return;'); // o evento de checkout também exige aceite
  });

  test('os eventos não levam dado de saúde nem de pessoa', () => {
    const evento = pixel.slice(pixel.indexOf('rastrearCheckout'));
    expect(evento).not.toMatch(/email|telefone|phone|nome|serial|glicemia|peso/i);
  });
});
