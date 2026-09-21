const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [
  ...config.resolver.assetExts.filter(ext => ext !== 'svg'),
  'svg',
];

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'svg',
];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

module.exports = config;
