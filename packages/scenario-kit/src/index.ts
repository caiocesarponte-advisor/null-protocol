export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type PayloadFieldType = "string" | "number" | "boolean" | "object" | "array" | "null";

export type ScenarioActionDefinition = {
  type: string;
  name: string;
  description?: string;
  payload: Record<
    string,
    {
      type: PayloadFieldType;
      required?: boolean;
    }
  >;
};

export type ScenarioCondition = {
  path: string;
  equals?: JsonValue;
  gte?: number;
  lte?: number;
  truthy?: boolean;
};

export type ScenarioTransition = {
  actionType: string;
  preconditions: ScenarioCondition[];
  updates: Array<{
    path: string;
    op: "set" | "increment" | "appendUnique";
    value?: JsonValue;
    amount?: number;
    fromActionPayload?: string;
  }>;
  scoreDelta?: number;
  setFlags: string[];
};

export type Scenario = {
  schemaVersion: "1" | 1 | "1.0.0";
  metadata: {
    id: string;
    title: string;
    difficulty?: "easy" | "medium" | "hard";
    description?: string;
  };
  initialState: Record<string, JsonValue>;
  actions: ScenarioActionDefinition[];
  transitions: ScenarioTransition[];
  completionConditions: Array<
    | {
        type: "flag";
        flag: string;
      }
    | {
        type: "scoreAtLeast";
        score: number;
      }
  >;
  scoringRules?: Array<{ actionType: string; points: number }>;
  narrativeContent?: Array<{ id: string; text: string }>;
};

export const ScenarioSchema = {
  safeParse: (scenario: unknown): { success: true; data: Scenario } | { success: false; errors: string[] } =>
    validateScenario(scenario)
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null) {
    return true;
  }

  if (["string", "number", "boolean"].includes(typeof value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((entry) => isJsonValue(entry));
  }

  if (isRecord(value)) {
    return Object.values(value).every((entry) => isJsonValue(entry));
  }

  return false;
};

export const validateScenario = (
  scenario: unknown
): { success: true; data: Scenario } | { success: false; errors: string[] } => {
  const errors: string[] = [];

  if (!isRecord(scenario)) {
    return { success: false, errors: ["Scenario must be an object"] };
  }

  if (!["1", 1, "1.0.0"].includes(scenario.schemaVersion as string | number)) {
    errors.push("schemaVersion: must be 1, '1', or '1.0.0'");
  }

  if (!isRecord(scenario.metadata)) {
    errors.push("metadata: required object");
  } else {
    if (!scenario.metadata.id || typeof scenario.metadata.id !== "string") {
      errors.push("metadata.id: required string");
    }
    if (!scenario.metadata.title || typeof scenario.metadata.title !== "string") {
      errors.push("metadata.title: required string");
    }
  }

  if (!isRecord(scenario.initialState) || !isJsonValue(scenario.initialState)) {
    errors.push("initialState: required JSON-serializable object");
  }

  if (!Array.isArray(scenario.actions) || scenario.actions.length === 0) {
    errors.push("actions: requires at least one action");
  }

  const actionTypes = new Set<string>();
  const actionNames = new Set<string>();
  if (Array.isArray(scenario.actions)) {
    scenario.actions.forEach((action, index) => {
      if (!isRecord(action)) {
        errors.push(`actions.${index}: must be object`);
        return;
      }
      if (typeof action.type !== "string" || action.type.length === 0) {
        errors.push(`actions.${index}.type: required string`);
      } else if (actionTypes.has(action.type)) {
        errors.push(`actions: Duplicate action type '${action.type}'`);
      } else {
        actionTypes.add(action.type);
      }

      if (typeof action.name !== "string" || action.name.length === 0) {
        errors.push(`actions.${index}.name: required string`);
      } else if (actionNames.has(action.name)) {
        errors.push(`actions: Duplicate action name '${action.name}'`);
      } else {
        actionNames.add(action.name);
      }

      if (action.payload !== undefined && !isRecord(action.payload)) {
        errors.push(`actions.${index}.payload: must be object`);
      }
    });
  }

  if (!Array.isArray(scenario.transitions) || scenario.transitions.length === 0) {
    errors.push("transitions: requires at least one transition");
  } else {
    scenario.transitions.forEach((transition, index) => {
      if (!isRecord(transition)) {
        errors.push(`transitions.${index}: must be object`);
        return;
      }

      if (typeof transition.actionType !== "string" || transition.actionType.length === 0) {
        errors.push(`transitions.${index}.actionType: required string`);
      } else if (!actionTypes.has(transition.actionType)) {
        errors.push(`transitions: Transition references unknown action type '${transition.actionType}'`);
      }
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const data: Scenario = {
    schemaVersion: scenario.schemaVersion as Scenario["schemaVersion"],
    metadata: scenario.metadata as Scenario["metadata"],
    initialState: scenario.initialState as Scenario["initialState"],
    actions: (scenario.actions as ScenarioActionDefinition[]).map((entry) => ({
      ...entry,
      payload: entry.payload ?? {}
    })),
    transitions: (scenario.transitions as ScenarioTransition[]).map((entry) => ({
      ...entry,
      preconditions: entry.preconditions ?? [],
      setFlags: entry.setFlags ?? []
    })),
    completionConditions: (scenario.completionConditions as Scenario["completionConditions"]) ?? [],
    ...(scenario.scoringRules !== undefined
      ? { scoringRules: scenario.scoringRules as Scenario["scoringRules"] }
      : {}),
    ...(scenario.narrativeContent !== undefined
      ? { narrativeContent: scenario.narrativeContent as Scenario["narrativeContent"] }
      : {})
  };

  return {
    success: true,
    data
  };
};
