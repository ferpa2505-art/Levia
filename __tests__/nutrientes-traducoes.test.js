// Guardas de regressão: não substituem revisão linguística ou nutricional.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../src/i18n/traducoes');
const locales = fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).sort();
const groups = {
  protein: ['nut.prot', 'home.proteina', 'evo.proteina'],
  carbohydrate: ['nut.carb', 'home.carbo', 'evo.carbo'],
  fat: ['nut.gord', 'home.gordura', 'evo.gordura'],
  fiber: ['nut.fibra', 'home.fibra', 'evo.fibra'],
};
function read(file) {
  const source = fs.readFileSync(path.join(dir, file), 'utf8');
  const values = {};
  const pair = /^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/gm;
  let m;
  while ((m = pair.exec(source))) {
    const key = JSON.parse(m[1]);
    if (Object.prototype.hasOwnProperty.call(values, key)) throw new Error(`${file}: chave duplicada ${key}`);
    values[key] = JSON.parse(m[2]);
  }
  return values;
}
function normalize(value) {
  return value.normalize('NFKC').trim().toLowerCase().replace(/^g\s+/u, '').replace(/\s+/gu, ' ');
}
function placeholders(value) {
  return (value.match(/\{[^{}]+\}/g) || []).sort();
}
function categoryErrors(values) {
  const errors = [];
  const owners = new Map();
  for (const [category, keys] of Object.entries(groups)) {
    for (const key of keys) {
      if (typeof values[key] !== 'string' || !values[key].trim()) {
        errors.push(`${key}: ausente/vazio`);
        continue;
      }
      const label = normalize(values[key]);
      const previous = owners.get(label);
      if (previous && previous.category !== category) errors.push(`${key}: categoria duplicada com ${previous.key}`);
      else owners.set(label, { category, key });
      if (/^k?cal(?:ories|orias)?$/u.test(label)) errors.push(`${key}: calorias em ${category}`);
    }
  }
  return errors;
}
// Só chaves que apresentam carboidratos totais, nunca nomes de alimentos,
// ingredientes ou textos educativos que podem mencionar amido legitimamente.
const carbKeys = [
  'nut.carb', 'home.carbo', 'evo.carbo', 'ali.carbo', 'ref.carbG',
  'fontes.texto', 'ali.media', 'ref.macros', 'ref.total', 'rel.carbDia',
];
// Delimitação Unicode: \b não funciona adequadamente em todos os alfabetos.
function words(expression) {
  return new RegExp(`(?:^|[^\\p{L}\\p{M}])(?:${expression})(?=$|[^\\p{L}\\p{M}])`, 'iu');
}
// Léxico explícito por idioma; termos não listados exigem revisão humana.
// Em árabe não usar o radical نشا: também ocorre em نشويات (carboidratos).
const starchRules = {
  'pt-BR': { pattern: words('amidos?|f[eé]culas?'), bad: ['amido', 'fécula'], good: 'carboidratos' },
  'pt-PT': { pattern: words('amidos?|f[eé]culas?'), bad: ['amido', 'fécula'], good: 'hidratos de carbono' },
  'en-US': { pattern: words('starch(?:es)?'), bad: ['starch', 'starches'], good: 'carbohydrates' },
  'en-GB': { pattern: words('starch(?:es)?'), bad: ['starch', 'starches'], good: 'carbohydrates' },
  es: { pattern: words('almid[oó]n(?:es)?|f[eé]culas?'), bad: ['almidón', 'almidones', 'fécula'], good: 'carbohidratos' },
  fr: { pattern: words('amidons?|f[eé]cules?'), bad: ['amidon', 'fécules'], good: 'glucides' },
  it: { pattern: words('amid[oi]|fecol[ae]'), bad: ['amido', 'amidi', 'fecola'], good: 'carboidrati' },
  de: { pattern: words('st[aä]rke'), bad: ['Stärke', 'Starke'], good: 'Kohlenhydrate' },
  nl: { pattern: words('zetmeel'), bad: ['zetmeel'], good: 'koolhydraten' },
  pl: { pattern: words('skrobi[aeęąy]?'), bad: ['skrobia', 'skrobi', 'skrobię'], good: 'węglowodany' },
  tr: { pattern: words('ni[sş]asta'), bad: ['nişasta', 'nisasta'], good: 'karbonhidrat' },
  ru: { pattern: words('крахмал[\\p{L}]*'), bad: ['крахмал', 'крахмала'], good: 'углеводы' },
  ja: { pattern: /でんぷん|デンプン|澱粉/iu, bad: ['でんぷん', 'デンプン', '澱粉'], good: '炭水化物' },
  ko: { pattern: /전분|녹말/iu, bad: ['전분', '녹말'], good: '탄수화물' },
  'zh-CN': { pattern: /淀粉|澱粉/iu, bad: ['淀粉', '澱粉'], good: '碳水化合物' },
  id: { pattern: words('pati|kanji'), bad: ['pati', 'kanji'], good: 'karbohidrat' },
  vi: { pattern: words('tinh\\s+bột'), bad: ['tinh bột', 'TINH  BỘT'], good: 'carbohydrat' },
  th: { pattern: /แป้ง|สตาร์ช/iu, bad: ['แป้ง', 'สตาร์ช'], good: 'คาร์โบไฮเดรต' },
  hi: { pattern: /स्टार्च/iu, bad: ['स्टार्च'], good: 'कार्बोहाइड्रेट' },
  ar: { pattern: words('(?:ال)?نشا(?:ء)?'), bad: ['نشا', 'النشا', 'نشاء'], good: 'الكربوهيدرات والنشويات' },
};
function starchErrors(locale, values) {
  const rule = starchRules[locale];
  if (!rule) throw new Error(`${locale}: adicionar regra de amido e casos positivos/negativos`);
  return carbKeys.filter((key) => typeof values[key] !== 'string' ||
    !values[key].trim() || rule.pattern.test(normalize(values[key])));
}
const viKeys = ['nut.carb', 'home.carbo', 'evo.carbo', 'fontes.texto', 'ali.media'];
function vietnameseErrors(values) {
  return viKeys.filter((key) => typeof values[key] !== 'string' || /tinh\s+bột/iu.test(values[key]) || !/carbohydrat(?:e)?/iu.test(values[key]));
}
describe('categorias de nutrientes nas traduções', () => {
  test('todo idioma descoberto tem regra explícita, sem cobertura silenciosamente ausente', () => {
    expect(locales).toContain('pt-BR.ts');
    expect(locales).toContain('vi.ts');
    expect(locales.map((file) => file.replace(/\.ts$/, '')).sort()).toEqual(Object.keys(starchRules).sort());
  });
  test.each(locales)('%s: proteína, carboidrato, gordura e fibra não colidem', (file) => {
    expect(categoryErrors(read(file))).toEqual([]);
  });
  test.each(locales)('%s: carboidratos não são rotulados como amido', (file) => {
    expect(starchErrors(file.replace(/\.ts$/, ''), read(file))).toEqual([]);
  });
  const requiredParams = {
    'fontes.texto': ['{n}'],
    'ali.media': ['{n}', '{kcal}', '{prot}', '{carb}', '{gord}', '{fibra}'],
    'ref.macros': ['{kcal}', '{prot}', '{carb}'],
    'ref.total': ['{kcal}', '{prot}', '{carb}'],
    'ref.totalNut': ['{valores}'],
  };
  test.each(locales)('%s: resumos preservam parâmetros de nutrientes', (file) => {
    const values = read(file);
    for (const [key, params] of Object.entries(requiredParams)) {
      expect(typeof values[key]).toBe('string');
      expect(placeholders(values[key] || '')).toEqual([...params].sort());
    }
  });
  describe.each(Object.keys(starchRules))('%s: valida a própria guarda', (locale) => {
    const rule = starchRules[locale];
    test('aceita termo de carboidratos e preserva o contexto legítimo fora das chaves monitoradas', () => {
      const values = Object.fromEntries(carbKeys.map((key) => [key, rule.good]));
      values['ingrediente.exemplo'] = rule.bad[0];
      expect(starchErrors(locale, values)).toEqual([]);
    });
    test.each(carbKeys)('detecta substituição por amido em %s, inclusive em resumo e com unidade', (key) => {
      for (const bad of rule.bad) {
        const values = Object.fromEntries(carbKeys.map((k) => [k, rule.good]));
        for (const text of [bad, `g ${bad}`, `{carb} g ${bad} · {prot} g`]) {
          values[key] = text;
          expect(starchErrors(locale, values)).toContain(key);
        }
      }
    });
  });
  test('idioma novo sem regra falha explicitamente', () => {
    expect(() => starchErrors('xx', {})).toThrow('adicionar regra');
  });
  test('vietnamita: os cinco textos usam carboidrato, não amido', () => {
    expect(vietnameseErrors(read('vi.ts'))).toEqual([]);
  });
  test.each(viKeys)('detecta regressão de amido em %s', (key) => {
    const changed = { ...read('vi.ts'), [key]: 'tinh bột' };
    expect(vietnameseErrors(changed)).toContain(key);
  });
  test('detecta gordura e fibra com o mesmo rótulo', () => {
    const changed = { ...read('vi.ts') };
    changed['nut.fibra'] = changed['nut.gord'];
    expect(categoryErrors(changed).some((e) => e.includes('nut.fibra'))).toBe(true);
  });
  test('detecta troca de carboidrato por proteína na home', () => {
    const changed = { ...read('vi.ts') };
    changed['home.carbo'] = changed['home.proteina'];
    expect(categoryErrors(changed).length).toBeGreaterThan(0);
  });
  test('detecta calorias no lugar de proteína', () => {
    const changed = { ...read('vi.ts'), 'nut.prot': 'kcal' };
    expect(categoryErrors(changed).some((e) => e.includes('calorias'))).toBe(true);
  });
  test('detecta remoção e duplicação de placeholders', () => {
    expect(placeholders('{kcal} kcal · {carb} g')).not.toEqual(['{kcal}', '{prot}', '{carb}'].sort());
    expect(placeholders('{carb} {carb}')).not.toEqual(['{carb}']);
  });
});
