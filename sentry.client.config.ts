/**
 * Configuração do Sentry para o cliente (app React Native)
 * Este arquivo é importado no entry point do app (expo-router/entry)
 */
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn ?? process.env.SENTRY_DSN;
const ENVIRONMENT = Constants.expoConfig?.extra?.sentryEnvironment ?? __DEV__ ? 'development' : 'production';
const RELEASE = Constants.expoConfig?.version ?? '0.4.0';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `levia-app@${RELEASE}`,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    profilesSampleRate: __DEV__ ? 1.0 : 0.1,

    // Filtros para não enviar dados sensíveis
    beforeSend(event) {
      // Remove possíveis chaves sensíveis do evento
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.request?.headers?.authorization) {
        event.request.headers.authorization = '[Filtered]';
      }
      return event;
    },

    // Replay de sessão desligado: uma tela de refeição ou medicação pode mostrar dados de saúde.
  });

  // Define usuário se autenticado (chamado após login)
  // Sentry.setUser({ id: 'user-id', email: 'user@example.com' });

  console.log('[Sentry] Inicializado:', ENVIRONMENT);
} else {
  console.warn('[Sentry] DSN não configurado — monitoramento desabilitado');
}

export const sentryInitialized = true;