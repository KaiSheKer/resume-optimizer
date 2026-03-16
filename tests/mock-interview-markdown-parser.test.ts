import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const parserModuleUrl = pathToFileURL(
  resolve(dirname(fileURLToPath(import.meta.url)), "../lib/markdown-parser.ts")
).href;
const parser = await import(parserModuleUrl);

const sampleMarkdown = `
# 模拟面试

## 直属上级
### 问题 1：如何推进跨团队项目？
**为什么会问**
关注执行与协作。

## 高级 VP
### 问题 1：你如何拆解年度目标？
**为什么会问**
关注战略和组织视角。

## HRD
### 问题 1：为什么考虑这次机会？
**为什么会问**
关注动机与稳定性。
`;

test("getMockInterviewRoleContent extracts the matching role section", () => {
  const getRoleContent = (parser as { getMockInterviewRoleContent?: unknown }).getMockInterviewRoleContent;

  assert.equal(typeof getRoleContent, "function");
  assert.match(
    (getRoleContent as (markdown: string, roleId: string) => string)(sampleMarkdown, "vp"),
    /^## 高级 VP/m
  );
});

test("getMockInterviewRoleLabel maps role ids to Chinese labels", () => {
  const getRoleLabel = (parser as { getMockInterviewRoleLabel?: unknown }).getMockInterviewRoleLabel;

  assert.equal(typeof getRoleLabel, "function");
  assert.equal((getRoleLabel as (roleId: string) => string)("hrd"), "HRD");
});
