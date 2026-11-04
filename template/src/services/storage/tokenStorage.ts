import { authStorage } from './storage';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Async contract on purpose: swapping MMKV for `react-native-keychain`
 * (recommended for production apps) only requires changing this file.
 */
export interface TokenStorage {
  getTokens(): Promise<AuthTokens | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clearTokens(): Promise<void>;
}

const TOKENS_KEY = 'auth.tokens';

function isAuthTokens(value: unknown): value is AuthTokens {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as AuthTokens).accessToken === 'string' &&
    typeof (value as AuthTokens).refreshToken === 'string'
  );
}

export const tokenStorage: TokenStorage = {
  async getTokens() {
    const raw = authStorage.getString(TOKENS_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return isAuthTokens(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  async setTokens(tokens) {
    authStorage.set(TOKENS_KEY, JSON.stringify(tokens));
  },
  async clearTokens() {
    authStorage.remove(TOKENS_KEY);
  },
};
