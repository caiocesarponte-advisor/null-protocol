# Scope & Non-Goals — Null Protocol

## Escopo do projeto
O Null Protocol cobre apenas simulação educacional determinística de conceitos de segurança ofensiva e defensiva.

### Incluído
- Motor de simulação local e determinístico
- Sistema de cenários com validação estrita
- Campanhas progressivas e achievements
- Replay de sessão via event log
- Auth segura para experiência de usuário

## Non-Goals (proibições absolutas)
Não implementar:
- Network scanning real
- Interação com Wi-Fi/NFC
- Packet sniffing
- Acesso a dispositivo/sistema operacional
- Brute force tooling
- Exploit automation
- Raw sockets
- Interação com sistemas externos

## Exemplos práticos
### ✅ Aceito
- "Simular enumeração de portas" com dados mockados no cenário.
- "Simular bypass de controle de acesso" com estados internos.
- "Simular hardening" com escolhas e pontuação.

### ❌ Proibido
- Rodar `nmap`, `aircrack`, `tcpdump` ou similares.
- Abrir sockets para hosts reais.
- Executar scripts de exploit contra serviços reais.
- Fornecer payload operacional reutilizável em ambiente real.

## Política de decisão
Se uma feature tiver ambiguidade entre simulação e operação real, **deve ser rejeitada** ou reformulada para simulação puramente abstrata.
