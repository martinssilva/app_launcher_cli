# PLAN — rn-app-launcher

Plano vivo do projeto: objetivo, decisões, status, escopo dos templates e
próximos passos. Atualize-o (na `main`) sempre que um item mudar de estado.

- Repositório: https://github.com/martinssilva/app_launcher_cli
- Última atualização: 2026-11-04 (formulários e auth na base)

## 1. Objetivo

Starter kit em **React Native CLI** (sem Expo) que funciona como base
("app_launcher") e, a partir dele, modelos de app especializados por tipo,
distribuídos como templates do RN CLI:

```bash
npx @react-native-community/cli@latest init MeuApp --template martinssilva/app_launcher_cli
npx @react-native-community/cli@latest init MeuApp --template martinssilva/app_launcher_cli#template/office
```

## 2. Decisões tomadas

| Tema         | Decisão                                                                                 | Motivo                                                                                    |
| ------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Toolchain    | React Native CLI 0.88.1 (New Architecture, Hermes), React 19, TypeScript estrito        | Controle total dos projetos nativos desde o início                                        |
| Organização  | Um repositório; `main` = base, `template/<nome>` = modelos                              | A base é mantida uma vez e propagada com `git merge main`                                 |
| Distribuição | `template.config.js` na raiz + pasta `template/` (placeholder `HelloWorld`)             | Formato exigido pelo `--template` do CLI                                                  |
| Estado       | Redux Toolkit + **RTK Query** (em vez de sagas)                                         | Cache, loading/erro e invalidação com pouco código; sagas/listeners entram só se precisar |
| Formulários  | `react-hook-form` + `zod` na base (`useZodForm`, `FormTextField`)                       | Login, office e fitness usam formulários; todos os templates herdam pelo merge            |
| Auth na base | Login, cadastro e recuperação de senha (código por e-mail)                              | Todo template precisa; a office cuida de perfil, troca de senha e domínio                 |
| HTTP         | Instância axios única + `axiosBaseQuery`; interceptors de token/refresh; `ApiError`     | Todas as requisições passam pelo mesmo caminho                                            |
| Persistência | `react-native-mmkv` v4 + `redux-persist` (`auth`, `settings`); tokens em `TokenStorage` | Rápido e síncrono; tokens isolados e prontos para ir ao Keychain                          |
| Ambientes    | `APP_ENV` (development/staging/production) embutido pelo Babel + config em TypeScript   | Sem configuração nativa por flavor/scheme                                                 |
| Backend      | API mock como adapter do axios (só em development)                                      | O app roda sem backend; rotas desconhecidas vão para a rede                               |
| i18n         | i18next + react-native-localize; `en` (fonte) e `pt-BR`                                 | Chaves tipadas: chave faltando é erro de compilação                                       |
| Qualidade    | ESLint 8.57 (flat config), Prettier 3, Jest 29 + RNTL v14, testIDs                      | ESLint 9 ainda quebra a config oficial do RN (plugin ft-flow)                             |
| CI           | Gera um app novo do template, valida e compila Android debug                            | Testa o mesmo fluxo que o usuário vai usar                                                |
| Licença      | MIT                                                                                     | —                                                                                         |
| Idioma       | Código, commits e READMEs em inglês; este plano em pt-BR                                | README público; planejamento interno                                                      |

## 3. Status

### Base (`main`)

- [x] Repositório criado (MIT) e renomeado de `app_laucher_cli` para `app_launcher_cli`
- [x] README completo (o que inclui, branches, como usar, como sincronizar)
- [x] app_launcher na `main` com a stack completa + `template.config.js`
- [x] Fluxo do template validado localmente (pack → `init --template` → typecheck, lint, testes, bundles de release)
- [x] CLAUDE.md e PLAN.md
- [x] CI verde na `main`, incluindo o primeiro build Android (runs #1 a #3)
- [ ] Formulários (`react-hook-form` + `zod`), cadastro e recuperação de senha na base (PR aberto)
- [ ] Teste manual no emulador Android e no simulador iOS (roteiro na seção 4)
- [ ] GitHub: preencher "About" e topics; proteger a `main` exigindo o CI

### Templates

| Branch              | Status    |
| ------------------- | --------- |
| `template/office`   | Próximo   |
| `template/shopping` | Planejado |
| `template/finance`  | Planejado |
| `template/fitness`  | Planejado |

## 4. Próximos passos

1. **Mergear na `main` o PR de formulários + cadastro + recuperação de senha.**
2. **Criar `template/office`** a partir da `main` (no GitHub) e implementar o escopo da seção 5.1.
3. **Teste manual da base** (Android e iOS): a splash aparece e some; login pela API mock;
   erro de credencial (senha `wrong-password`); cadastro; recuperação de senha
   (código `123456`); abas; detalhe de item; tema claro/escuro; idioma en/pt-BR;
   logout; fechar e reabrir o app mantém a sessão; `npm run start:staging`
   mostra "staging" em Configurações.
4. Seguir com shopping, finance e fitness, nessa ordem.

## 5. Escopo dos templates

Bibliotecas listadas são **propostas**: confirmar compatibilidade com RN 0.88 /
New Architecture antes de instalar.

### 5.1 `template/office` — app de escritório

- **Conta**: perfil (editar dados) e troca de senha. Cadastro e recuperação de senha já vêm da base. Biometria fica para uma versão futura.
- **Agenda/calendário**: visão mensal + lista do dia; criar, editar e excluir eventos.
- **Listas com filtros**: tarefas com busca (debounce), filtros por status/data/responsável, paginação infinita.
- **Upload de documentos**: escolher arquivo, enviar com progresso (multipart), listar e abrir.
- Rotas mock: `PATCH /me`, `POST /auth/change-password`, `/events`, `/tasks`, `/documents`.
- Bibliotecas (decididas): `react-native-calendars` (agenda) e `@react-native-documents/picker` (seleção de arquivos).

### 5.2 `template/shopping` — app de compras

- Catálogo (categorias, grade), detalhe do produto (galeria), busca com debounce e filtros.
- Favoritos e carrinho (slices persistidos: itens, quantidades, totais).
- Checkout (endereço, frete, pagamento simulado, resumo, confirmação) e histórico de pedidos.
- Rotas mock: `/products`, `/categories`, `/orders`.
- Bibliotecas: `@shopify/flash-list` (listas grandes); cache de imagens a avaliar.
- Persistência: incluir `cart` e `favorites` no `whitelist` do redux-persist.

### 5.3 `template/finance` — ações/cripto

- Cotações em tempo real via **WebSocket**: serviço com reconexão exponencial e heartbeat, inscrição por símbolo, integrado ao RTK Query (`onCacheEntryAdded` atualiza o cache a cada mensagem).
- Gráficos (linha e candle, por período), watchlist persistida, detalhe do ativo; opcional: alertas de preço.
- Mock: emissor local de cotações quando `env.useMockApi` (sem servidor); staging pode usar um feed público de cripto (a definir).
- Gráficos — decidir entre `react-native-wagmi-charts` (usa Reanimated + Gesture Handler, já na stack) e `victory-native` (exige `@shopify/react-native-skia`). A escolha vale também para o fitness.

### 5.4 `template/fitness` — cadastro/academia

- Cadastro de alunos e treinos (CRUD) com os formulários da base (`react-hook-form` + `zod`).
- **Modo offline**: fila de mutações persistida, sincronização ao reconectar (`@react-native-community/netinfo`), atualizações otimistas.
- Histórico/progresso: frequência (calendário) e evolução (gráficos, mesma biblioteca do finance).
- Rotas mock: `/members`, `/workouts`, `/sessions`.

## 6. Backlog da base (`main`)

Melhorias que servem a todos os templates: entram na `main` e chegam às branches por merge.

| Prioridade | Item                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Alta       | Teste manual no iOS (o build Android já passa no CI)                                                                      |
| Média      | Tokens no Keychain (`react-native-keychain`) por trás do `TokenStorage`; depois, biometria                                |
| Média      | `@react-native-community/netinfo` + `refetchOnReconnect` do RTK Query (base para o modo offline do fitness)               |
| Média      | Error boundary global (tela de erro inesperado)                                                                           |
| Média      | Testes E2E com Maestro usando os testIDs                                                                                  |
| Média      | Atualização automática de dependências (Renovate ou Dependabot)                                                           |
| Média      | CLAUDE.md próprio para os apps gerados (dentro de `template/`), explicando a arquitetura a quem usar o Claude Code no app |
| Baixa      | Job de CI iOS (runner macOS, sob demanda)                                                                                 |
| Baixa      | Tags de versão do template (ex.: `v0.1.0`) para permitir `--template ...#v0.1.0`                                          |
| Baixa      | Migrar para ESLint 9 quando `@react-native/eslint-config/flat` for corrigido                                              |
| Baixa      | Substituir `redux-persist` (sem manutenção ativa) se surgir problema                                                      |
| Baixa      | Ícones do app e guia de assinatura de release                                                                             |

## 7. Questões em aberto

Resolvidas em 2026-11-04: formulários (`react-hook-form` + `zod`) e cadastro/recuperação de senha
na base; office com `react-native-calendars` e `@react-native-documents/picker`, sem biometria
por enquanto; repositório público.

1. **Biblioteca de gráficos** (finance/fitness): `react-native-wagmi-charts` ou `victory-native`.
2. **Publicar no npm** (`rn-app-launcher`)? Daria versionamento semântico; com branches, tags git podem cumprir esse papel.

## 8. Fluxo de trabalho de um template

1. `main` com CI verde.
2. Criar `template/<nome>` a partir da `main`.
3. Código de domínio em `template/src/features/<dominio>/`; arquivos compartilhados (navegação, `rootReducer.ts`, locales, `testIDs.ts`, `package.json`) alterados só no necessário.
4. Rota mock para cada endpoint novo; textos em `en` e `pt-BR`; testIDs; testes.
5. `npm run validate` em `template/` e `npm run test:template` na raiz; CI verde.
6. Atualizar a tabela de branches do `README.md` (Planned → Available) e o `template/README.md`.
7. Sempre que a `main` mudar: `git merge origin/main` na branch do template.

## 9. Definição de pronto

- Typecheck, lint, testes e Prettier verdes; CI verde (jobs `template` e `android`).
- Funciona só com a API mock (sem backend).
- Telas com estados de carregamento, vazio e erro; textos traduzidos; testIDs.
- Nenhum `HelloWorld` fora dos lugares previstos; nenhum lockfile em `template/`.
- Documentação atualizada (README da raiz, `template/README.md`, este plano).

## 10. Riscos

| Risco                                                                                        | Mitigação                                                                           |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Build iOS ainda não verificado (o Android compila no CI)                                     | Roteiro manual no simulador iOS; job de CI iOS no backlog                           |
| Bibliotecas nativas atreladas à versão do RN (ex.: Reanimated 4.7 só suporta RN 0.86 a 0.88) | Upgrades do RN sempre na `main`, com atualização conjunta e `npm run test:template` |
| Conflitos ao propagar a base para quatro branches                                            | Domínio isolado em `features/`, merges frequentes, `git config rerere.enabled true` |
| ESLint 8 e `redux-persist` sem suporte ativo                                                 | Itens do backlog; trocar quando houver alternativa estável                          |

## 11. Histórico

- **2026-11-04**: CI verde na `main` (incluindo o build Android); decididos formulários e auth na base; PR com `react-hook-form` + `zod`, cadastro e recuperação de senha.
- **2026-11-04**: base criada (`91d7a18`); repositório renomeado para `app_launcher_cli` (`517def1`); `main` criada; CI #1 disparado; CLAUDE.md e PLAN.md adicionados.
