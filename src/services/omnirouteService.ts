/**
 * OmniRoute Service
 * Cliente TypeScript para Claude via OmniRoute Gateway
 * API: localhost:20128/v1/messages (Anthropic-compatible)
 * 
 * Baseado no omniroute-client.js do prof-controller
 */

export interface OmniRouteConfig {
  API_URL: string;
  MODEL: string;
  MAX_TOKENS: number;
  TIMEOUT: number;
}

export interface OmniRouteMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OmniRouteApiResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface OmniRouteResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface AnalyzeDataRequest {
  userData: Record<string, unknown>;
  dataType: 'weight' | 'nutrition' | 'glp1' | 'health';
  period?: 'week' | 'month' | 'all';
}

export interface AnalyzeDataResponse {
  success: boolean;
  analysis?: string;
  recommendations?: string[];
  error?: string;
}

export interface SuggestEconomyRequest {
  currentData: Record<string, unknown>;
  goals?: Record<string, unknown>;
}

export interface SuggestEconomyResponse {
  success: boolean;
  suggestions?: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  error?: string;
}

const DEFAULT_CONFIG: OmniRouteConfig = {
  API_URL: 'http://localhost:20128/v1/messages',
  MODEL: 'claude-sonnet-5-5',
  MAX_TOKENS: 2048,
  TIMEOUT: 30000, // 30 segundos
};

class OmniRouteService {
  private config: OmniRouteConfig;
  public isOnline: boolean = false;

  constructor(config: Partial<OmniRouteConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.checkConnection();
  }

  /**
   * Verifica a conexão com o OmniRoute
   */
  async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);

      const response = await fetch(this.config.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.config.MODEL,
          max_tokens: 100,
          system: 'Responda com "OK"',
          messages: [{ role: 'user', content: 'OK' }],
        }),
      });

      clearTimeout(timeoutId);

      this.isOnline = response.ok;
      console.log('[OmniRoute] Status:', this.isOnline ? '🟢 Online' : '🔴 Offline');
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      const msg = error instanceof Error ? error.message : String(error);
      console.warn('[OmniRoute] Offline:', msg);
      return false;
    }
  }

  /**
   * Executa uma chamada ao Claude via OmniRoute
   */
  async call(
    userMessage: string,
    systemPrompt: string = 'Você é um assistente útil e prestativo.',
    options: { max_tokens?: number } = {}
  ): Promise<OmniRouteResponse> {
    try {
      if (!this.isOnline) {
        const connected = await this.checkConnection();
        if (!connected) {
          return {
            success: false,
            error:
              'OmniRoute não está disponível. Certifique-se que está rodando em localhost:20128',
          };
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);

      const response = await fetch(this.config.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.MODEL,
          max_tokens: options.max_tokens || this.config.MAX_TOKENS,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OmniRoute API Error: ${response.status} ${response.statusText}`);
      }

      const data: OmniRouteApiResponse = await response.json();
      if (!data.content || !data.content[0]) {
        throw new Error('Resposta inválida do OmniRoute');
      }

      return {
        success: true,
        data: data.content[0].text,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[OmniRoute Error]', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Analisa dados do usuário (peso, nutrição, GLP-1, saúde)
   */
  async analisarDados(request: AnalyzeDataRequest): Promise<AnalyzeDataResponse> {
    const systemPrompts: Record<string, string> = {
      weight: 'Você é especialista em acompanhamento de peso e emagrecimento. Forneça análises claras e recomendações acionáveis.',
      nutrition: 'Você é nutricionista experiente. Analise dados de nutrição e dê recomendações de alimentação.',
      glp1: 'Você é especialista em medicações GLP-1. Analise o uso e efeitos, dando insights úteis.',
      health: 'Você é consultor de saúde. Forneça análises holísticas de bem-estar e saúde.',
    };

    const userMessage = this.buildAnalysisPrompt(request);
    const systemPrompt = systemPrompts[request.dataType] || systemPrompts.health;

    const response = await this.call(userMessage, systemPrompt, { max_tokens: 1024 });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const analysisText = response.data || '';
      return {
        success: true,
        analysis: analysisText,
        recommendations: this.extractRecommendations(analysisText),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Falha ao processar resposta da análise',
      };
    }
  }

  /**
   * Sugere otimizações baseado nos dados
   */
  async sugerirEconomia(request: SuggestEconomyRequest): Promise<SuggestEconomyResponse> {
    const userMessage = this.buildSuggestionPrompt(request);

    const response = await this.call(
      userMessage,
      'Você é consultor de saúde e bem-estar. Dê sugestões práticas e realistas para otimização.',
      { max_tokens: 512 }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const suggestionsText = response.data || '';
      return {
        success: true,
        suggestions: this.extractSuggestions(suggestionsText),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Falha ao processar sugestões',
      };
    }
  }

  /**
   * Explica um conceito de forma simples
   */
  async explicar(conceito: string): Promise<OmniRouteResponse> {
    const userMessage = `Explique de forma simples este conceito relacionado à saúde: ${conceito}`;

    return this.call(
      userMessage,
      'Explique conceitos de saúde de forma simples e didática.',
      { max_tokens: 512 }
    );
  }

  /**
   * Constrói prompt para análise de dados
   */
  private buildAnalysisPrompt(request: AnalyzeDataRequest): string {
    const dataTypeLabels = {
      weight: 'peso e progresso de emagrecimento',
      nutrition: 'nutrição e alimentação',
      glp1: 'medicação GLP-1 e efeitos',
      health: 'saúde geral e bem-estar',
    };

    const label = dataTypeLabels[request.dataType];
    const period = request.period || 'todos os dados disponíveis';

    return `Analise os seguintes dados de ${label} (período: ${period}) e forneça insights úteis e recomendações:

${JSON.stringify(request.userData, null, 2)}

Forneça uma análise clara e actionable.`;
  }

  /**
   * Constrói prompt para sugestões de economia/otimização
   */
  private buildSuggestionPrompt(request: SuggestEconomyRequest): string {
    return `Baseado nos dados atuais e objetivos abaixo, sugira otimizações e economias (de tempo, dinheiro, esforço) que façam sentido:

Dados atuais:
${JSON.stringify(request.currentData, null, 2)}

${request.goals ? `Objetivos:\n${JSON.stringify(request.goals, null, 2)}` : ''}

Forneça 3-5 sugestões práticas e realistas.`;
  }

  /**
   * Extrai recomendações de um texto
   */
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        recommendations.push(trimmed.substring(2));
      } else if (/^\d+\.\s/.test(trimmed)) {
        recommendations.push(trimmed.replace(/^\d+\.\s/, ''));
      }
    }

    return recommendations.length > 0 ? recommendations : [text.substring(0, 200)];
  }

  /**
   * Extrai sugestões estruturadas de um texto
   */
  private extractSuggestions(
    text: string
  ): Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }> {
    const suggestions: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
    }> = [];

    const lines = text.split('\n');
    let currentSuggestion: {
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
    } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        if (currentSuggestion) {
          suggestions.push(currentSuggestion);
        }
        currentSuggestion = {
          title: trimmed.substring(2),
          description: '',
          impact: this.detectImpact(trimmed),
        };
      } else if (currentSuggestion && trimmed) {
        currentSuggestion.description += ' ' + trimmed;
      }
    }

    if (currentSuggestion) {
      suggestions.push(currentSuggestion);
    }

    return suggestions.length > 0
      ? suggestions
      : [
          {
            title: 'Análise disponível',
            description: text.substring(0, 200),
            impact: 'medium',
          },
        ];
  }

  /**
   * Detecta o impacto de uma sugestão baseado em palavras-chave
   */
  private detectImpact(text: string): 'high' | 'medium' | 'low' {
    const highImpactWords = [
      'crítico',
      'importante',
      'essencial',
      'maior',
      'melhor',
      'significativo',
    ];
    const lowImpactWords = ['pequeno', 'menor', 'opcional', 'adicional'];

    const lowerText = text.toLowerCase();

    if (highImpactWords.some((word) => lowerText.includes(word))) {
      return 'high';
    }
    if (lowImpactWords.some((word) => lowerText.includes(word))) {
      return 'low';
    }
    return 'medium';
  }
}

export const omnirouteService = new OmniRouteService();

export default OmniRouteService;
