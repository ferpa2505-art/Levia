import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Pencil, Syringe, ChevronRight } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useProfile } from '@context/ProfileContext';
import { useRecords } from '@context/RecordsContext';
import { colors, spacing, radius } from '@constants/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, salvarAlteracoes } = useProfile();
  const { pesoAtualKg } = useRecords();
  const pesoAtual = pesoAtualKg ?? profile.pesoAtualKg;
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaTexto, setMetaTexto] = useState(
    profile.metaPesoKg != null ? String(profile.metaPesoKg) : ''
  );

  async function handleSalvarMeta() {
    const novaMeta = parseFloat(metaTexto.replace(',', '.'));
    if (!isNaN(novaMeta) && novaMeta > 0) {
      updateProfile({ metaPesoKg: novaMeta });
      await salvarAlteracoes();
    }
    setEditandoMeta(false);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="heading" color="text">
            {profile.comoChamar || profile.nome || 'Seu perfil'}
          </ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            Seus dados e metas
          </ThemedText>
        </View>

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text" style={{ marginBottom: spacing.md }}>
            Meus dados
          </ThemedText>
          <DadoLinha label="Altura" valor={profile.alturaCm != null ? `${profile.alturaCm} cm` : '--'} />
          <DadoLinha label="Peso atual" valor={pesoAtual != null ? `${pesoAtual} kg` : '--'} />
          <DadoLinha label="Idade" valor={profile.idade != null ? `${profile.idade} anos` : '--'} />
        </ThemedView>

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.metaHeader}>
            <View style={styles.metaTituloRow}>
              <Target size={18} color={colors.primary} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                Minha meta
              </ThemedText>
            </View>
            {!editandoMeta && (
              <Button
                label="Editar"
                variant="outline"
                size="sm"
                icon={<Pencil size={14} color={colors.primary} strokeWidth={2} />}
                onPress={() => {
                  setMetaTexto(profile.metaPesoKg != null ? String(profile.metaPesoKg) : '');
                  setEditandoMeta(true);
                }}
              />
            )}
          </View>

          {editandoMeta ? (
            <View style={styles.editRow}>
              <Input
                value={metaTexto}
                onChangeText={setMetaTexto}
                keyboardType="decimal-pad"
                placeholder="0"
                autoFocus
                style={styles.metaInput}
              />
              <ThemedText variant="body" color="textSecondary" style={{ marginLeft: spacing.sm }}>
                kg
              </ThemedText>
              <View style={styles.editButtons}>
                <Button label="Cancelar" variant="outline" size="sm" onPress={() => setEditandoMeta(false)} style={{ marginRight: spacing.sm }} />
                <Button label="Salvar" variant="primary" size="sm" onPress={handleSalvarMeta} />
              </View>
            </View>
          ) : (
            <ThemedText variant="title" color="primary" style={{ marginTop: spacing.sm }}>
              {profile.metaPesoKg != null ? `${profile.metaPesoKg} kg` : 'Defina sua meta'}
            </ThemedText>
          )}
        </ThemedView>

        <Pressable onPress={() => router.push('/glp1')}>
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow, styles.glp1Card]}>
            <View style={styles.glp1IconCircle}>
              <Syringe size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <ThemedText variant="subheading" color="text">Modo GLP-1</ThemedText>
              <ThemedText variant="small" color="textSecondary">
                Doses, rodízio de aplicação, sintomas e lembretes
              </ThemedText>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </ThemedView>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

function DadoLinha({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.dadoLinha}>
      <ThemedText variant="body" color="textSecondary">
        {label}
      </ThemedText>
      <ThemedText variant="body" color="text">
        {valor}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: spacing['2xl'],
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
  },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  dadoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editRow: {
    marginTop: spacing.md,
  },
  metaInput: {
    textAlign: 'left',
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  glp1Card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glp1IconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(111,165,142,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
