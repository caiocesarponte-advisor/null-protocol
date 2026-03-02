# THREAT_MODEL.md

## Superfícies de ataque do app
- Autenticação (OAuth/JWT/cookies)
- APIs de sessão e replay
- Renderização UI (XSS)
- Persistência de eventos (tampering)

## Ameaças e mitigação
1. **Auth abuse / credential attacks**  
   Mitigação: rate limit, lockout progressivo, logs de risco.
2. **CSRF em rotas mutáveis**  
   Mitigação: token CSRF + SameSite=Strict + validação de origem.
3. **XSS em conteúdo narrativo**  
   Mitigação: sanitização/escaping e CSP.
4. **Injection (SQL/NoSQL/JSON)**  
   Mitigação: Prisma parametrizado + validação Zod strict.
5. **Replay tampering**  
   Mitigação: sequence monotônica, hash de integridade e assinatura opcional.
6. **Abuso de API**  
   Mitigação: throttling por IP/user e auditoria por requestId.

## Fora de escopo
- Ataques contra infraestrutura externa ao app.
- Vetores de exploração real de rede/sistema (non-goals).
