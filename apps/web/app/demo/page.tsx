"use client";

import type { Scenario } from "@null-protocol/scenario-kit";
import { useMemo, useState } from "react";

import {
  getBundledScenarioText,
  loadBundledScenario,
  loadScenarioFromText,
  type LoadScenarioResult
} from "../../src/demo/loadScenario";
import { useDemoEngine, type ReplayStatus } from "../../src/demo/useDemoEngine";

const resolveScenarioErrors = (result: LoadScenarioResult): string[] => (result.ok ? [] : result.errors);

const toByte = (value: number): number => {
  const safe = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(255, Math.round(safe)));
};

const toBitString = (value: number): string => toByte(value).toString(2).padStart(8, "0");

const getMemoryCells = (state: Record<string, unknown>) => {
  const cpuAlert = toByte(Number(state["alertLevel"]));
  const progress = toByte(Number(state["phase"]));
  const tokenCount = toByte(Array.isArray(state["tokens"]) ? state["tokens"].length : 0);
  const logDepth = toByte(Number(state["eventCount"]));

  return [
    { address: "0x00", label: "CPU_ALERT", value: cpuAlert, tone: "var(--tone-accent)" },
    { address: "0x01", label: "PHASE_PTR", value: progress, tone: "var(--tone-success)" },
    { address: "0x02", label: "TOKEN_BUF", value: tokenCount, tone: "var(--tone-warn)" },
    { address: "0x03", label: "LOG_SIZE", value: logDepth, tone: "var(--tone-info)" }
  ];
};

const EnginePanel = ({ scenario }: { scenario: Scenario }) => {
  const engine = useDemoEngine(scenario);
  const [replayStatus, setReplayStatus] = useState<"idle" | ReplayStatus>("idle");

  const [tokenLabel, setTokenLabel] = useState("alpha");
  const [raiseNextLevel, setRaiseNextLevel] = useState(1);
  const [reduceNextLevel, setReduceNextLevel] = useState(0);
  const [exportBundle, setExportBundle] = useState<unknown | null>(null);

  const runReplay = () => {
    const nextStatus = engine.replayCheck();
    setReplayStatus(nextStatus);
  };

  const runAction = async (actionType: string, payload?: Record<string, unknown>) => {
    await engine.dispatch(actionType, payload);
  };

  const memoryCells = getMemoryCells(engine.state as Record<string, unknown>);

  return (
    <>
      {engine.lastError && (
        <section className="panel error-panel">
          <strong>Erro:</strong> {engine.lastError}
        </section>
      )}

      <section className="panel hardware-overview">
        <div>
          <p className="eyebrow">Pipeline de Execução</p>
          <h2>Visão de Hardware da sessão</h2>
          <p className="muted">Cada ação move estados como bytes vivos: registradores, memória e barramento em tempo real.</p>
        </div>

        <div className="bus-strip" aria-hidden>
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={`bus-${index}`} className="bus-pulse" style={{ animationDelay: `${index * 0.08}s` }} />
          ))}
        </div>

        <div className="stats-grid">
          <article className="metric-card">
            <p>Modo</p>
            <strong>{engine.mode.toUpperCase()}</strong>
          </article>
          <article className="metric-card">
            <p>Integridade</p>
            <strong>{engine.integrity.ok ? "SINAL LIMPO" : "CORROMPIDO"}</strong>
          </article>
          <article className="metric-card">
            <p>Eventos</p>
            <strong>{engine.eventLog.length}</strong>
          </article>
          <article className="metric-card">
            <p>Tokens</p>
            <strong>{Array.isArray((engine.state as Record<string, unknown>)["tokens"]) ? ((engine.state as Record<string, unknown>)["tokens"] as unknown[]).length : 0}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Execution Mode</h2>
        <div className="actions-row">
          <button type="button" onClick={() => engine.setMode("local")}>
            Local mode
          </button>
          <button type="button" onClick={() => engine.setMode("multiplayer")}>
            Multiplayer mode
          </button>
          <button type="button" onClick={() => void engine.createMultiplayerSession()}>
            Create server session
          </button>
        </div>
        <div className="actions-row align-center">
          <label htmlFor="sessionId">Session ID:</label>
          <input
            id="sessionId"
            value={engine.sessionId}
            onChange={(event) => engine.setSessionId(event.target.value)}
            placeholder="Paste an existing sessionId"
          />
          <button type="button" onClick={() => void engine.syncMultiplayerSession()}>
            Join / Sync session
          </button>
          <button
            type="button"
            onClick={() =>
              void engine
                .exportSession()
                .then((bundle) => setExportBundle(bundle))
                .catch((error: unknown) => {
                  setExportBundle(null);
                  const message = error instanceof Error ? error.message : "Failed to export session.";
                  console.error(message);
                })
            }
          >
            Export session
          </button>
        </div>
        <p className="muted">Current mode: {engine.mode}</p>
        <p className="muted">scenarioId: {engine.sessionScenarioId || "-"}</p>
        <p className="muted">scenarioVersion: {engine.sessionScenarioVersion || "-"}</p>
        <p className="muted">scenarioHash: {engine.sessionScenarioHash || "-"}</p>
      </section>

      <section className="panel memory-panel">
        <h2>Memória e Bits</h2>
        <div className="memory-grid">
          {memoryCells.map((cell, cellIndex) => {
            const bits = toBitString(cell.value).split("");
            return (
              <article key={cell.address} className="memory-card" style={{ ["--cell-tone" as string]: cell.tone, animationDelay: `${cellIndex * 0.08}s` }}>
                <header>
                  <span>{cell.address}</span>
                  <strong>{cell.label}</strong>
                  <em>{cell.value}</em>
                </header>
                <div className="bit-lane">
                  {bits.map((bit, bitIndex) => (
                    <span
                      key={`${cell.address}-${bitIndex}`}
                      className={`bit ${bit === "1" ? "on" : "off"}`}
                      style={{ animationDelay: `${bitIndex * 0.04}s` }}
                    >
                      {bit}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label htmlFor="tokenLabel">Token label: </label>
          <input id="tokenLabel" value={tokenLabel} onChange={(event) => setTokenLabel(event.target.value)} />
          <button type="button" onClick={() => void runAction("gainAccessToken", { tokenLabel })}>
            gainAccessToken
          </button>
        </div>

        <div>
          <label htmlFor="raiseNextLevel">Raise alert to: </label>
          <input
            id="raiseNextLevel"
            type="number"
            value={raiseNextLevel}
            onChange={(event) => setRaiseNextLevel(Number(event.target.value))}
          />
          <button type="button" onClick={() => void runAction("raiseAlert", { nextLevel: raiseNextLevel })}>
            raiseAlert
          </button>
        </div>

        <div>
          <label htmlFor="reduceNextLevel">Reduce alert to: </label>
          <input
            id="reduceNextLevel"
            type="number"
            value={reduceNextLevel}
            onChange={(event) => setReduceNextLevel(Number(event.target.value))}
          />
          <button type="button" onClick={() => void runAction("reduceAlert", { nextLevel: reduceNextLevel })}>
            reduceAlert
          </button>
        </div>

        <div className="actions-row">
          <button type="button" onClick={() => void runAction("advancePhase")}>
            advancePhase
          </button>
          <button type="button" onClick={() => void runAction("resetProgress")}>
            resetProgress
          </button>
          <button type="button" onClick={engine.reset}>
            Reset session
          </button>
          <button type="button" onClick={runReplay}>
            Replay
          </button>
          <button type="button" onClick={engine.corruptLog}>
            Corrupt log (for test)
          </button>
        </div>

        {replayStatus === "ok" && <p style={{ color: "#22c55e", margin: 0 }}>Replay OK</p>}
        {replayStatus === "mismatch" && <p style={{ color: "#ef4444", margin: 0 }}>Replay mismatch</p>}
      </section>

      <section className="panel">
        <strong>
          Integrity: {engine.integrity.ok ? "OK" : `CORRUPTED (event ${engine.integrity.index}: ${engine.integrity.reason})`}
        </strong>
      </section>
      <section className="panel">
        <h2>Current State</h2>
        <pre>{JSON.stringify(engine.state, null, 2)}</pre>
      </section>

      <section className="panel">
        <h2>Event Log</h2>
        <pre>{JSON.stringify(engine.eventLog, null, 2)}</pre>
      </section>

      {exportBundle && (
        <section className="panel">
          <h2>Export bundle</h2>
          <pre>{JSON.stringify(exportBundle, null, 2)}</pre>
        </section>
      )}
    </>
  );
};

export default function DemoPage() {
  const [jsonInput, setJsonInput] = useState(getBundledScenarioText());
  const [scenarioSourceLabel, setScenarioSourceLabel] = useState("Bundled scenario.json");
  const [scenarioErrors, setScenarioErrors] = useState<string[]>([]);

  const initialScenario = useMemo(() => {
    const bundled = loadBundledScenario();
    if (!bundled.ok) {
      return null;
    }

    return bundled.scenario;
  }, []);

  const [activeScenario, setActiveScenario] = useState<Scenario | null>(initialScenario);

  const applyScenario = (result: LoadScenarioResult, sourceLabel: string) => {
    if (!result.ok) {
      setScenarioErrors(resolveScenarioErrors(result));
      return;
    }

    setActiveScenario(result.scenario);
    setScenarioSourceLabel(sourceLabel);
    setScenarioErrors([]);
  };

  const loadBundled = () => {
    setJsonInput(getBundledScenarioText());
    applyScenario(loadBundledScenario(), "Bundled scenario.json");
  };

  const validateManualJson = () => {
    applyScenario(loadScenarioFromText(jsonInput), "Manual JSON");
  };

  return (
    <main className="demo-shell">
      <h1>Null Protocol Hardware Console</h1>
      <p className="muted">Scenario source: {scenarioSourceLabel}</p>

      <section className="panel">
        <h2>Scenario Loader</h2>
        <div className="actions-row">
          <button type="button" onClick={loadBundled}>
            Load bundled scenario.json
          </button>
          <button type="button" onClick={validateManualJson}>
            Validate and load pasted JSON
          </button>
        </div>
        <textarea value={jsonInput} onChange={(event) => setJsonInput(event.target.value)} rows={16} />
      </section>

      {scenarioErrors.length > 0 && (
        <section className="panel error-panel">
          <strong>Error:</strong>
          <ul>
            {scenarioErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      )}

      {activeScenario ? <EnginePanel scenario={activeScenario} /> : <p>Engine not initialized.</p>}

      <style jsx global>{`
        :root {
          --bg: #05070f;
          --panel: rgba(12, 18, 38, 0.82);
          --border: rgba(112, 190, 255, 0.26);
          --text: #e5ecff;
          --muted: #9eaacc;
          --tone-accent: #7dd3fc;
          --tone-success: #34d399;
          --tone-warn: #fbbf24;
          --tone-info: #c084fc;
        }

        body {
          margin: 0;
          background:
            radial-gradient(circle at 20% 0%, rgba(58, 110, 255, 0.22), transparent 34%),
            radial-gradient(circle at 85% 10%, rgba(12, 194, 180, 0.15), transparent 36%),
            var(--bg);
          color: var(--text);
          font-family: Inter, "Segoe UI", system-ui, -apple-system, sans-serif;
          min-height: 100vh;
        }

        .demo-shell {
          margin: 0 auto;
          padding: 2rem 1.2rem 4rem;
          max-width: 1080px;
          display: grid;
          gap: 1rem;
        }

        .panel {
          border: 1px solid var(--border);
          background: var(--panel);
          border-radius: 16px;
          padding: 1rem;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02), 0 14px 32px rgba(1, 4, 15, 0.45);
          backdrop-filter: blur(8px);
        }

        .error-panel {
          border-color: rgba(244, 63, 94, 0.45);
          background: rgba(90, 20, 40, 0.35);
        }

        .muted {
          color: var(--muted);
        }

        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.74rem;
          color: #89b9ff;
          margin-bottom: 0.25rem;
        }

        .hardware-overview {
          display: grid;
          gap: 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.7rem;
        }

        .metric-card {
          border: 1px solid rgba(152, 190, 255, 0.22);
          border-radius: 12px;
          padding: 0.7rem;
          background: rgba(10, 25, 50, 0.5);
          animation: float 2.8s ease-in-out infinite;
        }

        .metric-card p {
          margin: 0;
          color: var(--muted);
          font-size: 0.84rem;
        }

        .metric-card strong {
          margin-top: 0.2rem;
          display: block;
          font-size: 1rem;
        }

        .bus-strip {
          display: grid;
          grid-template-columns: repeat(20, 1fr);
          gap: 0.28rem;
        }

        .bus-pulse {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(126, 196, 255, 0.25), rgba(126, 196, 255, 0.95));
          animation: pulse 1.5s ease-in-out infinite;
        }

        .memory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .memory-card {
          border: 1px solid color-mix(in srgb, var(--cell-tone), transparent 55%);
          border-radius: 14px;
          padding: 0.75rem;
          background: linear-gradient(145deg, rgba(13, 20, 42, 0.85), rgba(7, 11, 27, 0.9));
          animation: rise 0.44s ease-out both;
        }

        .memory-card header {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.6rem;
        }

        .memory-card span {
          color: var(--muted);
          font-size: 0.82rem;
        }

        .memory-card strong {
          font-size: 0.92rem;
          letter-spacing: 0.02em;
        }

        .memory-card em {
          color: var(--cell-tone);
          font-style: normal;
          font-weight: 700;
        }

        .bit-lane {
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 0.25rem;
        }

        .bit {
          border-radius: 8px;
          text-align: center;
          font-size: 0.8rem;
          padding: 0.35rem 0;
          border: 1px solid rgba(255, 255, 255, 0.16);
          transition: transform 160ms ease, box-shadow 200ms ease;
        }

        .bit.on {
          background: color-mix(in srgb, var(--cell-tone), #ffffff 12%);
          color: #05121f;
          box-shadow: 0 0 14px color-mix(in srgb, var(--cell-tone), transparent 40%);
          animation: glow 1.4s ease-in-out infinite;
        }

        .bit.off {
          background: rgba(80, 94, 130, 0.24);
          color: #95a3c2;
        }

        .actions-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .align-center {
          align-items: center;
        }

        button,
        input,
        textarea {
          border-radius: 10px;
          border: 1px solid rgba(143, 184, 255, 0.32);
          background: rgba(6, 15, 30, 0.88);
          color: var(--text);
          padding: 0.52rem 0.68rem;
        }

        button {
          cursor: pointer;
          transition: transform 120ms ease, border-color 160ms ease;
        }

        button:hover {
          transform: translateY(-1px);
          border-color: rgba(147, 225, 255, 0.75);
        }

        input#sessionId {
          min-width: 320px;
        }

        textarea {
          width: 100%;
          font-family: "SFMono-Regular", ui-monospace, Menlo, monospace;
        }

        pre {
          max-height: 280px;
          overflow: auto;
          background: rgba(3, 10, 24, 0.75);
          padding: 0.8rem;
          border-radius: 10px;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.28;
            transform: scaleX(0.86);
          }
          50% {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        @keyframes glow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1px);
          }
        }

        @keyframes rise {
          from {
            transform: translateY(6px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
      `}</style>
    </main>
  );
}
