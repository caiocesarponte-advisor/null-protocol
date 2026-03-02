# DATA_MODEL.md (Prisma/DB)

## Entidades principais

### User
- `id`
- `email` (único)
- `displayName`
- `provider` (google|apple)
- `createdAt`, `updatedAt`

### Campaign
- `id`
- `slug` (único)
- `title`
- `description`
- `version`

### ScenarioProgress
- `id`
- `userId` (FK User)
- `campaignId` (FK Campaign)
- `scenarioId`
- `status` (locked|unlocked|completed)
- `bestScore`
- `lastPlayedAt`

### Session
- `id`
- `userId` (FK User)
- `campaignId` (FK Campaign)
- `scenarioId`
- `seed`
- `startedAt`, `endedAt`

### EventLog
- `id`
- `sessionId` (FK Session)
- `sequence`
- `actionType`
- `actionPayload` (JSON)
- `resultState` (JSON/hash)
- `scoreDelta`
- `createdAt`

### Achievements
- `id`
- `userId` (FK User)
- `code`
- `awardedAt`

## Regras de modelagem
- `EventLog(sessionId, sequence)` deve ser único.
- Integridade referencial obrigatória.
- Índices para consultas de progresso e replay.
- Retenção mínima de dados pessoais (privacy-first).
