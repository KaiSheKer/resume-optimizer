import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, dirname } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const iconPath = resolve(dirname(fileURLToPath(import.meta.url)), "../app/icon.svg");

test("app icon asset exists to satisfy favicon requests", async () => {
  await access(iconPath, constants.R_OK);
  assert.ok(true);
});
