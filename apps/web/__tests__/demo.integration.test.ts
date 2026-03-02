import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createEngine, replayScenario, type EngineAction, type EngineEvent } from "@null-protocol/engine";

import scenarioJson from "../src/demo/scenario.json";
import { loadBundledScenario } from "../src/demo/loadScenario";

describe("web demo deterministic integration", () => {
  it("loads scenario.json, runs deterministic sequence, persists log and replays equal state", () => {
    const loaded = loadBundledScenario();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) {
      return;
    }

    const engine = createEngine({ scenario: loaded.scenario });

    const sequence: readonly EngineAction[] = [
      { type: "gainAccessToken", payload: { tokenLabel: "alpha" } },
      { type: "raiseAlert", payload: { nextLevel: 3 } },
      { type: "reduceAlert", payload: { nextLevel: 1 } },
      { type: "advancePhase" }
    ];

    for (const action of sequence) {
      const result = engine.dispatch(action);
      expect(result.ok).toBe(true);
    }

    const finalState = engine.getState();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "null-protocol-demo-"));
    const logPath = path.join(tempDir, "event-log.json");

    fs.writeFileSync(logPath, JSON.stringify(engine.getEventLog(), null, 2), "utf8");

    const persistedLog = JSON.parse(fs.readFileSync(logPath, "utf8")) as EngineEvent[];
    const replayedState = replayScenario({ scenario: scenarioJson, events: persistedLog });

    expect(replayedState).toEqual(finalState);
  });
});
