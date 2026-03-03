import type { EngineEvent } from "@null-protocol/engine";
import type { Scenario } from "@null-protocol/scenario-kit";

export interface ScenarioMigrator {
  fromVersion: string;
  toVersion: string;
  migrateScenario?: (scenario: Scenario) => Scenario;
  migrateEventLog?: (eventLog: EngineEvent[]) => EngineEvent[];
}

export interface ScenarioMigrationRegistry {
  register: (migrator: ScenarioMigrator) => void;
  getMigrationPath: (fromVersion: string, toVersion: string) => ScenarioMigrator[];
}

export const createScenarioMigrationRegistry = (): ScenarioMigrationRegistry => {
  const migrators: ScenarioMigrator[] = [];

  return {
    register: (migrator) => {
      migrators.push(migrator);
    },

    getMigrationPath: (fromVersion, toVersion) => {
      if (fromVersion === toVersion) {
        return [];
      }

      const direct = migrators.find(
        (migrator) => migrator.fromVersion === fromVersion && migrator.toVersion === toVersion
      );
      return direct ? [direct] : [];
    }
  };
};
