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
import { validateScenario, type Scenario } from "@null-protocol/scenario-kit";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SessionSnapshot {
  eventIndex: number;
  state: State;
  finalHash: string;
}

export interface Session {
  scenarioId: string;
  scenarioVersion: string;
  scenarioHash: string;
  scenario: Scenario;
  eventLog: EngineEvent[];
  snapshots: SessionSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionStore {
  createSession: (scenario: unknown) => { sessionId: string; session: Session };
  getSession: (sessionId: string) => Session | null;
  applyAction: (
    sessionId: string,
    action: EngineAction,
    clientEventLog?: unknown
  ) => { eventLog: EngineEvent[]; integrity: VerifyEventChainResult };
  getSnapshotState: (sessionId: string, targetIndex?: number) => State;
  exportSession: (sessionId: string) => SessionExport;
  save: () => Promise<void>;
  load: () => Promise<void>;
}

export interface SessionExport {
  sessionId: string;
  scenarioId: string;
  scenarioVersion: string;
  scenarioHash: string;
  scenario: Scenario;
  eventLog: EngineEvent[];
  finalState: State;
  integrity: {
    ok: boolean;
    finalHash: string | null;
    eventCount: number;
  };
}

interface PersistedState {
  sessions: Record<string, Session>;
}

const PERSISTENCE_FILE = process.env.NULL_SERVER_PERSIST_PATH
  ? path.resolve(process.env.NULL_SERVER_PERSIST_PATH)
  : path.resolve(process.cwd(), "apps/server/data/sessions.json");

const getSnapshotInterval = (): number => Number(process.env.NULL_SERVER_SNAPSHOT_INTERVAL ?? "50");

const computeScenarioMetadata = (scenario: Scenario) => ({
  scenarioId: scenario.metadata.id,
  scenarioVersion: String(scenario.schemaVersion),
  scenarioHash: hashCanonicalJson(scenario)
});

const rebuildSnapshots = (scenario: Scenario, eventLog: EngineEvent[]): SessionSnapshot[] => {
  const snapshotInterval = getSnapshotInterval();
  if (!Number.isFinite(snapshotInterval) || snapshotInterval <= 0) {
    return [];
  }

  const engine = createEngine({ scenario });
  const snapshots: SessionSnapshot[] = [];

  for (const event of eventLog) {
    const result = engine.dispatch(event.action);
    if (!result.ok) {
      throw result.error;
    }

    if ((event.eventIndex + 1) % snapshotInterval === 0) {
      const currentLog = engine.getEventLog() as EngineEvent[];
      snapshots.push({
        eventIndex: event.eventIndex,
        state: engine.getState(),
        finalHash: currentLog.at(-1)?.hash ?? ""
      });
    }
  }

  return snapshots;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isEngineEvent = (value: unknown): value is EngineEvent =>
  isObject(value) &&
  value.v === 1 &&
  typeof value.id === "string" &&
  typeof value.actionType === "string" &&
  typeof value.previousHash === "string" &&
  typeof value.hash === "string";

const parseClientEventLog = (value: unknown): EngineEvent[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  if (!value.every((entry) => isEngineEvent(entry))) {
    return null;
  }

  return value as EngineEvent[];
};

const ensureScenario = (scenario: unknown): Scenario => {
  const result = validateScenario(scenario);
  if (!result.success) {
    throw new Error(`Invalid scenario: ${result.errors.join("; ")}`);
  }

  return result.data;
};

export const createSessionStore = (): SessionStore => {
  const sessions = new Map<string, Session>();

  const save = async () => {
    await mkdir(path.dirname(PERSISTENCE_FILE), { recursive: true });
    const payload: PersistedState = { sessions: Object.fromEntries(sessions.entries()) };
    await writeFile(PERSISTENCE_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
  };

  const load = async () => {
    try {
      const raw = await readFile(PERSISTENCE_FILE, "utf-8");
      const parsed = JSON.parse(raw) as PersistedState;
      const entries = Object.entries(parsed.sessions ?? {});

      for (const [sessionId, session] of entries) {
        const scenario = ensureScenario(session.scenario);
        const integrity = verifyEventChain(session.eventLog, scenario.initialState);
        if (!integrity.ok) {
          continue;
        }

        const rebuiltState = replayScenario({ scenario, events: session.eventLog, verifyIntegrity: true });
        const metadata = computeScenarioMetadata(scenario);
        const createdAt = typeof session.createdAt === "string" ? session.createdAt : new Date().toISOString();
        const updatedAt = typeof session.updatedAt === "string" ? session.updatedAt : createdAt;
        const snapshots = Array.isArray(session.snapshots)
          ? session.snapshots
          : rebuildSnapshots(scenario, session.eventLog);

        const rebuiltLog = structuredClone(session.eventLog);
        if (!rebuiltState) {
          continue;
        }

        sessions.set(sessionId, {
          ...metadata,
          scenario,
          eventLog: rebuiltLog,
          snapshots,
          createdAt,
          updatedAt
        });
      }
    } catch {
      // Ignore missing/unreadable persistence file on boot.
    }
  };

  return {
    createSession: (scenarioInput) => {
      const scenario = ensureScenario(scenarioInput);
      const sessionId = randomUUID();
      const now = new Date().toISOString();
      const metadata = computeScenarioMetadata(scenario);
      const session: Session = {
        ...metadata,
        scenario,
        eventLog: [],
        snapshots: [],
        createdAt: now,
        updatedAt: now
      };
      sessions.set(sessionId, session);
      return { sessionId, session };
    },

    getSession: (sessionId) => sessions.get(sessionId) ?? null,

    applyAction: (sessionId, action, clientEventLog) => {
      const session = sessions.get(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (clientEventLog !== undefined) {
        const parsedClientLog = parseClientEventLog(clientEventLog);
        if (!parsedClientLog) {
          throw new Error("Invalid client eventLog payload");
        }

        const clientIntegrity = verifyEventChain(parsedClientLog, session.scenario.initialState);
        if (!clientIntegrity.ok) {
          throw new Error(`Client eventLog failed integrity check at index ${clientIntegrity.index}`);
        }
      }

      const engine = createEngine({ scenario: session.scenario });
      for (const event of session.eventLog) {
        const result = engine.dispatch(event.action);
        if (!result.ok) {
          throw result.error;
        }
      }

      const result = engine.dispatch(action);
      if (!result.ok) {
        throw result.error;
      }

      const nextEventLog = engine.getEventLog() as EngineEvent[];
      const integrity = verifyEventChain(nextEventLog, session.scenario.initialState);
      if (!integrity.ok) {
        throw new Error(`Server integrity check failed at index ${integrity.index}`);
      }

      session.eventLog = nextEventLog;
      session.updatedAt = new Date().toISOString();
      const snapshotInterval = getSnapshotInterval();
      if (Number.isFinite(snapshotInterval) && snapshotInterval > 0 && nextEventLog.length % snapshotInterval === 0) {
        session.snapshots.push({
          eventIndex: nextEventLog.length - 1,
          state: engine.getState(),
          finalHash: nextEventLog.at(-1)?.hash ?? ""
        });
      }

      return {
        eventLog: nextEventLog,
        integrity
      };
    },

    getSnapshotState: (sessionId, targetIndex) => {
      const session = sessions.get(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const endIndex = typeof targetIndex === "number" ? targetIndex : session.eventLog.length - 1;
      if (endIndex < 0) {
        return structuredClone(session.scenario.initialState);
      }

      const latestSnapshot = [...session.snapshots]
        .reverse()
        .find((snapshot) => snapshot.eventIndex <= endIndex);

      const startIndex = latestSnapshot ? latestSnapshot.eventIndex + 1 : 0;
      const startState = latestSnapshot ? latestSnapshot.state : session.scenario.initialState;
      const engine = createEngine({ scenario: { ...session.scenario, initialState: structuredClone(startState) } });

      for (let index = startIndex; index <= endIndex; index += 1) {
        const event = session.eventLog[index];
        if (!event) {
          break;
        }

        const result = engine.dispatch(event.action);
        if (!result.ok) {
          throw result.error;
        }
      }

      return engine.getState();
    },

    exportSession: (sessionId) => {
      const session = sessions.get(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const integrity = verifyEventChain(session.eventLog, session.scenario.initialState);
      const finalState = replayScenario({ scenario: session.scenario, events: session.eventLog, verifyIntegrity: true });
      return {
        sessionId,
        scenarioId: session.scenarioId,
        scenarioVersion: session.scenarioVersion,
        scenarioHash: session.scenarioHash,
        scenario: session.scenario,
        eventLog: session.eventLog,
        finalState,
        integrity: {
          ok: integrity.ok,
          finalHash: session.eventLog.at(-1)?.hash ?? null,
          eventCount: session.eventLog.length
        }
      };
    },
    save,
    load
  };
};
