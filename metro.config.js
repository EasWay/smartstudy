const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Production optimizations
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable tree shaking
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Web-specific optimizations
config.resolver.alias = {
  'react-native$': 'react-native-web',
  'react-native-vector-icons': '@expo/vector-icons',
};

// Optimize bundle size
config.transformer.enableBabelRCLookup = false;

// Web performance optimizations
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Enable source maps for debugging
config.transformer.enableBabelRCLookup = false;

module.exports = config;