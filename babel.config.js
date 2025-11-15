module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: [
      // REQUIRED for react-native-reanimated - MUST BE LAST
      'react-native-reanimated/plugin',
    ],
  };
};
