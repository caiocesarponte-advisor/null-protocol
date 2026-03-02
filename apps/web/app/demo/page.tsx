"use client";

import { createEngine, replayScenario, type EngineAction, type EngineEvent, type State } from "@null-protocol/engine";
import { useMemo, useState } from "react";

import { demoScenario } from "../../src/demo/scenario";

type ReplayStatus = "idle" | "ok" | "mismatch";

export default function DemoPage() {
  const engine = useMemo(() => createEngine({ scenario: demoScenario }), []);

  const [state, setState] = useState<State>(engine.getState());
  const [eventLog, setEventLog] = useState<readonly EngineEvent[]>(engine.getEventLog());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replayStatus, setReplayStatus] = useState<ReplayStatus>("idle");

  const [tokenLabel, setTokenLabel] = useState("alpha");
  const [raiseNextLevel, setRaiseNextLevel] = useState(1);
  const [reduceNextLevel, setReduceNextLevel] = useState(0);

  const syncFromEngine = () => {
    setState(engine.getState());
    setEventLog(engine.getEventLog());
  };

  const dispatch = (action: EngineAction) => {
    const result = engine.dispatch(action);
    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setErrorMessage(null);
    setReplayStatus("idle");
    syncFromEngine();
  };

  const reset = () => {
    engine.reset();
    setErrorMessage(null);
    setReplayStatus("idle");
    syncFromEngine();
  };

  const replay = () => {
    try {
      const replayed = replayScenario({ scenario: demoScenario, events: eventLog });
      const matches = JSON.stringify(replayed) === JSON.stringify(state);
      setReplayStatus(matches ? "ok" : "mismatch");
      setErrorMessage(null);
    } catch (error) {
      setReplayStatus("mismatch");
      setErrorMessage(error instanceof Error ? error.message : "Replay failed");
    }
  };

  return (
    <main style={{ fontFamily: "sans-serif", margin: "1.5rem", maxWidth: 900 }}>
      <h1>Phase 3 Demo: Deterministic Web Adapter</h1>
      <p>Safe simulation controls and deterministic replay verification.</p>

      <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label htmlFor="tokenLabel">Token label: </label>
          <input
            id="tokenLabel"
            value={tokenLabel}
            onChange={(event) => setTokenLabel(event.target.value)}
          />
          <button type="button" onClick={() => dispatch({ type: "gainAccessToken", payload: { tokenLabel } })}>
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
          <button
            type="button"
            onClick={() => dispatch({ type: "raiseAlert", payload: { nextLevel: raiseNextLevel } })}
          >
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
          <button
            type="button"
            onClick={() => dispatch({ type: "reduceAlert", payload: { nextLevel: reduceNextLevel } })}
          >
            reduceAlert
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => dispatch({ type: "advancePhase" })}>
            advancePhase
          </button>
          <button type="button" onClick={() => dispatch({ type: "resetProgress" })}>
            resetProgress
          </button>
          <button type="button" onClick={reset}>
            Reset session
          </button>
          <button type="button" onClick={replay}>
            Replay
          </button>
        </div>

        {replayStatus === "ok" && <p style={{ color: "green", margin: 0 }}>Replay OK</p>}
        {replayStatus === "mismatch" && <p style={{ color: "crimson", margin: 0 }}>Replay mismatch</p>}
      </section>

      {errorMessage && (
        <section
          style={{
            border: "1px solid #b22222",
            background: "#fff1f1",
            color: "#7f1d1d",
            padding: "0.75rem",
            marginBottom: "1rem"
          }}
        >
          <strong>Error:</strong> {errorMessage}
        </section>
      )}

      <section>
        <h2>Current State</h2>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </section>

      <section>
        <h2>Event Log</h2>
        <pre>{JSON.stringify(eventLog, null, 2)}</pre>
      </section>
    </main>
  );
}
