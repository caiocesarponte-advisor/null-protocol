import {
  createEngine,
  hashCanonicalJson,
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
export type DemoMode = "local" | "multiplayer";

interface UseDemoEngineResult {
  mode: DemoMode;
  state: State;
  eventLog: readonly EngineEvent[];
  lastError: string | null;
  integrity: VerifyEventChainResult;
  sessionId: string;
  sessionScenarioId: string;
  sessionScenarioVersion: string;
  sessionScenarioHash: string;
  setSessionId: (value: string) => void;
  setMode: (mode: DemoMode) => void;
  dispatch: (actionType: string, payload?: Record<string, unknown>) => Promise<void>;
  reset: () => void;
  replayCheck: () => ReplayStatus;
  corruptLog: () => void;
  createMultiplayerSession: () => Promise<void>;
  syncMultiplayerSession: () => Promise<void>;
  exportSession: () => Promise<unknown>;
}

const statesMatch = (left: State, right: State): boolean => JSON.stringify(left) === JSON.stringify(right);

const serverBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";

export const useDemoEngine = (scenario: Scenario): UseDemoEngineResult => {
  const localEngine = useMemo(() => createEngine({ scenario }), [scenario]);
  const localScenarioHash = useMemo(() => hashCanonicalJson(scenario), [scenario]);

  const [mode, setMode] = useState<DemoMode>("local");
  const [sessionId, setSessionId] = useState("");
  const [state, setState] = useState<State>(localEngine.getState());
  const [eventLog, setEventLog] = useState<readonly EngineEvent[]>(localEngine.getEventLog());
  const [lastError, setLastError] = useState<string | null>(null);
  const [integrity, setIntegrity] = useState<VerifyEventChainResult>({ ok: true });
  const [sessionScenarioId, setSessionScenarioId] = useState("");
  const [sessionScenarioVersion, setSessionScenarioVersion] = useState("");
  const [sessionScenarioHash, setSessionScenarioHash] = useState("");

  const syncFromLocalEngine = useCallback(() => {
    const nextState = localEngine.getState();
    const nextLog = localEngine.getEventLog();
    setState(nextState);
    setEventLog(nextLog);
    setIntegrity(verifyEventChain(nextLog, localEngine.getInitialState()));
  }, [localEngine]);

  const reconcileFromServerLog = useCallback(
    (log: EngineEvent[]) => {
      const chain = verifyEventChain(log, scenario.initialState);
      if (!chain.ok) {
        throw new Error(`Server returned corrupted event log at index ${chain.index}`);
      }

      const replayedState = replayScenario({
        scenario,
        events: log,
        verifyIntegrity: true
      });
      setEventLog(log);
      setState(replayedState);
      setIntegrity(chain);
    },
    [scenario]
  );

  useEffect(() => {
    if (mode !== "local") {
      setEventLog([]);
      setState(scenario.initialState);
      setIntegrity({ ok: true });
      return;
    }

    syncFromLocalEngine();
    const saved = loadSavedSession();

    if (!saved) {
      setLastError(null);
      return;
    }

    const sameScenario =
      saved.scenarioId === scenario.metadata.id && saved.schemaVersion === String(scenario.schemaVersion);

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
      const replayedState = replayScenario({ scenario, events: saved.eventLog, verifyIntegrity: true });
      for (const event of saved.eventLog) {
        const result = localEngine.dispatch(event.action);
        if (!result.ok) {
          throw result.error;
        }
      }

      syncFromLocalEngine();
      const current = localEngine.getState();
      if (!statesMatch(current, replayedState)) {
        setLastError("Saved session replay mismatch detected.");
      } else {
        setLastError(null);
      }
    } catch (error) {
      clearSession();
      setLastError(error instanceof Error ? error.message : "Failed to restore saved session.");
    }
  }, [localEngine, mode, scenario, syncFromLocalEngine]);

  useEffect(() => {
    if (mode !== "local") {
      return;
    }

    saveSession({
      scenarioId: scenario.metadata.id,
      schemaVersion: String(scenario.schemaVersion),
      eventLog: [...eventLog],
      savedAt: new Date().toISOString()
    });
  }, [eventLog, mode, scenario.metadata.id, scenario.schemaVersion]);

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${serverBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });

    const data = (await response.json()) as T & { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? `Request failed with status ${response.status}`);
    }

    return data;
  };

  const createMultiplayerSession = async () => {
    const response = await request<{ sessionId: string; scenarioId: string; scenarioVersion: string; scenarioHash: string }>("/session", {
      method: "POST",
      body: JSON.stringify({ scenario })
    });

    setSessionId(response.sessionId);
    setSessionScenarioId(response.scenarioId);
    setSessionScenarioVersion(response.scenarioVersion);
    setSessionScenarioHash(response.scenarioHash);
    setMode("multiplayer");
    setLastError(null);
    await request<{ scenario: Scenario; eventLog: EngineEvent[]; scenarioId: string; scenarioVersion: string; scenarioHash: string }>(
      `/session/${response.sessionId}?scenarioHash=${encodeURIComponent(response.scenarioHash)}`
    ).then((data) => {
      setSessionScenarioId(data.scenarioId);
      setSessionScenarioVersion(data.scenarioVersion);
      setSessionScenarioHash(data.scenarioHash);
      reconcileFromServerLog(data.eventLog);
    });
  };

  const syncMultiplayerSession = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    const providedHash = localScenarioHash;
    const data = await request<{ scenario: Scenario; eventLog: EngineEvent[]; scenarioId: string; scenarioVersion: string; scenarioHash: string }>(
      `/session/${sessionId}?scenarioHash=${encodeURIComponent(providedHash)}`
    );
    setSessionScenarioId(data.scenarioId);
    setSessionScenarioVersion(data.scenarioVersion);
    setSessionScenarioHash(data.scenarioHash);
    reconcileFromServerLog(data.eventLog);
    setLastError(null);
  }, [localScenarioHash, reconcileFromServerLog, sessionId]);

  useEffect(() => {
    if (mode !== "multiplayer" || !sessionId) {
      return;
    }

    const handle = setInterval(() => {
      void syncMultiplayerSession().catch((error) => {
        setLastError(error instanceof Error ? error.message : "Failed to sync session.");
      });
    }, 2000);

    return () => clearInterval(handle);
  }, [mode, sessionId, syncMultiplayerSession]);

  const dispatch = async (actionType: string, payload?: Record<string, unknown>) => {
    const action: EngineAction = payload ? { type: actionType, payload } : { type: actionType };

    if (mode === "local") {
      const result = localEngine.dispatch(action);
      if (!result.ok) {
        setLastError(result.error.message);
        return;
      }

      setLastError(null);
      syncFromLocalEngine();
      return;
    }

    if (!sessionId) {
      setLastError("Multiplayer sessionId is required.");
      return;
    }

    try {
      const data = await request<{ eventLog: EngineEvent[]; integrity: "ok" }>(`/session/${sessionId}/action`, {
        method: "POST",
        body: JSON.stringify({
          actionType,
          payload: payload ?? {},
          eventLog,
          scenarioHash: sessionScenarioHash || localScenarioHash
        })
      });
      reconcileFromServerLog(data.eventLog);
      setLastError(null);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Failed to dispatch action.");
    }
  };

  const exportSession = async (): Promise<unknown> => {
    if (!sessionId) {
      throw new Error("Multiplayer sessionId is required.");
    }

    return request<unknown>(`/session/${sessionId}/export`);
  };

  const reset = () => {
    if (mode === "local") {
      localEngine.reset();
      clearSession();
      setLastError(null);
      syncFromLocalEngine();
      return;
    }

    setEventLog([]);
    setState(scenario.initialState);
    setIntegrity({ ok: true });
    setSessionScenarioId("");
    setSessionScenarioVersion("");
    setSessionScenarioHash("");
    setLastError(null);
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
    setIntegrity(verifyEventChain(mutable, scenario.initialState));
  };

  return {
    mode,
    state,
    eventLog,
    lastError,
    integrity,
    sessionId,
    sessionScenarioId,
    sessionScenarioVersion,
    sessionScenarioHash,
    setSessionId,
    setMode,
    dispatch,
    reset,
    replayCheck,
    corruptLog,
    createMultiplayerSession,
    syncMultiplayerSession,
    exportSession
  };
};
