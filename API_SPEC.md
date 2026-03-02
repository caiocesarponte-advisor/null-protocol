# API_SPEC.md

## Princípios
- API segura, validada e orientada a simulação.
- Sem qualquer acesso a sistema externo operacional.

## Rotas
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/user/profile`
- `GET /api/campaigns`
- `POST /api/session/start`
- `POST /api/session/action`
- `GET /api/session/replay`

## Payloads (alto nível)
- Todos os payloads validados com Zod.
- Campos desconhecidos rejeitados (`strict`).
- IDs no formato UUID/ULID definido em contrato.

## Auth
- OAuth Google/Apple com PKCE.
- Sessão JWT com rotação.
- Cookie seguro (`httpOnly`, `Secure`, `SameSite=Strict`).
- CSRF token obrigatório em mutações.

## Rate limiting
- Por IP + userId em rotas protegidas.
- Janela curta para auth e ações de sessão.
- Excesso retorna `429` com código de erro padronizado.

## Logging
- Log de autenticação e eventos suspeitos.
- Sem armazenamento de segredos/token em texto puro.
- Correlação por `requestId`.

## Erros padronizados
```json
{
  "error": {
    "code": "INVALID_ACTION",
    "message": "Action is not allowed in this scenario.",
    "requestId": "req_..."
  }
}
```
