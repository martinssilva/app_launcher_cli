/* eslint-disable no-console */
import { env } from '@/config';

type LogArgs = unknown[];

/**
 * Thin console wrapper so logs can be silenced per environment or forwarded
 * to a crash reporter (Sentry, Crashlytics...) in a single place.
 */
export const logger = {
  debug: (...args: LogArgs) => {
    if (env.enableLogs) {
      console.debug(...args);
    }
  },
  info: (...args: LogArgs) => {
    if (env.enableLogs) {
      console.info(...args);
    }
  },
  warn: (...args: LogArgs) => {
    if (env.enableLogs) {
      console.warn(...args);
    }
  },
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};
