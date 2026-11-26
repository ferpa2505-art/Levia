import { useEffect, useState } from 'react';
import { aoCarregarEstendido, carregarEstendido, estendidoCarregado } from '@constants/alimentosGlobais';

/**
 * Pede o banco estendido (produtos industrializados) quando a tela abre e redesenha quando ele chega.
 * Na PWA o banco é baixado sob demanda; antes disso a busca mostra só o banco curado.
 */
export function useCatalogoEstendido(): boolean {
  const [pronto, setPronto] = useState(estendidoCarregado());
  useEffect(() => {
    const parar = aoCarregarEstendido(() => setPronto(true));
    void carregarEstendido().then(() => setPronto(estendidoCarregado()));
    return parar;
  }, []);
  return pronto;
}
