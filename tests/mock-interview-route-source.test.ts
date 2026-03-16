import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const routePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../app/api/mock-interview/route.ts"
);

test("mock interview route uses model settings accepted by kimi-k2.5", async () => {
  const source = await readFile(routePath, "utf8");

  assert.match(source, /model:\s*"kimi-k2\.5"/);
  assert.doesNotMatch(source, /temperature:/);
});
