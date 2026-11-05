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

// Shopping: FlashList measures its items with native layout, which Jest does not
// have. Like `@shopify/flash-list/jestSetup.js`, but cells are the size of a
// product card in a two-column grid, so a page does not fit in the viewport
// (otherwise every page would be loaded at mount).
jest.mock('@shopify/flash-list/dist/recyclerview/utils/measureLayout', () => {
  const actual = jest.requireActual(
    '@shopify/flash-list/dist/recyclerview/utils/measureLayout',
  );
  const viewport = { x: 0, y: 0, width: 400, height: 800 };
  return {
    ...actual,
    measureParentSize: jest.fn(() => viewport),
    measureFirstChildLayout: jest.fn(() => viewport),
    measureItemLayout: jest.fn(() => ({ x: 0, y: 0, width: 200, height: 320 })),
  };
});
