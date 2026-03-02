import { validateScenario } from "@null-protocol/scenario-kit";

import { createEngine } from "./engine";
import { InvalidActionError, TransitionError, ValidationError } from "./errors";
import type { EngineEvent, State } from "./types";

export const applyEventLog = ({
  scenario,
  events
}: {
  scenario: unknown;
  events: readonly EngineEvent[];
}): State => {
  const validated = validateScenario(scenario);
  if (!validated.success) {
    throw new ValidationError(`Invalid scenario for replay: ${validated.errors.join("; ")}`);
  }

  const engine = createEngine({ scenario: validated.data });

  for (const event of events) {
    if (!event || typeof event !== "object" || !event.action || typeof event.action.type !== "string") {
      throw new ValidationError("Corrupted event log: action entry is invalid");
    }

    const result = engine.dispatch(event.action);
    if (!result.ok) {
      throw result.error;
    }

    if (result.event.eventIndex !== event.eventIndex || result.event.id !== event.id) {
      throw new InvalidActionError(`Replay diverged at event index ${event.eventIndex}`);
    }

    if (event.stateHash && result.event.stateHash !== event.stateHash) {
      throw new TransitionError(`Replay hash mismatch at event index ${event.eventIndex}`);
    }
  }

  return engine.getState();
};

export const replayScenario = applyEventLog;
