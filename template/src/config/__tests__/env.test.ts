import { getEnvConfig, isAppEnv, resolveAppEnv } from '../env';

describe('env', () => {
  it('uses APP_ENV when it is a known environment', () => {
    expect(resolveAppEnv('staging', true)).toBe('staging');
    expect(resolveAppEnv('production', true)).toBe('production');
  });

  it('falls back to development in debug and production in release', () => {
    expect(resolveAppEnv(undefined, true)).toBe('development');
    expect(resolveAppEnv(undefined, false)).toBe('production');
    expect(resolveAppEnv('qa', false)).toBe('production');
  });

  it('validates environment names', () => {
    expect(isAppEnv('development')).toBe(true);
    expect(isAppEnv('local')).toBe(false);
    expect(isAppEnv(undefined)).toBe(false);
  });

  it('never enables the mock API outside development', () => {
    expect(getEnvConfig('staging').useMockApi).toBe(false);
    expect(getEnvConfig('production').useMockApi).toBe(false);
  });
});
