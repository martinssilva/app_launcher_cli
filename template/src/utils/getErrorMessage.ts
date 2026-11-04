import type { TFunction } from 'i18next';

import { type ApiErrorCode, isApiErrorData } from '@/services/api/errors';

type ErrorKey =
  | 'errors.network'
  | 'errors.timeout'
  | 'errors.unauthorized'
  | 'errors.forbidden'
  | 'errors.notFound'
  | 'errors.validation'
  | 'errors.server'
  | 'errors.unknown';

const KEY_BY_CODE: Partial<Record<ApiErrorCode, ErrorKey>> = {
  NETWORK: 'errors.network',
  TIMEOUT: 'errors.timeout',
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  NOT_FOUND: 'errors.notFound',
  VALIDATION: 'errors.validation',
  BAD_REQUEST: 'errors.validation',
  SERVER: 'errors.server',
};

/**
 * Maps any error (ApiErrorData from RTK Query, ApiError, unknown) to a
 * user-facing, translated message.
 */
export function getErrorMessage(
  error: unknown,
  t: TFunction,
  overrides: Partial<Record<ApiErrorCode, string>> = {},
): string {
  if (isApiErrorData(error)) {
    const override = overrides[error.code];
    if (override) {
      return override;
    }
    return t(KEY_BY_CODE[error.code] ?? 'errors.unknown');
  }
  return t('errors.unknown');
}
