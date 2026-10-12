import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApiHandler } from "./api.mjs";

const description =
  "Remote frontend developer. Build React interfaces. TypeScript required. Salary: $3000 per month.";
async function withServer(options, run) {
  const handler = createApiHandler(options);
  const server = createServer((req, res) => void handler(req, res));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/summarize`;
  try {
    await run(url);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
const post = (url, body, headers = {}) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
test("summarizes supplied text through the server", async () => {
  await withServer(
    {
      apiKey: () => "test",
      generate: async (args) => {
        assert.equal(args.prompt, description);
        assert.match(args.instructions, /Never invent/);
        return { text: "• Remote React role\n• TypeScript required" };
      },
    },
    async (url) => {
      const res = await post(url, { description });
      assert.equal(res.status, 200);
      assert.match((await res.json()).summary, /React/);
    },
  );
});
test("reports missing configuration without attempting generation", async () => {
  await withServer(
    {
      apiKey: () => "",
      generate: () => {
        assert.fail("Should not call provider");
      },
    },
    async (url) => {
      const res = await post(url, { description });
      assert.equal(res.status, 503);
      assert.match((await res.json()).error, /AI_GATEWAY_API_KEY/);
    },
  );
});
test("rejects invalid input and cross-origin calls", async () => {
  await withServer(
    {
      apiKey: () => "test",
      generate: () => assert.fail("Should not call provider"),
    },
    async (url) => {
      assert.equal((await post(url, { description: "short" })).status, 400);
      assert.equal((await post(url, "{")).status, 400);
      assert.equal(
        (await post(url, { description: "x".repeat(20001) })).status,
        400,
      );
      assert.equal(
        (await post(url, { description }, { Origin: "https://example.com" }))
          .status,
        403,
      );
      assert.equal((await fetch(url)).status, 405);
    },
  );
});
test("provider failures return an actionable message", async () => {
  await withServer(
    {
      apiKey: () => "test",
      generate: async () => {
        throw new Error("Secret provider response");
      },
    },
    async (url) => {
      const res = await post(url, { description });
      assert.equal(res.status, 502);
      const body = await res.json();
      assert.match(body.error, /API key/);
      assert.doesNotMatch(body.error, /Secret/);
    },
  );
});
