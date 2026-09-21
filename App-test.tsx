import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🍃 Levia App</Text>
      <Text style={styles.subtitle}>Testando compilação...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6FA58E',
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FBF8F3',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#FBF8F3',
    opacity: 0.8,
  },
});
