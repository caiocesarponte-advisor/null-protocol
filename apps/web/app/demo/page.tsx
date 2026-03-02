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

const EnginePanel = ({ scenario }: { scenario: Scenario }) => {
  const engine = useDemoEngine(scenario);
  const [replayStatus, setReplayStatus] = useState<"idle" | ReplayStatus>("idle");

  const [tokenLabel, setTokenLabel] = useState("alpha");
  const [raiseNextLevel, setRaiseNextLevel] = useState(1);
  const [reduceNextLevel, setReduceNextLevel] = useState(0);

  const runReplay = () => {
    const nextStatus = engine.replayCheck();
    setReplayStatus(nextStatus);
  };

  return (
    <>
      {engine.lastError && (
        <section
          style={{
            border: "1px solid #b22222",
            background: "#fff1f1",
            color: "#7f1d1d",
            padding: "0.75rem",
            marginBottom: "1rem"
          }}
        >
          <strong>Error:</strong> {engine.lastError}
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label htmlFor="tokenLabel">Token label: </label>
          <input id="tokenLabel" value={tokenLabel} onChange={(event) => setTokenLabel(event.target.value)} />
          <button type="button" onClick={() => engine.dispatch("gainAccessToken", { tokenLabel })}>
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
          <button type="button" onClick={() => engine.dispatch("raiseAlert", { nextLevel: raiseNextLevel })}>
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
          <button type="button" onClick={() => engine.dispatch("reduceAlert", { nextLevel: reduceNextLevel })}>
            reduceAlert
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => engine.dispatch("advancePhase")}>
            advancePhase
          </button>
          <button type="button" onClick={() => engine.dispatch("resetProgress")}>
            resetProgress
          </button>
          <button type="button" onClick={engine.reset}>
            Reset session
          </button>
          <button type="button" onClick={runReplay}>
            Replay
          </button>
        </div>

        {replayStatus === "ok" && <p style={{ color: "green", margin: 0 }}>Replay OK</p>}
        {replayStatus === "mismatch" && <p style={{ color: "crimson", margin: 0 }}>Replay mismatch</p>}
      </section>

      <section>
        <h2>Current State</h2>
        <pre>{JSON.stringify(engine.state, null, 2)}</pre>
      </section>

      <section>
        <h2>Event Log</h2>
        <pre>{JSON.stringify(engine.eventLog, null, 2)}</pre>
      </section>
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
    <main style={{ fontFamily: "sans-serif", margin: "1.5rem", maxWidth: 900 }}>
      <h1>Phase 4 Demo: Runtime + Loader + Persistence</h1>
      <p>Scenario source: {scenarioSourceLabel}</p>

      <section style={{ marginBottom: "1rem" }}>
        <h2>Scenario Loader</h2>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <button type="button" onClick={loadBundled}>
            Load bundled scenario.json
          </button>
          <button type="button" onClick={validateManualJson}>
            Validate and load pasted JSON
          </button>
        </div>
        <textarea
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          rows={16}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
      </section>

      {scenarioErrors.length > 0 && (
        <section
          style={{
            border: "1px solid #b22222",
            background: "#fff1f1",
            color: "#7f1d1d",
            padding: "0.75rem",
            marginBottom: "1rem"
          }}
        >
          <strong>Error:</strong>
          <ul>
            {scenarioErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      )}

      {activeScenario ? <EnginePanel scenario={activeScenario} /> : <p>Engine not initialized.</p>}
    </main>
  );
}
