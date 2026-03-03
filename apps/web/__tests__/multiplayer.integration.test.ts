import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { replayScenario, verifyEventChain, type EngineEvent } from "@null-protocol/engine";

import scenario from "../src/demo/scenario.json";
import { createServerApp } from "../../server/src/app";

interface ClientState {
  eventLog: EngineEvent[];
}

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

describe("multiplayer reconciliation", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "null-server-client-"));
    process.env.NULL_SERVER_PERSIST_PATH = path.join(tempDir, "sessions.json");
  });

  afterEach(async () => {
    delete process.env.NULL_SERVER_PERSIST_PATH;
    await rm(tempDir, { recursive: true, force: true });
  });

  it("keeps two clients in sync after sequential authoritative actions", async () => {
    const { server, baseUrl } = await startServer();

    try {
      const createResponse = await fetch(`${baseUrl}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });
      const created = (await createResponse.json()) as { sessionId: string };

      const clientA: ClientState = { eventLog: [] };
      const clientB: ClientState = { eventLog: [] };

      const dispatchAsClient = async (client: ClientState, actionType: string, payload: Record<string, unknown>) => {
        const response = await fetch(`${baseUrl}/session/${created.sessionId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionType, payload, eventLog: client.eventLog })
        });
        expect(response.status).toBe(200);
        const body = (await response.json()) as { eventLog: EngineEvent[] };
        client.eventLog = body.eventLog;
      };

      await dispatchAsClient(clientA, "gainAccessToken", { tokenLabel: "alpha" });
      await dispatchAsClient(clientB, "raiseAlert", { nextLevel: 1 });

      const syncA = await fetch(`${baseUrl}/session/${created.sessionId}`);
      const syncB = await fetch(`${baseUrl}/session/${created.sessionId}`);
      clientA.eventLog = ((await syncA.json()) as { eventLog: EngineEvent[] }).eventLog;
      clientB.eventLog = ((await syncB.json()) as { eventLog: EngineEvent[] }).eventLog;

      const stateA = replayScenario({ scenario, events: clientA.eventLog, verifyIntegrity: true });
      const stateB = replayScenario({ scenario, events: clientB.eventLog, verifyIntegrity: true });

      expect(verifyEventChain(clientA.eventLog, scenario.initialState)).toEqual({ ok: true });
      expect(stateA).toEqual(stateB);
    } finally {
      server.close();
    }
  });
});
