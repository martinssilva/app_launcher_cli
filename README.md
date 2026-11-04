# rn-app-launcher

React Native CLI starter kit with TypeScript, Redux Toolkit, Axios, React
Navigation, Reanimated and Gesture Handler. The `main` branch is the base
launcher; each `template/*` branch is a ready-to-use app model (office,
shopping, finance, fitness).

[![CI](https://github.com/martinssilva/app_launcher_cli/actions/workflows/ci.yml/badge.svg)](https://github.com/martinssilva/app_launcher_cli/actions/workflows/ci.yml)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

Inspired by the Expo templates/examples, but built for the **React Native
CLI** (no Expo): you get plain `android/` and `ios/` projects from day one.

---

## Contents

- [Quick start](#quick-start)
- [What is included](#what-is-included)
- [Branches and templates](#branches-and-templates)
- [How the template works](#how-the-template-works)
- [Developing the template](#developing-the-template)
- [Keeping templates in sync with `main`](#keeping-templates-in-sync-with-main)
- [Technical decisions](#technical-decisions)
- [License](#license)

## Quick start

```bash
# Base launcher (main)
npx @react-native-community/cli@latest init MyApp --template martinssilva/app_launcher_cli

# A specific app model (any template/* branch)
npx @react-native-community/cli@latest init MyApp --template martinssilva/app_launcher_cli#template/office
```

Useful options: `--title "My App"` (display name), `--package-name com.company.myapp`,
`--pm yarn|npm|bun`, `--skip-git-init`, `--install-pods true`.

Then:

```bash
cd MyApp
bundle install && bundle exec pod install --project-directory=ios   # iOS only
npm start
npm run android   # or: npm run ios
```

The app starts with an **in-app mock API**: sign in with any e-mail and a
password of 6+ characters (the password reset code is `123456`). See the generated `README.md` for the full guide
(architecture, environments, testing, production checklist).

> **Requirements:** Node.js >= 22.11, JDK 17, Android Studio, and Xcode +
> CocoaPods for iOS ([environment setup](https://reactnative.dev/docs/set-up-your-environment)).
> The React Native version comes from the template (currently **0.88.1**),
> not from the `--version` flag.
>
> The CLI downloads the template with npm/git, so the repository must be
> public or your git client must be able to access it.

## What is included

| Area               | Stack                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Core               | React Native 0.88 (New Architecture, Hermes), React 19, TypeScript (strict)                                           |
| Navigation         | `@react-navigation/native` + `native-stack` + `bottom-tabs`, `react-native-screens`, `react-native-safe-area-context` |
| Gestures/animation | `react-native-gesture-handler` 3, `react-native-reanimated` 4 (+ `react-native-worklets`)                             |
| State              | Redux Toolkit + **RTK Query** (with an axios base query), typed hooks                                                 |
| Forms              | `react-hook-form` + `zod` (`useZodForm`, `FormTextField`, schemas with translated messages)                           |
| HTTP               | Axios instance with auth interceptor, single-flight token refresh, normalized `ApiError`                              |
| Persistence        | `react-native-mmkv` + `redux-persist` (auth and settings), isolated token storage                                     |
| Environments       | `development` / `staging` / `production` selected by `APP_ENV` at build time                                          |
| i18n               | `i18next` + `react-i18next` + `react-native-localize`, type-checked keys, `en` and `pt-BR`                            |
| Theme              | Design tokens, light/dark themes, `makeStyles`, React Navigation theme                                                |
| Assets             | `react-native-svg` + `react-native-svg-transformer` (SVG as components)                                               |
| Splash             | `react-native-bootsplash` (generated from an SVG, hidden when navigation is ready)                                    |
| Quality            | ESLint (`@react-native/eslint-config`), Prettier, Jest + React Native Testing Library, `testID`s everywhere           |
| Dev experience     | `@/` import alias, mock API adapter, `npm run validate`, CI that generates and validates a fresh app                  |

Example features in the base app: **Auth** (login, sign-up and password
recovery with a code; form validation, API errors, session persistence),
**Home** (RTK Query list with pull-to-refresh, loading/empty/error states,
details screen) and **Settings** (theme, language, environment info, sign out).

```
template/src/
  app/          providers, store, navigation root
  services/api/ axios instance, interceptors, errors, RTK Query base, mock API
  services/storage/ MMKV, redux-persist adapter, token storage
  features/     isolated domains (auth, home, settings)
  components/   reusable UI
  theme/        colors, typography, spacing
  config/       environments
  hooks/ utils/ i18n/ test-utils/
```

## Branches and templates

| Branch              | Template | Adds on top of the base                                         | Status    |
| ------------------- | -------- | --------------------------------------------------------------- | --------- |
| `main`              | Launcher | The base described above                                        | Available |
| `template/office`   | Office   | Complete auth, calendar/agenda, filtered lists, document upload | Planned   |
| `template/shopping` | Shopping | Catalog, cart, checkout, favorites, search                      | Planned   |
| `template/finance`  | Finance  | WebSocket real-time quotes, charts, watchlist                   | Planned   |
| `template/fitness`  | Fitness  | `react-hook-form` + `zod`, CRUD, offline mode, history/progress | Planned   |

Every template branch is created from `main` and receives base updates by
merging `main` (see [below](#keeping-templates-in-sync-with-main)).

## How the template works

```
.
├── template.config.js      # placeholderName, titlePlaceholder, templateDir
├── package.json            # the template "package" (name: rn-app-launcher)
├── template/               # the app copied into new projects
├── scripts/test-template.sh
└── .github/workflows/ci.yml
```

`init --template <user>/<repo>` installs this repository as an npm package,
reads `template.config.js`, copies `template/` and then:

- replaces `HelloWorld` (and `helloworld`, e.g. `com.helloworld`) with the new
  project name in file contents, file names and folders;
- replaces `Hello App Display Name` with `--title`;
- renames underscored dotfiles: `_gitignore` → `.gitignore`, `_bundle` →
  `.bundle`, `_watchmanconfig` → `.watchmanconfig`, `ios/_xcode.env` →
  `ios/.xcode.env`.

Rules when editing `template/`:

1. Only write `HelloWorld` where the project name must end up.
2. `.gitignore` must stay as `_gitignore`: npm drops `.gitignore` files when
   packing and the CLI renames it back. Other dotfiles (e.g. `.prettierignore`)
   can be committed as they are.
3. Tool configs use non-dotfile names (`eslint.config.js`,
   `prettier.config.js`) so they work both in the template and in generated apps.
4. Do not commit lockfiles in `template/` (they are git-ignored).

## Developing the template

`template/` is a regular React Native app, so you can run it in place:

```bash
cd template
npm install
npm run validate   # typecheck + lint + tests
npm start          # then: npm run android / npm run ios
```

Before pushing, test the real user flow (npm pack → `init --template` →
validate → release bundles) from the repository root:

```bash
npm run test:template
```

CI runs the same script on every push to `main`/`template/**` and on pull
requests, plus an Android debug build of the generated app.

### Upgrading React Native

Do it on `main`: apply the diff from the
[React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
to `template/` (native files included), bump the library versions, run
`npm run test:template`, then merge `main` into every `template/*` branch.

## Keeping templates in sync with `main`

Base changes (fixes, dependency upgrades, new infrastructure) are made on
`main` and propagated with a merge:

```bash
# Create a new template branch
git checkout main && git pull
git checkout -b template/office
git push -u origin template/office

# Bring base updates into a template
git checkout template/office
git pull
git merge origin/main
(cd template && npm install && npm run validate)
git push
```

Tips to keep merges painless:

- Put domain code in `template/src/features/<domain>/` (new files rarely conflict).
- Touch shared files only where needed: `rootReducer.ts`, `app/navigation/*`,
  `i18n/locales/*`, `utils/testIDs.ts`, `package.json`.
- Merge (do not rebase) shared branches, and enable
  `git config rerere.enabled true` to reuse conflict resolutions.
- Never commit template-specific code to `main`.

## Technical decisions

- **React Native CLI instead of Expo**: full control of native projects from
  the start; templates are plain RN projects.
- **One repository, one branch per template**: the base is maintained once and
  merged into each model; users pick a model with `#template/<name>`.
- **RTK Query instead of sagas**: server state, caching, loading/error states
  and invalidation with much less code. It runs on the same axios instance via
  `axiosBaseQuery`, so interceptors apply everywhere. Sagas/listeners can still
  be added for complex workflows.
- **MMKV + redux-persist**: synchronous and fast; only `auth` and `settings`
  are persisted. Tokens live behind an async `TokenStorage` interface, ready to
  be moved to `react-native-keychain`.
- **Environments in TypeScript + `APP_ENV` inlined by Babel**: no native
  configuration per flavor/scheme, type-safe config, Metro cache keyed by
  environment. No secrets in the bundle.
- **Mock API as an axios adapter**: the app runs without a backend and unknown
  routes fall through to the network.
- **ESLint 8**: `@react-native/eslint-config` flat config still crashes on
  ESLint 9 (Flow plugin), so the template uses ESLint 8.57 with
  `eslint.config.js`. Moving to ESLint 9 is a version bump once that is fixed.

## License

[MIT](./LICENSE). The native projects and tooling in `template/` are derived
from [`@react-native-community/template`](https://github.com/react-native-community/template)
(MIT).
