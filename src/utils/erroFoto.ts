/**
 * Diagnóstico de falha ao receber uma foto. Mostra só a etapa, o tipo do arquivo e o erro técnico:
 * nunca o nome, o caminho, o endereço ou o conteúdo da foto.
 */
export type EtapaFoto = 'selecionar' | 'abrir' | 'converter';

const TAMANHO_MAX_DETALHE = 120;

export class ErroFoto extends Error {
  constructor(readonly etapa: EtapaFoto, readonly tipo: string, readonly causa: unknown) {
    super(`falha na foto: ${etapa}`);
    this.name = 'ErroFoto';
  }
}

/** Tipo MIME informado pelo navegador; só aceita o formato "grupo/subtipo". */
export function tipoSeguro(tipo: unknown): string {
  return typeof tipo === 'string' && /^[a-z]+\/[a-z0-9.+-]{1,60}$/i.test(tipo) ? tipo.toLowerCase() : 'sem tipo';
}

/** Tira do texto do erro tudo que possa identificar o arquivo. */
function detalheSeguro(causa: unknown): string {
  const nome = causa instanceof Error ? causa.name : 'Erro';
  const mensagem = causa instanceof Error ? causa.message : '';
  const limpo = mensagem
    .replace(/\b(?:blob|data|file|content|https?):\S+/gi, '[endereço]')
    .replace(/\([^)]*\.[a-z0-9]{2,5}\)/gi, '[arquivo]')
    .replace(/\S*[\\/]\S*[\\/]\S*/g, '[caminho]')
    .replace(/\S+\.(?:jpe?g|png|heic|heif|webp|gif|bmp|avif|dng)\b/gi, '[arquivo]');
  return `${nome}: ${limpo}`.slice(0, TAMANHO_MAX_DETALHE);
}

export function diagnosticoFoto(erro: unknown): string {
  if (!(erro instanceof ErroFoto)) return `etapa=desconhecida · erro=${detalheSeguro(erro)}`;
  return `etapa=${erro.etapa} · tipo=${erro.tipo} · erro=${detalheSeguro(erro.causa)}`;
}
