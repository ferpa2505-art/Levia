import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { ThemedText } from '@components/ThemedText';
import { useProfile } from '@context/ProfileContext';
import { useT } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

export default function OnboardingDiabetesType() {
  const t = useT();
  const router = useRouter();
  const { profile, finalizarOnboarding } = useProfile();
  const [tipo, setTipo] = useState<'tipo1' | 'tipo2' | null>(profile.tipoDiabetes);

  async function handleConfirmar() {
    if (tipo) {
      await finalizarOnboarding({ tipoDiabetes: tipo });
      router.replace('/');
    }
  }

  return (
    <QuestionLayout
      step={7}
      totalSteps={8}
      question={t('onb.tipodiabetes.pergunta')}
      subtitle={t('onb.tipodiabetes.sub')}
      onNext={handleConfirmar}
      onBack={() => router.back()}
      nextLabel={t('onb.tipodiabetes.confirmar')}
      nextDisabled={!tipo}
    >
      <View style={styles.opcoes}>
        <CardTipo
          titulo={t('onb.tipodiabetes.tipo1_nome')}
          descricao={t('onb.tipodiabetes.tipo1_desc')}
          selecionado={tipo === 'tipo1'}
          onPress={() => setTipo('tipo1')}
        />
        <CardTipo
          titulo={t('onb.tipodiabetes.tipo2_nome')}
          descricao={t('onb.tipodiabetes.tipo2_desc')}
          selecionado={tipo === 'tipo2'}
          onPress={() => setTipo('tipo2')}
        />
      </View>
    </QuestionLayout>
  );
}

interface CardTipoProps {
  titulo: string;
  descricao: string;
  selecionado: boolean;
  onPress: () => void;
}

function CardTipo({ titulo, descricao, selecionado, onPress }: CardTipoProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        selecionado && styles.cardSelecionado,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <Heart
        size={32}
        color={selecionado ? colors.primary : colors.textSecondary}
        strokeWidth={2}
      />
      <ThemedText
        variant="subheading"
        color={selecionado ? 'primary' : 'text'}
        style={styles.cardTitulo}
      >
        {titulo}
      </ThemedText>
      <ThemedText
        variant="small"
        color={selecionado ? 'primary' : 'textSecondary'}
        style={styles.cardDescricao}
      >
        {descricao}
      </ThemedText>
    </Pressable>
  );
}

const styles = estilosTema(() => ({
  opcoes: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  card: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cardSelecionado: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTitulo: {
    marginTop: spacing.md,
  },
  cardDescricao: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
}));
