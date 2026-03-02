import { type Scenario, validateScenario } from "@null-protocol/scenario-kit";

import scenarioJson from "./scenario.json";

type LoadScenarioSuccess = {
  ok: true;
  scenario: Scenario;
};

type LoadScenarioFailure = {
  ok: false;
  errors: string[];
};

export type LoadScenarioResult = LoadScenarioSuccess | LoadScenarioFailure;

const buildInvalidJsonError = (error: unknown): string => {
  if (error instanceof Error) {
    return `Invalid JSON: ${error.message}`;
  }

  return "Invalid JSON input.";
};

const validateScenarioInput = (input: unknown): LoadScenarioResult => {
  const validated = validateScenario(input);
  if (!validated.success) {
    return { ok: false, errors: validated.errors };
  }

  return {
    ok: true,
    scenario: validated.data
  };
};

export const loadBundledScenario = (): LoadScenarioResult => validateScenarioInput(scenarioJson);

export const loadScenarioFromText = (value: string): LoadScenarioResult => {
  try {
    const parsed: unknown = JSON.parse(value);
    return validateScenarioInput(parsed);
  } catch (error) {
    return {
      ok: false,
      errors: [buildInvalidJsonError(error)]
    };
  }
};

export const getBundledScenarioText = (): string => JSON.stringify(scenarioJson, null, 2);
