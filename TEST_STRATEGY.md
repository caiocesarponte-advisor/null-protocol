# TEST_STRATEGY.md

## Objetivos
- Garantir determinismo, segurança e estabilidade do produto.
- Impedir regressão que viole NON-GOALS.

## Pirâmide de testes
- **Unit:** engine, avaliador de regras, transições, validators.
- **Integration:** engine-ui, api-auth, sessão completa.
- **E2E (Playwright):** login, execução de cenário, replay.

## Cobertura mínima
- Meta global >= 85%.
- Engine e validação de cenários com cobertura mais alta (alvo >= 90%).

## O que testar por pacote
- `packages/engine`: determinismo, rejeição de ação inválida, replay.
- `packages/scenario-kit`: schema, versionamento, compatibilidade.
- `packages/api`: auth, rate limit, erros padronizados.
- `apps/web`: fluxos críticos de campanha/cenário/replay.

## Determinismo
- Testes com seed fixa.
- Snapshot de event log e estado final.
- Reexecução idempotente dos mesmos eventos.
