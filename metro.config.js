const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-safe-area-context': path.resolve(
    __dirname,
    'src/shims/react-native-safe-area-context'
  ),
};

config.transformer.babelTransformerPath = require.resolve(
  'react-native-svg-transformer/expo'
);

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg'
);
config.resolver.sourceExts.push('svg');

module.exports = config;
