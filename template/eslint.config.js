const reactNativeConfig = require('@react-native/eslint-config/flat');

module.exports = [
  {
    ignores: [
      'node_modules/',
      'android/',
      'ios/',
      'vendor/',
      'coverage/',
      '.bundle/',
    ],
  },
  ...reactNativeConfig,
  {
    files: ['jest/**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    rules: {
      'no-console': 'warn',
      'react/react-in-jsx-scope': 'off',
    },
  },
];
