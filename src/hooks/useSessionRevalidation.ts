import { useEffect } from 'react';
import { useProfile } from '@context/ProfileContext';

const WORKER_API = 'https://levia-ia-worker.ferpa2505.workers.dev';
const REVALIDATION_INTERVAL = 15 * 60 * 1000; // 15 minutes

/**
 * Hook para revalidar periodicamente o session token
 */
export function useSessionRevalidation() {
  const { profile, updateProfile } = useProfile();

  useEffect(() => {
    if (!profile.sessionToken) return;

    const timer = setInterval(async () => {
      try {
        const response = await fetch(`${WORKER_API}/v1/licenca/validar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${profile.sessionToken}`,
          },
          body: JSON.stringify({}),
        });

        const data = await response.json();

        if (!response.ok) {
          // Se a revalidação falhar, limpa o session token
          updateProfile({ sessionToken: undefined, entitlement: undefined });
          return;
        }

        // Atualiza o entitlement com os dados mais recentes
        updateProfile({ entitlement: data.entitlement });
      } catch (error) {
        console.error('Falha na revalidação da sessão:', error);
      }
    }, REVALIDATION_INTERVAL);

    return () => clearInterval(timer);
  }, [profile.sessionToken]);
}
