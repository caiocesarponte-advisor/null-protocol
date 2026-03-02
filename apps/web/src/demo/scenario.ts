import type { Scenario } from "@null-protocol/scenario-kit";

export const demoScenario: Scenario = {
  schemaVersion: "1.0.0",
  metadata: {
    id: "web-demo-safe-simulation-v1",
    title: "Deterministic Simulation Lab",
    description:
      "A safe, abstract learning scenario for testing deterministic state transitions in the browser.",
    difficulty: "easy"
  },
  initialState: {
    phase: 0,
    alertLevel: 0,
    score: 0,
    hasAccessToken: false,
    tokens: [],
    flags: []
  },
  actions: [
    {
      type: "gainAccessToken",
      name: "Gain Access Token",
      payload: {
        tokenLabel: { type: "string", required: true }
      }
    },
    {
      type: "raiseAlert",
      name: "Raise Alert",
      payload: {
        nextLevel: { type: "number", required: true }
      }
    },
    {
      type: "reduceAlert",
      name: "Reduce Alert",
      payload: {
        nextLevel: { type: "number", required: true }
      }
    },
    {
      type: "advancePhase",
      name: "Advance Phase",
      payload: {}
    },
    {
      type: "resetProgress",
      name: "Reset Progress",
      payload: {}
    }
  ],
  transitions: [
    {
      actionType: "gainAccessToken",
      preconditions: [{ path: "hasAccessToken", equals: false }],
      updates: [
        { path: "hasAccessToken", op: "set", value: true },
        { path: "tokens", op: "appendUnique", fromActionPayload: "tokenLabel" }
      ],
      scoreDelta: 2,
      setFlags: []
    },
    {
      actionType: "raiseAlert",
      preconditions: [],
      updates: [{ path: "alertLevel", op: "set", fromActionPayload: "nextLevel" }],
      scoreDelta: 1,
      setFlags: []
    },
    {
      actionType: "reduceAlert",
      preconditions: [],
      updates: [{ path: "alertLevel", op: "set", fromActionPayload: "nextLevel" }],
      scoreDelta: 1,
      setFlags: []
    },
    {
      actionType: "advancePhase",
      preconditions: [{ path: "hasAccessToken", equals: true }],
      updates: [{ path: "phase", op: "increment", amount: 1 }],
      scoreDelta: 2,
      setFlags: ["phaseAdvanced"]
    },
    {
      actionType: "resetProgress",
      preconditions: [],
      updates: [
        { path: "phase", op: "set", value: 0 },
        { path: "alertLevel", op: "set", value: 0 },
        { path: "score", op: "set", value: 0 },
        { path: "hasAccessToken", op: "set", value: false },
        { path: "tokens", op: "set", value: [] },
        { path: "flags", op: "set", value: [] }
      ],
      setFlags: []
    }
  ],
  completionConditions: [{ type: "scoreAtLeast", score: 6 }]
};
