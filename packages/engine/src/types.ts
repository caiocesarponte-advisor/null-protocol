import { Scenario } from "@null-protocol/scenario-kit";

export type State = Record<string, unknown>;

export type EngineAction = {
  type: string;
  payload?: Record<string, unknown>;
};

export type EventEffect = {
  path: string;
  op: "set" | "increment" | "appendUnique";
  value?: unknown;
};

export type EngineEvent = {
  id: string;
  eventIndex: number;
  action: EngineAction;
  effects: EventEffect[];
  stateHash: string;
};

export type DispatchSuccess = {
  ok: true;
  state: State;
  event: EngineEvent;
};

export type DispatchFailure = {
  ok: false;
  error: Error;
};

export type DispatchResult = DispatchSuccess | DispatchFailure;

export type EngineContext = {
  seed?: number;
  userId?: string;
};

export type EngineParams = {
  scenario: Scenario | unknown;
  initialContext?: EngineContext;
};
