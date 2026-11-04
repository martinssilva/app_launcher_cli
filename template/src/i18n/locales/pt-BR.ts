import type { Translations } from './en';

export const ptBR: Translations = {
  common: {
    retry: 'Tentar novamente',
    loading: 'Carregando…',
  },
  errors: {
    network:
      'Sem conexão com a internet. Verifique sua rede e tente novamente.',
    timeout: 'O servidor demorou muito para responder. Tente novamente.',
    unauthorized: 'Sua sessão expirou. Entre novamente.',
    forbidden: 'Você não tem permissão para fazer isso.',
    notFound: 'Não encontramos o que você procurava.',
    validation: 'Alguns dados são inválidos. Revise e tente novamente.',
    server: 'Algo deu errado do nosso lado. Tente novamente mais tarde.',
    unknown: 'Algo deu errado. Tente novamente.',
  },
  auth: {
    title: 'Bem-vindo de volta',
    subtitle: 'Entre para continuar',
    email: 'E-mail',
    emailPlaceholder: 'voce@exemplo.com',
    password: 'Senha',
    passwordPlaceholder: 'Sua senha',
    submit: 'Entrar',
    invalidEmail: 'Informe um e-mail válido.',
    passwordTooShort: 'A senha deve ter pelo menos {{min}} caracteres.',
    invalidCredentials: 'E-mail ou senha inválidos.',
    mockHint:
      'API mock ativa: qualquer e-mail com senha de 6+ caracteres faz login.',
  },
  home: {
    title: 'Início',
    greeting: 'Olá, {{name}}!',
    subtitle: 'Veja as novidades de hoje.',
    empty: 'Nada por aqui ainda.',
  },
  itemDetails: {
    title: 'Detalhes',
    createdAt: 'Criado em {{date}}',
  },
  settings: {
    title: 'Configurações',
    appearance: 'Aparência',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    language: 'Idioma',
    languageSystem: 'Sistema',
    about: 'Sobre',
    environment: 'Ambiente',
    apiUrl: 'API',
    mockApi: 'API mock',
    enabled: 'Ativada',
    disabled: 'Desativada',
    account: 'Conta',
    signedInAs: 'Conectado como {{email}}',
    logout: 'Sair',
  },
  tabs: {
    home: 'Início',
    settings: 'Ajustes',
  },
  languages: {
    en: 'English',
    ptBR: 'Português (Brasil)',
  },
};
