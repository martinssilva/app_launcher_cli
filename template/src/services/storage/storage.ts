import { createMMKV } from 'react-native-mmkv';

/**
 * General purpose key/value storage (Redux persistence, preferences, cache).
 * MMKV is synchronous and much faster than AsyncStorage.
 */
export const appStorage = createMMKV({ id: 'app-storage' });

/**
 * Isolated instance for session data (tokens).
 * See ./tokenStorage.ts for how to move tokens to the Keychain/Keystore.
 */
export const authStorage = createMMKV({ id: 'auth-storage' });

export function clearAllStorage(): void {
  appStorage.clearAll();
  authStorage.clearAll();
}
