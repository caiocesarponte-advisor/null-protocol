import type { EngineEvent } from "@null-protocol/engine";

const STORAGE_KEY = "null-protocol:demo:v1";

export interface SavedSession {
  scenarioId: string;
  schemaVersion: string;
  eventLog: EngineEvent[];
  savedAt: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isEngineEvent = (value: unknown): value is EngineEvent => {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.v === 1 &&
    typeof value.id === "string" &&
    typeof value.ts === "number" &&
    typeof value.actionType === "string" &&
    isObject(value.payload) &&
    typeof value.previousHash === "string" &&
    typeof value.hash === "string" &&
    typeof value.eventIndex === "number" &&
    isObject(value.action) &&
    typeof value.action.type === "string" &&
    Array.isArray(value.effects) &&
    typeof value.stateHash === "string"
  );
};

const isSavedSession = (value: unknown): value is SavedSession => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.scenarioId === "string" &&
    typeof value.schemaVersion === "string" &&
    typeof value.savedAt === "string" &&
    Array.isArray(value.eventLog) &&
    value.eventLog.every((event) => isEngineEvent(event))
  );
};

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

export const loadSavedSession = (): SavedSession | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    return isSavedSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveSession = (session: SavedSession): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
};
