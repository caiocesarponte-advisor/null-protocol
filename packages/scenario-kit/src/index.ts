import { z } from "zod";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(JsonValueSchema), z.record(JsonValueSchema)])
);

const PayloadFieldSchema = z.object({
  type: z.enum(["string", "number", "boolean", "object", "array", "null"]),
  required: z.boolean().optional()
});

const TransitionConditionSchema = z.object({
  path: z.string(),
  equals: JsonValueSchema.optional(),
  truthy: z.boolean().optional(),
  gte: z.number().optional(),
  lte: z.number().optional()
});

const TransitionUpdateSchema = z.object({
  path: z.string(),
  op: z.enum(["set", "increment", "appendUnique"]),
  value: JsonValueSchema.optional(),
  amount: z.number().optional(),
  fromActionPayload: z.string().optional()
});

const CompletionConditionSchema = z.union([
  z.object({ type: z.literal("flag"), flag: z.string() }),
  z.object({ type: z.literal("scoreAtLeast"), score: z.number() })
]);

export const ScenarioActionDefinitionSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  payload: z.record(PayloadFieldSchema).default({})
});

export const ScenarioTransitionSchema = z.object({
  actionType: z.string().min(1),
  preconditions: z.array(TransitionConditionSchema).default([]),
  updates: z.array(TransitionUpdateSchema),
  scoreDelta: z.number().optional(),
  setFlags: z.array(z.string()).default([])
});

const ScoringRuleSchema = z.object({
  actionType: z.string(),
  points: z.number()
});

export const ScenarioSchema = z
  .object({
    schemaVersion: z.union([z.literal("1"), z.literal(1), z.literal("1.0.0")]),
    metadata: z.object({
      id: z.string(),
      title: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      description: z.string().optional()
    }),
    initialState: z.record(JsonValueSchema),
    actions: z.array(ScenarioActionDefinitionSchema).min(1),
    transitions: z.array(ScenarioTransitionSchema).min(1),
    completionConditions: z.array(CompletionConditionSchema).default([]),
    scoringRules: z.array(ScoringRuleSchema).optional(),
    narrativeContent: z.array(z.object({ id: z.string(), text: z.string() })).optional()
  })
  .superRefine((scenario, context) => {
    const actionTypes = new Set<string>();
    const actionNames = new Set<string>();

    scenario.actions.forEach((action, index) => {
      if (actionTypes.has(action.type)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actions", index, "type"],
          message: `actions: Duplicate action type '${action.type}'`
        });
      }
      actionTypes.add(action.type);

      if (actionNames.has(action.name)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actions", index, "name"],
          message: `actions: Duplicate action name '${action.name}'`
        });
      }
      actionNames.add(action.name);
    });

    scenario.transitions.forEach((transition, index) => {
      if (!actionTypes.has(transition.actionType)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transitions", index, "actionType"],
          message: `transitions: Transition references unknown action type '${transition.actionType}'`
        });
      }
    });
  });

export type ScenarioActionDefinition = z.infer<typeof ScenarioActionDefinitionSchema>;
export type ScenarioTransition = z.infer<typeof ScenarioTransitionSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;

export const validateScenario = (
  input: unknown
): { success: true; data: Scenario } | { success: false; errors: string[] } => {
  const parseResult = ScenarioSchema.safeParse(input);

  if (!parseResult.success) {
    return {
      success: false,
      errors: parseResult.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
    };
  }

  return { success: true, data: parseResult.data };
};
