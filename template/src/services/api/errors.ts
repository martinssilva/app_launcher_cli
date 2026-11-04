import axios, { AxiosError } from 'axios';

export const API_ERROR_CODES = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION',
  'RATE_LIMITED',
  'SERVER',
  'NETWORK',
  'TIMEOUT',
  'CANCELLED',
  'UNKNOWN',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/**
 * Serializable error shape shared by the whole app.
 * RTK Query stores it as `error` on queries/mutations.
 */
export interface ApiErrorData {
  /** HTTP status, or `null` when no response was received. */
  status: number | null;
  code: ApiErrorCode;
  message: string;
  /** Extra payload sent by the server (e.g. field validation errors). */
  details?: unknown;
}

/** Error thrown by `apiClient` (always normalized by the response interceptor). */
export class ApiError extends Error implements ApiErrorData {
  readonly status: number | null;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(data: ApiErrorData, options?: { cause?: unknown }) {
    super(data.message, options);
    this.name = 'ApiError';
    this.status = data.status;
    this.code = data.code;
    this.details = data.details;
  }

  toJSON(): ApiErrorData {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      ...(this.details === undefined ? {} : { details: this.details }),
    };
  }
}

export function codeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION';
    case 429:
      return 'RATE_LIMITED';
    default:
      if (status >= 500) {
        return 'SERVER';
      }
      return status >= 400 ? 'BAD_REQUEST' : 'UNKNOWN';
  }
}

function readServerField(data: unknown, field: string): unknown {
  if (typeof data === 'object' && data !== null && field in data) {
    return (data as Record<string, unknown>)[field];
  }
  return undefined;
}

function extractServerMessage(data: unknown): string | undefined {
  for (const field of ['message', 'error', 'detail']) {
    const value = readServerField(data, field);
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

/** Converts anything thrown by axios (or by our own code) into an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new ApiError(
      { status: null, code: 'CANCELLED', message: 'Request cancelled' },
      { cause: error },
    );
  }

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const { status, data } = error.response;
      const details = readServerField(data, 'errors');
      return new ApiError(
        {
          status,
          code: codeFromStatus(status),
          message: extractServerMessage(data) ?? error.message,
          ...(details === undefined ? {} : { details }),
        },
        { cause: error },
      );
    }

    const isTimeout =
      error.code === AxiosError.ECONNABORTED ||
      error.code === AxiosError.ETIMEDOUT;
    return new ApiError(
      {
        status: null,
        code: isTimeout ? 'TIMEOUT' : 'NETWORK',
        message: error.message,
      },
      { cause: error },
    );
  }

  return new ApiError(
    {
      status: null,
      code: 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Unexpected error',
    },
    { cause: error },
  );
}

export function isApiErrorData(value: unknown): value is ApiErrorData {
  return (
    typeof value === 'object' &&
    value !== null &&
    API_ERROR_CODES.includes((value as ApiErrorData).code) &&
    typeof (value as ApiErrorData).message === 'string'
  );
}
