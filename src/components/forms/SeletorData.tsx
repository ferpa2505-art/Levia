import { View, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

interface Props {
  valor: Date;
  onChange: (data: Date) => void;
  /** Não deixa voltar antes de hoje (padrão: permite qualquer data) */
  minimoHoje?: boolean;
}

function mesmoDia(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** Data ajustada por botões ‹ › (um dia por toque), com atalho "Hoje" */
export function SeletorData({ valor, onChange, minimoHoje }: Props) {
  const { t, idioma } = usePreferences();
  const hoje = new Date();
  const podeVoltar = !minimoHoje || !mesmoDia(valor, hoje);

  const mover = (dias: number) => {
    const d = new Date(valor);
    d.setDate(d.getDate() + dias);
    onChange(d);
  };

  let texto: string;
  try {
    texto = valor.toLocaleDateString(idioma, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    texto = valor.toLocaleDateString('pt-BR');
  }

  return (
    <View style={styles.linha}>
      <Pressable onPress={() => mover(-1)} disabled={!podeVoltar} style={[styles.botao, !podeVoltar && { opacity: 0.3 }]} hitSlop={6}>
        <ChevronLeft size={20} color={colors.primary} strokeWidth={2.5} />
      </Pressable>
      <ThemedText variant="body" color="text" style={styles.texto}>{texto}</ThemedText>
      <Pressable onPress={() => mover(1)} style={styles.botao} hitSlop={6}>
        <ChevronRight size={20} color={colors.primary} strokeWidth={2.5} />
      </Pressable>
      {!mesmoDia(valor, hoje) && (
        <Pressable
          onPress={() => {
            const d = new Date(valor);
            d.setFullYear(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            onChange(d);
          }}
          style={styles.hoje}
          hitSlop={6}
        >
          <ThemedText variant="small" color="primary">{t('ali.hoje')}</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = estilosTema(() => ({
  linha: { flexDirection: 'row', alignItems: 'center' },
  botao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  texto: { minWidth: 150, textAlign: 'center', marginHorizontal: spacing.sm },
  hoje: {
    marginLeft: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
}));
