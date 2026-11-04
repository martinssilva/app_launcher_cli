/**
 * Chains the Reanimated/Worklets resolver (picks web implementations in Jest)
 * with the React Native preset resolver (relaxes `react-native` exports).
 */
const reactNativeResolver = require('@react-native/jest-preset/jest/resolver');
const reanimatedResolver = require('react-native-reanimated/jest/resolver');

module.exports = (request, options) =>
  reanimatedResolver(request, {
    ...options,
    defaultResolver: (nextRequest, nextOptions) =>
      reactNativeResolver(nextRequest, {
        ...nextOptions,
        defaultResolver: options.defaultResolver,
      }),
  });
