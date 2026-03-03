import { createServer } from "node:http";

import { createServerApp } from "./app";

const port = Number(process.env.PORT ?? 4000);

const main = async () => {
  const { handler, store } = createServerApp();
  await store.load();

  const server = createServer((req, res) => {
    void handler(req, res);
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[null-server] listening on http://localhost:${port}`);
  });
};

void main();
