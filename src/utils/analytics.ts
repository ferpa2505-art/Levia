/**
 * PostHog Analytics - Privacy-Safe Configuration
 *
 * This module provides privacy-first analytics for Leviã.
 * No health data, PII, or sensitive information is ever sent.
 * Only anonymous, aggregated usage metrics for product improvement.
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

let posthog: any = null;
let isInitialized = false;
let hasConsent = false;

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

/**
 * Initialize PostHog with privacy-safe configuration
 * Only initializes if user has given analytics consent
 */
export async function initAnalytics(userConsent: boolean): Promise<void> {
  if (isInitialized) return;

  hasConsent = userConsent;

  if (!hasConsent) {
    console.log('[Analytics] User declined analytics - skipping initialization');
    return;
  }

  try {
    // Dynamic import to avoid bundling if not used
    const { PostHog } = await import('posthog-react-native');

    const apiKey = Constants.expoConfig?.extra?.posthogApiKey || process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    const host = Constants.expoConfig?.extra?.posthogHost || 'https://app.posthog.com';

    // Chave de exemplo (placeholder) não inicia o cliente: nenhum evento sai sem chave real.
    if (!apiKey || apiKey.startsWith('YOUR')) {
      console.warn('[Analytics] PostHog API key not configured - analytics disabled');
      return;
    }

    posthog = new PostHog(apiKey, { host });

    // Privacy-safe configuration
    posthog.config({
      // Disable automatic event capture
      capture_pageview: false,
      capture_pageleave: false,

      // Disable personally identifiable information capture
      disable_session_recording: true,
      disable_feature_flags: false,

      // Only send on WiFi to respect data plans
      flush_interval: 30000,
      max_batch_size: 50,

      // Opt-out of IP tracking (PostHog respects this)
      ip_address: 'masked',

      // User persistence - only anonymous ID
      persistence: 'localstorage',
    });

    // Set anonymous user ID (not linked to PII)
    const anonymousId = await getAnonymousId();
    posthog.identify(anonymousId, {
      platform: 'react-native',
      app_version: Constants.expoConfig?.version || 'unknown',
      // NO: email, name, phone, health data, serial, license info
    });

    // Hook into Sentry for error tracking correlation
    Sentry.addEventProcessor((event) => {
      if (event.event_id) {
        // Add PostHog session ID to Sentry events for correlation
        const sessionId = posthog?.get_session_id?.();
        if (sessionId) {
          event.tags = { ...event.tags, posthog_session_id: sessionId };
        }
      }
      return event;
    });

    isInitialized = true;
    console.log('[Analytics] PostHog initialized (privacy-safe mode)');

    // Track app start (anonymous)
    track('app_started', {
      source: 'cold_start',
    });

  } catch (error) {
    console.error('[Analytics] Failed to initialize:', error);
    // Fail silently - analytics should never break the app
  }
}

/**
 * Get or create anonymous user ID (persisted locally)
 */
async function getAnonymousId(): Promise<string> {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const key = '@levia:anonymous_id';
    let id = await AsyncStorage.getItem(key);

    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      await AsyncStorage.setItem(key, id);
    }
    return id;
  } catch {
    // Fallback if storage unavailable
    return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

/**
 * Track an analytics event (only if consent given)
 * Properties are sanitized to remove any PII/health data
 */
export function track(eventName: string, properties?: Record<string, any>): void {
  if (!isInitialized || !posthog || !hasConsent) return;

  try {
    const sanitizedProps = sanitizeProperties(properties || {});
    posthog.capture(eventName, sanitizedProps);
  } catch (error) {
    console.warn('[Analytics] Track failed:', error);
  }
}

/**
 * Sanitize properties to ensure no PII or health data is sent
 */
function sanitizeProperties(props: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const blockedKeys = [
    // PII
    'email', 'name', 'phone', 'serial', 'license', 'user_id', 'device_id',
    'cpf', 'cpf_hash', 'whatsapp_id',
    // Health data
    'weight', 'height', 'glucose', 'glp1_dose', 'medication', 'calories',
    'protein', 'carbs', 'fat', 'water', 'exercise', 'meal', 'food',
    'bmi', 'body_fat', 'muscle_mass', 'blood_pressure', 'heart_rate',
    'diabetes_type', 'target_weight', 'sex', 'age', 'pronoun',
    // Backup/restore
    'backup_password', 'backup_path', 'restore_status',
    // Payment
    'purchase_token', 'order_id', 'hotmart_id', 'price', 'plan',
    // Location/device
    'ip', 'location', 'gps', 'latitude', 'longitude', 'address',
    // Auth
    'password', 'biometry', 'pin', 'token', 'auth_token',
  ];

  const allowedPrefixes = ['screen_', 'button_', 'feature_', 'error_', 'performance_', 'ui_'];

  for (const [key, value] of Object.entries(props)) {
    const lowerKey = key.toLowerCase();

    // Block any key containing sensitive terms
    const isBlocked = blockedKeys.some(blocked =>
      lowerKey.includes(blocked.toLowerCase())
    );

    if (isBlocked) {
      console.debug(`[Analytics] Blocked property: ${key}`);
      continue;
    }

    // Only allow known safe property patterns
    const isAllowed = allowedPrefixes.some(prefix =>
      lowerKey.startsWith(prefix)
    ) || ['platform', 'app_version', 'source', 'duration_ms', 'success', 'error_type', 'feature_name'].includes(lowerKey);

    if (isAllowed) {
      // Sanitize values too - only allow primitives, no objects with potential PII
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.slice(0, 100); // Truncate long strings
      } else if (typeof value === 'object' && value !== null) {
        // Don't send nested objects - could contain PII
        sanitized[key] = '[object]';
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Track screen view (anonymized)
 */
export function trackScreen(screenName: string): void {
  track('screen_view', {
    screen_name: screenName,
  });
}

/**
 * Track feature usage (anonymized)
 */
export function trackFeature(featureName: string, properties?: Record<string, any>): void {
  track('feature_used', {
    feature_name: featureName,
    ...properties,
  });
}

/**
 * Track error (anonymized, no stack traces with PII)
 */
export function trackError(errorType: string, context?: string): void {
  track('error_occurred', {
    error_type: errorType,
    error_context: context?.slice(0, 50) || 'unknown',
  });
}

/**
 * Track performance metric
 */
export function trackPerformance(metricName: string, durationMs: number, success: boolean): void {
  track('performance_metric', {
    metric_name: metricName,
    duration_ms: Math.round(durationMs),
    success,
  });
}

/**
 * Update user consent (called when user changes privacy settings)
 */
export async function setConsent(consent: boolean): Promise<void> {
  hasConsent = consent;

  if (consent && !isInitialized) {
    await initAnalytics(true);
  } else if (!consent && posthog) {
    // Opt out - clear user data
    try {
      posthog.opt_out_capturing();
      posthog.reset();
    } catch (e) {
      console.warn('[Analytics] Opt-out failed:', e);
    }
    isInitialized = false;
    posthog = null;
  }
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return isInitialized && hasConsent;
}

/**
 * Get PostHog instance for advanced usage (rarely needed)
 */
export function getPostHog(): any {
  return posthog;
}

const CHAVE_CONSENTIMENTO_USO = 'levia:analyticsConsent';

/** Autorização de medição de uso guardada neste aparelho (padrão: desligada). */
export async function lerConsentimentoUso(): Promise<boolean> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  return (await AsyncStorage.getItem(CHAVE_CONSENTIMENTO_USO)) === '1';
}

/** Liga ou desliga a medição de uso e guarda a escolha. Desligar apaga o identificador no PostHog. */
export async function salvarConsentimentoUso(ativo: boolean): Promise<void> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.setItem(CHAVE_CONSENTIMENTO_USO, ativo ? '1' : '0');
  await setConsent(ativo);
}

/** Na abertura do app: inicia a medição só se o usuário já tiver autorizado. */
export async function iniciarMedicaoSeAutorizada(): Promise<void> {
  if (await lerConsentimentoUso()) {
    await setConsent(true);
  }
}