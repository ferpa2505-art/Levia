import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aplicarTema, NomeTema } from '@constants/colors';
import {
  CodigoIdioma,
  ChaveTraducao,
  detectarIdiomaDoCelular,
  idiomaValido,
  traduzir,
} from '@/i18n';

/**
 * Preferências do app: tema (cores) e idioma.
 * Ficam salvas no celular e valem para o app inteiro.
 */

const CHAVE_STORAGE = '@levia/preferencias';

interface PreferenciasSalvas {
  tema: NomeTema;
  idioma: CodigoIdioma;
  idiomaConfirmado: boolean;
}

interface PreferencesContextValue {
  tema: NomeTema;
  idioma: CodigoIdioma;
  /** true depois que a pessoa escolheu o idioma na primeira tela */
  idiomaConfirmado: boolean;
  mudarTema: (tema: NomeTema) => void;
  mudarIdioma: (idioma: CodigoIdioma) => void;
  confirmarIdioma: (idioma: CodigoIdioma) => void;
  /** Tradução: t('home.seuPeso') ou t('home.ola', { nome: 'Fer' }) */
  t: (chave: ChaveTraducao, params?: Record<string, string | number>) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [carregado, setCarregado] = useState(false);
  const [prefs, setPrefs] = useState<PreferenciasSalvas>({
    tema: 'salvia',
    idioma: detectarIdiomaDoCelular(),
    idiomaConfirmado: false,
  });

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_STORAGE)
      .then((texto) => {
        if (!texto) return;
        const salvo = JSON.parse(texto) as Partial<PreferenciasSalvas>;
        setPrefs((atual) => {
          const novo: PreferenciasSalvas = {
            tema: salvo.tema === 'petroleo' ? 'petroleo' : 'salvia',
            idioma: idiomaValido(salvo.idioma) ? salvo.idioma : atual.idioma,
            idiomaConfirmado: !!salvo.idiomaConfirmado,
          };
          aplicarTema(novo.tema);
          return novo;
        });
      })
      .catch(() => {})
      .finally(() => setCarregado(true));
  }, []);

  const salvar = useCallback((novo: PreferenciasSalvas) => {
    AsyncStorage.setItem(CHAVE_STORAGE, JSON.stringify(novo)).catch(() => {});
  }, []);

  const mudarTema = useCallback(
    (tema: NomeTema) => {
      aplicarTema(tema); // troca as cores ANTES de redesenhar
      setPrefs((atual) => {
        const novo = { ...atual, tema };
        salvar(novo);
        return novo;
      });
    },
    [salvar]
  );

  const mudarIdioma = useCallback(
    (idioma: CodigoIdioma) => {
      setPrefs((atual) => {
        const novo = { ...atual, idioma };
        salvar(novo);
        return novo;
      });
    },
    [salvar]
  );

  const confirmarIdioma = useCallback(
    (idioma: CodigoIdioma) => {
      setPrefs((atual) => {
        const novo = { ...atual, idioma, idiomaConfirmado: true };
        salvar(novo);
        return novo;
      });
    },
    [salvar]
  );

  const t = useCallback(
    (chave: ChaveTraducao, params?: Record<string, string | number>) =>
      traduzir(prefs.idioma, chave, params),
    [prefs.idioma]
  );

  // Enquanto lê as preferências salvas, não mostra nada (a splash continua na tela)
  if (!carregado) return null;

  return (
    <PreferencesContext.Provider
      value={{
        tema: prefs.tema,
        idioma: prefs.idioma,
        idiomaConfirmado: prefs.idiomaConfirmado,
        mudarTema,
        mudarIdioma,
        confirmarIdioma,
        t,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences precisa ser usado dentro de um PreferencesProvider');
  }
  return ctx;
}

/** Atalho para traduzir: const t = useT(); */
export function useT() {
  return usePreferences().t;
}
