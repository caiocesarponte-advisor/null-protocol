import type { IncomingMessage, ServerResponse } from "node:http";

import { createSessionStore } from "./store";

interface JsonResponse {
  status: number;
  body: unknown;
}

const readJsonBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
};

const sendJson = (res: ServerResponse, response: JsonResponse): void => {
  res.statusCode = response.status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(response.body));
};

export const createServerApp = () => {
  const store = createSessionStore();

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const method = req.method ?? "GET";

      if (method === "GET" && url.pathname === "/health") {
        sendJson(res, { status: 200, body: { ok: true } });
        return;
      }

      if (method === "POST" && url.pathname === "/session") {
        const body = (await readJsonBody(req)) as { scenario?: unknown };
        const created = store.createSession(body.scenario);
        await store.save();
        sendJson(res, { status: 201, body: { sessionId: created.sessionId } });
        return;
      }

      const sessionMatch = url.pathname.match(/^\/session\/([^/]+)$/);
      if (method === "GET" && sessionMatch) {
        const session = store.getSession(sessionMatch[1] ?? "");
        if (!session) {
          sendJson(res, { status: 404, body: { error: "Session not found" } });
          return;
        }

        sendJson(res, { status: 200, body: { scenario: session.scenario, eventLog: session.eventLog } });
        return;
      }

      const actionMatch = url.pathname.match(/^\/session\/([^/]+)\/action$/);
      if (method === "POST" && actionMatch) {
        const body = (await readJsonBody(req)) as {
          actionType?: string;
          payload?: Record<string, unknown>;
          eventLog?: unknown;
        };

        if (typeof body.actionType !== "string") {
          sendJson(res, { status: 400, body: { error: "actionType must be a string" } });
          return;
        }

        if (body.payload !== undefined && (typeof body.payload !== "object" || body.payload === null)) {
          sendJson(res, { status: 400, body: { error: "payload must be an object" } });
          return;
        }

        const response = store.applyAction(
          actionMatch[1] ?? "",
          { type: body.actionType, payload: body.payload ?? {} },
          body.eventLog
        );
        await store.save();
        sendJson(res, { status: 200, body: { eventLog: response.eventLog, integrity: "ok" } });
        return;
      }

      sendJson(res, { status: 404, body: { error: "Not found" } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      const status = message === "Session not found" ? 404 : 400;
      sendJson(res, { status, body: { error: message } });
    }
  };

  return { handler, store };
};
