import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const promptModuleUrl = pathToFileURL(
  resolve(dirname(fileURLToPath(import.meta.url)), "../lib/prompt.ts")
).href;
const prompts = await import(promptModuleUrl);

test("mockInterviewPrompt builds the required role-oriented markdown template", () => {
  const promptBuilder = (prompts as { mockInterviewPrompt?: unknown }).mockInterviewPrompt;

  assert.equal(typeof promptBuilder, "function");

  const prompt = (promptBuilder as (jd: string, resume: string, analysis: string) => string)(
    "JD 示例",
    "简历 示例",
    "分析 示例"
  );

  assert.match(prompt, /^你是一位极其资深的面试官训练顾问。/);
  assert.match(prompt, /# 模拟面试/);
  assert.match(prompt, /## 直属上级/);
  assert.match(prompt, /## 高级 VP/);
  assert.match(prompt, /## HRD/);
  assert.match(prompt, /JD 内容：\nJD 示例/);
  assert.match(prompt, /简历内容：\n简历 示例/);
  assert.match(prompt, /分析结果：\n分析 示例/);
});
