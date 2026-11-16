import { idadeValida } from '../src/utils/idade';

describe('idadeValida', () => {
  test.each(['18', '19', '100', '018'])('aceita idade inteira %s', (idade) => {
    expect(idadeValida(idade)).toBe(true);
  });

  test.each(['', '17', '101', '18abc', '18.5', '18,5', '-18', '+18', ' 18', '18\n'])(
    'recusa idade inválida %s',
    (idade) => {
      expect(idadeValida(idade)).toBe(false);
    },
  );
});
