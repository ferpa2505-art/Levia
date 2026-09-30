import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useOmniRoute } from '@hooks/useOmniRoute';
import { colors } from '@constants/colors';

export function OmniRouteTest() {
  const { isOnline, isLoading, error, call, retry } = useOmniRoute();
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestResult('Testando conexão...');
    const response = await call('Responda com uma frase breve confirmando que está funcionando.');

    if (response.success) {
      setTestResult(`✅ Conexão bem-sucedida!\n\nResposta: ${response.data?.substring(0, 100)}...`);
    } else {
      setTestResult(`❌ Erro: ${response.error}`);
    }
  };

  const handleTestAnalysis = async () => {
    setTestResult('Analisando dados...');
    const response = await call(
      'Analise este exemplo: o usuário perdeu 5kg em 2 semanas. É uma perda de peso saudável?',
      'Você é especialista em nutrição e saúde.'
    );

    if (response.success) {
      setTestResult(`✅ Análise completa!\n\n${response.data?.substring(0, 150)}...`);
    } else {
      setTestResult(`❌ Erro: ${response.error}`);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
        OmniRoute Integration Test
      </Text>

      <View
        style={{
          padding: 12,
          backgroundColor: isOnline ? '#d4edda' : '#f8d7da',
          borderRadius: 8,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: isOnline ? '#28a745' : '#dc3545',
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: isOnline ? '#155724' : '#721c24',
            fontWeight: '600',
          }}
        >
          Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: isOnline ? '#155724' : '#721c24',
            marginTop: 4,
          }}
        >
          localhost:20128/v1/messages
        </Text>
      </View>

      {error && (
        <View
          style={{
            padding: 12,
            backgroundColor: '#fff3cd',
            borderRadius: 8,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#ffc107',
          }}
        >
          <Text style={{ fontSize: 12, color: '#856404' }}>⚠️ {error}</Text>
        </View>
      )}

      <View style={{ gap: 12, marginBottom: 16 }}>
        <Pressable
          onPress={handleTestConnection}
          disabled={isLoading}
          style={({ pressed }) => ({
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            padding: 12,
            borderRadius: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {isLoading ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '600' }}>Testando...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
              🧪 Testar Conexão
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleTestAnalysis}
          disabled={isLoading}
          style={({ pressed }) => ({
            backgroundColor: isLoading ? '#6c757d' : '#28a745',
            padding: 12,
            borderRadius: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {isLoading ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '600' }}>Analisando...</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
              🔍 Testar Análise
            </Text>
          )}
        </Pressable>

        {!isOnline && (
          <Pressable
            onPress={retry}
            disabled={isLoading}
            style={({ pressed }) => ({
              backgroundColor: isLoading ? '#6c757d' : '#ffc107',
              padding: 12,
              borderRadius: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: '#000', textAlign: 'center', fontWeight: '600' }}>
              🔄 Reconectar
            </Text>
          </Pressable>
        )}
      </View>

      {testResult && (
        <View
          style={{
            padding: 12,
            backgroundColor: colors.surface || '#f5f5f5',
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary || '#007bff',
          }}
        >
          <Text style={{ fontSize: 12, color: colors.text, fontFamily: 'monospace' }}>
            {testResult}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
