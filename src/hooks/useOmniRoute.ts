import { useContext } from 'react';
import { useOmniRoute as useOmniRouteContext } from '@context/OmniRouteContext';

/**
 * Hook para acessar OmniRoute no contexto da aplicação
 * Uso: const { isOnline, call, analisarDados, sugerirEconomia } = useOmniRoute();
 */
export function useOmniRoute() {
  return useOmniRouteContext();
}
