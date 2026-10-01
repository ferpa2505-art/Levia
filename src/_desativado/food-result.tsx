import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiabetes } from '@context/DiabetesContext';
import { useProfile } from '@context/ProfileContext';
import { analyzeImageWithGoogleVision, FoodNutritionData } from '@services/googleVisionService';

type FoodAnalysis = FoodNutritionData;

export default function FoodResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const diabetesContext = useDiabetes();
  const profileContext = useProfile();

  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  // Analisa imagem usando Google Vision API (com fallback para mock)
  useEffect(() => {
    const analyzeImage = async () => {
      try {
        setIsLoading(true);
        
        // Usar Google Vision API para análise real
        const detectedFood = await analyzeImageWithGoogleVision(photoUri);
        setAnalysis(detectedFood);
      } catch (error) {
        console.error('Erro ao analisar imagem:', error);
        // Fallback já implementado no serviço
      } finally {
        setIsLoading(false);
      }
    };

    if (photoUri) {
      analyzeImage();
    }
  }, [photoUri]);

  const handleAddToDiary = async () => {
    if (!analysis) return;

    try {
      setIsSaving(true);

      // Calcular macros baseado na quantidade
      const multiplier = parseInt(quantity) || 1;
      const foodEntry = {
        id: `${Date.now()}`,
        nome: analysis.nome,
        porcao: `${quantity}x ${analysis.porcao}`,
        calorias: Math.round(analysis.calorias * multiplier),
        carboidratos: Math.round(analysis.carboidratos * multiplier),
        proteina: Math.round(analysis.proteina * multiplier),
        gordura: Math.round(analysis.gordura * multiplier),
        fibra: Math.round(analysis.fibra * multiplier),
        timestamp: new Date().toISOString(),
        foto: photoUri,
      };

      // Adicionar ao contexto do Diário
      if (diabetesContext) {
        await diabetesContext.adicionarRefeicao(
          analysis.nome,
          analysis.carboidratos,
          `${quantity}x ${analysis.porcao}`,
          `Foto: ${photoUri}`
        );
      }

      Alert.alert(
        'Sucesso!',
        `${analysis.nome} adicionado ao Diário`,
        [
          {
            text: 'Voltar',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao adicionar ao diário');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#0066CC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Análise Nutricional</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Imagem da comida */}
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.foodImage} />
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Analisando imagem...</Text>
          </View>
        ) : analysis ? (
          <>
            {/* Nome e Confiança */}
            <View style={styles.infoSection}>
              <View style={styles.titleRow}>
                <Text style={styles.foodName}>{analysis.nome}</Text>
                <View
                  style={[
                    styles.confidenceBadge,
                    {
                      backgroundColor:
                        (analysis.confianca ?? 0.75) > 0.8
                          ? '#4CAF50'
                          : (analysis.confianca ?? 0.75) > 0.6
                          ? '#FFC107'
                          : '#FF9800',
                    },
                  ]}
                >
                  <Text style={styles.confidenceText}>
                    {Math.round((analysis.confianca ?? 0.75) * 100)}%
                  </Text>
                </View>
              </View>

              <Text style={styles.porcionText}>{analysis.porcao}</Text>
            </View>

            {/* Informações Nutricionais */}
            <View style={styles.nutritionGrid}>
              <NutritionCard
                label="Calorias"
                value={Math.round(analysis.calorias)}
                unit="kcal"
                icon="flame"
                color="#FF6B6B"
              />
              <NutritionCard
                label="Carboidratos"
                value={Math.round(analysis.carboidratos)}
                unit="g"
                icon="nutrition"
                color="#4ECDC4"
              />
              <NutritionCard
                label="Proteína"
                value={Math.round(analysis.proteina)}
                unit="g"
                icon="barbell"
                color="#95E1D3"
              />
              <NutritionCard
                label="Gordura"
                value={Math.round(analysis.gordura)}
                unit="g"
                icon="water"
                color="#FFD93D"
              />
              <NutritionCard
                label="Fibra"
                value={Math.round(analysis.fibra)}
                unit="g"
                icon="leaf"
                color="#6BCB77"
              />
            </View>

            {/* Ajuste de Quantidade */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantidade</Text>
              <View style={styles.quantityInput}>
                <TouchableOpacity
                  onPress={() =>
                    setQuantity(Math.max(1, parseInt(quantity) - 1).toString())
                  }
                  style={styles.quantityButton}
                >
                  <Ionicons name="remove" size={20} color="#0066CC" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityTextInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  maxLength={3}
                />

                <TouchableOpacity
                  onPress={() =>
                    setQuantity((parseInt(quantity) + 1).toString())
                  }
                  style={styles.quantityButton}
                >
                  <Ionicons name="add" size={20} color="#0066CC" />
                </TouchableOpacity>
              </View>
              <Text style={styles.quantityHint}>
                Total: {Math.round(analysis.calorias * parseInt(quantity))} kcal
              </Text>
            </View>

            {/* Alerta para Diabetes */}
            {profileContext?.profile?.tipoDiabetes && (
              <View style={styles.diabetesAlert}>
                <Ionicons name="alert-circle" size={24} color="#FFC107" />
                <Text style={styles.diabetesAlertText}>
                  Monitore esse alimento — tem alto índice glicêmico
                </Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Botão de Ação */}
      {analysis && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, isSaving && styles.actionButtonDisabled]}
            onPress={handleAddToDiary}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.actionButtonText}>Adicionar ao Diário</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function NutritionCard({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  icon: string;
  color: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.cardValue}>
        {value}
        <Text style={styles.cardUnit}>{unit}</Text>
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  foodImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#E0E0E0',
  },
  loadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  porcionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666',
    marginLeft: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  quantitySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quantityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityTextInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quantityHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  diabetesAlert: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  diabetesAlertText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
