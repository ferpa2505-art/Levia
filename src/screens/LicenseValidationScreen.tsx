import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useProfile } from '@context/ProfileContext';
import { useRouter } from 'expo-router';
import { colors } from '@constants/colors';

const WORKER_API = 'https://levia-ia-worker.ferpa2505.workers.dev';

interface LicenseValidationProps {
  // Add any props if needed
}

export default function LicenseValidationScreen({}: LicenseValidationProps) {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useProfile();
  const router = useRouter();

  async function validarLicenca() {
    if (!serial.trim()) {
      Alert.alert('Erro', 'Por favor insira o número serial');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${WORKER_API}/v1/licenca/validar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serial: serial.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Falha na validação');
      }

      // Save session token and entitlement to profile
      updateProfile({
        sessionToken: data.session_token,
        entitlement: data.entitlement,
      });

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha na validação da licença');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Validação de Licença</Text>
      <Text style={styles.subtitle}>Insira seu número serial</Text>
      <TextInput
        style={styles.input}
        placeholder="LEVIA-AB52-7R5Y-28LO"
        placeholderTextColor={colors.textSecondary}
        value={serial}
        onChangeText={setSerial}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Button
        title={loading ? 'Validando...' : 'Validar Licença'}
        onPress={validarLicenca}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    color: colors.text,
    fontSize: 16,
  },
});