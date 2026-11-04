/**
 * Central registry of testIDs used by unit tests and E2E tools (Detox, Maestro).
 * Keep them stable: renaming one breaks E2E flows.
 */
export const testIDs = {
  login: {
    screen: 'login.screen',
    emailInput: 'login.emailInput',
    passwordInput: 'login.passwordInput',
    submitButton: 'login.submitButton',
    errorMessage: 'login.errorMessage',
  },
  home: {
    screen: 'home.screen',
    greeting: 'home.greeting',
    list: 'home.list',
    item: (id: string) => `home.item.${id}`,
  },
  itemDetails: {
    screen: 'itemDetails.screen',
    title: 'itemDetails.title',
  },
  settings: {
    screen: 'settings.screen',
    themeOption: (value: string) => `settings.theme.${value}`,
    languageOption: (value: string) => `settings.language.${value}`,
    logoutButton: 'settings.logoutButton',
  },
  tabs: {
    home: 'tabs.home',
    settings: 'tabs.settings',
  },
  stateView: {
    loading: 'stateView.loading',
    error: 'stateView.error',
    empty: 'stateView.empty',
    retryButton: 'stateView.retryButton',
  },
} as const;
