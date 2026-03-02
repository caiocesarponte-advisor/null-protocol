import { validateScenario } from "../src";
import type { Scenario } from "../src";

const validScenario: Scenario = {
  schemaVersion: "1",
  metadata: {
    id: "scenario-1",
    title: "Deterministic Scenario",
    difficulty: "easy",
    description: "A simple deterministic simulation"
  },
  initialState: {
    score: 0,
    flags: [],
    gateOpen: false
  },
  actions: [
    {
      type: "openGate",
      name: "Open Gate",
      payload: {
        reason: { type: "string", required: true }
      }
    }
  ],
  transitions: [
    {
      actionType: "openGate",
      preconditions: [{ path: "gateOpen", equals: false }],
      updates: [{ path: "gateOpen", op: "set", value: true }],
      scoreDelta: 10,
      setFlags: ["gate_opened"]
    }
  ],
  completionConditions: [{ type: "flag", flag: "gate_opened" }],
  scoringRules: [{ actionType: "openGate", points: 10 }],
  narrativeContent: [{ id: "intro", text: "Open the gate." }]
};

describe("ScenarioSchema validation", () => {
  it("valid scenario passes validation", () => {
    const result = validateScenario(validScenario);
    expect(result.success).toBe(true);
  });

  it("missing required fields fails with readable errors", () => {
    const result = validateScenario({ metadata: { id: "x", title: "x" } });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.join(" ")).toContain("schemaVersion");
      expect(result.errors.join(" ")).toContain("initialState");
    }
  });

  it("duplicate action types are rejected", () => {
    const result = validateScenario({
      ...validScenario,
      actions: [
        validScenario.actions[0],
        { ...validScenario.actions[0], name: "Duplicate Action" }
      ]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.join(" ")).toContain("Duplicate action type");
    }
  });

  it("transition referencing unknown action is rejected", () => {
    const result = validateScenario({
      ...validScenario,
      transitions: [
        {
          actionType: "unknownAction",
          updates: [{ path: "gateOpen", op: "set", value: true }],
          preconditions: []
        }
      ]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.join(" ")).toContain("unknown action type");
    }
  });
});
