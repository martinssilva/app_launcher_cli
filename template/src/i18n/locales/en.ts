/**
 * Source of truth for translation keys. Other locales are typed against it,
 * so a missing or extra key is a TypeScript error.
 */
export const en = {
  common: {
    retry: 'Try again',
    loading: 'Loading…',
  },
  errors: {
    network: 'No internet connection. Check your network and try again.',
    timeout: 'The server took too long to respond. Please try again.',
    unauthorized: 'Your session has expired. Please sign in again.',
    forbidden: "You don't have permission to do that.",
    notFound: "We couldn't find what you were looking for.",
    validation: 'Some information is invalid. Please review it and try again.',
    server: 'Something went wrong on our side. Please try again later.',
    unknown: 'Something went wrong. Please try again.',
  },
  validation: {
    required: 'This field is required.',
    email: 'Enter a valid e-mail address.',
    passwordTooShort: 'The password must have at least {{min}} characters.',
    passwordsDontMatch: "The passwords don't match.",
    code: 'Enter the 6-digit code.',
  },
  auth: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue',
    email: 'E-mail',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: 'Your password',
    submit: 'Sign in',
    forgotPassword: 'Forgot your password?',
    noAccount: "Don't have an account?",
    createAccount: 'Create account',
    invalidCredentials: 'Invalid e-mail or password.',
    passwordResetDone: 'Password updated. Sign in with your new password.',
    mockHint:
      'Mock API enabled: any e-mail with a 6+ character password signs you in.',
  },
  register: {
    title: 'Create your account',
    subtitle: 'It only takes a minute.',
    name: 'Name',
    namePlaceholder: 'Your name',
    confirmPassword: 'Confirm password',
    confirmPasswordPlaceholder: 'Repeat the password',
    submit: 'Create account',
    emailTaken: 'This e-mail is already registered.',
  },
  forgotPassword: {
    title: 'Forgot your password?',
    subtitle: 'Enter your e-mail and we will send you a code to reset it.',
    submit: 'Send code',
  },
  resetPassword: {
    title: 'Reset your password',
    subtitle: 'Enter the code sent to {{email}} and choose a new password.',
    code: 'Code',
    codePlaceholder: '6-digit code',
    newPassword: 'New password',
    submit: 'Update password',
    invalidCode: 'Invalid or expired code.',
    mockHint: 'Mock API enabled: use the code 123456.',
  },
  home: {
    title: 'Home',
    greeting: 'Hello, {{name}}!',
    subtitle: 'Here is what is new today.',
    empty: 'Nothing here yet.',
  },
  itemDetails: {
    title: 'Details',
    createdAt: 'Created on {{date}}',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    languageSystem: 'System',
    about: 'About',
    environment: 'Environment',
    apiUrl: 'API',
    mockApi: 'Mock API',
    enabled: 'Enabled',
    disabled: 'Disabled',
    account: 'Account',
    signedInAs: 'Signed in as {{email}}',
    logout: 'Sign out',
  },
  tabs: {
    home: 'Home',
    settings: 'Settings',
  },
  languages: {
    en: 'English',
    ptBR: 'Português (Brasil)',
  },
};

type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]>;
};

export type Translations = DeepStringRecord<typeof en>;
