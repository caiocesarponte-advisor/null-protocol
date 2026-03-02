# SECURITY.md

## Responsible Disclosure
- Reporte vulnerabilidades para: `security@null-protocol.example`.
- Inclua passos de reprodução, impacto e versão afetada.
- SLA alvo: triagem inicial em até 5 dias úteis.

## Escopo de segurança
- Segurança de aplicação, autenticação, autorização e integridade de replay.
- Não aceitamos relatórios de "abuso operacional" porque o produto não interage com alvos reais.

## Proibições explícitas no repositório
- Código de ataque real reutilizável.
- Ferramentas de exploração operacional.
- Qualquer acesso a rede/sistema operacional fora do contexto de app web padrão.
- Uso de `eval` dinâmico e execução de comandos de sistema.

## Política de correção
- Prioridade por severidade (Critical/High/Medium/Low).
- Correções devem incluir testes e notas de segurança.
