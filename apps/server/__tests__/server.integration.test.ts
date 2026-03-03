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
  });

  afterEach(async () => {
    delete process.env.NULL_SERVER_PERSIST_PATH;
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
  it("creates a session, applies 3 actions and keeps integrity ok", async () => {
    const { server, baseUrl } = await startServer();

    try {
      const createResponse = await fetch(`${baseUrl}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });
      const created = (await createResponse.json()) as { sessionId: string };

      expect(createResponse.status).toBe(201);
      expect(created.sessionId).toBeTruthy();

      const actions = [
        { actionType: "gainAccessToken", payload: { tokenLabel: "alpha" } },
        { actionType: "raiseAlert", payload: { nextLevel: 1 } },
        { actionType: "advancePhase", payload: {} }
      ];

      for (const action of actions) {
        const actionResponse = await fetch(`${baseUrl}/session/${created.sessionId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action)
        });
        const body = (await actionResponse.json()) as { integrity: "ok"; eventLog: unknown[] };

        expect(actionResponse.status).toBe(200);
        expect(body.integrity).toBe("ok");
      }

      const sessionResponse = await fetch(`${baseUrl}/session/${created.sessionId}`);
      const session = (await sessionResponse.json()) as { eventLog: unknown[] };
      expect(session.eventLog).toHaveLength(3);
    } finally {
      server.close();
    }
  });
});
