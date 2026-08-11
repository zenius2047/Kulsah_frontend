const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Skia 2.x uses extensionless folder-index imports in its React Native source.
// Metro's package-exports resolver can reject those imports (for example
// `./Path`) even though `Path/index.ts` exists in the package.
config.resolver.unstable_enablePackageExports = false;

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
