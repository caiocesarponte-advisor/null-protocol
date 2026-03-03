export interface ModuleChallenge {
  id: string;
  title: string;
  objective: string;
  realityParity: string;
  studyMaterial: string;
  references: string[];
  difficulty: "iniciante" | "intermediario";
  actionType: "gainAccessToken" | "raiseAlert" | "reduceAlert" | "advancePhase";
  payload?: Record<string, unknown>;
}

export interface LearningModule {
  id: string;
  title: string;
  subjectUnderstanding: string;
  toolExplanation: string;
  phaseIntent: string;
  tutorial: string[];
  certification: string;
  challenges: ModuleChallenge[];
}

export const moduleOne: LearningModule = {
  id: "modulo-01-fundamentos",
  title: "Módulo 01 · Fundamentos de Reconhecimento e Operação Segura",
  subjectUnderstanding:
    "Você vai aprender o fluxo mental de hacking ético: observar, validar hipótese, agir de forma controlada e registrar evidências.",
  toolExplanation:
    "A plataforma usa uma engine determinística de ações. Cada decisão gera um evento verificável, permitindo auditoria e treino multiplayer sem inconsistências.",
  phaseIntent:
    "A intenção da fase é construir disciplina técnica: reduzir ruído, manter rastreabilidade e avançar apenas com pré-condições atendidas.",
  tutorial: [
    "Crie seu personagem e selecione um avatar com combinação única de roupas.",
    "Escolha modo Local ou Multiplayer. No multiplayer, crie ou entre em uma sessão compartilhada.",
    "Leia o objetivo do desafio atual e execute a ação recomendada.",
    "Acompanhe placar, nível de alerta e progresso de fase no painel.",
    "Ao concluir os 10 desafios, finalize o módulo e emita sua certificação inicial."
  ],
  certification:
    "Certificação Inicial: Operador(a) de Simulação Ética - Módulo 01",
  challenges: [
    {
      id: "d1",
      title: "Mapear contexto inicial",
      objective: "Ganhe seu primeiro token de acesso controlado.",
      realityParity: "Equivalente ao reconhecimento autorizado e coleta inicial de credenciais temporárias.",
      studyMaterial: "Princípios de recon e registro de evidências.",
      references: ["OWASP Testing Guide v4", "NIST SP 800-115"],
      difficulty: "iniciante",
      actionType: "gainAccessToken",
      payload: { tokenLabel: "baseline" }
    },
    {
      id: "d2",
      title: "Sinalizar risco operacional",
      objective: "Eleve alerta para nível 1 para representar risco detectado.",
      realityParity: "Classificação inicial de risco durante teste controlado.",
      studyMaterial: "Risk rating e impacto em ambiente monitorado.",
      references: ["MITRE ATT&CK", "PTES"],
      difficulty: "iniciante",
      actionType: "raiseAlert",
      payload: { nextLevel: 1 }
    },
    {
      id: "d3",
      title: "Mitigar ruído",
      objective: "Reduza alerta para nível 0 após controle da operação.",
      realityParity: "Aplicação de contramedidas para reduzir detecção desnecessária.",
      studyMaterial: "Higiene operacional e stealth ético.",
      references: ["NIST CSF", "SANS SEC504"],
      difficulty: "iniciante",
      actionType: "reduceAlert",
      payload: { nextLevel: 0 }
    },
    {
      id: "d4",
      title: "Avanço autorizado de fase",
      objective: "Avance para fase 1 com pré-condições válidas.",
      realityParity: "Passagem de etapa com aprovação técnica e registro.",
      studyMaterial: "Gate de qualidade e checklist técnico.",
      references: ["OWASP SAMM", "ISO 27001 A.12"],
      difficulty: "iniciante",
      actionType: "advancePhase"
    },
    {
      id: "d5",
      title: "Calibração de severidade",
      objective: "Eleve alerta para nível 2 para simular incidente moderado.",
      realityParity: "Ajuste de severidade para decisão de resposta.",
      studyMaterial: "Priorização de incidentes.",
      references: ["FIRST CVSS", "NIST SP 800-61"],
      difficulty: "iniciante",
      actionType: "raiseAlert",
      payload: { nextLevel: 2 }
    },
    {
      id: "d6",
      title: "Resposta defensiva",
      objective: "Reduza alerta para nível 1 mantendo continuidade da operação.",
      realityParity: "Resposta incremental com mínimo impacto no cenário.",
      studyMaterial: "Playbooks de resposta e rollback seguro.",
      references: ["MITRE D3FEND", "SANS Incident Handler's Handbook"],
      difficulty: "iniciante",
      actionType: "reduceAlert",
      payload: { nextLevel: 1 }
    },
    {
      id: "d7",
      title: "Escalonamento controlado",
      objective: "Eleve alerta para nível 3 para testar resiliência do time.",
      realityParity: "Simulação de pressão operacional em ambiente controlado.",
      studyMaterial: "Escalonamento e comunicação técnica.",
      references: ["PagerDuty Incident Response", "NIST SP 800-84"],
      difficulty: "intermediario",
      actionType: "raiseAlert",
      payload: { nextLevel: 3 }
    },
    {
      id: "d8",
      title: "Normalização tática",
      objective: "Reduza alerta para nível 1 após estabilização.",
      realityParity: "Retorno à operação com monitoramento reforçado.",
      studyMaterial: "Estabilização pós-incidente.",
      references: ["ITIL Incident Management", "NIST SP 800-160"],
      difficulty: "intermediario",
      actionType: "reduceAlert",
      payload: { nextLevel: 1 }
    },
    {
      id: "d9",
      title: "Revalidação de acesso",
      objective: "Tente obter novo token e observe regras de pré-condição.",
      realityParity: "Testes de reuso de credencial e hardening de controles.",
      studyMaterial: "Gestão de identidade e least privilege.",
      references: ["NIST SP 800-53 AC", "OWASP ASVS"],
      difficulty: "intermediario",
      actionType: "gainAccessToken",
      payload: { tokenLabel: "secondary" }
    },
    {
      id: "d10",
      title: "Encerramento técnico",
      objective: "Avance mais uma fase para concluir o módulo.",
      realityParity: "Fechamento com evidência e relatório de lições aprendidas.",
      studyMaterial: "Relato técnico e recomendações.",
      references: ["PTES Reporting", "OWASP Reporting"],
      difficulty: "intermediario",
      actionType: "advancePhase"
    }
  ]
};
