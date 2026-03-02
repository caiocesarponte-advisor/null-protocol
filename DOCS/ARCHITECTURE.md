# ARCHITECTURE.md

## Monorepo layout
```text
apps/
  web/        # aplicação Next.js
  docs/       # documentação pública

packages/
  engine/     # núcleo determinístico
  scenario-kit/ # schemas e validação de cenários
  ui/         # componentes visuais e estado de tela
  content/    # cenários/campanhas versionados
  auth/       # OAuth, sessão, CSRF
  api/        # rotas e contratos HTTP

tooling/
  ci/
  eslint/
  tsconfig/
```

## Dependências permitidas
- `engine`: sem dependência de UI/API; apenas utilitários puros e validação.
- `ui`: pode depender de `engine` e `scenario-kit`.
- `api`: pode depender de `engine`, `auth`, `scenario-kit`, `content`.
- `content`: sem dependência de runtime web.

## Fluxo principal (Engine -> UI)
1. UI emite `ActionIntent`.
2. API/UI despacha para `engine.dispatch(action)`.
3. Engine valida ação + regras do cenário.
4. Engine resolve transição e persiste evento.
5. UI renderiza novo estado derivado do log/estado.

## Boundary rules
- Proibido acoplamento UI -> infra de segurança sensível.
- Proibido `engine` chamar rede/sistema operacional.
- Regras de cenário vivem em contratos declarativos versionados.
- Toda entrada externa passa por validação de schema (Zod).
