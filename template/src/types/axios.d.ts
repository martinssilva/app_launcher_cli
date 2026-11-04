import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    /**
     * Skip the `Authorization` header and the refresh-token flow.
     * Use it for public endpoints such as login, sign-up and refresh.
     */
    skipAuth?: boolean;
    /** Internal flag: the request was already replayed after a 401. */
    _retried?: boolean;
  }
}
