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
  return value.normalize('NFC').trim().toLowerCase().replace(/^g\s+/u, '').replace(/\s+/gu, ' ');
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
const viKeys = ['nut.carb', 'home.carbo', 'evo.carbo', 'fontes.texto', 'ali.media'];
function vietnameseErrors(values) {
  return viKeys.filter((key) => typeof values[key] !== 'string' || /tinh\s+bột/iu.test(values[key]) || !/carbohydrat(?:e)?/iu.test(values[key]));
}
describe('categorias de nutrientes nas traduções', () => {
  test('descobre os idiomas presentes no repositório', () => {
    expect(locales).toContain('pt-BR.ts');
    expect(locales).toContain('vi.ts');
    expect(locales.length).toBeGreaterThan(1);
  });
  test.each(locales)('%s: proteína, carboidrato, gordura e fibra não colidem', (file) => {
    expect(categoryErrors(read(file))).toEqual([]);
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
