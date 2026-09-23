import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { IDIOMAS, CodigoIdioma } from '@/i18n';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

interface ListaIdiomasProps {
  selecionado: CodigoIdioma;
  onSelecionar: (codigo: CodigoIdioma) => void;
  /** 'claro' = texto claro sobre fundo colorido (tela de boas-vindas) */
  aparencia?: 'normal' | 'claro';
}

/** Lista de idiomas com bandeira e nome no próprio idioma. */
export function ListaIdiomas({ selecionado, onSelecionar, aparencia = 'normal' }: ListaIdiomasProps) {
  const claro = aparencia === 'claro';

  return (
    <View>
      {IDIOMAS.map((item) => {
        const ativo = item.codigo === selecionado;
        return (
          <Pressable
            key={item.codigo}
            onPress={() => onSelecionar(item.codigo)}
            style={({ pressed }) => [
              styles.linha,
              claro ? styles.linhaClaro : styles.linhaNormal,
              ativo && (claro ? styles.ativoClaro : styles.ativoNormal),
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText variant="subheading" style={styles.bandeira}>
              {item.bandeira}
            </ThemedText>
            <ThemedText
              variant="body"
              style={[styles.nome, { color: claro ? colors.background : colors.text }]}
            >
              {item.nome}
            </ThemedText>
            {ativo ? (
              <Check size={20} strokeWidth={2.5} color={claro ? colors.background : colors.primary} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = estilosTema(() => ({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
    borderWidth: 1.5,
  },
  linhaNormal: { borderColor: 'transparent' },
  linhaClaro: { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.08)' },
  ativoNormal: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  ativoClaro: { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: colors.background },
  bandeira: { marginRight: spacing.md },
  nome: { flex: 1 },
}));
