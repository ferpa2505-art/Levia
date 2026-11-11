import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, perfilVazio } from '@models/profile';
import { basicoDe, carregarPerfil, salvarPerfil } from '@utils/profileStorage';
import { cofre } from '@utils/cofre';

interface ProfileContextValue {
  profile: UserProfile;
  loading: boolean;
  updateProfile: (parcial: Partial<UserProfile>) => void;
  finalizarOnboarding: (parcial: Partial<UserProfile>) => Promise<void>;
  salvarAlteracoes: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(perfilVazio);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    const carregar = async () => {
      const perfil = await carregarPerfil();
      if (vivo) {
        setProfile(perfil);
        setLoading(false);
      }
    };
    carregar();
    // ao abrir o cofre o perfil completo é lido; ao fechar, só a parte básica fica na memória
    const parar = cofre.ouvir((aberto) => {
      if (!aberto) {
        setProfile((p) => ({ ...perfilVazio, ...basicoDe(p) }));
      } else {
        carregar();
      }
    });
    return () => {
      vivo = false;
      parar();
    };
  }, []);

  function updateProfile(parcial: Partial<UserProfile>) {
    setProfile((prev) => ({ ...prev, ...parcial }));
  }

  async function finalizarOnboarding(parcial: Partial<UserProfile>) {
    const perfilFinal = { ...profile, ...parcial, onboardingConcluido: true };
    setProfile(perfilFinal);
    await salvarPerfil(perfilFinal);
  }

  async function salvarAlteracoes() {
    await salvarPerfil(profile);
  }

  return (
    <ProfileContext.Provider
      value={{ profile, loading, updateProfile, finalizarOnboarding, salvarAlteracoes }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile precisa ser usado dentro de um ProfileProvider');
  }
  return ctx;
}
