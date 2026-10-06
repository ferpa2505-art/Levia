import { randomBytes } from 'crypto';
import { cifrar, decifrar } from '../src/utils/cifraBackup';

const aleatorio = (n: number) => new Uint8Array(randomBytes(n));

describe('Backup com senha', () => {
  const original = JSON.stringify({ peso: 92.4, glicemia: [110, 98], nome: 'Luís Fernando — ação' });

  test('cifra e decifra com a senha certa', async () => {
    const c = await cifrar(original, 'minha senha', aleatorio);
    expect(c.texto).not.toContain('glicemia');
    expect(await decifrar(c, 'minha senha')).toBe(original);
  }, 30000);

  test('senha errada não abre', async () => {
    const c = await cifrar(original, 'certa', aleatorio);
    expect(await decifrar(c, 'errada')).toBeNull();
  }, 30000);

  test('arquivo alterado é detectado', async () => {
    const c = await cifrar(original, 'certa', aleatorio);
    const adulterado = { ...c, texto: c.texto.slice(0, -4) + (c.texto.endsWith('AAAA') ? 'BBBB' : 'AAAA') };
    expect(await decifrar(adulterado, 'certa')).toBeNull();
  }, 30000);

  test('parâmetros absurdos são recusados', async () => {
    const c = await cifrar(original, 'certa', aleatorio);
    expect(await decifrar({ ...c, N: 2 ** 24 }, 'certa')).toBeNull();
  }, 30000);
});
