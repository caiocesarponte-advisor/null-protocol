import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

import scenario from "../../web/src/demo/scenario.json";
import { createServerApp } from "../src/app";

const startServer = async () => {
  const { handler, store } = createServerApp();
  await store.load();
  const server = createServer((req, res) => {
    void handler(req, res);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server");
  }

  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
};

describe("authoritative server", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "null-server-"));
    process.env.NULL_SERVER_PERSIST_PATH = path.join(tempDir, "sessions.json");
    process.env.NULL_SERVER_SNAPSHOT_INTERVAL = "2";
  });

  afterEach(async () => {
    delete process.env.NULL_SERVER_PERSIST_PATH;
    delete process.env.NULL_SERVER_SNAPSHOT_INTERVAL;
    await rm(tempDir, { recursive: true, force: true });
  });

  it("handles CORS preflight and includes CORS headers on API responses", async () => {
    const { server, baseUrl } = await startServer();

    try {
      const preflightResponse = await fetch(`${baseUrl}/session`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type"
        }
      });

      expect(preflightResponse.status).toBe(204);
      expect(preflightResponse.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
      expect(preflightResponse.headers.get("access-control-allow-methods")).toContain("POST");
      expect(preflightResponse.headers.get("access-control-allow-headers")).toContain("Content-Type");

      const createResponse = await fetch(`${baseUrl}/session`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ scenario })
      });

      expect(createResponse.status).toBe(201);
      expect(createResponse.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    } finally {
      server.close();
    }
  });

  it("stores scenario identity/version/hash and exports a validated audit bundle", async () => {
    const { server, baseUrl } = await startServer();

    try {
      const createResponse = await fetch(`${baseUrl}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });
      const created = (await createResponse.json()) as {
        sessionId: string;
        scenarioHash: string;
        scenarioId: string;
        scenarioVersion: string;
      };

      expect(created.sessionId).toBeTruthy();
      expect(created.scenarioHash).toMatch(/^[a-f0-9]{64}$/);
      expect(created.scenarioId).toBe(scenario.metadata.id);
      expect(created.scenarioVersion).toBe(String(scenario.schemaVersion));

      await fetch(`${baseUrl}/session/${created.sessionId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "gainAccessToken", payload: { tokenLabel: "alpha" }, scenarioHash: created.scenarioHash })
      });

      const exportResponse = await fetch(`${baseUrl}/session/${created.sessionId}/export`);
      const bundle = (await exportResponse.json()) as {
        scenarioHash: string;
        scenarioId: string;
        scenarioVersion: string;
        scenario: unknown;
        eventLog: unknown[];
        finalState: Record<string, unknown>;
        integrity: { ok: boolean; eventCount: number; finalHash: string | null };
      };

      expect(exportResponse.status).toBe(200);
      expect(bundle.scenarioHash).toBe(created.scenarioHash);
      expect(bundle.scenarioId).toBe(created.scenarioId);
      expect(bundle.scenarioVersion).toBe(created.scenarioVersion);
      expect(bundle.scenario).toEqual(scenario);
      expect(bundle.eventLog).toHaveLength(1);
      expect(bundle.finalState).toEqual(expect.objectContaining({ score: expect.any(Number) }));
      expect(bundle.integrity.ok).toBe(true);
      expect(bundle.integrity.eventCount).toBe(1);
      expect(bundle.integrity.finalHash).toBeTruthy();
    } finally {
      server.close();
    }
  });

  it("rejects joins when provided scenarioHash differs", async () => {
    const { server, baseUrl } = await startServer();

    try {
      const createResponse = await fetch(`${baseUrl}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });
      const created = (await createResponse.json()) as { sessionId: string };

      const syncResponse = await fetch(`${baseUrl}/session/${created.sessionId}?scenarioHash=bad-hash`);
      const body = (await syncResponse.json()) as {
        error: string;
        expectedScenarioHash: string;
        providedScenarioHash: string;
      };

      expect(syncResponse.status).toBe(409);
      expect(body.error).toContain("Scenario hash mismatch");
      expect(body.expectedScenarioHash).toMatch(/^[a-f0-9]{64}$/);
      expect(body.providedScenarioHash).toBe("bad-hash");
    } finally {
      server.close();
    }
  });
});
