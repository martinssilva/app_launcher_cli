import {
  AxiosError,
  CanceledError,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  ApiError,
  codeFromStatus,
  isApiErrorData,
  toApiError,
} from '../errors';

const config = { headers: {} } as InternalAxiosRequestConfig;

function httpError(status: number, data: unknown) {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    config,
    undefined,
    {
      status,
      statusText: String(status),
      headers: {},
      config,
      data,
    },
  );
}

describe('toApiError', () => {
  it('maps HTTP errors and keeps the server message and details', () => {
    const error = toApiError(
      httpError(422, {
        message: 'Invalid name',
        errors: { name: ['required'] },
      }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.toJSON()).toEqual({
      status: 422,
      code: 'VALIDATION',
      message: 'Invalid name',
      details: { name: ['required'] },
    });
  });

  it('falls back to the axios message when the server sends none', () => {
    expect(toApiError(httpError(500, '<html>')).toJSON()).toEqual({
      status: 500,
      code: 'SERVER',
      message: 'Request failed',
    });
  });

  it('detects network errors and timeouts', () => {
    expect(
      toApiError(new AxiosError('Network Error', 'ERR_NETWORK')).code,
    ).toBe('NETWORK');
    expect(
      toApiError(new AxiosError('timeout', AxiosError.ECONNABORTED)).code,
    ).toBe('TIMEOUT');
  });

  it('detects cancellations', () => {
    expect(toApiError(new CanceledError()).code).toBe('CANCELLED');
  });

  it('wraps unknown errors', () => {
    expect(toApiError(new Error('boom')).toJSON()).toEqual({
      status: null,
      code: 'UNKNOWN',
      message: 'boom',
    });
    expect(toApiError('weird').message).toBe('Unexpected error');
  });

  it('returns ApiError instances untouched', () => {
    const error = new ApiError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'x',
    });
    expect(toApiError(error)).toBe(error);
  });
});

describe('codeFromStatus', () => {
  it.each([
    [400, 'BAD_REQUEST'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [418, 'BAD_REQUEST'],
    [429, 'RATE_LIMITED'],
    [503, 'SERVER'],
  ])('%i -> %s', (status, code) => {
    expect(codeFromStatus(status)).toBe(code);
  });
});

describe('isApiErrorData', () => {
  it('recognizes serialized errors', () => {
    expect(
      isApiErrorData({ status: null, code: 'NETWORK', message: 'x' }),
    ).toBe(true);
    expect(isApiErrorData({ code: 'NOPE', message: 'x' })).toBe(false);
    expect(isApiErrorData(undefined)).toBe(false);
  });
});
