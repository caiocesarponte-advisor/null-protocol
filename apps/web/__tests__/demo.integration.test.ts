import {
  createEngine,
  replayScenario,
  verifyEventChain,
  type EngineAction,
  type EngineEvent
} from "@null-protocol/engine";

import scenarioJson from "../src/demo/scenario.json";
import { loadBundledScenario } from "../src/demo/loadScenario";

describe("web demo deterministic integration", () => {
  it("verifies integrity and replay, then detects corruption", () => {
    const loaded = loadBundledScenario();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const engine = createEngine({ scenario: loaded.scenario });

    const sequence: readonly EngineAction[] = [
      { type: "gainAccessToken", payload: { tokenLabel: "alpha" } },
      { type: "raiseAlert", payload: { nextLevel: 1 } },
      { type: "advancePhase" }
    ];

    for (const action of sequence) {
      const result = engine.dispatch(action);
      expect(result.ok).toBe(true);
    }

    const pristineLog = engine.getEventLog() as EngineEvent[];

    expect(verifyEventChain(pristineLog, engine.getInitialState())).toEqual({ ok: true });
    expect(
      replayScenario({ scenario: scenarioJson, events: pristineLog, verifyIntegrity: true })
    ).toEqual(engine.getState());

    const corrupted = structuredClone(pristineLog);
    corrupted[0]!.payload = { ...corrupted[0]!.payload, tokenLabel: "tampered" };

    const integrity = verifyEventChain(corrupted, engine.getInitialState());
    expect(integrity.ok).toBe(false);

    expect(() =>
      replayScenario({ scenario: scenarioJson, events: corrupted, verifyIntegrity: true })
    ).toThrow("Replay integrity check failed");
  });
});
