import type { Scenario } from "@null-protocol/scenario-kit";

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

export type EventLogEntryV1 = {
  v: 1;
  id: string;
  ts: number;
  actionType: string;
  payload: Record<string, unknown>;
  previousHash: string;
  stateHash: string;
  hash: string;
};

export type EngineEvent = EventLogEntryV1 & {
  eventIndex: number;
  action: EngineAction;
  effects: EventEffect[];
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

export type VerifyEventChainResult =
  | { ok: true }
  | {
      ok: false;
      index: number;
      reason: string;
    };
