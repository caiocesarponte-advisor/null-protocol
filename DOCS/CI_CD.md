# CI_CD.md

## Pipelines obrigatórios (GitHub Actions)
1. Lint
2. Typecheck
3. Unit tests
4. Integration tests
5. E2E tests
6. Build
7. Dependency/security scan

## Branch protection
- `main` protegida.
- Merge apenas via PR.
- Required checks obrigatórios e verdes.
- Pelo menos 1 review aprovado.

## Automação
- Dependabot habilitado para dependências.
- Atualizações automáticas com PR e CI completo.
- Releases com Semantic Versioning.

## Estratégia de release
- Tag `vMAJOR.MINOR.PATCH`.
- Changelog com breaking changes e migrações.
