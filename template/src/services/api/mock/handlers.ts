import {
  findSession,
  issueTokens,
  MOCK_RESET_CODE,
  MOCK_TAKEN_EMAIL,
  mockDb,
  type MockUser,
} from './db';
import { financeMockRoutes } from './finance/routes';

export interface MockRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
  authorization: string | undefined;
}

export interface MockResponse {
  status: number;
  data?: unknown;
}

export interface MockRoute {
  method: string;
  path: string;
  handler: (request: MockRequest) => MockResponse;
}

const unauthorized: MockResponse = {
  status: 401,
  data: { message: 'Unauthorized' },
};

function readString(body: unknown, field: string): string {
  if (typeof body === 'object' && body !== null) {
    const value = (body as Record<string, unknown>)[field];
    return typeof value === 'string' ? value : '';
  }
  return '';
}

function currentUser(request: MockRequest): MockUser | undefined {
  const token = request.authorization?.replace(/^Bearer\s+/i, '');
  return token ? findSession(token)?.user : undefined;
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'user';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export const mockRoutes: MockRoute[] = [
  {
    method: 'POST',
    path: '/auth/login',
    handler: ({ body }) => {
      const email = readString(body, 'email').trim().toLowerCase();
      const password = readString(body, 'password');
      // Any e-mail + password with 6+ characters signs in.
      // `wrong-password` simulates invalid credentials.
      if (
        !email.includes('@') ||
        password.length < 6 ||
        password === 'wrong-password'
      ) {
        return { status: 401, data: { message: 'Invalid credentials' } };
      }
      const user: MockUser = mockDb.users.get(email) ?? {
        id: '1',
        name: nameFromEmail(email),
        email,
      };
      return { status: 200, data: { user, tokens: issueTokens(user) } };
    },
  },
  {
    method: 'POST',
    path: '/auth/register',
    handler: ({ body }) => {
      const name = readString(body, 'name').trim();
      const email = readString(body, 'email').trim().toLowerCase();
      const password = readString(body, 'password');
      if (!name || !email.includes('@') || password.length < 6) {
        return { status: 422, data: { message: 'Invalid data' } };
      }
      if (email === MOCK_TAKEN_EMAIL || mockDb.users.has(email)) {
        return { status: 409, data: { message: 'E-mail already registered' } };
      }
      const user: MockUser = { id: String(mockDb.users.size + 2), name, email };
      mockDb.users.set(email, user);
      return { status: 201, data: { user, tokens: issueTokens(user) } };
    },
  },
  {
    method: 'POST',
    path: '/auth/forgot-password',
    // Always succeeds, so the API does not reveal which e-mails exist.
    handler: () => ({ status: 204 }),
  },
  {
    method: 'POST',
    path: '/auth/reset-password',
    handler: ({ body }) => {
      if (readString(body, 'code').trim() !== MOCK_RESET_CODE) {
        return { status: 400, data: { message: 'Invalid or expired code' } };
      }
      if (readString(body, 'password').length < 6) {
        return { status: 422, data: { message: 'Invalid password' } };
      }
      return { status: 204 };
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: ({ body }) => {
      const refreshToken = readString(body, 'refreshToken');
      const user = mockDb.refreshTokens.get(refreshToken);
      if (!user) {
        return { status: 401, data: { message: 'Invalid refresh token' } };
      }
      mockDb.refreshTokens.delete(refreshToken);
      return { status: 200, data: issueTokens(user) };
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    handler: () => ({ status: 204 }),
  },
  {
    method: 'GET',
    path: '/me',
    handler: request => {
      const user = currentUser(request);
      return user ? { status: 200, data: user } : unauthorized;
    },
  },
  {
    method: 'GET',
    path: '/items',
    handler: request => {
      if (!currentUser(request)) {
        return unauthorized;
      }
      const page = Math.max(1, Number(request.query.page ?? 1) || 1);
      const limit = Math.max(1, Number(request.query.limit ?? 20) || 20);
      const start = (page - 1) * limit;
      const data = mockDb.items.slice(start, start + limit);
      return {
        status: 200,
        data: {
          data,
          page,
          limit,
          total: mockDb.items.length,
          hasMore: start + limit < mockDb.items.length,
        },
      };
    },
  },
  {
    method: 'GET',
    path: '/items/:id',
    handler: request => {
      if (!currentUser(request)) {
        return unauthorized;
      }
      const item = mockDb.items.find(({ id }) => id === request.params.id);
      return item
        ? { status: 200, data: item }
        : { status: 404, data: { message: 'Item not found' } };
    },
  },
  ...financeMockRoutes,
];

function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const expected = patternParts[i] as string;
    const actual = pathParts[i] as string;
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

export function findMockRoute(method: string, path: string) {
  for (const route of mockRoutes) {
    if (route.method !== method) {
      continue;
    }
    const params = matchPath(route.path, path);
    if (params) {
      return { route, params };
    }
  }
  return null;
}
