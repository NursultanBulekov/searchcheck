import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { createServer as createViteServer } from "vite";
import { createApiHandler } from "./api.mjs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "spa",
});
const api = createApiHandler();
const server = createServer((req, res) => {
  if (req.url?.startsWith("/api/")) void api(req, res);
  else vite.middlewares(req, res);
});
const port = Number(process.env.PORT || 5173);
server.listen(port, "127.0.0.1", () =>
  console.log(`Job tracker ready: http://localhost:${port}`),
);
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
  void vite.close();
});
async function close() {
  server.close();
  await vite.close();
  process.exit(0);
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
