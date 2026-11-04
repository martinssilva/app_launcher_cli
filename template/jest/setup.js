// Native modules that have no JS implementation in Jest.
jest.mock('react-native-localize', () => require('react-native-localize/mock'));

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockReturnValue(false),
  useHideAnimation: jest.fn().mockReturnValue({
    container: {},
    logo: { source: 0 },
    brand: { source: 0 },
  }),
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// react-native-mmkv v4 ships an in-memory implementation when JEST_WORKER_ID is set.

// react-native-mmkv v4 uses an in-memory instance under Jest, but still imports
// Nitro at module load; the native Nitro module does not exist in Jest.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => {
      throw new Error('NitroModules are not available in Jest');
    }),
  },
}));

// Reanimated 4 runs on top of react-native-worklets, which needs a native
// runtime. Worklets ships a Jest mock; Reanimated itself runs for real.
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);

// Office: the document picker is a TurboModule (no native side in Jest).
jest.mock('@react-native-documents/picker', () => {
  const errorCodes = {
    OPERATION_CANCELED: 'OPERATION_CANCELED',
    IN_PROGRESS: 'ASYNC_OP_IN_PROGRESS',
    UNABLE_TO_OPEN_FILE_TYPE: 'UNABLE_TO_OPEN_FILE_TYPE',
    NULL_PRESENTER: 'NULL_PRESENTER',
  };
  return {
    pick: jest.fn().mockResolvedValue([
      {
        uri: 'file:///mock/report.pdf',
        name: 'report.pdf',
        type: 'application/pdf',
        size: 1234,
      },
    ]),
    keepLocalCopy: jest.fn(),
    types: { allFiles: '*/*', pdf: 'application/pdf', images: 'image/*' },
    errorCodes,
    isErrorWithCode: error =>
      typeof error === 'object' && error !== null && 'code' in error,
  };
});

// Use React Native's FormData (file parts with `uri`) instead of Node's.
// eslint-disable-next-line @react-native/no-deep-imports
global.FormData = require('react-native/Libraries/Network/FormData').default;
