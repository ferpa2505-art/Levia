import { liberarCotaFoto } from '../worker/src/cotas';

function criarBancoFalso() {
  const apagados: number[] = [];
  const db = {
    prepare(sql: string) {
      let args: unknown[] = [];
      const stmt = {
        bind(...valores: unknown[]) { args = valores; return stmt; },
        async run() {
          if (sql.startsWith('DELETE FROM cotas_uso')) apagados.push(Number(args[0]));
          return { meta: { changes: 1 } };
        },
      };
      return stmt;
    },
  };
  return { db, apagados };
}

describe('liberarCotaFoto', () => {
  it('apaga só as reservas da análise que falhou', async () => {
    const { db, apagados } = criarBancoFalso();
    await liberarCotaFoto({ LEVIA_DB: db } as never, [101, 102, 103]);
    expect(apagados).toEqual([101, 102, 103]);
  });

  it('não faz nada sem reservas (plano sem cota ou resposta sem id)', async () => {
    const { db, apagados } = criarBancoFalso();
    await liberarCotaFoto({ LEVIA_DB: db } as never, []);
    await liberarCotaFoto({ LEVIA_DB: db } as never, undefined as never);
    expect(apagados).toEqual([]);
  });

  it('não faz nada sem banco D1 (caminho de desenvolvimento)', async () => {
    await expect(liberarCotaFoto({} as never, [1])).resolves.toBeUndefined();
  });
});
