import { Linking, Platform } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import Constants from 'expo-constants';
import { traduzirAtual as t, obterIdiomaAtual } from '@/i18n';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';
import type { AlimentoSalvo } from '@utils/alimentosSalvos';

/** Caixa da equipe que revisa os alimentos sugeridos para o banco do app */
export const EMAIL_EQUIPE = 'contatoapplevia@gmail.com';

/**
 * Abre o e-mail já preenchido com o alimento que a pessoa cadastrou, para a
 * equipe revisar e incluir no banco numa próxima versão. Só o alimento vai no
 * texto (nada de nome, peso ou glicemia) e a pessoa confirma o envio no app de
 * e-mail. A última linha é um JSON para a ferramenta de análise ler.
 */
export async function enviarAlimentoParaEquipe(a: AlimentoSalvo): Promise<boolean> {
  const dados = {
    nome: a.nome,
    kcalPor100g: a.kcalPor100g,
    proteinaGPor100g: a.proteinaGPor100g,
    carboidratoGPor100g: a.carboidratoGPor100g ?? null,
    gorduraGPor100g: a.gorduraGPor100g ?? null,
    fibraGPor100g: a.fibraGPor100g ?? null,
    medida: a.unidade,
    gramasPorMedida: a.gramasPorUnidade,
    idioma: obterIdiomaAtual(),
    versaoApp: Constants.expoConfig?.version ?? '',
  };
  const linhas = [
    t('alim.emailCorpo'),
    '',
    `${a.nome}`,
    `${a.kcalPor100g} kcal · ${a.proteinaGPor100g} g prot · ${a.carboidratoGPor100g ?? '–'} g carbo · ${a.gorduraGPor100g ?? '–'} g gord · ${a.fibraGPor100g ?? '–'} g fibra (100 g)`,
    '',
    `LEVIA_ALIMENTO ${JSON.stringify(dados)}`,
  ];
  const assunto = t('alim.emailAssunto', { nome: a.nome });
  const corpo = linhas.join('\n');
  try {
    if (Platform.OS !== 'web' && (await MailComposer.isAvailableAsync())) {
      suspenderBloqueio();
      await MailComposer.composeAsync({ recipients: [EMAIL_EQUIPE], subject: assunto, body: corpo });
      return true;
    }
    await Linking.openURL(`mailto:${EMAIL_EQUIPE}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`);
    return true;
  } catch {
    return false;
  }
}
