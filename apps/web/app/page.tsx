"use client";

import { useMemo, useState } from "react";

import { loadBundledScenario } from "../src/demo/loadScenario";
import { useDemoEngine } from "../src/demo/useDemoEngine";
import { moduleOne } from "../src/game/module1";

type Outfit = {
  id: string;
  name: string;
  top: string;
  bottom: string;
  accessory: string;
  avatar: string;
};

type LeaderboardEntry = {
  player: string;
  avatar: string;
  score: number;
  completedAt: string;
};

const outfits: Outfit[] = [
  { id: "o1", name: "Navy Ghost", top: "Moletom azul", bottom: "Calça tática", accessory: "Headset", avatar: "🧢" },
  { id: "o2", name: "Urban Cipher", top: "Jaqueta preta", bottom: "Jeans cinza", accessory: "Óculos", avatar: "🕶️" },
  { id: "o3", name: "Stealth Neon", top: "Blusa neon", bottom: "Calça cargo", accessory: "Pulseira NFC", avatar: "🧤" },
  { id: "o4", name: "Terminal White", top: "Camisa branca", bottom: "Calça azul", accessory: "Tablet", avatar: "🤍" },
  { id: "o5", name: "Ops Runner", top: "Corta-vento", bottom: "Jogger preta", accessory: "Relógio", avatar: "⌚" },
  { id: "o6", name: "Analyst Core", top: "Polo verde", bottom: "Calça bege", accessory: "Badge", avatar: "🪪" }
];

const scenarioResult = loadBundledScenario();

export default function HomePage() {
  const scenario = useMemo(() => (scenarioResult.ok ? scenarioResult.scenario : null), []);
  const [playerName, setPlayerName] = useState("");
  const [selectedOutfitId, setSelectedOutfitId] = useState(outfits[0]!.id);
  const [profileReady, setProfileReady] = useState(false);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  if (!scenario) {
    return <main><p>Erro ao carregar cenário.</p></main>;
  }

  const engine = useDemoEngine(scenario);
  const selectedOutfit = outfits.find((item) => item.id === selectedOutfitId) ?? outfits[0]!;
  const currentChallenge = moduleOne.challenges[completedChallengeIds.length] ?? null;
  const progress = Math.round((completedChallengeIds.length / moduleOne.challenges.length) * 100);
  const moduleComplete = completedChallengeIds.length === moduleOne.challenges.length;

  const runChallenge = async () => {
    if (!currentChallenge) {
      return;
    }

    const previousCount = engine.eventLog.length;
    await engine.dispatch(currentChallenge.actionType, currentChallenge.payload);

    if (engine.eventLog.length > previousCount) {
      setCompletedChallengeIds((prev) => [...prev, currentChallenge.id]);
    }
  };

  const saveScore = () => {
    if (!moduleComplete) {
      return;
    }

    const entry: LeaderboardEntry = {
      player: playerName,
      avatar: selectedOutfit.avatar,
      score: Number(engine.state.score ?? 0),
      completedAt: new Date().toISOString()
    };

    setLeaderboard((prev) => [entry, ...prev].sort((a, b) => b.score - a.score).slice(0, 10));
  };

  return (
    <main className="shell">
      <h1>Null Protocol · Plataforma Jogável</h1>
      <p className="muted">Primeiro módulo multiplayer de prática guiada em hacking ético.</p>

      <section className="card">
        <h2>Criação de personagem (sem conta)</h2>
        <div className="row">
          <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Digite seu nome" />
          <button type="button" onClick={() => setProfileReady(playerName.trim().length > 2)}>
            Confirmar
          </button>
        </div>
        <div className="outfits">
          {outfits.map((outfit) => (
            <button
              type="button"
              key={outfit.id}
              className={outfit.id === selectedOutfitId ? "outfit active" : "outfit"}
              onClick={() => setSelectedOutfitId(outfit.id)}
            >
              <strong>{outfit.avatar} {outfit.name}</strong>
              <span>{outfit.top} · {outfit.bottom} · {outfit.accessory}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card grid2">
        <article>
          <h2>{moduleOne.title}</h2>
          <p><strong>Entendimento da matéria:</strong> {moduleOne.subjectUnderstanding}</p>
          <p><strong>Explicação da ferramenta:</strong> {moduleOne.toolExplanation}</p>
          <p><strong>Explicação da fase:</strong> {moduleOne.phaseIntent}</p>
        </article>
        <article>
          <h3>Tutorial básico</h3>
          <ol>
            {moduleOne.tutorial.map((step) => (<li key={step}>{step}</li>))}
          </ol>
        </article>
      </section>

      <section className="card">
        <h2>Multiplayer</h2>
        <div className="row">
          <button type="button" onClick={() => engine.setMode("local")}>Modo local</button>
          <button type="button" onClick={() => engine.setMode("multiplayer")}>Modo multiplayer</button>
          <button type="button" onClick={() => void engine.createMultiplayerSession()}>Criar sessão</button>
          <button type="button" onClick={() => void engine.syncMultiplayerSession()}>Sincronizar</button>
          <input value={engine.sessionId} onChange={(event) => engine.setSessionId(event.target.value)} placeholder="Session ID" />
        </div>
      </section>

      <section className="card grid3">
        <article>
          <h3>Avatar</h3>
          <p className="avatar">{selectedOutfit.avatar}</p>
          <p>{playerName || "Operador sem nome"}</p>
        </article>
        <article>
          <h3>Placar</h3>
          <p>Pontos: <strong>{Number(engine.state.score ?? 0)}</strong></p>
          <p>Progresso: <strong>{progress}%</strong></p>
          <p>Eventos: <strong>{engine.eventLog.length}</strong></p>
        </article>
        <article>
          <h3>Dificuldade</h3>
          <p>Atual: <strong>{currentChallenge?.difficulty ?? "concluído"}</strong></p>
          <p>Nível de alerta: <strong>{Number(engine.state.alertLevel ?? 0)}</strong></p>
          <p>Fase: <strong>{Number(engine.state.phase ?? 0)}</strong></p>
        </article>
      </section>

      <section className="card">
        <h2>Desafios do módulo (10 iniciais)</h2>
        {currentChallenge ? (
          <article className="challenge">
            <p><strong>{currentChallenge.title}</strong> · {completedChallengeIds.length + 1}/10</p>
            <p>{currentChallenge.objective}</p>
            <p><strong>Paridade com a realidade:</strong> {currentChallenge.realityParity}</p>
            <p><strong>Aperfeiçoamento técnico:</strong> {currentChallenge.studyMaterial}</p>
            <p><strong>Referências:</strong> {currentChallenge.references.join(" · ")}</p>
            <button type="button" disabled={!profileReady} onClick={() => void runChallenge()}>
              Executar desafio
            </button>
          </article>
        ) : (
          <p>Você concluiu os 10 desafios deste módulo.</p>
        )}
      </section>

      <section className="card">
        <h2>Ranking da turma</h2>
        <button type="button" disabled={!moduleComplete} onClick={saveScore}>Salvar no ranking</button>
        <ul>
          {leaderboard.map((entry) => (
            <li key={`${entry.player}-${entry.completedAt}`}>{entry.avatar} {entry.player} · {entry.score} pts</li>
          ))}
        </ul>
      </section>

      {moduleComplete && (
        <section className="card certificate">
          <h2>Conclusão com certificação</h2>
          <p>{moduleOne.certification}</p>
          <p>Emitido para <strong>{playerName}</strong> ({selectedOutfit.name}).</p>
        </section>
      )}

      {engine.lastError && <p className="error">Erro da sessão: {engine.lastError}</p>}

      <style jsx>{`
        .shell { max-width: 980px; margin: 0 auto; padding: 1.2rem; display: grid; gap: 1rem; }
        .muted { color: #667085; }
        .card { border: 1px solid #d0d5dd; border-radius: 12px; padding: 1rem; background: #fff; }
        .row { display: flex; gap: .5rem; flex-wrap: wrap; }
        .grid2 { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 1rem; }
        .grid3 { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 1rem; }
        .outfits { display: grid; gap: .4rem; margin-top: .8rem; }
        .outfit { text-align: left; border: 1px solid #d0d5dd; padding: .6rem; border-radius: 10px; display: grid; }
        .outfit.active { border-color: #1570ef; background: #eff8ff; }
        .avatar { font-size: 2rem; margin: 0; }
        .challenge { background: #f8fafc; padding: .8rem; border-radius: 10px; }
        .certificate { border-color: #16a34a; background: #f0fdf4; }
        .error { color: #b42318; }
      `}</style>
    </main>
  );
}
