import { Linking, Pressable, View } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { useT } from '@context/PreferencesContext';
import { spacing } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const URL_PRIVACIDADE = 'https://ferpa2505-art.github.io/levia-policies/privacidade.html';
const EMAIL_CONTATO = 'contato@leviapp.org';

/**
 * Termos de Serviço publicados em https://leviapp.org/termos (fonte: TERMOS_SERVICO.md, versão 2026-11-13).
 * Documento jurídico em português; o texto não é traduzido para não perder validade.
 */
const SECOES: { titulo: string; paragrafos: string[] }[] = [
  {
    titulo: '1. Aceitação',
    paragrafos: [
      'Ao ativar e usar o Leviã (aplicativo Android e web/PWA) você declara que leu e concorda com estes termos e com a Política de Privacidade. Se não concordar, não use o serviço. Concordar com estes termos não substitui os consentimentos específicos pedidos em cada momento (atendimento pelo WhatsApp, análise de foto por IA e pixel da página de vendas), que você pode dar ou recusar separadamente e revogar quando quiser.',
    ],
  },
  {
    titulo: '2. Quem oferece o Leviã',
    paragrafos: [
      `O Leviã é oferecido por Luis Fernando Paulino, pessoa física, que atua com o nome FP Tech & Art, Brasil. Contato: ${EMAIL_CONTATO}.`,
    ],
  },
  {
    titulo: '3. O que é o Leviã',
    paragrafos: [
      'Uma ferramenta de registro e organização pessoal de peso, alimentação, água, exercícios, tratamento com medicamentos GLP-1, glicemia e medicações, com lembretes, relatórios, backup e, opcionalmente, análise de foto de prato por inteligência artificial.',
    ],
  },
  {
    titulo: '4. Aviso de saúde',
    paragrafos: [
      'O Leviã não é dispositivo médico e não faz diagnóstico, não prescreve tratamento nem ajusta doses. Não substitui médico, nutricionista ou outro profissional de saúde. Seus valores de calorias e nutrientes, inclusive os estimados pela IA, são aproximados e podem estar errados: confira sempre antes de salvar e não tome decisões de tratamento, de insulina ou de medicação com base só neles.',
      'Em emergência (hipoglicemia grave, confusão, desmaio, dor no peito, falta de ar), ligue 192 (SAMU) ou o serviço de emergência local. O Leviã não é um sistema de alerta: lembretes dependem do seu aparelho e podem falhar.',
    ],
  },
  {
    titulo: '5. Acesso, serial e teste',
    paragrafos: [
      '• O acesso é liberado por um serial pessoal (código de ativação), enviado pelo atendimento no WhatsApp. Não o compartilhe nem o revenda.',
      '• Cada serial vale para até 2 aparelhos. O teste de 7 dias começa na primeira ativação de um serial de teste, com limite de uso da IA informado no app. O serial de um plano pago libera o plano contratado e não inicia um novo teste.',
      '• Podemos limitar, suspender ou revogar acessos em caso de abuso, fraude, tentativa de burlar limites, reembolso ou estorno da compra, ou violação destes termos. Você pode pedir um novo serial a qualquer momento pelo próprio WhatsApp (o anterior deixa de valer).',
      '• Assinatura: os planos mensal e anual e seus preços ficam em www.leviapp.org, com pagamento pela Hotmart. Preço, renovação, cancelamento e reembolso são informados antes da contratação, respeitando o Código de Defesa do Consumidor (inclusive o direito de arrependimento de 7 dias em compras online). Cancelamentos e reembolsos são feitos na própria Hotmart ou pelo contato do site. Com o reembolso ou o estorno (chargeback) de uma compra, o acesso liberado por ela é encerrado; o simples cancelamento da renovação não encerra o período já pago.',
    ],
  },
  {
    titulo: '6. Uso adequado',
    paragrafos: [
      'Você concorda em usar o Leviã para fins pessoais, informar dados verdadeiros, ter 18 anos ou mais e proteger o acesso ao seu aparelho. Você concorda em não: usá-lo para tratar ou diagnosticar outras pessoas, tentar invadir, sobrecarregar ou contornar os limites do serviço, extrair o código ou os dados do servidor, enviar fotos de terceiros, rostos ou documentos para a análise de IA, nem copiar, revender ou distribuir o app.',
    ],
  },
  {
    titulo: '7. Seus dados e a segurança do aparelho',
    paragrafos: [
      'Os registros de saúde ficam no seu aparelho; o servidor guarda apenas o necessário para liberar o acesso (nome, telefone, e-mail se informado, objetivo informado no WhatsApp, aparelhos e uso). Detalhes, base legal, prestadores, prazos e seus direitos estão na Política de Privacidade. Você é responsável pela exatidão do que registra e por guardar seus backups.',
      'Senha no navegador (PWA): no navegador, a proteção dos registros contra quem copiar os dados do navegador depende da força da sua senha. Um PIN numérico curto pode ser descoberto por quem tiver essa cópia. Ao usar o Leviã no navegador, você declara estar ciente desse risco; para os registros mais sensíveis, prefira o app no celular ou uma senha longa. Se esquecer a senha sem biometria ativada, os dados não podem ser recuperados por nós. Este aviso não afasta as nossas obrigações de segurança previstas na LGPD e no Código de Defesa do Consumidor.',
    ],
  },
  {
    titulo: '8. Análise por IA',
    paragrafos: [
      'É opcional e depende do seu consentimento, pedido antes do primeiro uso; cada foto só é enviada quando você toca em Analisar com IA. A foto é enviada ao Google Gemini por meio do nosso servidor, apenas para identificar alimentos e estimar porções, conforme a Política de Privacidade; o Leviã não faz reconhecimento facial. A IA pode errar o alimento e a quantidade; o resultado é apenas uma sugestão que você confere e salva.',
    ],
  },
  {
    titulo: '9. Disponibilidade e mudanças',
    paragrafos: [
      'O serviço é oferecido "no estado em que se encontra", sem garantia de funcionamento ininterrupto. Podemos mudar, suspender ou encerrar recursos; se o serviço for descontinuado, avisaremos com antecedência razoável e você poderá exportar seus dados pelo backup.',
    ],
  },
  {
    titulo: '10. Propriedade intelectual',
    paragrafos: [
      'O Leviã, sua marca e seu design pertencem a Luis Fernando Paulino (FP Tech & Art). Você recebe uma licença pessoal, não exclusiva e revogável, para usar o app. Os registros que você cria continuam sendo seus.',
    ],
  },
  {
    titulo: '11. Responsabilidade',
    paragrafos: [
      'Respondemos pelo serviço nos termos do Código de Defesa do Consumidor e da LGPD, e nada nestes termos limita os seus direitos previstos nessas leis. Como o Leviã é uma ferramenta de registro, as decisões de saúde continuam sendo suas e da sua equipe de saúde. Não há responsabilidade nossa quando o dano decorrer exclusivamente de ato seu ou de terceiro, como uso contrário a estes termos, perda de dados por falta de backup ou por senha esquecida, ou falha de serviço de terceiro fora do nosso controle (por exemplo, indisponibilidade do WhatsApp ou da loja de aplicativos), conforme o art. 14, § 3º, do Código de Defesa do Consumidor.',
    ],
  },
  {
    titulo: '12. Lei aplicável e contato',
    paragrafos: [
      `Estes termos seguem as leis do Brasil; fica eleito o foro do domicílio do consumidor. Dúvidas, pedidos de privacidade e suporte: ${EMAIL_CONTATO}.`,
    ],
  },
  {
    titulo: '13. Alterações',
    paragrafos: [
      'Podemos atualizar estes termos. Mudanças relevantes serão avisadas no app ou pelo WhatsApp antes de valerem; o uso continuado depois do aviso indica concordância com os termos, mas mudanças que dependam de consentimento para o tratamento de dados só valem depois de você consentir de novo. Se não concordar, você pode deixar de usar o serviço e pedir a exclusão dos seus dados. A data e a versão no topo mostram a última alteração.',
    ],
  },
];

export default function Termos() {
  const t = useT();

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedText variant="caption" color="textSecondary">
          Última atualização: 13 de novembro de 2026 · Versão 2026-11-13
        </ThemedText>

        {SECOES.map((secao) => (
          <View key={secao.titulo} style={styles.secao}>
            <ThemedText variant="subheading" color="text">{secao.titulo}</ThemedText>
            {secao.paragrafos.map((paragrafo) => (
              <ThemedText key={paragrafo} variant="small" color="textSecondary" style={styles.paragrafo}>
                {paragrafo}
              </ThemedText>
            ))}
          </View>
        ))}

        <Pressable
          onPress={() => Linking.openURL(URL_PRIVACIDADE).catch(() => {})}
          accessibilityRole="link"
          hitSlop={8}
          style={styles.link}
        >
          <ThemedText variant="small" color="primary" style={styles.linkTexto}>
            {t('paywall.politicaPrivacidade')}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1, paddingTop: spacing.md, paddingBottom: spacing.xl },
  secao: { marginTop: spacing.lg },
  paragrafo: { marginTop: spacing.xs },
  link: { marginTop: spacing.xl },
  linkTexto: { textDecorationLine: 'underline' },
}));
