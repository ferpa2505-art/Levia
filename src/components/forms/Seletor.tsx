import { useState } from 'react';
import { View, Pressable, Modal, FlatList, useWindowDimensions } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

export interface OpcaoSeletor {
  valor: string;
  rotulo: string;
}

interface Props {
  valor: string;
  opcoes: OpcaoSeletor[];
  onChange: (valor: string) => void;
  /** Título da lista que abre */
  titulo: string;
}

/** Campo de escolha única: mostra a opção atual e abre uma lista ao tocar */
export function Seletor({ valor, opcoes, onChange, titulo }: Props) {
  const [aberto, setAberto] = useState(false);
  const { height } = useWindowDimensions();
  const atual = opcoes.find((o) => o.valor === valor);

  return (
    <>
      <Pressable onPress={() => setAberto(true)} style={({ pressed }) => [styles.campo, pressed && { opacity: 0.7 }]}>
        <ThemedText variant="body" color={atual ? 'text' : 'textSecondary'} style={{ flex: 1 }}>
          {atual?.rotulo ?? titulo}
        </ThemedText>
        <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <Pressable style={[styles.caixa, { maxHeight: height * 0.7 }]} onPress={() => {}}>
            <ThemedText variant="subheading" color="text" style={styles.titulo}>{titulo}</ThemedText>
            <FlatList
              data={opcoes}
              keyExtractor={(o) => o.valor}
              renderItem={({ item }) => {
                const ativo = item.valor === valor;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.valor);
                      setAberto(false);
                    }}
                    style={[styles.opcao, ativo && styles.opcaoAtiva]}
                  >
                    <ThemedText variant="body" color={ativo ? 'primary' : 'text'} style={{ flex: 1 }}>
                      {item.rotulo}
                    </ThemedText>
                    {ativo && <Check size={18} color={colors.primary} strokeWidth={2.5} />}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = estilosTema(() => ({
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.xl },
  caixa: { backgroundColor: colors.surface, borderRadius: radius.xl, paddingVertical: spacing.md, overflow: 'hidden' },
  titulo: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  opcaoAtiva: { backgroundColor: colors.primarySoft },
}));
