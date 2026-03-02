# Null Protocol

Null Protocol é um framework open source de simulação educacional em cibersegurança, com arquitetura determinística e sandboxed.

## Fonte de verdade
A especificação principal do projeto está em:
- `DOCS/AI_PROJECT_SPECIFICATION.md`

## Status do repositório
Atualmente o projeto está em **Phase 4 (runtime + loader + persistência simulada)**.

Já existem entregas funcionais de:
- validação de cenários (`@null-protocol/scenario-kit`),
- engine determinística com event log e replay (`@null-protocol/engine`),
- demo web com carregamento de cenário e persistência local simulada (`apps/web`).

O projeto continua seguindo os non-goals de segurança: **não há** integração com sistemas reais (autenticação real, scanning real, brute force, exploração, acesso a dispositivos, sockets de baixo nível etc.).

## Documentação
Todos os documentos de produto, arquitetura, segurança e entrega estão centralizados em `DOCS/`:

- `DOCS/PRD.md`
- `DOCS/Scope & Non-Goals.md`
- `DOCS/User Stories & Acceptance Criteria.md`
- `DOCS/ARCHITECTURE.md`
- `DOCS/ENGINE_DESIGN.md`
- `DOCS/SCENARIO_SPEC.md`
- `DOCS/API_SPEC.md`
- `DOCS/DATA_MODEL.md`
- `DOCS/SECURITY.md`
- `DOCS/ETHICAL_USE.md`
- `DOCS/THREAT_MODEL.md`
- `DOCS/PRIVACY.md`
- `DOCS/TEST_STRATEGY.md`
- `DOCS/CI_CD.md`
- `DOCS/CONTRIBUTING.md`

## Non-Goals (resumo)
Este projeto **não** implementa interação real com redes/sistemas (ex.: scanning real, packet sniffing, brute force, exploit automation, raw sockets, execução OS).

Todas as interações são simulações controladas pelo motor.


## Próximo marco recomendado
**Phase 5: UX da demo, empacotamento/distribuição e hardening de validação/replay.**
