# Null Protocol

Null Protocol é um framework open source de simulação educacional em cibersegurança, com arquitetura determinística e sandboxed.

## Fonte de verdade
A especificação principal do projeto está em:
- `DOCS/AI_PROJECT_SPECIFICATION.md`

## Status do repositório
Atualmente o projeto está em **Phase 1 (foundations only)**: baseline de monorepo, toolchain e padrões de entrega.

Isso significa que nesta fase **não há** implementação de lógica real de engine, autenticação, banco de dados, sockets, acesso a dispositivos, NFC/Wi-Fi, scanning, brute force, exploração ou qualquer integração com sistemas reais.

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
