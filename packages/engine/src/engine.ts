import {
  type Scenario,
  type ScenarioActionDefinition,
  type ScenarioTransition,
  validateScenario
} from "@null-protocol/scenario-kit";

import { InvalidActionError, TransitionError, ValidationError } from "./errors";
import type {
  DispatchResult,
  EngineAction,
  EngineEvent,
  EngineParams,
  EventEffect,
  EventLogEntryV1,
  State,
  VerifyEventChainResult
} from "./types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
};

const rightRotate = (value: number, amount: number): number =>
  (value >>> amount) | (value << (32 - amount));

const sha256Fallback = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;

  const messageLength = (((bytes.length + 9 + 63) >> 6) << 6);
  const message = new Uint8Array(messageLength);
  message.set(bytes);
  message[bytes.length] = 0x80;

  const view = new DataView(message.buffer);
  view.setUint32(message.length - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(message.length - 4, bitLength >>> 0, false);

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
    0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
    0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
    0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
    0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
    0xc67178f2
  ];

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let i = 0; i < message.length; i += 64) {
    for (let j = 0; j < 16; j += 1) {
      w[j] = view.getUint32(i + j * 4, false);
    }

    for (let j = 16; j < 64; j += 1) {
      const s0 = rightRotate(w[j - 15] as number, 7) ^ rightRotate(w[j - 15] as number, 18) ^ ((w[j - 15] as number) >>> 3);
      const s1 = rightRotate(w[j - 2] as number, 17) ^ rightRotate(w[j - 2] as number, 19) ^ ((w[j - 2] as number) >>> 10);
      w[j] = (((w[j - 16] as number) + s0 + (w[j - 7] as number) + s1) >>> 0);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let j = 0; j < 64; j += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + (k[j] as number) + (w[j] as number)) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const toHex = (value: number): string => value.toString(16).padStart(8, "0");
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
};

const sha256Hex = (input: string): string => sha256Fallback(input);

const getPath = (state: Record<string, unknown>, path: string): unknown => {
  const segments = path.split(".");
  let current: unknown = state;

  for (const segment of segments) {
    if (!segment) {
      return undefined;
    }

    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
};

const setPath = (state: Record<string, unknown>, path: string, value: unknown): void => {
  const segments = path.split(".");
  const lastSegment = segments.at(-1);
  if (!lastSegment) {
    return;
  }

  let current: Record<string, unknown> = state;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!segment) {
      return;
    }

    const next = current[segment];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[lastSegment] = value;
};

const applyEffects = (state: State, effects: readonly EventEffect[]): State => {
  const nextState = clone(state);

  for (const effect of effects) {
    if (effect.op === "set") {
      setPath(nextState, effect.path, clone(effect.value));
      continue;
    }

    if (effect.op === "increment") {
      const current = getPath(nextState, effect.path);
      const amount = typeof effect.value === "number" ? effect.value : 0;
      if (typeof current !== "number") {
        throw new TransitionError(`Cannot increment non-numeric path '${effect.path}'`);
      }
      setPath(nextState, effect.path, current + amount);
      continue;
    }

    if (effect.op === "appendUnique") {
      const current = getPath(nextState, effect.path);
      if (!Array.isArray(current)) {
        throw new TransitionError(`Cannot appendUnique non-array path '${effect.path}'`);
      }

      const values = Array.isArray(effect.value) ? effect.value : [effect.value];
      let nextArray = [...current];
      for (const value of values) {
        const cloned = clone(value);
        if (!nextArray.some((item) => stableStringify(item) === stableStringify(cloned))) {
          nextArray = [...nextArray, cloned];
        }
      }
      setPath(nextState, effect.path, nextArray);
    }
  }

  return nextState;
};

const matchesPreconditions = (state: State, transition: ScenarioTransition): boolean =>
  transition.preconditions.every((condition) => {
    const current = getPath(state, condition.path);

    if (condition.equals !== undefined && stableStringify(current) !== stableStringify(condition.equals)) {
      return false;
    }

    if (condition.truthy !== undefined && Boolean(current) !== condition.truthy) {
      return false;
    }

    if (condition.gte !== undefined && (typeof current !== "number" || current < condition.gte)) {
      return false;
    }

    if (condition.lte !== undefined && (typeof current !== "number" || current > condition.lte)) {
      return false;
    }

    return true;
  });

const validatePayload = (
  action: EngineAction,
  definition: ScenarioActionDefinition
): ValidationError | null => {
  const payload = action.payload ?? {};

  for (const [field, fieldSchema] of Object.entries(definition.payload)) {
    const value = payload[field];
    if (fieldSchema.required && value === undefined) {
      return new ValidationError(`Payload field '${field}' is required for action '${action.type}'`);
    }

    if (value === undefined) {
      continue;
    }

    if (fieldSchema.type === "array" && !Array.isArray(value)) {
      return new ValidationError(`Payload field '${field}' must be of type array`);
    }

    if (fieldSchema.type === "null" && value !== null) {
      return new ValidationError(`Payload field '${field}' must be null`);
    }

    if (fieldSchema.type === "object" && (typeof value !== "object" || value === null || Array.isArray(value))) {
      return new ValidationError(`Payload field '${field}' must be of type object`);
    }

    if (
      ["string", "number", "boolean"].includes(fieldSchema.type) &&
      typeof value !== fieldSchema.type
    ) {
      return new ValidationError(`Payload field '${field}' must be of type ${fieldSchema.type}`);
    }
  }

  return null;
};

const applyTransition = (
  previousState: State,
  transition: ScenarioTransition,
  action: EngineAction
): { state: State; effects: EngineEvent["effects"] } => {
  const nextState = clone(previousState);
  const effects: EngineEvent["effects"] = [];

  for (const update of transition.updates) {
    const payloadValue = update.fromActionPayload
      ? (action.payload ?? {})[update.fromActionPayload]
      : undefined;
    const resolvedValue = payloadValue ?? update.value;

    if (update.op === "set") {
      setPath(nextState, update.path, clone(resolvedValue));
      effects.push({ path: update.path, op: "set", value: clone(resolvedValue) });
    }

    if (update.op === "increment") {
      const current = getPath(nextState, update.path);
      if (typeof current !== "number") {
        throw new TransitionError(`Cannot increment non-numeric path '${update.path}'`);
      }
      const amount = update.amount ?? 1;
      const nextValue = current + amount;
      setPath(nextState, update.path, nextValue);
      effects.push({ path: update.path, op: "increment", value: amount });
    }

    if (update.op === "appendUnique") {
      const current = getPath(nextState, update.path);
      if (!Array.isArray(current)) {
        throw new TransitionError(`Cannot appendUnique non-array path '${update.path}'`);
      }

      if (!current.some((item) => stableStringify(item) === stableStringify(resolvedValue))) {
        const nextArray = [...current, clone(resolvedValue)];
        setPath(nextState, update.path, nextArray);
      }

      effects.push({ path: update.path, op: "appendUnique", value: clone(resolvedValue) });
    }
  }

  const scoreDelta = transition.scoreDelta ?? 0;
  if (scoreDelta !== 0) {
    const currentScore = getPath(nextState, "score");
    if (typeof currentScore === "number") {
      setPath(nextState, "score", currentScore + scoreDelta);
      effects.push({ path: "score", op: "increment", value: scoreDelta });
    }
  }

  if (transition.setFlags.length > 0) {
    const existingFlags = getPath(nextState, "flags");
    if (Array.isArray(existingFlags)) {
      let nextFlags = existingFlags;
      for (const flag of transition.setFlags) {
        if (!nextFlags.includes(flag)) {
          nextFlags = [...nextFlags, flag];
        }
      }
      setPath(nextState, "flags", nextFlags);
      effects.push({ path: "flags", op: "appendUnique", value: clone(transition.setFlags) });
    }
  }

  return { state: nextState, effects };
};

export const computeStateHash = (state: State): string => sha256Hex(stableStringify(state));

export const computeEventHash = (
  entryWithoutHash: Omit<EventLogEntryV1, "hash">
): string =>
  sha256Hex(
    stableStringify({
      v: entryWithoutHash.v,
      id: entryWithoutHash.id,
      ts: entryWithoutHash.ts,
      actionType: entryWithoutHash.actionType,
      payload: entryWithoutHash.payload,
      previousHash: entryWithoutHash.previousHash,
      stateHash: entryWithoutHash.stateHash
    })
  );

export const appendEventWithIntegrity = (
  prevEvent: Pick<EventLogEntryV1, "hash"> | null,
  actionType: string,
  payload: Record<string, unknown>,
  nextState: State,
  eventIndex: number,
  effects: EventEffect[]
): EngineEvent => {
  const baseEntry = {
    v: 1 as const,
    id: `evt-${eventIndex}`,
    ts: eventIndex,
    actionType,
    payload: clone(payload),
    previousHash: prevEvent?.hash ?? "GENESIS",
    stateHash: computeStateHash(nextState)
  };

  return {
    ...baseEntry,
    hash: computeEventHash(baseEntry),
    eventIndex,
    action: { type: actionType, payload: clone(payload) },
    effects: clone(effects)
  };
};

export const verifyEventChain = (
  log: readonly EngineEvent[],
  initialState: State
): VerifyEventChainResult => {
  let previousHash = "GENESIS";
  let workingState = clone(initialState);

  for (let index = 0; index < log.length; index += 1) {
    const event = log[index];
    if (!event) {
      return { ok: false, index, reason: "hash mismatch" };
    }

    if (event.previousHash !== previousHash) {
      return { ok: false, index, reason: "previousHash mismatch" };
    }

    try {
      workingState = applyEffects(workingState, event.effects);
    } catch {
      return { ok: false, index, reason: "stateHash mismatch" };
    }

    const expectedStateHash = computeStateHash(workingState);
    if (event.stateHash !== expectedStateHash) {
      return { ok: false, index, reason: "stateHash mismatch" };
    }

    const expectedHash = computeEventHash({
      v: event.v,
      id: event.id,
      ts: event.ts,
      actionType: event.actionType,
      payload: event.payload,
      previousHash: event.previousHash,
      stateHash: event.stateHash
    });

    if (event.hash !== expectedHash) {
      return { ok: false, index, reason: "hash mismatch" };
    }

    previousHash = event.hash;
  }

  return { ok: true };
};

export const createEngine = ({ scenario: rawScenario }: EngineParams) => {
  const validated = validateScenario(rawScenario);
  if (!validated.success) {
    throw new ValidationError(`Invalid scenario: ${validated.errors.join("; ")}`);
  }

  const scenario: Scenario = validated.data;
  const initialState = clone(scenario.initialState) as State;

  let currentState = clone(initialState);
  let eventLog: EngineEvent[] = [];

  const dispatch = (action: EngineAction): DispatchResult => {
    const actionDefinition = scenario.actions.find((entry) => entry.type === action.type);
    if (!actionDefinition) {
      return { ok: false, error: new InvalidActionError(`Unknown action type '${action.type}'`) };
    }

    const payloadError = validatePayload(action, actionDefinition);
    if (payloadError) {
      return { ok: false, error: payloadError };
    }

    const transition = scenario.transitions.find(
      (entry) => entry.actionType === action.type && matchesPreconditions(currentState, entry)
    );

    if (!transition) {
      return {
        ok: false,
        error: new TransitionError(`No eligible transition found for action '${action.type}'`)
      };
    }

    try {
      const { state, effects } = applyTransition(currentState, transition, action);
      const payload = action.payload ?? {};
      const event = appendEventWithIntegrity(
        eventLog.at(-1) ?? null,
        action.type,
        payload,
        state,
        eventLog.length,
        effects
      );
      currentState = state;
      eventLog = [...eventLog, event];
      return { ok: true, state: clone(currentState), event };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new TransitionError("Unknown transition error") };
    }
  };

  return {
    dispatch,
    getState: (): State => clone(currentState),
    getEventLog: (): readonly EngineEvent[] => clone(eventLog),
    getInitialState: (): State => clone(initialState),
    reset: (): void => {
      currentState = clone(initialState);
      eventLog = [];
    }
  };
};
