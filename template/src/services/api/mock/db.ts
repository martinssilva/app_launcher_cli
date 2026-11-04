/**
 * In-memory "database" for the mock API. Data resets on every app reload.
 */
export interface MockUser {
  id: string;
  name: string;
  email: string;
}

export interface MockItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface Session {
  user: MockUser;
  expiresAt: number;
}

export const mockApiConfig = {
  /** Simulated network latency. Set to 0 in tests (see jest/setup.js). */
  delayMs: 400,
  /** Access token lifetime; short enough to see the refresh flow in action. */
  accessTokenTtlMs: 5 * 60 * 1000,
};

function seedItems(): MockItem[] {
  return Array.from({ length: 20 }, (_, index) => {
    const n = index + 1;
    return {
      id: String(n),
      title: `Item ${n}`,
      description: `Example item #${n} served by the mock API. Replace it with your own domain data.`,
      createdAt: new Date(Date.UTC(2026, 0, n)).toISOString(),
    };
  });
}

let tokenCounter = 0;

export const mockDb = {
  items: seedItems(),
  accessTokens: new Map<string, Session>(),
  refreshTokens: new Map<string, MockUser>(),
};

export function issueTokens(user: MockUser) {
  tokenCounter += 1;
  const accessToken = `mock-access-${tokenCounter}`;
  const refreshToken = `mock-refresh-${tokenCounter}`;
  mockDb.accessTokens.set(accessToken, {
    user,
    expiresAt: Date.now() + mockApiConfig.accessTokenTtlMs,
  });
  mockDb.refreshTokens.set(refreshToken, user);
  return { accessToken, refreshToken };
}

export function findSession(accessToken: string): Session | undefined {
  const session = mockDb.accessTokens.get(accessToken);
  if (!session || session.expiresAt < Date.now()) {
    return undefined;
  }
  return session;
}

export function resetMockApi(): void {
  tokenCounter = 0;
  mockDb.items = seedItems();
  mockDb.accessTokens.clear();
  mockDb.refreshTokens.clear();
}
