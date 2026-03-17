import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const pagePath = resolve(dirname(fileURLToPath(import.meta.url)), "../app/page.tsx");

test("analysis request surfaces backend error payloads instead of only status codes", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /const errorPayload = await response\.json\(\)\.catch\(\(\) => \(\{\}\)\);/);
  assert.match(source, /throw new Error\(errorPayload\.error \|\| `API 请求失败: \$\{response\.status\}`\);/);
});
