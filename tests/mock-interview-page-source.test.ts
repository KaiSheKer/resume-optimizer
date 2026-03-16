import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const pagePath = resolve(dirname(fileURLToPath(import.meta.url)), "../app/page.tsx");

test("results page wires a dedicated mock interview tab and panel", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /MockInterviewPanel/);
  assert.match(source, /handleStartMockInterview/);
  assert.match(source, /resetMockInterviewState/);
  assert.match(source, /mockInterview/);
});
