/**
 * Data curta do fim do acesso, no idioma do app.
 * Devolve vazio quando não há data (acesso vitalício) ou quando a data não é válida.
 */
export function formatarDataAcesso(iso: string, idioma: string): string {
  const data = new Date(iso);
  if (!iso || Number.isNaN(data.getTime())) return '';
  try {
    return data.toLocaleDateString(idioma, { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}
