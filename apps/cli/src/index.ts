import { createEngine, replayScenario, type EngineAction, type EngineEvent } from "@null-protocol/engine";
import { validateScenario } from "@null-protocol/scenario-kit";
import fs from "node:fs";
import path from "node:path";

type CliCommand = "run" | "replay";

type ParsedArgs = {
  command: CliCommand;
  scenarioPath: string;
  actionsPath?: string;
  logPath?: string;
};

const readJsonFile = (filePath: string): unknown => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  return JSON.parse(content) as unknown;
};

const parseArgs = (argv: string[]): ParsedArgs => {
  const [, , commandRaw, ...rest] = argv;
  if (commandRaw !== "run" && commandRaw !== "replay") {
    throw new Error("Usage: yarn cli <run|replay> --scenario <path> [--actions <path> | --log <path>]");
  }

  const values = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];

    if (!key?.startsWith("--") || !value) {
      throw new Error("Invalid CLI arguments.");
    }

    values.set(key, value);
  }

  const scenarioPath = values.get("--scenario");
  if (!scenarioPath) {
    throw new Error("Missing --scenario path.");
  }

  if (commandRaw === "run") {
    const actionsPath = values.get("--actions");
    if (!actionsPath) {
      throw new Error("Missing --actions path for run command.");
    }

    return { command: "run", scenarioPath, actionsPath };
  }

  const logPath = values.get("--log");
  if (!logPath) {
    throw new Error("Missing --log path for replay command.");
  }

  return { command: "replay", scenarioPath, logPath };
};

const parseActions = (input: unknown): EngineAction[] => {
  if (!Array.isArray(input)) {
    throw new Error("Actions file must be an array.");
  }

  return input.map((item, index) => {
    if (typeof item !== "object" || item === null || typeof (item as { type?: unknown }).type !== "string") {
      throw new Error(`Invalid action at index ${index}.`);
    }

    const action = item as { type: string; payload?: Record<string, unknown> };
    return action.payload ? { type: action.type, payload: action.payload } : { type: action.type };
  });
};

const parseEventLog = (input: unknown): EngineEvent[] => {
  if (!Array.isArray(input)) {
    throw new Error("Log file must be an array.");
  }

  return input as EngineEvent[];
};

const runCommand = (scenarioPath: string, actionsPath: string): void => {
  const scenarioInput = readJsonFile(scenarioPath);
  const validated = validateScenario(scenarioInput);
  if (!validated.success) {
    throw new Error(`Invalid scenario: ${validated.errors.join("; ")}`);
  }

  const actions = parseActions(readJsonFile(actionsPath));
  const engine = createEngine({ scenario: validated.data });

  for (const action of actions) {
    const result = engine.dispatch(action);
    if (!result.ok) {
      throw result.error;
    }
  }

  const finalState = engine.getState();
  const log = engine.getEventLog();
  const replayedState = replayScenario({ scenario: validated.data, events: log });
  const replayOk = JSON.stringify(finalState) === JSON.stringify(replayedState);

  console.log("Final state:");
  console.log(JSON.stringify(finalState, null, 2));
  console.log("Log:");
  console.log(JSON.stringify(log, null, 2));
  console.log(`Replay ${replayOk ? "OK" : "Mismatch"}`);
};

const replayCommand = (scenarioPath: string, logPath: string): void => {
  const scenarioInput = readJsonFile(scenarioPath);
  const validated = validateScenario(scenarioInput);
  if (!validated.success) {
    throw new Error(`Invalid scenario: ${validated.errors.join("; ")}`);
  }

  const log = parseEventLog(readJsonFile(logPath));
  const finalState = replayScenario({ scenario: validated.data, events: log });

  console.log("Final state:");
  console.log(JSON.stringify(finalState, null, 2));
  console.log("Log:");
  console.log(JSON.stringify(log, null, 2));
  console.log("Replay OK");
};

const main = (): void => {
  try {
    const args = parseArgs(process.argv);
    if (args.command === "run" && args.actionsPath) {
      runCommand(args.scenarioPath, args.actionsPath);
      return;
    }

    if (args.command === "replay" && args.logPath) {
      replayCommand(args.scenarioPath, args.logPath);
      return;
    }

    throw new Error("Invalid command arguments.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CLI error.";
    console.error(message);
    process.exitCode = 1;
  }
};

main();
