const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Otimizações para evitar hang no Windows
config.maxWorkers = 1;

// Aumentar timeout para transpilação
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

module.exports = config;
