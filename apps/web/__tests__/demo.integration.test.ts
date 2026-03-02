import { createEngine, replayScenario } from "@null-protocol/engine";

import { demoScenario } from "../src/demo/scenario";

describe("web demo deterministic integration", () => {
  it("dispatches actions and replays to the same final state", () => {
    const engine = createEngine({ scenario: demoScenario });

    const sequence = [
      { type: "gainAccessToken", payload: { tokenLabel: "alpha" } },
      { type: "raiseAlert", payload: { nextLevel: 3 } },
      { type: "reduceAlert", payload: { nextLevel: 1 } },
      { type: "advancePhase" }
    ] as const;

    for (const action of sequence) {
      const result = engine.dispatch(action);
      expect(result.ok).toBe(true);
    }

    expect(engine.getState()).toEqual({
      phase: 1,
      alertLevel: 1,
      score: 6,
      hasAccessToken: true,
      tokens: ["alpha"],
      flags: ["phaseAdvanced"]
    });

    const eventLog = engine.getEventLog();
    const replayedState = replayScenario({ scenario: demoScenario, events: eventLog });

    expect(replayedState).toEqual(engine.getState());
  });
});
