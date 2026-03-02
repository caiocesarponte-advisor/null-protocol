import {
  type Scenario,
  type ScenarioActionDefinition,
  type ScenarioTransition,
  validateScenario
} from "@null-protocol/scenario-kit";

import { InvalidActionError, TransitionError, ValidationError } from "./errors";
import type { DispatchResult, EngineAction, EngineEvent, EngineParams, State } from "./types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const stableStringify = (value: unknown): string => {
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

const hashState = (state: State): string => {
  const text = stableStringify(state);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
};

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

const buildEvent = (action: EngineAction, effects: EngineEvent["effects"], state: State, index: number): EngineEvent => ({
  id: `evt-${index}`,
  eventIndex: index,
  action: clone(action),
  effects: clone(effects),
  stateHash: hashState(state)
});

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
      const event = buildEvent(action, effects, state, eventLog.length);
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
    reset: (): void => {
      currentState = clone(initialState);
      eventLog = [];
    }
  };
};

export { applyTransition, buildEvent, hashState };
