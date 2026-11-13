import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytes } from 'expo-crypto';
import { Platform } from 'react-native';
import { criarCofre, type ProvedorChaveSistema } from '@utils/cofreDados';
import { deBase64, paraBase64 } from '@utils/cifraBackup';

const CHAVE_KEK_SISTEMA = 'levia_cofre_kek';

/**
 * Celular: chave aleatória guardada no cofre do sistema (Android Keystore / iOS Keychain), sem pedir biometria
 * a cada uso e presa a este aparelho (não entra em backup nem migra para outro). Navegador: não existe cofre
 * do sistema, então não há provedor e a proteção vem só da senha (ver docs/SEGURANCA_COFRE.md).
 */
const chaveSistema: ProvedorChaveSistema | undefined = Platform.OS === 'web'
  ? undefined
  : {
      async ler() {
        const v = await SecureStore.getItemAsync(CHAVE_KEK_SISTEMA);
        return v ? deBase64(v) : null;
      },
      async gravar(chave) {
        await SecureStore.setItemAsync(CHAVE_KEK_SISTEMA, paraBase64(chave), {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      },
    };

/** Cofre do app: os dados de saúde passam por aqui (ver cofreDados.ts). */
export const cofre = criarCofre({
  armazenamento: AsyncStorage,
  aleatorio: (n) => getRandomBytes(n),
  chaveSistema,
});
