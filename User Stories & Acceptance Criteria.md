# User Stories & Acceptance Criteria

## 1) Módulo de Campanha
### História
Como estudante, quero seguir uma campanha com ordem e desbloqueios para evoluir gradualmente.

### Critérios de aceitação
- Dado um usuário autenticado, quando abre campanhas, então vê somente cenários desbloqueados.
- Dado conclusão de cenário com condições satisfeitas, então próximo cenário é desbloqueado.
- Score agregado da campanha é atualizado de forma determinística.

## 2) Módulo de Cenário
### História
Como estudante, quero executar ações permitidas em um cenário para praticar conceitos.

### Critérios de aceitação
- Ações fora de `allowedActions` são rejeitadas com erro padronizado.
- Transições seguem regras do cenário e não dependem de rede externa.
- Estado final e pontuação são reproduzíveis para mesma sequência de ações.

## 3) Módulo de Replay
### História
Como estudante, quero revisar sessões para entender decisões e melhorar desempenho.

### Critérios de aceitação
- Replay reconstrói estado passo a passo a partir do event log.
- Mesma seed + mesmos eventos => mesmo estado final.
- Log inclui timestamp lógico, ação, resultado e metadados auditáveis.

## 4) Módulo de Autenticação
### História
Como usuário, quero login seguro para acessar progresso e campanhas.

### Critérios de aceitação
- OAuth (Google/Apple) com PKCE e sessão JWT rotacionável.
- Cookies `httpOnly` e `SameSite=Strict`.
- Rotas protegidas validam sessão, schema de payload e rate limit.
- Eventos de autenticação são logados para auditoria.
