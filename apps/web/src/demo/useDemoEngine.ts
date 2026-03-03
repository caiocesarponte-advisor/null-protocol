import {
  createEngine,
  replayScenario,
  verifyEventChain,
  type EngineAction,
  type EngineEvent,
  type State,
  type VerifyEventChainResult
} from "@null-protocol/engine";
import type { Scenario } from "@null-protocol/scenario-kit";
import { useCallback, useEffect, useMemo, useState } from "react";

import { clearSession, loadSavedSession, saveSession } from "./storage";

export type ReplayStatus = "ok" | "mismatch";

interface UseDemoEngineResult {
  state: State;
  eventLog: readonly EngineEvent[];
  lastError: string | null;
  integrity: VerifyEventChainResult;
  dispatch: (actionType: string, payload?: Record<string, unknown>) => void;
  reset: () => void;
  replayCheck: () => ReplayStatus;
  corruptLog: () => void;
}

const statesMatch = (left: State, right: State): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

export const useDemoEngine = (scenario: Scenario): UseDemoEngineResult => {
  const engine = useMemo(() => createEngine({ scenario }), [scenario]);

  const [state, setState] = useState<State>(engine.getState());
  const [eventLog, setEventLog] = useState<readonly EngineEvent[]>(engine.getEventLog());
  const [lastError, setLastError] = useState<string | null>(null);
  const [integrity, setIntegrity] = useState<VerifyEventChainResult>({ ok: true });

  const syncFromEngine = useCallback(() => {
    const nextState = engine.getState();
    const nextLog = engine.getEventLog();
    setState(nextState);
    setEventLog(nextLog);
    setIntegrity(verifyEventChain(nextLog, engine.getInitialState()));
  }, [engine]);

  useEffect(() => {
    syncFromEngine();
    const saved = loadSavedSession();

    if (!saved) {
      setLastError(null);
      return;
    }

    const sameScenario =
      saved.scenarioId === scenario.metadata.id &&
      saved.schemaVersion === String(scenario.schemaVersion);

    if (!sameScenario) {
      clearSession();
      setLastError("Saved session ignored: scenario metadata changed.");
      return;
    }

    if (saved.eventLog.length === 0) {
      setLastError(null);
      return;
    }

    try {
      const replayedState = replayScenario({
        scenario,
        events: saved.eventLog,
        verifyIntegrity: true
      });
      for (const event of saved.eventLog) {
        const result = engine.dispatch(event.action);
        if (!result.ok) {
          throw result.error;
        }
      }

      syncFromEngine();
      const current = engine.getState();
      if (!statesMatch(current, replayedState)) {
        setLastError("Saved session replay mismatch detected.");
      } else {
        setLastError(null);
      }
    } catch (error) {
      clearSession();
      setLastError(error instanceof Error ? error.message : "Failed to restore saved session.");
    }
  }, [engine, scenario, syncFromEngine]);

  useEffect(() => {
    saveSession({
      scenarioId: scenario.metadata.id,
      schemaVersion: String(scenario.schemaVersion),
      eventLog: [...eventLog],
      savedAt: new Date().toISOString()
    });
  }, [eventLog, scenario.metadata.id, scenario.schemaVersion]);

  const dispatch = (actionType: string, payload?: Record<string, unknown>) => {
    const action: EngineAction = payload ? { type: actionType, payload } : { type: actionType };
    const result = engine.dispatch(action);
    if (!result.ok) {
      setLastError(result.error.message);
      return;
    }

    setLastError(null);
    syncFromEngine();
  };

  const reset = () => {
    engine.reset();
    clearSession();
    setLastError(null);
    syncFromEngine();
  };

  const replayCheck = (): ReplayStatus => {
    try {
      const replayed = replayScenario({ scenario, events: eventLog, verifyIntegrity: true });
      const ok = statesMatch(replayed, state);
      setLastError(ok ? null : "Replay mismatch detected.");
      return ok ? "ok" : "mismatch";
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Replay failed.");
      return "mismatch";
    }
  };

  const corruptLog = (): void => {
    const mutable = structuredClone(eventLog);
    if (mutable.length === 0) {
      return;
    }

    const target = mutable[0];
    if (!target) {
      return;
    }

    target.payload = { ...target.payload, tokenLabel: "tampered" };
    target.action = { ...target.action, payload: { ...(target.action.payload ?? {}), tokenLabel: "tampered" } };
    setEventLog(mutable);
    setIntegrity(verifyEventChain(mutable, engine.getInitialState()));
  };

  return {
    state,
    eventLog,
    lastError,
    integrity,
    dispatch,
    reset,
    replayCheck,
    corruptLog
  };
};
