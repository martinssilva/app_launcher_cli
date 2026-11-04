# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

`rn-app-launcher` is a **React Native CLI template** (no Expo). Users create apps with:

```bash
npx @react-native-community/cli@latest init MyApp --template martinssilva/app_launcher_cli
npx @react-native-community/cli@latest init MyApp --template martinssilva/app_launcher_cli#template/office
```

- `main` is the base launcher. Each `template/<name>` branch (office, shopping, finance, fitness) is the base plus one domain. Base changes are made on `main` and reach the templates through `git merge origin/main` (never rebase shared branches). Template-specific code never goes to `main`.
- The repo root is the template **package**: `package.json` (name `rn-app-launcher`; its `files` field decides what is shipped) and `template.config.js` (points the CLI at `template/`). `template/` is a complete, runnable React Native 0.88 app (New Architecture, Hermes, React 19).
- Roadmap, decisions, status and open questions live in `PLAN.md` (pt-BR).

## Commands

Day-to-day work happens inside `template/` (run `npm install` there; the root has no dependencies):

```bash
cd template
npm run validate                 # typecheck + lint + jest; run before every commit
npm test -- src/features/auth/__tests__/authFlow.test.tsx   # one test file
npm test -- -t "signs out"       # tests matching a name
npm run typecheck                # tsc --noEmit
npm run lint                     # ESLint 8.57 with eslint.config.js (flat config)
npm run format                   # Prettier (format:check in CI)
npm start                        # Metro; start:dev|start:staging|start:prod set APP_ENV and reset the cache
npm run android                  # or: npm run ios (after `bundle install && bundle exec pod install --project-directory=ios`)
npm run splash:generate          # regenerate the native splash from src/assets/bootsplash/logo.svg
```

From the repo root:

```bash
npm run test:template                                    # npm pack -> `init --template` -> validate, prettier, release bundles (~3 min)
ANDROID_BUILD=1 bash scripts/test-template.sh /tmp/tt    # same + ./gradlew assembleDebug (needs an Android SDK)
```

Run `npm run test:template` after changing dependencies, config files, dotfiles, native code or anything outside `template/src`. CI (`.github/workflows/ci.yml`) runs that script plus an Android debug build on pushes to `main`/`template/**` and on pull requests. Without an Android SDK or Xcode (e.g. cloud sessions), native changes are only verified by CI.

## Template mechanics (mistakes here break generated apps)

- The CLI replaces `HelloWorld`, `helloworld` (e.g. `com.helloworld`) and `Hello App Display Name` in file **contents and paths**. Never write these strings where they should not become the user's app name, including comments and tests.
- `template/_gitignore` becomes `.gitignore` (npm drops `.gitignore` files when packing); `_bundle`, `_watchmanconfig` and `ios/_xcode.env` are renamed too. Tool configs use non-dot names (`eslint.config.js`, `prettier.config.js`) so they work both in place and in generated apps.
- No lockfiles in `template/` (git-ignored). A new build/output directory under `template/` must also be excluded in the root `package.json` `files`.
- Native setup is manual and follows each library's README: react-native-screens fragment factory + bootsplash init in `android/.../MainActivity.kt`, bootsplash in `ios/HelloWorld/SceneDelegate.swift`. `splash:generate` rewrites AndroidManifest, `styles.xml`, `colors.xml`, `Info.plist` and `project.pbxproj`: review the diff (it writes `undefined` attributes into pbxproj entries, which were cleaned up by hand).

## Architecture (`template/src`, imported through the `@/` alias)

- **HTTP**: `services/api/client.ts` creates the only axios instance and installs `interceptors.ts` at import time: bearer token from `TokenStorage`; on 401, a single-flight refresh (`POST /auth/refresh`, only for requests that carried a token, replayed once via `_retried`); every failure is rejected as a normalized `ApiError` (`errors.ts`). RTK Query (`baseApi.ts`) uses the same instance through `axiosBaseQuery`, so hooks expose serializable `ApiErrorData`. UI turns any error into text with `getErrorMessage(error, t)`.
- **The API layer never imports the store.** When the refresh fails, the client calls the handler that the store registers with `setSessionExpiredHandler` (`app/store/store.ts`), which dispatches `endSession()` (clear tokens, `signedOut`, `resetApiState`).
- **Store**: slices are registered in `app/store/rootReducer.ts`. `makeStore()` is the non-persisted store (tests); `makePersistedStore()` is the app store (persists only `auth` and `settings` to MMKV). `app/store/index.ts` creates the app singleton on import, so features import from `@/app/store/hooks` and `@/app/store/types`, never from `@/app/store`.
- **Features** (`features/<domain>/`) own their `api/` (endpoints added with `baseApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)`), `screens/`, slice, `types.ts` and `__tests__/`. Every new endpoint also gets a route in `services/api/mock/handlers.ts`.
- **Mock API**: an axios adapter enabled only when `env.useMockApi` (development). Unknown routes fall through to the real network. Login accepts any e-mail with a 6+ character password; `wrong-password` returns 401.
- **Auth flow**: `app/navigation/RootNavigator.tsx` renders Login or `MainTabs` + stack screens from `selectIsAuthenticated`, so sign-in/out never navigates manually. Param lists are in `app/navigation/types.ts` (also declared globally for `useNavigation`).
- **Environments**: `config/env.ts` has one config per environment. `APP_ENV` is inlined by `babel-plugin-transform-inline-environment-variables`, and Metro's `cacheVersion` includes it. Read configuration through `env`, not `process.env`.
- **Tokens**: `services/storage/tokenStorage.ts` has an async interface (MMKV today); moving to the Keychain changes only that file.
- **UI**: colors, spacing and typography come from the theme (`makeStyles(theme => ...)`, `useTheme()`); text goes through the `Text` component from `@/components`; user-facing strings use `t()` with keys in `i18n/locales/en.ts` (source of truth; `pt-BR.ts` is typed against it, so a missing key fails typecheck). Interactive elements and screens get a `testID` from `utils/testIDs.ts`. Theme and language preferences live in the `settings` slice and are applied by `PreferencesProvider` (`app/providers/AppProviders.tsx`).

## Testing

- Jest 29 + React Native Testing Library **v14**: `render`, `fireEvent`, `userEvent` and `act` are async; always `await` them.
- Use `renderWithProviders()` from `@/test-utils` (real providers, isolated `makeStore()`, optional `withNavigation`). End-to-end flows render `NavigationRoot` against the mock API (see `features/auth/__tests__/authFlow.test.tsx`).
- `jest/setup.js` mocks native modules (localize, bootsplash, safe-area, Nitro modules, Worklets). Reanimated runs for real through `jest/resolver.js`; MMKV v4 switches to memory under Jest. `jest/setupAfterEnv.ts` removes mock-API latency and, after each test, unmounts, resets RTK Query state (pending cache timers would keep Jest alive), the mock database and storage.
- A new native library usually needs a mock in `jest/setup.js`; ESM-only packages must be added to `transformIgnorePatterns` in `jest.config.js`.

## Gotchas

- Stay on ESLint 8.57: `@react-native/eslint-config/flat` crashes on ESLint 9 (eslint-plugin-ft-flow uses a removed API).
- `process` is not typed in React Native; `config/env.ts` uses an intentional `@ts-ignore` so Babel can inline `process.env.APP_ENV`.
- Reanimated shared values use `.get()`/`.set()` (the react-hooks v7 rules flag `.value` mutation).
- `persistConfig.timeout` is `0` on purpose (MMKV is synchronous; the default 5 s timer keeps Jest running).
- `makeStyles` defines its own `NamedStyles` type because RN 0.88 types no longer export `StyleSheet.NamedStyles`.
- Reanimated 4.7 and Worklets 0.13 only support RN 0.86 to 0.88: upgrade React Native on `main` with the Upgrade Helper diff applied to `template/`, bump them together, then run `npm run test:template`.

## Conventions

- Code, comments, commits and READMEs in English; talk to the user in Portuguese (pt-BR). `PLAN.md` is written in pt-BR.
- On template branches, keep edits to shared files (`rootReducer.ts`, `app/navigation/*`, locales, `testIDs.ts`, `package.json`) minimal so `merge main` stays painless. `CLAUDE.md` and `PLAN.md` are edited on `main`; a template branch may only append a section about its own domain to `CLAUDE.md`.
- When a template becomes usable, update the branch table in the root `README.md` (Planned to Available) and `template/README.md`.
