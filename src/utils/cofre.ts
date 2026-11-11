import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytes } from 'expo-crypto';
import { criarCofre } from '@utils/cofreDados';

/** Cofre do app: os dados de saúde passam por aqui (ver cofreDados.ts). */
export const cofre = criarCofre({
  armazenamento: AsyncStorage,
  aleatorio: (n) => getRandomBytes(n),
});
