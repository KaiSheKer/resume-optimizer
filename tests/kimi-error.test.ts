import assert from "node:assert/strict";
import test from "node:test";

import { getKimiErrorMessage } from "../lib/kimi-error.ts";

test("maps insufficient balance responses to a clear Chinese message", () => {
  const message = getKimiErrorMessage(
    429,
    "Your account org-xxx is suspended due to insufficient balance, please recharge your account"
  );

  assert.equal(
    message,
    "Kimi 账户余额不足或套餐不可用，请检查计费状态后重试。"
  );
});

test("falls back to upstream message when no special mapping exists", () => {
  const message = getKimiErrorMessage(500, "upstream exploded");

  assert.equal(message, "upstream exploded");
});
