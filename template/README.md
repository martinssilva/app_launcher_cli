# HelloWorld

React Native CLI app generated from
[rn-app-launcher](https://github.com/martinssilva/app_launcher_cli).

TypeScript · Redux Toolkit + RTK Query · Axios · React Navigation ·
Reanimated · Gesture Handler · MMKV · i18next · Jest + Testing Library

**Shopping template**: catalog, favorites, cart, checkout and orders on top of
the base launcher. See [Shopping features](#shopping-features).

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

## Shopping features

| Tab / screen         | What it does                                                                                       | Code                 |
| -------------------- | -------------------------------------------------------------------------------------------------- | -------------------- |
| Shop                 | Product grid with debounced search, category, on-sale and sort filters, infinite scroll            | `features/catalog`   |
| Product details      | Photo gallery, price and discount, stock, quantity, add to cart, favorite                          | `features/catalog`   |
| Favorites            | Products saved with the heart button (kept on the device)                                          | `features/favorites` |
| Cart                 | Quantities, line totals, subtotal; the tab shows the item count                                    | `features/cart`      |
| Checkout             | Address form, shipping options, simulated card/cash payment, summary, place order and confirmation | `features/checkout`  |
| Settings → My orders | Order history and order details                                                                    | `features/orders`    |

Library added by this template:
[`@shopify/flash-list`](https://shopify.github.io/flash-list/) v2 (JavaScript
only, New Architecture) for the product grids. Product photos use React
Native's `Image`, which already caches downloads; `ProductImage` shows a
themed placeholder while there is no photo or it fails to load (offline).

Notes:

- Prices are **integer amounts in cents** and are formatted with
  `formatMoney` / `useFormatMoney` (`src/utils/money.ts`, currency `USD`:
  change `CURRENCY` for your store).
- The `cart` and `favorites` slices are persisted (`persistConfig.whitelist`
  in `src/app/store/store.ts`) and cleared on sign out. They keep product
  snapshots, so they work offline; the server recalculates prices and checks
  the stock when the order is placed (`409` → the user is asked to review the
  cart).
- The catalog uses an RTK Query **infinite query**
  (`useGetProductsInfiniteQuery` + `fetchNextPage`); each filter combination
  has its own cache entry. Placing an order invalidates the products (stock)
  and the order list.
- Payments are **simulated**: the app sends only the last four digits of the
  card. With a real provider, collect the card with its SDK and send the
  token it returns; never send card data to your API.

Shopping endpoints (all authenticated) and the mock API values to try them:

| Endpoint                                                     | Notes                                                                                     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `GET /categories`                                            | `[{ id, name }]`                                                                          |
| `GET /products?search&category&onSale=true&sort&page&limit`  | Paginated `{ data, page, limit, total, hasMore }`; `sort`: `price_asc`, `price_desc`, ... |
| `GET /products/:id`                                          | Product: `{ id, name, description, category, price, compareAtPrice, images, stock, ... }` |
| `GET /shipping-options`                                      | `[{ id: 'standard' \| 'express', price, minDays, maxDays, freeOver }]`                    |
| `GET /orders`, `GET /orders/:id`                             | Newest first                                                                              |
| `POST /orders` `{ items, address, shippingMethod, payment }` | `201` order; `409` not enough stock; `402` card declined (mock: card ending in `0002`)    |

The mock data (36 products in 6 categories, 2 past orders) lives in
`src/services/api/mock/shopping/`. Use `4242 4242 4242 4242` (any future
expiry, any CVC) to pay, or `4000 0000 0000 0002` to see a declined card. One
product per category is sold out and one has only 2 units left. Photos come
from `picsum.photos` (needs a network connection).

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
