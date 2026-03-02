# PRD — Null Protocol

## 1. Problema
Aprendizado prático de cibersegurança costuma depender de ambientes reais, arriscados ou caros. O Null Protocol resolve isso com simulações determinísticas e sandboxed, sem interação com sistemas externos reais.

## 2. Público-alvo
- Estudantes de segurança (iniciante a intermediário)
- Instrutores e bootcamps
- Times de produto/engenharia que querem treinamento seguro

## 3. Proposta de valor
- Aprender ofensiva/defensiva em ambiente controlado
- Reprodutibilidade via replay determinístico
- Escalabilidade via cenários versionados
- Segurança e conformidade por design

## 4. Jornadas principais
1. **Onboarding e autenticação:** login OAuth seguro, criação de sessão.
2. **Campanha:** seleção de trilha, progressão por dificuldade e unlocks.
3. **Cenário:** execução de ações permitidas pelo motor, feedback imediato.
4. **Replay e aprendizado:** revisão de decisões e eventos para reflexão.

## 5. Limitações (hard constraints)
- Sem rede real, sniffing, execução OS, raw sockets ou automação de exploit.
- Conteúdo estritamente educacional, sem instruções operacionais reais.
- Toda ação é simulação validada por schema e regras de motor.

## 6. Critérios de sucesso
- Cobertura de testes >= 85% (unit/integration/e2e).
- Replays reproduzem resultados idênticos para mesma seed/event log.
- Zero funcionalidades fora dos NON-GOALS.
- Tempo de setup local baixo (DX padronizada no monorepo).

## 7. Roadmap
- **Fase 1 (MVP):** engine determinístico, campanhas básicas, auth, replay.
- **Fase 2:** achievements, telemetria privacy-first, cenários avançados.
- **Fase 3:** dashboard instrutor e analytics educacional.
- **Futuro:** multiplayer simulado e trilhas de certificação (sempre sandbox).
