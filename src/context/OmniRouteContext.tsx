import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import OmniRouteService, {
  OmniRouteResponse,
  AnalyzeDataRequest,
  AnalyzeDataResponse,
  SuggestEconomyRequest,
  SuggestEconomyResponse,
} from '@services/omnirouteService';

export interface OmniRouteContextValue {
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  call: (userMessage: string, systemPrompt?: string, options?: { max_tokens?: number }) => Promise<OmniRouteResponse>;
  analisarDados: (request: AnalyzeDataRequest) => Promise<AnalyzeDataResponse>;
  sugerirEconomia: (request: SuggestEconomyRequest) => Promise<SuggestEconomyResponse>;
  explicar: (conceito: string) => Promise<OmniRouteResponse>;
  retry: () => Promise<void>;
}

const OmniRouteContext = createContext<OmniRouteContextValue | undefined>(undefined);

export function OmniRouteProvider({ children }: { children: ReactNode }) {
  const [service] = useState(() => new OmniRouteService());
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        const connected = await service.checkConnection();
        setIsOnline(connected);
        setError(connected ? null : 'OmniRoute não está acessível em localhost:20128');
      } catch (err) {
        setIsOnline(false);
        setError('Erro ao verificar conexão com OmniRoute');
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [service]);

  const call = async (
    userMessage: string,
    systemPrompt?: string,
    options?: { max_tokens?: number }
  ): Promise<OmniRouteResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await service.call(userMessage, systemPrompt, options);
      if (!response.success) {
        setError(response.error || 'Erro desconhecido');
      }
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao chamar OmniRoute';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const analisarDados = async (request: AnalyzeDataRequest): Promise<AnalyzeDataResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await service.analisarDados(request);
      if (!response.success) {
        setError(response.error || 'Erro na análise');
      }
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao analisar dados';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sugerirEconomia = async (
    request: SuggestEconomyRequest
  ): Promise<SuggestEconomyResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await service.sugerirEconomia(request);
      if (!response.success) {
        setError(response.error || 'Erro ao sugerir economias');
      }
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao sugerir economias';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const explicar = async (conceito: string): Promise<OmniRouteResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await service.explicar(conceito);
      if (!response.success) {
        setError(response.error || 'Erro ao explicar');
      }
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao explicar';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const retry = async () => {
    setIsLoading(true);
    try {
      const connected = await service.checkConnection();
      setIsOnline(connected);
      setError(connected ? null : 'OmniRoute não está acessível');
    } catch (err) {
      setIsOnline(false);
      setError('Erro ao reconectar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OmniRouteContext.Provider
      value={{
        isOnline,
        isLoading,
        error,
        call,
        analisarDados,
        sugerirEconomia,
        explicar,
        retry,
      }}
    >
      {children}
    </OmniRouteContext.Provider>
  );
}

export function useOmniRoute() {
  const context = useContext(OmniRouteContext);
  if (context === undefined) {
    throw new Error('useOmniRoute deve ser usado dentro de OmniRouteProvider');
  }
  return context;
}
