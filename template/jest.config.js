module.exports = {
  preset: '@react-native/jest-preset',
  resolver: '<rootDir>/jest/resolver.js',
  setupFiles: [
    './node_modules/react-native-gesture-handler/jestSetup.js',
    './jest/setup.js',
  ],
  setupFilesAfterEnv: ['./jest/setupAfterEnv.ts'],
  transform: {
    // d3 packages (used by react-native-wagmi-charts) only ship ESM `.mjs` files.
    '^.+\\.mjs$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/jest/svgMock.tsx',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*|nitro-core|react-redux|@reduxjs/toolkit|redux|redux-thunk|reselect|immer|d3-.*|internmap)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
