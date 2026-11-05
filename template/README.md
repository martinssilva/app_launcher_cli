# HelloWorld

React Native CLI app generated from
[rn-app-launcher](https://github.com/martinssilva/app_launcher_cli).

TypeScript · Redux Toolkit + RTK Query · Axios · React Navigation ·
Reanimated · Gesture Handler · MMKV · i18next · Jest + Testing Library

**Finance template**: real-time quotes over WebSocket, line and candlestick
charts and a persisted watchlist on top of the base launcher. See
[Finance features](#finance-features).

---

## Getting started

Set up your machine first:
[React Native environment setup](https://reactnative.dev/docs/set-up-your-environment).

```sh
npm install

# iOS only: install CocoaPods dependencies (first run and after native changes)
bundle install
bundle exec pod install --project-directory=ios

npm start          # Metro bundler
npm run android    # in another terminal
npm run ios
```

In development the app talks to an **in-app mock API**, so it runs with no
backend: sign in with any e-mail and a password of 6+ characters (the
password reset code is `123456`).

## Scripts

| Script                                               | What it does                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm start`                                          | Metro bundler (environment: `development` in debug builds)                 |
| `npm run start:dev` / `start:staging` / `start:prod` | Metro with `APP_ENV` set (clears the Metro cache)                          |
| `npm run android` / `npm run ios`                    | Build and run the app                                                      |
| `npm run typecheck`                                  | `tsc --noEmit` (strict mode)                                               |
| `npm run lint`                                       | ESLint (`@react-native/eslint-config`)                                     |
| `npm run format` / `format:check`                    | Prettier                                                                   |
| `npm test` / `test:watch` / `test:coverage`          | Jest + React Native Testing Library                                        |
| `npm run validate`                                   | typecheck + lint + tests (run it before every PR)                          |
| `npm run splash:generate`                            | Regenerates the native splash screen from `src/assets/bootsplash/logo.svg` |

## Finance features

| Tab / screen  | What it does                                                                                                                             | Code                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Watchlist     | Your assets with live prices and daily change, connection status, star to remove, empty state that leads to Markets                      | `features/watchlist` |
| Markets       | Stocks and crypto with live prices, debounced search, type filter, star to add to the watchlist                                          | `features/markets`   |
| Asset details | Live price, line or candlestick chart per period (1D, 1W, 1M, 1Y) with a touch cursor, change and range of the period, statistics, about | `features/markets`   |

Library added by this template:
[`react-native-wagmi-charts`](https://github.com/coinjar/react-native-wagmi-charts)
(JavaScript only, built on Reanimated, Gesture Handler and `react-native-svg`,
which the base already has; nothing to link).

### Real-time quotes

- `features/markets/services/quoteSocket.ts` (`QuoteSocket`) keeps **one**
  WebSocket for the whole app:
  - **per-symbol subscriptions**, reference counted: the server gets
    `subscribe` once per symbol and `unsubscribe` when the last screen using
    it leaves; the socket opens with the first subscription and closes with
    the last one;
  - **exponential reconnection** (1s, 2s, 4s... up to 30s, plus up to 20%
    jitter), subscribing every symbol again once connected;
  - **heartbeat**: a `ping` every 15s; if nothing arrives within 10s the
    connection is replaced (mobile networks drop sockets silently);
  - closed while the app is in the background and reopened (no backoff) when
    it comes back (`services/quoteStream.ts`, `AppState`).
- RTK Query integration: `getQuotes(symbols)` loads a snapshot with
  `GET /quotes`, then its `onCacheEntryAdded` subscribes to the socket and
  writes every update into that cache entry with `updateCachedData`.
  Components call `useLiveQuotes(symbols)`; the subscription ends 15 seconds
  after the last component using it unmounts. If the snapshot fails, the
  screens show "Prices are unavailable" with a retry button.
- The socket URL of each environment is in `features/markets/config.ts`. In
  `development` (`env.useMockApi`) a local emitter replaces the network:
  `MockQuoteSocket` (`services/api/mock/finance/quoteServer.ts`) has the same
  surface as `WebSocket`, moves the subscribed prices every second and runs
  on timers only, so it works with Jest fake timers.

WebSocket protocol (JSON text messages). Adapt `parseMessage` and the
messages sent in `quoteSocket.ts` to your provider; if it needs the access
token, add it to the URL (or send it as the first message) in `connect()`.

| Direction        | Message                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| client to server | `{ "type": "subscribe", "symbols": ["AAPL", "BTC"] }`, `{ "type": "unsubscribe", "symbols": [...] }`   |
| client to server | `{ "type": "ping" }`                                                                                   |
| server to client | `{ "type": "quotes", "data": [Quote] }`: the current quotes right after `subscribe`, then every update |
| server to client | `{ "type": "pong" }`, `{ "type": "error", "message": "..." }`                                          |

### Watchlist

`features/watchlist/watchlistSlice.ts` holds the symbols (default: AAPL,
NVDA, BTC, ETH). It is persisted to MMKV (the redux-persist `whitelist` in
`src/app/store/store.ts`) and goes back to the defaults on sign-out. Move it
to your backend if it must follow the user across devices.

### Endpoints

All authenticated. A `Quote` is
`{ symbol, price, change, changePercent, open, high, low, previousClose, volume, timestamp }`
(`change*` against the previous close, `timestamp` in epoch milliseconds).

| Endpoint                                            | Response                                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET /assets?search&type&symbols`                   | `[{ symbol, name, type: 'stock' \| 'crypto', exchange, currency }]`; `symbols=AAPL,BTC` keeps that order |
| `GET /assets/:symbol`                               | Asset plus `{ description, marketCap }`                                                                  |
| `GET /assets/:symbol/candles?period=1D\|1W\|1M\|1Y` | `{ symbol, period, candles: [{ timestamp, open, high, low, close, volume }] }`                           |
| `GET /quotes?symbols=AAPL,BTC`                      | `[Quote]` (unknown symbols are skipped)                                                                  |

The mock market (`src/services/api/mock/finance/`) has 8 stocks and 4 crypto
assets with made-up prices; the random walk is seeded, so it starts the same
on every reload. Candles end at the current price, and the 1D series starts
at the previous close. Tests use `mockQuoteServer` to push prices
(`setPrice`), drop connections (`dropConnections`, `setOffline`) and turn the
random moves off (`config.tickIntervalMs = 0`).

Notes:

- Prices are formatted with `Intl.NumberFormat` in the app language
  (`features/markets/format.ts`); the chart tooltips use the library's own
  number format.
- `react-native-wagmi-charts` passes dependency arrays to Reanimated's
  `useDerivedValue`, which ignores them on native and logs "Dependencies
  should only be used on the web" once per call site. It is harmless and
  hidden from LogBox (`PriceChart.tsx`) and from Jest (`jest/setup.js`).
- Jest: the `d3-*` packages used by the charts ship ESM `.mjs` files only, so
  `jest.config.js` transforms them.
- Markets subscribes to every symbol in the list. With a large catalog,
  subscribe only to the visible rows (`FlatList` `onViewableItemsChanged`).

## Project structure

```
src/
  app/            App root: providers, Redux store, navigation
    navigation/   Root stack (auth flow), bottom tabs, typed params
    providers/    Gesture handler, safe area, Redux, persistence, theme, i18n
    store/        configureStore, persistence, typed hooks
  assets/         SVG icons (imported as components) and splash assets
  components/     Reusable UI: Button, Text, TextField, Screen, Card, ...
  config/         Environment configuration (development/staging/production)
  features/       One folder per domain, each with its api/, screens/, slice
    auth/         Login, session, tokens
    home/         Example list + details screens backed by RTK Query
    settings/     Theme and language preferences, sign out
  hooks/          Generic hooks (useDebouncedValue, useRefreshByUser)
  i18n/           i18next setup and locales (en, pt-BR)
  services/
    api/          Axios instance, interceptors, errors, RTK Query base API, mock API
    storage/      MMKV instances, redux-persist adapter, token storage
  test-utils/     renderWithProviders and Testing Library re-exports
  theme/          Design tokens, light/dark themes, makeStyles
  utils/          testIDs, validation, logger, error messages
```

Imports use the `@/` alias for `src/` (configured in `babel.config.js`,
`tsconfig.json`; Jest uses the Babel config).

## Architecture

### HTTP and API errors

- `src/services/api/client.ts` creates **the** axios instance (`apiClient`).
- Interceptors (`interceptors.ts`):
  - add `Authorization: Bearer <accessToken>` (skip it with `{ skipAuth: true }`);
  - on `401`, call `POST /auth/refresh` **once** (concurrent requests share the
    same refresh), save the new tokens and replay the request;
  - if the refresh fails, clear the tokens and end the session (back to Login);
  - always reject with a normalized `ApiError` (`status`, `code`, `message`, `details`).
- RTK Query uses the same instance through `axiosBaseQuery`, so every endpoint
  gets the same behavior. Errors in hooks are `ApiErrorData` objects.
- `getErrorMessage(error, t)` turns any error into a translated message.

Expected backend contract (adapt `features/auth` and `client.ts` to yours):

| Endpoint                     | Body                        | Response                                          |
| ---------------------------- | --------------------------- | ------------------------------------------------- |
| `POST /auth/login`           | `{ email, password }`       | `{ user, tokens: { accessToken, refreshToken } }` |
| `POST /auth/register`        | `{ name, email, password }` | same as login (`409` if the e-mail exists)        |
| `POST /auth/forgot-password` | `{ email }`                 | `204` (always, to not reveal registered e-mails)  |
| `POST /auth/reset-password`  | `{ email, code, password }` | `204` (`400` for an invalid code)                 |
| `POST /auth/refresh`         | `{ refreshToken }`          | `{ accessToken, refreshToken }`                   |
| `POST /auth/logout`          | –                           | `204`                                             |
| `GET /me`                    | –                           | `user`                                            |

### Mock API

`src/services/api/mock` is an axios adapter enabled when
`env.useMockApi` is `true` (only in `development`). Known routes are answered
locally; **unknown routes go to the real network**, so you can mock only what
the backend does not have yet. Remove the folder (and the adapter line in
`client.ts`) when you no longer need it.

Special values to try the error paths: password `wrong-password` (login `401`),
e-mail `taken@example.com` (sign-up `409`) and any reset code other than
`123456` (`400`).

### State

- Redux Toolkit store in `src/app/store`. Add reducers in `rootReducer.ts`.
- Server state lives in **RTK Query**. Features add endpoints with
  `baseApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)`
  (see `features/home/api/itemsApi.ts`).
- `auth` and `settings` are persisted to MMKV with redux-persist. The RTK
  Query cache is not persisted. Bump `version` in `persistConfig` and add a
  migration when a persisted slice changes shape.
- `refetchOnFocus` (opt-in per API or endpoint) is wired to the app foreground
  state (`AppState`).

### Tokens

Tokens are stored by `src/services/storage/tokenStorage.ts` in a dedicated
MMKV instance. The interface is async on purpose: for production apps, move
them to the Keychain/Keystore with `react-native-keychain` by changing only
that file.

### Navigation

- `RootNavigator` renders the **Login** screen or the **MainTabs** stack
  depending on `selectIsAuthenticated` (the
  [auth flow](https://reactnavigation.org/docs/auth-flow) pattern).
- Param lists live in `src/app/navigation/types.ts`; `useNavigation()` is typed
  globally.

### Environments

`src/config/env.ts` holds one config object per environment. The active one is
chosen by `APP_ENV`, inlined at build time by Babel:

```sh
npm run start:staging                       # Metro with APP_ENV=staging
APP_ENV=staging npm run android -- --mode release
cd android && APP_ENV=production ./gradlew bundleRelease
```

Without `APP_ENV`, debug builds use `development` and release builds use
`production`. Metro's cache key includes `APP_ENV`, so switching is safe.
Never put secrets in the app: anything in the bundle can be extracted.

### Theme

Tokens (`theme/tokens.ts`) → semantic light/dark themes (`theme/themes.ts`).
Use `useTheme()` or `makeStyles(theme => ({ ... }))`. The user can choose
system/light/dark in Settings; React Navigation uses the same colors.

### i18n

i18next with `en` (source of truth) and `pt-BR`. Keys are type-checked:
a missing key in `pt-BR.ts` is a TypeScript error. The device language is
detected with `react-native-localize`; the user can override it in Settings.

### Forms

`react-hook-form` + `zod`. Schemas are factories that receive `t`, so
validation messages are translated (`features/auth/schemas.ts`; shared fields
such as e-mail and password rules in `utils/validation.ts`):

```tsx
const { control, handleSubmit } = useZodForm(createLoginSchema, {
  defaultValues: { email: '', password: '' },
});
const onSubmit = handleSubmit(values => login(values));

<FormTextField control={control} name="email" label={t('auth.email')} />
<Button title={t('auth.submit')} onPress={onSubmit} />
```

`FormTextField` wires value, blur, focus (`setFocus`) and the error message.

### SVG

`.svg` files are imported as React components (`react-native-svg-transformer`).
Use `currentColor` in the SVG and pass `color` to tint it.

### Splash screen

Native splash with `react-native-bootsplash`, hidden when navigation is ready.
Change `src/assets/bootsplash/logo.svg` and the `--background` color in the
`splash:generate` script, then run `npm run splash:generate`.

## Testing

- Jest with `@react-native/jest-preset` and React Native Testing Library v14
  (`render`, `fireEvent` and `userEvent` are async).
- `renderWithProviders()` (`src/test-utils`) renders with the real providers
  and an isolated store; the mock API runs with no latency in tests.
- Native modules are mocked in `jest/setup.js`.
- Every interactive element has a stable `testID` (`src/utils/testIDs.ts`),
  ready for Detox or Maestro E2E tests.

## Adding a feature

1. Create `src/features/<name>/` with `api/`, `screens/`, `types.ts` and,
   if needed, a slice.
2. Inject endpoints into `baseApi`; add mock routes in
   `src/services/api/mock/handlers.ts` if the backend is not ready.
   Forms use `useZodForm` with a schema factory next to the feature.
3. Register reducers in `src/app/store/rootReducer.ts` and screens/params in
   `src/app/navigation`.
4. Add translations to `en.ts` and `pt-BR.ts`, and testIDs to `testIDs.ts`.
5. Write tests next to the code (`__tests__/`).

## Before going to production

- [ ] Set the real API URLs in `src/config/env.ts`.
- [ ] Change the bundle identifier / application id and app icons.
- [ ] Configure release signing (`android/app/build.gradle`, Xcode).
- [ ] Move tokens to `react-native-keychain`.
- [ ] Plug a crash reporter into `src/utils/logger.ts`.
