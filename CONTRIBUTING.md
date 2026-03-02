# CONTRIBUTING.md

## Setup local
1. Instale Node LTS e Yarn.
2. Rode `yarn install` no monorepo.
3. Execute `yarn lint && yarn typecheck && yarn test`.

## Como criar cenário
1. Defina `schemaVersion` válido.
2. Preencha `metadata`, `initialState`, `allowedActions`, `transitions`.
3. Inclua `scoringRules`, `completionConditions`, `narrativeContent`.
4. Adicione testes de validação e replay determinístico.

## Padrões de PR
- PR pequeno, focado e com contexto.
- Descrever impacto em segurança e determinismo.
- Incluir evidências de testes.

## Checklist de contribuição
- [ ] Não viola NON-GOALS.
- [ ] Sem código operacional de ataque.
- [ ] TypeScript strict e validação de schema.
- [ ] Testes atualizados e CI verde.
- [ ] Documentação atualizada quando necessário.
