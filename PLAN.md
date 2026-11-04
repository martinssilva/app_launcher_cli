# PLAN — rn-app-launcher

Plano vivo do projeto: objetivo, decisões, status, escopo dos templates e
próximos passos. Atualize-o (na `main`) sempre que um item mudar de estado.

- Repositório: https://github.com/martinssilva/app_launcher_cli
- Última atualização: 2026-11-04

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
- [x] Fluxo do template validado localmente (pack → `init --template` → typecheck, lint, 44 testes, bundles de release)
- [x] CLAUDE.md e PLAN.md
- [ ] CI verde na `main` (run #1 disparado em 2026-11-04; o build Android é a primeira validação nativa)
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

1. **Fechar a validação da base**
   - CI #1 verde (jobs `template` e `android`); se falhar, corrigir na `main`.
   - Roteiro manual (Android e iOS): a splash aparece e some; login pela API mock;
     erro de credencial (senha `wrong-password`); abas; detalhe de item; tema
     claro/escuro; idioma en/pt-BR; logout; fechar e reabrir o app mantém a sessão;
     `npm run start:staging` mostra "staging" em Configurações.
2. **Responder as questões da seção 7** que afetam a office (formulários e auth).
3. **Criar `template/office`** a partir da `main` e implementar o escopo da seção 5.1.
4. Seguir com shopping, finance e fitness, nessa ordem.

## 5. Escopo dos templates

Bibliotecas listadas são **propostas**: confirmar compatibilidade com RN 0.88 /
New Architecture antes de instalar.

### 5.1 `template/office` — app de escritório

- **Auth completa**: cadastro, esqueci/redefinir senha, perfil (editar dados), troca de senha; opcional: biometria para desbloquear a sessão.
- **Agenda/calendário**: visão mensal + lista do dia; criar, editar e excluir eventos.
- **Listas com filtros**: tarefas com busca (debounce), filtros por status/data/responsável, paginação infinita.
- **Upload de documentos**: escolher arquivo, enviar com progresso (multipart), listar e abrir.
- Rotas mock: `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `PATCH /me`, `/events`, `/tasks`, `/documents`.
- Bibliotecas: `react-native-calendars` (agenda), `@react-native-documents/picker` (seleção de arquivos), `react-native-keychain` (biometria e tokens no Keychain).

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

- Cadastro de alunos e treinos (CRUD) com `react-hook-form` + `zod`.
- **Modo offline**: fila de mutações persistida, sincronização ao reconectar (`@react-native-community/netinfo`), atualizações otimistas.
- Histórico/progresso: frequência (calendário) e evolução (gráficos, mesma biblioteca do finance).
- Rotas mock: `/members`, `/workouts`, `/sessions`.

## 6. Backlog da base (`main`)

Melhorias que servem a todos os templates: entram na `main` e chegam às branches por merge.

| Prioridade | Item                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Alta       | Validar o build nativo (CI Android + teste manual iOS)                                                                    |
| Alta       | Decidir se `react-hook-form` + `zod` entram na base (o login já é um formulário; office e fitness usam formulários)       |
| Média      | Tokens no Keychain (`react-native-keychain`) por trás do `TokenStorage`                                                   |
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

1. **Formulários na base?** Recomendação: sim. Adicionar `react-hook-form` + `zod` na `main` antes da office e migrar o login para eles.
2. **O que de "auth completa" sobe para a base?** Recomendação: cadastro e recuperação de senha na base (todo template precisa); biometria, 2FA e SSO ficam na office.
3. **Bibliotecas** de calendário (office) e de gráficos (finance/fitness): confirmar antes de instalar.
4. **Visibilidade do repositório**: precisa ser público para o `--template` funcionar sem autenticação git.
5. **Publicar no npm** (`rn-app-launcher`)? Daria versionamento semântico; com branches, tags git podem cumprir esse papel.

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
| Configuração nativa ainda não compilada (Android aguarda o CI; iOS sem CI)                   | Job Android no CI; roteiro manual no iOS antes da office                            |
| Bibliotecas nativas atreladas à versão do RN (ex.: Reanimated 4.7 só suporta RN 0.86 a 0.88) | Upgrades do RN sempre na `main`, com atualização conjunta e `npm run test:template` |
| Conflitos ao propagar a base para quatro branches                                            | Domínio isolado em `features/`, merges frequentes, `git config rerere.enabled true` |
| ESLint 8 e `redux-persist` sem suporte ativo                                                 | Itens do backlog; trocar quando houver alternativa estável                          |

## 11. Histórico

- **2026-11-04**: base criada (`91d7a18`); repositório renomeado para `app_launcher_cli` (`517def1`); `main` criada; CI #1 disparado; CLAUDE.md e PLAN.md adicionados.
