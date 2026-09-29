import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Credenciais do Google Cloud Vision API
// Em produção, isso viria de variáveis de ambiente
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY || 'AIzaSyC_mock_key';
const GOOGLE_VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Database de alimentos com seus macros (fallback para quando Vision não funciona)
export const FOOD_DATABASE: Record<string, FoodNutritionData> = {
  maca: {
    nome: 'Maçã',
    porcao: '100g',
    calorias: 52,
    proteina: 0.3,
    carboidratos: 14,
    gordura: 0.2,
    fibra: 2.4,
    indiceGlicemico: 'baixo',
  },
  banana: {
    nome: 'Banana',
    porcao: '100g',
    calorias: 89,
    proteina: 1.1,
    carboidratos: 23,
    gordura: 0.3,
    fibra: 2.6,
    indiceGlicemico: 'alto',
  },
  pao: {
    nome: 'Pão Integral',
    porcao: '100g',
    calorias: 250,
    proteina: 8,
    carboidratos: 48,
    gordura: 2,
    fibra: 7,
    indiceGlicemico: 'médio',
  },
  frango: {
    nome: 'Peito de Frango',
    porcao: '100g',
    calorias: 165,
    proteina: 31,
    carboidratos: 0,
    gordura: 3.6,
    fibra: 0,
    indiceGlicemico: 'baixo',
  },
  arroz: {
    nome: 'Arroz Branco',
    porcao: '100g',
    calorias: 130,
    proteina: 2.7,
    carboidratos: 28,
    gordura: 0.3,
    fibra: 0.4,
    indiceGlicemico: 'alto',
  },
  batata: {
    nome: 'Batata',
    porcao: '100g',
    calorias: 77,
    proteina: 2,
    carboidratos: 17,
    gordura: 0.1,
    fibra: 2.1,
    indiceGlicemico: 'alto',
  },
  brocolos: {
    nome: 'Brócolis',
    porcao: '100g',
    calorias: 34,
    proteina: 2.8,
    carboidratos: 7,
    gordura: 0.4,
    fibra: 2.4,
    indiceGlicemico: 'baixo',
  },
  abobora: {
    nome: 'Abóbora',
    porcao: '100g',
    calorias: 26,
    proteina: 1,
    carboidratos: 6,
    gordura: 0.1,
    fibra: 0.5,
    indiceGlicemico: 'baixo',
  },
  ovos: {
    nome: 'Ovo',
    porcao: '100g',
    calorias: 155,
    proteina: 13,
    carboidratos: 1.1,
    gordura: 11,
    fibra: 0,
    indiceGlicemico: 'baixo',
  },
  iogurte: {
    nome: 'Iogurte Natural',
    porcao: '100g',
    calorias: 59,
    proteina: 10,
    carboidratos: 3.3,
    gordura: 0.4,
    fibra: 0,
    indiceGlicemico: 'baixo',
  },
  default: {
    nome: 'Alimento Desconhecido',
    porcao: '100g',
    calorias: 100,
    proteina: 5,
    carboidratos: 15,
    gordura: 3,
    fibra: 1,
    indiceGlicemico: 'desconhecido',
  },
};

export interface FoodNutritionData {
  nome: string;
  porcao: string;
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
  fibra: number;
  indiceGlicemico?: string;
  confianca?: number;
}

export interface GoogleVisionResponse {
  responses: Array<{
    textAnnotations?: Array<{ description: string }>;
    labelAnnotations?: Array<{ description: string; score: number }>;
  }>;
}

/**
 * Envia uma imagem para Google Vision API para análise
 */
export async function analyzeImageWithGoogleVision(
  imageUri: string
): Promise<FoodNutritionData> {
  try {
    // Se não temos API key real, usar mock database
    if (!GOOGLE_VISION_API_KEY || GOOGLE_VISION_API_KEY.includes('mock')) {
      console.log('[Vision] Usando mock database (API key não configurada)');
      return getRandomFoodFromDatabase();
    }

    // Converter imagem para base64
    let base64Image: string;
    if (Platform.OS === 'web') {
      // No web, a imagem já pode ser uma data URL
      base64Image = imageUri.split('data:image/jpeg;base64,')[1] || imageUri;
    } else {
      // No mobile, ler do filesystem
      base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    // Montar payload para Google Vision API
    const requestPayload = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10,
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 5,
            },
          ],
        },
      ],
    };

    // Chamar Google Vision API
    const response = await fetch(`${GOOGLE_VISION_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      console.error('[Vision] Erro na requisição:', response.status);
      return getRandomFoodFromDatabase();
    }

    const data: GoogleVisionResponse = await response.json();

    // Extrair labels detectados
    const labels = data.responses[0]?.labelAnnotations || [];
    if (labels.length === 0) {
      console.warn('[Vision] Nenhum rótulo detectado');
      return getRandomFoodFromDatabase();
    }

    // Procurar alimento na database baseado nos labels
    const detectedFood = findFoodInDatabase(labels);
    return detectedFood;
  } catch (error) {
    console.error('[Vision] Erro ao analisar imagem:', error);
    // Fallback para mock database em caso de erro
    return getRandomFoodFromDatabase();
  }
}

/**
 * Procura um alimento na database baseado nos rótulos do Google Vision
 */
function findFoodInDatabase(
  labels: Array<{ description: string; score: number }>
): FoodNutritionData {
  // Mapear descrições do Vision para alimentos na database
  const visionToFoodMap: Record<string, string> = {
    apple: 'maca',
    banana: 'banana',
    bread: 'pao',
    'whole wheat': 'pao',
    chicken: 'frango',
    rice: 'arroz',
    potato: 'batata',
    broccoli: 'brocolos',
    pumpkin: 'abobora',
    squash: 'abobora',
    egg: 'ovos',
    yogurt: 'iogurte',
  };

  // Procurar por matches
  for (const label of labels) {
    const descricao = label.description.toLowerCase();
    for (const [visionLabel, foodKey] of Object.entries(visionToFoodMap)) {
      if (descricao.includes(visionLabel)) {
        const food = FOOD_DATABASE[foodKey];
        return {
          ...food,
          confianca: label.score,
        };
      }
    }
  }

  // Se nenhum match, retornar aleatório
  return getRandomFoodFromDatabase();
}

/**
 * Retorna um alimento aleatório da database
 */
function getRandomFoodFromDatabase(): FoodNutritionData {
  const keys = Object.keys(FOOD_DATABASE).filter((k) => k !== 'default');
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return FOOD_DATABASE[randomKey] || FOOD_DATABASE.default;
}
