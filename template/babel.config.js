module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.js',
          '.json',
          '.svg',
        ],
        alias: {
          '@': './src',
        },
      },
    ],
    // `export * as ns from '...'` (used by zod v4) is not covered by the RN preset.
    '@babel/plugin-transform-export-namespace-from',
    // Inlines `process.env.APP_ENV` at build time (see src/config/env.ts).
    ['transform-inline-environment-variables', { include: ['APP_ENV'] }],
    // Must be listed last.
    'react-native-worklets/plugin',
  ],
};
