module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@core': './src/core',
          '@components': './src/core/components',
          '@modules': './src/modules',
          '@services': './src/services',
          '@utils': './src/core/utils',
          '@theme': './src/core/theme',
          '@assets': './src/assets',
          '@navigation': './src/navigation',
          '@selling': './src/modules/selling',
          '@sellingComponents': './src/modules/selling/components',
          '@sellingServices': './src/modules/selling/services',
          '@sellingScreens': './src/modules/selling/screens',
          '@authServices': './src/modules/auth/services',
          '@auth': './src/modules/auth',
          '@dashboard': './src/modules/dashboard',
          '@stock': './src/modules/stock',
          '@user': './src/modules/user',
          '@accounting': './src/modules/accounting'

        },
        extensions: [
          '.ios.js',
          '.android.js',
          '.js',
          '.jsx',
          '.json',
          '.tsx',
          '.ts',
          '.native.js',
        ],
      },
    ],
    '@babel/plugin-transform-export-namespace-from',
    'react-native-reanimated/plugin',
  ],
};
