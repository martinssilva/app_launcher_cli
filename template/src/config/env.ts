/**
 * Runtime configuration per environment.
 *
 * The active environment comes from `APP_ENV`, inlined at build time by
 * `babel-plugin-transform-inline-environment-variables`:
 *
 *   APP_ENV=staging npm start -- --reset-cache        # or: npm run start:staging
 *   APP_ENV=staging ./gradlew assembleRelease         # inside android/
 *
 * When `APP_ENV` is not set, debug builds use `development` and release builds
 * use `production`.
 *
 * Never put secrets here: everything in the JS bundle can be extracted.
 */
export const APP_ENVS = ['development', 'staging', 'production'] as const;

export type AppEnv = (typeof APP_ENVS)[number];

export interface EnvConfig {
  /** Environment name. */
  name: AppEnv;
  /** Base URL used by the axios instance. */
  apiUrl: string;
  /** Request timeout in milliseconds. */
  apiTimeoutMs: number;
  /** Serve requests from the in-app mock API (src/services/api/mock). */
  useMockApi: boolean;
  /** Log requests/errors to the console. */
  enableLogs: boolean;
}

const ENVIRONMENTS: Record<AppEnv, EnvConfig> = {
  development: {
    name: 'development',
    apiUrl: 'https://api.dev.example.com',
    apiTimeoutMs: 15_000,
    useMockApi: true,
    enableLogs: true,
  },
  staging: {
    name: 'staging',
    apiUrl: 'https://api.staging.example.com',
    apiTimeoutMs: 15_000,
    useMockApi: false,
    enableLogs: true,
  },
  production: {
    name: 'production',
    apiUrl: 'https://api.example.com',
    apiTimeoutMs: 15_000,
    useMockApi: false,
    enableLogs: false,
  },
};

export function isAppEnv(value: unknown): value is AppEnv {
  return typeof value === 'string' && APP_ENVS.includes(value as AppEnv);
}

export function resolveAppEnv(raw: string | undefined, isDev: boolean): AppEnv {
  if (isAppEnv(raw)) {
    return raw;
  }
  return isDev ? 'development' : 'production';
}

export function getEnvConfig(appEnv: AppEnv): EnvConfig {
  return ENVIRONMENTS[appEnv];
}

// `process` is not part of the React Native type environment; Babel replaces
// this expression with a string literal (or `undefined`) at build time.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const RAW_APP_ENV: string | undefined = process.env.APP_ENV;

export const env: EnvConfig = getEnvConfig(resolveAppEnv(RAW_APP_ENV, __DEV__));
