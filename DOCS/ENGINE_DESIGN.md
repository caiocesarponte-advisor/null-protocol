# ENGINE_DESIGN.md

## Contratos centrais
- `EngineState`: snapshot serializável e determinístico.
- `EngineAction`: ação solicitada pelo usuário (tipo + payload).
- `EngineEvent`: resultado da avaliação de ação.
- `TransitionResult`: próximo estado + score delta + flags.

## Pipeline de execução
1. Validar `EngineAction` contra `allowedActions`.
2. Avaliar pré-condições e regras.
3. Resolver transição de estado.
4. Registrar evento no `EventLog`.
5. Emitir estado atualizado.

## Replay
- Fonte de verdade: `EventLog` ordenado.
- Reconstrução: `initialState` + redução determinística dos eventos.
- Qualquer divergência invalida replay e gera erro de integridade.

## Invariantes
- Mesma entrada -> mesma saída (determinismo).
- Nenhuma ação inválida altera estado.
- Score não pode ser atualizado fora do resolver.
- Eventos são append-only e imutáveis.

## Decisões arquiteturais
- Event sourcing leve para auditabilidade e replay.
- Schema-first para cenários (Zod).
- Separação estrita entre conteúdo, regras e renderização.
