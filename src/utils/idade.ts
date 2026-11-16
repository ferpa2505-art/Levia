export function idadeValida(texto: string): boolean {
  if (!texto || /[^0-9]/.test(texto)) return false;
  const idade = Number(texto);
  return idade >= 18 && idade <= 100;
}
