import { useState } from 'react';

/**
 * Controla quando mostrar o erro de um campo: assim que a pessoa começa a
 * digitar ou sai do campo (onBlur) — não só ao tocar em Salvar.
 *
 *   const nome = useCampoTocado();
 *   <Input onBlur={nome.tocar} ... />
 *   <MensagemErro texto={nome.mostrar(valor, erro)} />
 */
export function useCampoTocado() {
  const [tocado, setTocado] = useState(false);
  return {
    tocado,
    tocar: () => setTocado(true),
    /** Devolve o erro se o campo já foi mexido (tem conteúdo ou perdeu o foco) */
    mostrar: (valor: string, erro: string | null | undefined) => ((tocado || valor.trim().length > 0) && erro ? erro : null),
  };
}
