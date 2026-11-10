import { Linking, Pressable, View } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { useT } from '@context/PreferencesContext';
import { spacing } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const URL_PRIVACIDADE = 'https://ferpa2505-art.github.io/levia-policies/privacidade.html';
const EMAIL_CONTATO = 'contatoapplevia@gmail.com';

/**
 * Termos de Serviço publicados em https://leviapp.org/termos (fonte: TERMOS_SERVICO.md).
 * Documento jurídico em português; o texto não é traduzido para não perder validade.
 */
const SECOES: { titulo: string; paragrafos: string[] }[] = [
  {
    titulo: '1. Aceitação',
    paragrafos: [
      'Ao ativar e usar o Leviã (aplicativo Android e web/PWA) você concorda com estes termos e com a Política de Privacidade. Se não concordar, não use o serviço.',
    ],
  },
  {
    titulo: '2. O que é o Leviã',
    paragrafos: [
      'Uma ferramenta de registro e organização pessoal de peso, alimentação, água, exercícios, tratamento com medicamentos GLP-1, glicemia e medicações, com lembretes, relatórios, backup e, opcionalmente, análise de foto de prato por inteligência artificial.',
    ],
  },
  {
    titulo: '3. Aviso de saúde',
    paragrafos: [
      'O Leviã não é dispositivo médico e não faz diagnóstico, não prescreve tratamento nem ajusta doses. Não substitui médico, nutricionista ou outro profissional de saúde. Seus valores de calorias e nutrientes, inclusive os estimados pela IA, são aproximados e podem estar errados: confira sempre antes de salvar e não tome decisões de tratamento, de insulina ou de medicação com base só neles.',
      'Em emergência (hipoglicemia grave, confusão, desmaio, dor no peito, falta de ar), ligue 192 (SAMU) ou o serviço de emergência local. O Leviã não é um sistema de alerta: lembretes dependem do seu aparelho e podem falhar.',
    ],
  },
  {
    titulo: '4. Acesso, serial e teste',
    paragrafos: [
      '• O acesso é liberado por um serial pessoal, enviado pelo atendimento no WhatsApp. Não o compartilhe nem o revenda.',
      '• Cada serial vale para até 2 aparelhos. O teste de 7 dias começa na primeira ativação, com limite de uso da IA informado no app.',
      '• Podemos limitar, suspender ou revogar acessos em caso de abuso, fraude, tentativa de burlar limites ou violação destes termos. Você pode pedir um novo serial a qualquer momento pelo próprio WhatsApp (o anterior deixa de valer).',
      '• Assinatura: os planos mensal e anual e seus preços ficam em www.leviapp.org, com pagamento pela Hotmart. Preço, renovação, cancelamento e reembolso são informados antes da contratação, respeitando o Código de Defesa do Consumidor (inclusive o direito de arrependimento de 7 dias em compras online). Cancelamentos e reembolsos são feitos na própria Hotmart ou pelo contato do site.',
    ],
  },
  {
    titulo: '5. Uso adequado',
    paragrafos: [
      'Você concorda em usar o Leviã para fins pessoais, informar dados verdadeiros, ter 18 anos ou mais e proteger o acesso ao seu aparelho. Você concorda em não: usá-lo para tratar ou diagnosticar outras pessoas, tentar invadir, sobrecarregar ou contornar os limites do serviço, extrair o código ou os dados do servidor, enviar fotos de terceiros, rostos ou documentos para a análise de IA, nem copiar, revender ou distribuir o app.',
    ],
  },
  {
    titulo: '6. Seus dados',
    paragrafos: [
      'Os registros de saúde ficam no seu aparelho; o servidor guarda apenas o necessário para liberar o acesso (nome, telefone, objetivo informado no WhatsApp, aparelhos e uso). Detalhes, base legal, prestadores e seus direitos estão na Política de Privacidade. Você é responsável pela exatidão do que registra e por guardar seus backups.',
    ],
  },
  {
    titulo: '7. Análise por IA',
    paragrafos: [
      'É opcional e depende do seu consentimento a cada uso. A foto é enviada ao Google Gemini por meio do nosso servidor, conforme a Política de Privacidade. A IA pode errar o alimento e a quantidade; o resultado é apenas uma sugestão que você confere e salva.',
    ],
  },
  {
    titulo: '8. Disponibilidade e mudanças',
    paragrafos: [
      'O serviço é oferecido "no estado em que se encontra", sem garantia de funcionamento ininterrupto. Podemos mudar, suspender ou encerrar recursos; se o serviço for descontinuado, avisaremos com antecedência razoável e você poderá exportar seus dados pelo backup.',
    ],
  },
  {
    titulo: '9. Propriedade intelectual',
    paragrafos: [
      'O Leviã, sua marca e seu design pertencem a Luis Fernando Paulino (FP Tech & Art). Você recebe uma licença pessoal, não exclusiva e revogável, para usar o app. Os registros que você cria continuam sendo seus.',
    ],
  },
  {
    titulo: '10. Responsabilidade',
    paragrafos: [
      'Dentro do que a lei permite, não respondemos por decisões de saúde tomadas com base no app, por perda de dados causada por falta de backup, por falhas de terceiros (WhatsApp, Google, Cloudflare, lojas de aplicativos) nem por danos indiretos. Nada nestes termos exclui responsabilidade que a lei não permita excluir, em especial a prevista no Código de Defesa do Consumidor. Havendo responsabilidade, ela se limita ao valor que você pagou pelo serviço nos 12 meses anteriores ao fato, no que a lei permitir.',
    ],
  },
  {
    titulo: '11. Lei aplicável e contato',
    paragrafos: [
      `Estes termos seguem as leis do Brasil; fica eleito o foro do domicílio do consumidor. Dúvidas, pedidos de privacidade e suporte: ${EMAIL_CONTATO}.`,
    ],
  },
  {
    titulo: '12. Alterações',
    paragrafos: [
      'Podemos atualizar estes termos. Mudanças relevantes serão avisadas no app ou pelo WhatsApp antes de valerem; o uso continuado depois do aviso indica concordância. A data no topo mostra a última alteração.',
    ],
  },
];

export default function Termos() {
  const t = useT();

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedText variant="caption" color="textSecondary">
          Última atualização: 4 de novembro de 2026
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
