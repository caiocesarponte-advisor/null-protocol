# SCENARIO_SPEC.md

## Schema mínimo
```ts
Scenario {
  schemaVersion: string;
  metadata: {
    id: string;
    title: string;
    difficulty: "easy" | "medium" | "hard";
    tags: string[];
  };
  initialState: Record<string, unknown>;
  allowedActions: ActionDefinition[];
  transitions: TransitionDefinition[];
  scoringRules: ScoringRule[];
  completionConditions: CompletionRule[];
  narrativeContent: NarrativeBlock[];
}
```

## Versionamento
- `schemaVersion` obrigatório (SemVer).
- Mudança incompatível => incremento de MAJOR.
- Compatível retroativo => MINOR/PATCH.
- Cenários antigos devem continuar válidos por adaptadores explícitos.

## Guidelines para autores
- Escrever somente lógica simulada e abstrata.
- Não incluir comandos operacionais, payloads reais ou exploit code.
- Fornecer narrativa pedagógica, contexto e objetivos claros.
- Incluir testes de validação de schema e completude de transições.
