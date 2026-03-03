import type { Scenario } from "@null-protocol/scenario-kit";

import {
  createEngine,
  InvalidActionError,
  replayScenario,
  TransitionError,
  ValidationError,
  verifyEventChain
} from "../src";

const baseScenario: Scenario = {
  schemaVersion: "1",
  metadata: { id: "engine-1", title: "Engine Determinism", difficulty: "easy" },
  initialState: {
    score: 0,
    gateOpen: false,
    inventory: [],
    flags: []
  },
  actions: [
    {
      type: "openGate",
      name: "Open Gate",
      payload: { key: { type: "string", required: true } }
    },
    {
      type: "collectItem",
      name: "Collect Item",
      payload: { item: { type: "string", required: true } }
    }
  ],
  transitions: [
    {
      actionType: "openGate",
      preconditions: [{ path: "gateOpen", equals: false }],
      updates: [{ path: "gateOpen", op: "set", value: true }],
      scoreDelta: 5,
      setFlags: ["gate_opened"]
    },
    {
      actionType: "collectItem",
      preconditions: [{ path: "gateOpen", equals: true }],
      updates: [{ path: "inventory", op: "appendUnique", fromActionPayload: "item" }],
      scoreDelta: 2,
      setFlags: ["item_collected"]
    }
  ],
  completionConditions: [{ type: "flag", flag: "item_collected" }],
  scoringRules: [{ actionType: "collectItem", points: 2 }],
  narrativeContent: [{ id: "n1", text: "Collect the hidden item after opening the gate." }]
};

describe("engine determinism and replay", () => {
  it("Determinism: identical sequence yields identical logs and final states", () => {
    const run = () => {
      const engine = createEngine({ scenario: baseScenario });
      const actions = [
        { type: "openGate", payload: { key: "alpha" } },
        { type: "collectItem", payload: { item: "badge" } }
      ] as const;

      for (const action of actions) {
        const result = engine.dispatch(action);
        expect(result.ok).toBe(true);
      }

      return { state: engine.getState(), log: engine.getEventLog(), initialState: engine.getInitialState() };
    };

    const first = run();
    const second = run();

    expect(first.state).toEqual(second.state);
    expect(first.log).toEqual(second.log);
    expect(verifyEventChain(first.log, first.initialState)).toEqual({ ok: true });
  });

  it("Replay correctness: replay final state deep-equals engine final state", () => {
    const engine = createEngine({ scenario: baseScenario });
    engine.dispatch({ type: "openGate", payload: { key: "alpha" } });
    engine.dispatch({ type: "collectItem", payload: { item: "badge" } });

    const replayState = replayScenario({
      scenario: baseScenario,
      events: engine.getEventLog(),
      verifyIntegrity: true
    });
    expect(replayState).toEqual(engine.getState());
  });

  it("Invalid action: unknown action and invalid payload return errors", () => {
    const engine = createEngine({ scenario: baseScenario });
    const unknown = engine.dispatch({ type: "doesNotExist", payload: {} });
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.error).toBeInstanceOf(InvalidActionError);
    }

    const invalidPayload = engine.dispatch({ type: "openGate", payload: { key: 42 } });
    expect(invalidPayload.ok).toBe(false);
    if (!invalidPayload.ok) {
      expect(invalidPayload.error).toBeInstanceOf(ValidationError);
    }
  });

  it("Replay validation: corrupted event logs are rejected", () => {
    expect(() =>
      replayScenario({
        scenario: baseScenario,
        events: [{ eventIndex: 0, id: "evt-0", action: null, effects: [], stateHash: "broken" } as never]
      })
    ).toThrow("Corrupted event log");
  });

  it("Replay validation: incompatible scenarios are rejected", () => {
    const engine = createEngine({ scenario: baseScenario });
    engine.dispatch({ type: "openGate", payload: { key: "alpha" } });

    const incompatibleScenario: Scenario = {
      ...baseScenario,
      transitions: baseScenario.transitions.filter((transition) => transition.actionType !== "openGate")
    };

    expect(() => replayScenario({ scenario: incompatibleScenario, events: engine.getEventLog() })).toThrow(
      "No eligible transition found"
    );
  });

  it("Replay validation: state hash mismatch signals restoration regression", () => {
    const engine = createEngine({ scenario: baseScenario });
    engine.dispatch({ type: "openGate", payload: { key: "alpha" } });

    const corrupted = structuredClone(engine.getEventLog());
    corrupted[0]!.stateHash = "tampered";

    expect(() => replayScenario({ scenario: baseScenario, events: corrupted })).toThrow(TransitionError);
  });

  it("Transition rules: unmet preconditions fail and initialState stays immutable", () => {
    const originalState = structuredClone(baseScenario.initialState);
    const engine = createEngine({ scenario: baseScenario });

    const unmet = engine.dispatch({ type: "collectItem", payload: { item: "badge" } });
    expect(unmet.ok).toBe(false);

    expect(baseScenario.initialState).toEqual(originalState);
    expect(engine.getState()).toEqual(originalState);
  });

  it("verifyEventChain returns ok for intact logs", () => {
    const engine = createEngine({ scenario: baseScenario });
    engine.dispatch({ type: "openGate", payload: { key: "alpha" } });
    engine.dispatch({ type: "collectItem", payload: { item: "badge" } });

    expect(verifyEventChain(engine.getEventLog(), engine.getInitialState())).toEqual({ ok: true });
  });

  it("verifyEventChain fails at correct index when payload is tampered", () => {
    const engine = createEngine({ scenario: baseScenario });
    engine.dispatch({ type: "openGate", payload: { key: "alpha" } });
    engine.dispatch({ type: "collectItem", payload: { item: "badge" } });

    const tampered = structuredClone(engine.getEventLog());
    tampered[1]!.payload = { item: "hacked" };

    expect(verifyEventChain(tampered, engine.getInitialState())).toEqual({
      ok: false,
      index: 1,
      reason: "hash mismatch"
    });
  });

  it("verifyEventChain fails when removing event from middle", () => {
    const engine = createEngine({ scenario: baseScenario });
    engine.dispatch({ type: "openGate", payload: { key: "alpha" } });
    engine.dispatch({ type: "collectItem", payload: { item: "badge" } });

    const mutated = [...engine.getEventLog()];
    mutated.splice(0, 1);

    expect(verifyEventChain(mutated, engine.getInitialState())).toEqual({
      ok: false,
      index: 0,
      reason: "previousHash mismatch"
    });
  });
});
