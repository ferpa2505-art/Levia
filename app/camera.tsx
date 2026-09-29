import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'Preciso de acesso à câmera para reconhecer alimentos',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo.uri) {
        setPhotoPreview(photo.uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao capturar foto');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeFoodImage = async () => {
    if (!photoPreview) return;

    try {
      setIsLoading(true);
      // Navegar para resultado com a foto
      router.push({
        pathname: '/food-result',
        params: { photoUri: photoPreview },
      });
    } catch (error) {
      Alert.alert('Erro', 'Falha ao analisar imagem');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const retakePicture = () => {
    setPhotoPreview(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Sem permissão de câmera</Text>
      </View>
    );
  }

  if (photoPreview) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: photoPreview }}
          style={styles.previewImage}
        />
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={retakePicture}
            disabled={isLoading}
          >
            <Ionicons name="refresh" size={24} color="#0066CC" />
            <Text style={styles.buttonText}>Retomar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={analyzeFoodImage}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={24} color="white" />
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  Analisar
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <View style={styles.focusBox} />
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.instructionText}>
            Aponte para o alimento e tire uma foto
          </Text>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={isLoading}
          >
            <View style={styles.innerCircle} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusBox: {
    width: 280,
    height: 280,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0066CC',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#0066CC',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
});
