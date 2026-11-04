# HelloWorld

React Native CLI app generated from
[rn-app-launcher](https://github.com/martinssilva/app_laucher_cli).

TypeScript · Redux Toolkit + RTK Query · Axios · React Navigation ·
Reanimated · Gesture Handler · MMKV · i18next · Jest + Testing Library

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
backend: sign in with any e-mail and a password of 6+ characters.

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

| Endpoint             | Body                  | Response                                          |
| -------------------- | --------------------- | ------------------------------------------------- |
| `POST /auth/login`   | `{ email, password }` | `{ user, tokens: { accessToken, refreshToken } }` |
| `POST /auth/refresh` | `{ refreshToken }`    | `{ accessToken, refreshToken }`                   |
| `POST /auth/logout`  | –                     | `204`                                             |
| `GET /me`            | –                     | `user`                                            |

### Mock API

`src/services/api/mock` is an axios adapter enabled when
`env.useMockApi` is `true` (only in `development`). Known routes are answered
locally; **unknown routes go to the real network**, so you can mock only what
the backend does not have yet. Remove the folder (and the adapter line in
`client.ts`) when you no longer need it.

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
