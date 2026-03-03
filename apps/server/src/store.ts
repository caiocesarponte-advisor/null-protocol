import {
  createEngine,
  verifyEventChain,
  type EngineAction,
  type EngineEvent,
  type VerifyEventChainResult
} from "@null-protocol/engine";
import { validateScenario, type Scenario } from "@null-protocol/scenario-kit";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface Session {
  scenario: Scenario;
  eventLog: EngineEvent[];
}

export interface SessionStore {
  createSession: (scenario: unknown) => { sessionId: string; session: Session };
  getSession: (sessionId: string) => Session | null;
  applyAction: (
    sessionId: string,
    action: EngineAction,
    clientEventLog?: unknown
  ) => { eventLog: EngineEvent[]; integrity: VerifyEventChainResult };
  save: () => Promise<void>;
  load: () => Promise<void>;
}

interface PersistedState {
  sessions: Record<string, Session>;
}

const PERSISTENCE_FILE = process.env.NULL_SERVER_PERSIST_PATH
  ? path.resolve(process.env.NULL_SERVER_PERSIST_PATH)
  : path.resolve(process.cwd(), "apps/server/data/sessions.json");

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
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

        const engine = createEngine({ scenario });
        for (const event of session.eventLog) {
          const result = engine.dispatch(event.action);
          if (!result.ok) {
            throw result.error;
          }
        }

        const rebuiltLog = engine.getEventLog() as EngineEvent[];
        const originalDigest = createHash("sha256").update(stableStringify(session.eventLog)).digest("hex");
        const rebuiltDigest = createHash("sha256").update(stableStringify(rebuiltLog)).digest("hex");
        if (originalDigest !== rebuiltDigest) {
          continue;
        }

        sessions.set(sessionId, { scenario, eventLog: rebuiltLog });
      }
    } catch {
      // Ignore missing/unreadable persistence file on boot.
    }
  };

  return {
    createSession: (scenarioInput) => {
      const scenario = ensureScenario(scenarioInput);
      const sessionId = randomUUID();
      const session: Session = { scenario, eventLog: [] };
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
      return {
        eventLog: nextEventLog,
        integrity
      };
    },
    save,
    load
  };
};
