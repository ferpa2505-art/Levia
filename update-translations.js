const fs = require('fs');
const path = require('path');

const translations = {
  'pt-PT': {
    'home.reconhecerComida': '📷 Reconhecer Alimento',
    'home.reconhecerComidaDesc': 'Use câmara para adicionar refeição',
    'camera.titulo': 'Capturar Alimento',
    'camera.instrucao': 'Aponte para o alimento e tire uma foto',
    'camera.retomar': 'Retomar',
    'camera.analisar': 'Analisar',
    'camera.permissao': 'Preciso de acesso à câmara para reconhecer alimentos',
    'camera.erro': 'Falha ao capturar foto',
    'resultado.titulo': 'Análise Nutricional',
    'resultado.calorias': 'Calorias',
    'resultado.carboidratos': 'Hidratos de Carbono',
    'resultado.proteina': 'Proteína',
    'resultado.gordura': 'Gordura',
    'resultado.fibra': 'Fibra',
    'resultado.quantidade': 'Quantidade',
    'resultado.adicionar': 'Adicionar ao Diário',
    'resultado.sucesso': 'Sucesso!',
    'resultado.adicionado': '{nome} adicionado ao Diário',
    'resultado.erro': 'Falha ao adicionar ao diário',
    'resultado.alerta': 'Monitore esse alimento — tem alto índice glicêmico',
    'resultado.total': 'Total: {kcal} kcal',
  },
  'es': {
    'home.reconhecerComida': '📷 Reconocer Alimento',
    'home.reconhecerComidaDesc': 'Usa la cámara para añadir comida',
    'camera.titulo': 'Capturar Alimento',
    'camera.instrucao': 'Apunta a la comida y toma una foto',
    'camera.retomar': 'Retomar',
    'camera.analisar': 'Analizar',
    'camera.permissao': 'Necesito acceso a la cámara para reconocer alimentos',
    'camera.erro': 'Error al capturar foto',
    'resultado.titulo': 'Análisis Nutricional',
    'resultado.calorias': 'Calorías',
    'resultado.carboidratos': 'Carbohidratos',
    'resultado.proteina': 'Proteína',
    'resultado.gordura': 'Grasa',
    'resultado.fibra': 'Fibra',
    'resultado.quantidade': 'Cantidad',
    'resultado.adicionar': 'Añadir al Diario',
    'resultado.sucesso': '¡Éxito!',
    'resultado.adicionado': '{nome} añadido al Diario',
    'resultado.erro': 'Error al añadir al diario',
    'resultado.alerta': 'Monitorea este alimento — tiene índice glucémico alto',
    'resultado.total': 'Total: {kcal} kcal',
  },
  'fr': {
    'home.reconhecerComida': '📷 Reconnaître Aliment',
    'home.reconhecerComidaDesc': 'Utilisez la caméra pour ajouter un repas',
    'camera.titulo': 'Capturer Aliment',
    'camera.instrucao': 'Pointez vers l\'aliment et prenez une photo',
    'camera.retomar': 'Reprendre',
    'camera.analisar': 'Analyser',
    'camera.permissao': 'J\'ai besoin d\'accès à la caméra pour reconnaître les aliments',
    'camera.erro': 'Échec de la capture de photo',
    'resultado.titulo': 'Analyse Nutritionnelle',
    'resultado.calorias': 'Calories',
    'resultado.carboidratos': 'Glucides',
    'resultado.proteina': 'Protéine',
    'resultado.gordura': 'Graisse',
    'resultado.fibra': 'Fibre',
    'resultado.quantidade': 'Quantité',
    'resultado.adicionar': 'Ajouter au Journal',
    'resultado.sucesso': 'Succès!',
    'resultado.adicionado': '{nome} ajouté au Journal',
    'resultado.erro': 'Échec de l\'ajout au journal',
    'resultado.alerta': 'Surveillez cet aliment — il a un indice glycémique élevé',
    'resultado.total': 'Total: {kcal} kcal',
  },
  'de': {
    'home.reconhecerComida': '📷 Essen erkennen',
    'home.reconhecerComidaDesc': 'Verwenden Sie die Kamera, um eine Mahlzeit hinzuzufügen',
    'camera.titulo': 'Essen erfassen',
    'camera.instrucao': 'Zeige auf das Essen und mache ein Foto',
    'camera.retomar': 'Erneut versuchen',
    'camera.analisar': 'Analysieren',
    'camera.permissao': 'Ich benötige Kamerazugriff, um Lebensmittel zu erkennen',
    'camera.erro': 'Fehler beim Erfassen des Fotos',
    'resultado.titulo': 'Nährwertanalyse',
    'resultado.calorias': 'Kalorien',
    'resultado.carboidratos': 'Kohlenhydrate',
    'resultado.proteina': 'Protein',
    'resultado.gordura': 'Fett',
    'resultado.fibra': 'Faser',
    'resultado.quantidade': 'Menge',
    'resultado.adicionar': 'Zum Tagebuch hinzufügen',
    'resultado.sucesso': 'Erfolg!',
    'resultado.adicionado': '{nome} zum Tagebuch hinzugefügt',
    'resultado.erro': 'Fehler beim Hinzufügen zum Tagebuch',
    'resultado.alerta': 'Achten Sie auf dieses Lebensmittel — es hat einen hohen glykämischen Index',
    'resultado.total': 'Gesamt: {kcal} kcal',
  },
  'it': {
    'home.reconhecerComida': '📷 Riconosci Cibo',
    'home.reconhecerComidaDesc': 'Usa la fotocamera per aggiungere un pasto',
    'camera.titulo': 'Cattura Cibo',
    'camera.instrucao': 'Punta al cibo e scatta una foto',
    'camera.retomar': 'Ritentare',
    'camera.analisar': 'Analizzare',
    'camera.permissao': 'Ho bisogno dell\'accesso alla fotocamera per riconoscere il cibo',
    'camera.erro': 'Errore durante l\'acquisizione della foto',
    'resultado.titulo': 'Analisi Nutrizionale',
    'resultado.calorias': 'Calorie',
    'resultado.carboidratos': 'Carboidrati',
    'resultado.proteina': 'Proteine',
    'resultado.gordura': 'Grassi',
    'resultado.fibra': 'Fibra',
    'resultado.quantidade': 'Quantità',
    'resultado.adicionar': 'Aggiungi al Diario',
    'resultado.sucesso': 'Successo!',
    'resultado.adicionado': '{nome} aggiunto al Diario',
    'resultado.erro': 'Errore nell\'aggiunta al diario',
    'resultado.alerta': 'Monitora questo cibo — ha un alto indice glicemico',
    'resultado.total': 'Totale: {kcal} kcal',
  },
};

const traducaoDir = path.join(__dirname, 'src/i18n/traducoes');

for (const [lang, transObj] of Object.entries(translations)) {
  const filePath = path.join(traducaoDir, `${lang}.ts`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Build the new translation lines
    const newLines = Object.entries(transObj).map(([key, value]) => {
      const escapedValue = value.replace(/"/g, '\\"');
      return `  "${key}": "${escapedValue}",`;
    }).join('\n');
    
    // Find and replace before the closing };
    content = content.replace(/  "notif\.corpo": "[^"]*",\n}/, `  "notif.corpo": "${content.match(/"notif\.corpo": "([^"]*)"/)?.[1] || 'notif.corpo'}",\n${newLines}\n}`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${lang}`);
  } catch (err) {
    console.log(`❌ ${lang}: ${err.message}`);
  }
}

console.log('\n✓ Todas as traduções foram atualizadas!');
