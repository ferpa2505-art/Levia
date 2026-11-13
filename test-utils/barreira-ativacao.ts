/** Barreira apenas de teste, sem dependência do texto SQL ou dos aliases. */
export function pausarLeituraCodigo(db: any, timeoutMs = 5000) {
  // Estes cenários usam exatamente um código; rejeita fixtures ambíguas.
  const codigos = db.sql('SELECT id, account_id FROM activation_codes');
  if (codigos.length !== 1) throw new Error('Barreira exige exatamente um código na fixture');
  const { id, account_id: conta } = codigos[0];
  const original = db.prepare;
  let anunciar!: () => void;
  let rejeitar!: (erro: Error) => void;
  let liberar!: () => void;
  let capturada = false;
  let fechada = false;
  const entrada = new Promise<void>((resolve, reject) => { anunciar = resolve; rejeitar = reject; });
  // Evita rejection sem handler se a ativação falhar antes de o chamador aguardar.
  void entrada.catch(() => {});
  const saida = new Promise<void>((resolve) => { liberar = resolve; });
  const timer = setTimeout(() => {
    rejeitar(new Error(`Leitura contendo código e conta da fixture não atingiu a barreira em ${timeoutMs}ms`));
    fechar();
  }, timeoutMs);

  function fechar() {
    if (fechada) return;
    fechada = true;
    clearTimeout(timer);
    db.prepare = original;
    liberar();
    if (!capturada) rejeitar(new Error('Barreira encerrada antes de observar o código e a conta'));
  }
  function envolver(stmt: any): any {
    return {
      ...stmt,
      bind: (...args: any[]) => envolver(stmt.bind(...args)),
      async first(...args: any[]) {
        const linha = await stmt.first(...args);
        const valores = linha && typeof linha === 'object' ? Object.values(linha) : [];
        // Usa identidades da fixture, não nomes de aliases ou estrutura do JOIN.
        // A leitura já terminou antes da pausa; não mantém transação aberta.
        if (!fechada && !capturada && valores.includes(id) && valores.includes(conta)) {
          capturada = true;
          clearTimeout(timer);
          anunciar();
          await saida;
        }
        return linha;
      },
    };
  }
  db.prepare = (...args: any[]) => envolver(original.apply(db, args));
  return { entrada, fechar };
}
