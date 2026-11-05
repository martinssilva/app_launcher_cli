# HelloWorld

React Native CLI app generated from
[rn-app-launcher](https://github.com/martinssilva/app_launcher_cli).

TypeScript · Redux Toolkit + RTK Query · Axios · React Navigation ·
Reanimated · Gesture Handler · MMKV · i18next · Jest + Testing Library

**Fitness template**: members, workouts and sessions that work offline, on
top of the base launcher. See [Fitness features](#fitness-features).

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

## Fitness features

| Tab / screen          | What it does                                                                        | Screen (`features/fitness/screens`)        |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| Members               | Search members, create/edit/delete them (contact, goal, notes), sync status banner  | `MembersScreen`, `MemberFormScreen`        |
| Member → Workouts     | Create/edit/delete workout plans with a list of exercises (sets, reps, load)        | `MemberDetailsScreen`, `WorkoutFormScreen` |
| Member → Log session  | Check-in: workout, date, duration and the loads actually used                       | `SessionFormScreen`                        |
| Member → Progress     | Attendance stats and calendar, sessions of a day, load evolution chart per exercise | `ProgressScreen`                           |
| Sync (tap the banner) | Connection, last sync, queued changes and conflict resolution                       | `SyncScreen`                               |

Libraries added by this template:
[`@react-native-community/netinfo`](https://github.com/react-native-netinfo/react-native-netinfo)
(native, autolinked: connection status),
[`react-native-calendars`](https://github.com/wix/react-native-calendars)
(pure JS: attendance calendar and date picker, themed and translated in
`features/fitness/components`) and
[`react-native-wagmi-charts`](https://github.com/coinjar/react-native-wagmi-charts)
(pure JS on top of Reanimated, Gesture Handler and react-native-svg, which the
base already has: load chart).

### Offline mode

The fitness screens never wait for the network: they read the **offline
store** (`features/fitness/fitnessSlice.ts`), which redux-persist saves to
MMKV (`fitness` in the `whitelist` of `src/app/store/store.ts`).

- **Optimistic updates**: saving a form applies the change to the store
  right away and appends it to a **queue** (`queue` in the same slice, also
  persisted). Records created on the device get their id there (`nanoid`), so
  workouts and sessions can reference a member created offline.
- **Sync** (`features/fitness/sync/syncEngine.ts`): sends the queue **in
  order**, one request at a time, then downloads fresh data
  (`GET /members`, `/workouts`, `/sessions`). A download never overwrites
  records that still have queued changes. It runs when the signed-in app
  starts, after every change, when the connection comes back (NetInfo,
  `features/network`), when the app returns to the foreground, on
  pull-to-refresh and with **Sync now**.
- **Failures**: network errors, timeouts, `5xx` and `429` keep the change at
  the head of the queue and are retried on the next sync (the banner shows
  that the sync failed).
- **Conflicts** are explicit. Each change carries the `version` of the record
  it was based on; the API answers `409` when someone else changed the record
  first. The queue stops at that change (later changes wait, so the order is
  kept) and the Sync screen shows both versions:
  - changed on the server (`409`): **Keep my version** (sent again on top of
    the server's version) or **Use the server version**;
  - deleted on the server (`404`): **Restore with my changes** or **Discard**;
  - rejected (`400`, `403`, `422`...): **Discard my changes**.
- Signing out clears the offline store, including changes not synced yet.

Contract for a real backend (implemented by the mock API):

| Endpoint                                                     | Notes                                                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `GET /members`, `GET /members/:id`                           | Member: `{ id, name, email, phone, goal, notes, version }`                                     |
| `POST /members`, `PATCH /members/:id`, `DELETE /members/:id` | Deleting a member deletes their workouts and sessions                                          |
| `GET /workouts?memberId`, `GET/PATCH/DELETE /workouts/:id`   | Workout: `{ id, memberId, name, notes, exercises: [{ name, sets, reps, weightKg }], version }` |
| `POST /workouts`                                             | `422` for an unknown `memberId`                                                                |
| `GET /sessions?memberId&from&to`, `POST /sessions`           | Session: `{ id, memberId, workoutId, workoutName, date, durationMinutes, exercises, version }` |
| `DELETE /sessions/:id`                                       | Sessions are not edited, only logged and deleted                                               |

- `POST` receives the client `id`; a `POST` with an id that already exists is
  a retry and returns the stored record (`200`).
- `PATCH` sends the whole record plus the `version` it is based on; `DELETE`
  sends it as `?version=`. A stale version gets `409`. The server increments
  `version` on every change. A `DELETE` of a missing record (`404`) counts as
  done.
- Queued requests carry an `Idempotency-Key` header (the change id): a backend
  should store the answer by key so a retry after a lost response is not
  applied twice (the mock instead treats a `PATCH` identical to the current
  record as a retry).
- The sync downloads every record; with a large history, add `?since=` or
  pagination to `GET /sessions`.

Try it with the mock API: turn on airplane mode, create or edit members and
workouts, log a session, then reconnect. To see a conflict without a second
device, save a member whose notes contain `#conflict`: the mock answers `409`
once, as if the front desk had changed that member first. The mock data
(4 members, 4 workouts and two months of sessions with increasing loads) lives
in `src/services/api/mock/fitness/`.

Tests: `src/features/fitness/__tests__` covers the CRUD flows, the sync engine
(order, conflicts, failures), offline → edit → reconnect, a restart with
pending changes and the progress screen. `setNetworkState(online)`
(`src/test-utils/network.ts`) simulates connectivity through NetInfo's Jest
mock, and `fitnessMockConfig.outage` makes the mock API answer `503`.

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
