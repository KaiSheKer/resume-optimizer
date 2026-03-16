# Mock Interview Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an on-demand `模拟面试` tab that generates personalized panel-style interview coaching for `直属上级`、`高级 VP`、`HRD` based on the current `JD + 简历 + 分析结果`.

**Architecture:** Keep mock interview generation decoupled from the main analysis chain. Add a new `/api/mock-interview` route and prompt template that return a single Markdown document, extend `lib/markdown-parser.ts` with role-level extraction helpers, and render the new flow through a dedicated `MockInterviewPanel` component so `app/page.tsx` only manages state and API orchestration.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript 5, Tailwind CSS 3, React Markdown, Moonshot Kimi API

---

## Implementation Notes

- This repo currently does not have a dedicated automated test runner. Verification for this feature should rely on:
  - `pnpm lint`
  - `pnpm build`
  - manual browser smoke tests
  - one negative API smoke test with `curl`
- Do not touch unrelated local changes such as `wrangler.jsonc`.
- Keep the first version read-only. Do not add chat-style follow-up, scoring, persistence, or history.

---

### Task 0: Create An Isolated Worktree

**Files:**
- None

**Step 1: Confirm the current branch and latest commit**

Run:

```bash
git branch --show-current
git log --oneline -3
```

Expected:

- You are on the branch that contains the design and implementation docs
- The log includes the `mock interview` design/plan commits

**Step 2: Create a dedicated worktree for implementation**

Run:

```bash
git worktree add ../resume-optimizer-mock-interview -b codex/mock-interview HEAD
```

Expected:

- A new directory `../resume-optimizer-mock-interview` is created
- A new branch `codex/mock-interview` is checked out there

**Step 3: Switch to the new worktree**

Run:

```bash
cd ../resume-optimizer-mock-interview
git status --short
```

Expected:

- The worktree is clean
- No unrelated local modifications are present

---

### Task 1: Add The Mock Interview Prompt Template

**Files:**
- Modify: `lib/prompt.ts`

**Step 1: Read the existing prompt structure**

Run:

```bash
sed -n '1,260p' lib/prompt.ts
```

Expected:

- You see `resumeAnalysisPrompt(...)`
- You see `icebreakerPrompt(...)`

**Step 2: Add the new prompt builder**

Append a new function to `lib/prompt.ts`:

```typescript
export function mockInterviewPrompt(jd: string, resume: string, analysis: string): string {
  return `你是一位极其资深的面试官训练顾问。请基于以下 JD、简历和已有分析结果，
生成一个“模拟面试”辅导面板，面向三个角色：
1. 直属上级
2. 高级 VP
3. HRD

请严格遵守以下要求：

一、整体要求
- 输出语言为中文
- 输出格式必须是 Markdown
- 顶级标题必须是：# 模拟面试
- 二级标题必须严格包含以下三个角色，顺序固定：
  - ## 直属上级
  - ## 高级 VP
  - ## HRD
- 每个角色输出 5-7 道问题
- 每道问题都必须强绑定当前 JD、当前简历经历和分析结果中的亮点/缺口
- 不要输出通用题库，不要写空泛问题
- 不要输出完整标准答案，只提供回答框架

二、每道题的固定结构
### 问题 X：{具体问题}
**为什么会问**
{说明该角色为什么会这样问，必须结合当前岗位和简历}

**考察点**
- {考察点1}
- {考察点2}
- {考察点3}

**回答框架**
- {建议先讲什么}
- {建议再讲什么}
- {建议最后讲什么}

**常见雷区**
- {最容易踩的坑1}
- {最容易踩的坑2}

三、角色要求
- 直属上级：聚焦执行能力、项目细节、跨团队协作、优先级取舍、结果真实性
- 高级 VP：聚焦业务判断、战略理解、目标拆解、影响力、组织视角
- HRD：聚焦动机、稳定性、文化适配、风险点、职业路径一致性

四、禁止项
- 不要重复三个角色的问题
- 不要脱离 JD 与简历凭空发挥
- 不要写“以下是模拟面试题”之类前言
- 不要写总结陈词

JD 内容：
${jd}

简历内容：
${resume}

分析结果：
${analysis}`;
}
```

**Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected:

- Lint passes
- No syntax or formatting errors are introduced in `lib/prompt.ts`

**Step 4: Commit**

Run:

```bash
git add lib/prompt.ts
git commit -m "feat: add mock interview prompt template"
```

---

### Task 2: Create The Mock Interview API Route

**Files:**
- Create: `app/api/mock-interview/route.ts`

**Step 1: Create the route file**

Run:

```bash
mkdir -p app/api/mock-interview
touch app/api/mock-interview/route.ts
```

**Step 2: Implement request validation and Kimi API call**

Create `app/api/mock-interview/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { mockInterviewPrompt } from "@/lib/prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jd, resume, analysis } = body;

    if (!jd || typeof jd !== "string") {
      return NextResponse.json(
        { error: "缺少或无效的 JD 参数" },
        { status: 400 }
      );
    }

    if (!resume || typeof resume !== "string") {
      return NextResponse.json(
        { error: "缺少或无效的简历参数" },
        { status: 400 }
      );
    }

    if (!analysis || typeof analysis !== "string") {
      return NextResponse.json(
        { error: "缺少或无效的分析结果参数" },
        { status: 400 }
      );
    }

    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      console.error("KIMI_API_KEY 环境变量未设置");
      return NextResponse.json(
        { error: "服务器配置错误：API Key 未设置" },
        { status: 500 }
      );
    }

    const prompt = mockInterviewPrompt(jd, resume, analysis);

    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-k2.5",
        messages: [
          {
            role: "system",
            content:
              "你是一位资深面试训练顾问，擅长把 JD、简历和岗位匹配分析转化为高质量的模拟面试辅导面板。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Kimi API 错误:", errorData);
      return NextResponse.json(
        {
          error:
            errorData.error?.message ||
            `API 请求失败: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = String(data.choices[0]?.message?.content || "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "模拟面试内容为空，请重试" },
        { status: 502 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Mock interview API 路由错误:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
```

**Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected:

- The new route passes lint
- Path alias import from `@/lib/prompt` resolves cleanly

**Step 4: Commit**

Run:

```bash
git add app/api/mock-interview/route.ts
git commit -m "feat: add mock interview API route"
```

---

### Task 3: Extend Markdown Parsing For Mock Interview Roles

**Files:**
- Modify: `lib/markdown-parser.ts`

**Step 1: Read the current parser implementation**

Run:

```bash
sed -n '1,260p' lib/markdown-parser.ts
```

Expected:

- You see the existing `BaseTabId`, `TAB_MAPPING`, and `getTabContentById(...)`

**Step 2: Add role-level types and heading mapping**

Update the top of `lib/markdown-parser.ts`:

```typescript
export type BaseTabId = "overview" | "analysis" | "suggestions";
export type MockInterviewRoleId = "manager" | "vp" | "hrd";

const MOCK_INTERVIEW_ROLE_MAPPING: Record<MockInterviewRoleId, string> = {
  manager: "直属上级",
  vp: "高级 VP",
  hrd: "HRD",
};
```

**Step 3: Add a helper to extract role sections from level-2 headings**

Append the following helper functions near the bottom of the file:

```typescript
export function getMockInterviewRoleLabel(roleId: MockInterviewRoleId): string {
  return MOCK_INTERVIEW_ROLE_MAPPING[roleId];
}

export function getMockInterviewRoleContent(markdown: string, roleId: MockInterviewRoleId): string {
  const text = markdown.trim();
  if (!text) {
    return "";
  }

  const roleSections = splitSectionsAtHeadingLevel(text, 2);
  if (roleSections.length === 0) {
    return text;
  }

  const targetTitle = getMockInterviewRoleLabel(roleId);
  const exact = findExactSection(roleSections, targetTitle);
  if (exact) {
    return exact.fullText;
  }

  return "";
}
```

**Step 4: Make sure the existing analysis parser behavior is unchanged**

Do not modify:

- `TAB_MAPPING`
- `TAB_KEYWORDS`
- `getTabContentById(...)` fallback behavior

Only add the new role helpers on top of the existing implementation.

**Step 5: Run typecheck and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected:

- TypeScript passes with no new type errors
- Lint still passes

**Step 6: Commit**

Run:

```bash
git add lib/markdown-parser.ts
git commit -m "feat: add mock interview markdown helpers"
```

---

### Task 4: Create A Dedicated MockInterviewPanel Component

**Files:**
- Create: `components/mock-interview-panel.tsx`

**Step 1: Create the component file**

Run:

```bash
touch components/mock-interview-panel.tsx
```

**Step 2: Implement the panel states and nested role tabs**

Create `components/mock-interview-panel.tsx` with:

```typescript
"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs } from "@/components/tabs";
import {
  MockInterviewRoleId,
  getMockInterviewRoleContent,
} from "@/lib/markdown-parser";

const ROLE_TABS: Array<{ id: MockInterviewRoleId; label: string }> = [
  { id: "manager", label: "直属上级" },
  { id: "vp", label: "高级 VP" },
  { id: "hrd", label: "HRD" },
];

interface MockInterviewPanelProps {
  content: string;
  isLoading: boolean;
  error: string;
  hasStarted: boolean;
  copiedRoleId: MockInterviewRoleId | null;
  onStart: () => void;
  onRetry: () => void;
  onCopy: (content: string, roleId: MockInterviewRoleId) => void;
}

export function MockInterviewPanel({
  content,
  isLoading,
  error,
  hasStarted,
  copiedRoleId,
  onStart,
  onRetry,
  onCopy,
}: MockInterviewPanelProps) {
  if (!hasStarted) {
    return (
      <div className="rounded-lg border border-claude-border bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-claude-orange/10 text-claude-orange">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-claude-text-primary dark:text-white">
            模拟面试
          </h3>
          <p className="mb-6 text-sm leading-7 text-claude-text-secondary dark:text-gray-400">
            基于当前 JD、简历和分析结果，生成直属上级、高级 VP、HRD 三种视角的定制化面试辅导面板。
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-lg bg-claude-orange px-6 py-3 text-white transition-all hover:scale-105 hover:bg-claude-orange-dark"
          >
            <Sparkles className="h-4 w-4" />
            <span>开始模拟</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-claude-border bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-claude-border border-t-claude-orange" />
          <p className="text-sm text-claude-text-secondary dark:text-gray-400">
            正在生成直属上级 / 高级 VP / HRD 视角问题...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-claude-danger/40 bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-3 text-xl font-semibold text-claude-text-primary dark:text-white">
            模拟面试生成失败
          </h3>
          <p className="mb-6 text-sm leading-7 text-claude-text-secondary dark:text-gray-400">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="rounded-lg bg-claude-orange px-6 py-3 text-white transition-all hover:bg-claude-orange-dark"
          >
            重新生成
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-claude-border bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <Tabs tabs={ROLE_TABS} defaultTab="manager">
        {(activeRoleTab) => {
          const roleId = activeRoleTab as MockInterviewRoleId;
          const roleContent = getMockInterviewRoleContent(content, roleId);

          return (
            <div className="relative">
              <button
                onClick={() => onCopy(roleContent, roleId)}
                className="absolute right-0 top-0 rounded-md p-2 transition-colors hover:bg-claude-surface-elevated"
                title="复制当前角色内容"
              >
                {copiedRoleId === roleId ? (
                  <Check className="h-4 w-4 text-claude-success" />
                ) : (
                  <Copy className="h-4 w-4 text-claude-text-secondary hover:text-claude-orange" />
                )}
              </button>

              <div className="prose prose-blue max-w-none pr-10 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {roleContent || "未识别到该角色内容，请重新生成。"}
                </ReactMarkdown>
              </div>
            </div>
          );
        }}
      </Tabs>
    </div>
  );
}
```

**Step 3: Run typecheck and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected:

- The new component compiles cleanly
- Nested `Tabs` usage does not introduce prop/type issues

**Step 4: Commit**

Run:

```bash
git add components/mock-interview-panel.tsx
git commit -m "feat: add mock interview panel component"
```

---

### Task 5: Integrate Mock Interview State And Request Flow In app/page.tsx

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add the new imports**

Update the imports at the top of `app/page.tsx`:

```typescript
import { MockInterviewPanel } from "@/components/mock-interview-panel";
import type { MockInterviewRoleId } from "@/lib/markdown-parser";
```

**Step 2: Add mock interview state**

Add the following state near the existing `icebreaker` state:

```typescript
const [mockInterviewContent, setMockInterviewContent] = useState("");
const [isMockInterviewLoading, setIsMockInterviewLoading] = useState(false);
const [mockInterviewError, setMockInterviewError] = useState("");
const [hasMockInterviewStarted, setHasMockInterviewStarted] = useState(false);
const [copiedMockInterviewRoleId, setCopiedMockInterviewRoleId] =
  useState<MockInterviewRoleId | null>(null);
```

**Step 3: Add a reset helper for mock interview state**

Add this helper inside the component:

```typescript
const resetMockInterviewState = () => {
  setMockInterviewContent("");
  setMockInterviewError("");
  setIsMockInterviewLoading(false);
  setHasMockInterviewStarted(false);
  setCopiedMockInterviewRoleId(null);
};
```

Use this helper in:

- the beginning of `handleAnalyze`
- the `onChange` handler for the JD textarea
- the `onChange` handler for the resume textarea
- the `清空` buttons for JD and resume
- `handlePaste(...)` after successful paste

Important:

- Only the mock interview state needs to be invalidated on input edits
- Keep the existing analysis result behavior unchanged

**Step 4: Add the start/retry request handler**

Add this function:

```typescript
const handleStartMockInterview = async () => {
  if (!result.trim()) {
    setToast({ message: "请先完成简历分析", type: "info" });
    return;
  }

  setHasMockInterviewStarted(true);
  setIsMockInterviewLoading(true);
  setMockInterviewError("");
  setMockInterviewContent("");
  setCopiedMockInterviewRoleId(null);

  try {
    const response = await fetch("/api/mock-interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jd,
        resume,
        analysis: result,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(
        errorPayload.error || `模拟面试生成失败: ${response.status}`
      );
    }

    const data = await response.json();
    const content =
      typeof data.content === "string" ? data.content.trim() : "";

    if (!content) {
      throw new Error("模拟面试内容为空，请重试");
    }

    setMockInterviewContent(content);
    setToast({ message: "模拟面试已生成", type: "success" });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "模拟面试生成失败，请重试";
    setMockInterviewError(errorMessage);
    setToast({ message: errorMessage, type: "error" });
  } finally {
    setIsMockInterviewLoading(false);
  }
};
```

**Step 5: Add a role-level copy handler**

Add this function next to the existing `handleCopy(...)`:

```typescript
const handleCopyMockInterviewRole = async (
  content: string,
  roleId: MockInterviewRoleId
) => {
  if (!content.trim()) {
    setToast({ message: "当前角色暂无可复制内容", type: "info" });
    return;
  }

  try {
    await navigator.clipboard.writeText(content);
    setCopiedMockInterviewRoleId(roleId);
    setToast({ message: "已复制到剪贴板", type: "success" });
    window.setTimeout(() => {
      setCopiedMockInterviewRoleId((current) =>
        current === roleId ? null : current
      );
    }, 1200);
  } catch {
    setToast({ message: "复制失败，请重试", type: "error" });
  }
};
```

**Step 6: Add the new top-level tab**

Update the `tabs` array:

```typescript
const tabs = [
  { id: "overview", label: "概览" },
  { id: "analysis", label: "详细分析" },
  { id: "suggestions", label: "优化建议" },
  { id: "icebreaker", label: "HR 破冰" },
  { id: "mockInterview", label: "模拟面试" },
  { id: "original", label: "原文" },
];
```

**Step 7: Render the dedicated panel for the new tab**

Inside the `Tabs` render block:

- keep the current card + copy button for `overview` / `analysis` / `suggestions` / `icebreaker` / `original`
- branch on `activeTab === "mockInterview"` and render `MockInterviewPanel`

Use this shape:

```tsx
{activeTab === "mockInterview" ? (
  <MockInterviewPanel
    content={mockInterviewContent}
    isLoading={isMockInterviewLoading}
    error={mockInterviewError}
    hasStarted={hasMockInterviewStarted}
    copiedRoleId={copiedMockInterviewRoleId}
    onStart={() => void handleStartMockInterview()}
    onRetry={() => void handleStartMockInterview()}
    onCopy={(content, roleId) => void handleCopyMockInterviewRole(content, roleId)}
  />
) : (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-claude-border dark:border-gray-700 relative">
    {/* keep the existing non-mock-interview rendering here */}
  </div>
)}
```

Important:

- Do not reuse the current top-right global copy button for the mock interview tab
- Keep mock interview copy inside the panel at role granularity

**Step 8: Run typecheck and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected:

- `app/page.tsx` still compiles cleanly
- No duplicate state or unreachable branch issues are reported

**Step 9: Commit**

Run:

```bash
git add app/page.tsx
git commit -m "feat: integrate mock interview flow into results page"
```

---

### Task 6: Update README To Reflect The New Feature

**Files:**
- Modify: `README.md`

**Step 1: Read the current README sections**

Run:

```bash
sed -n '1,220p' README.md
```

Expected:

- You see `最新更新`
- You see `功能特性`

**Step 2: Add the new feature to the README**

Update the relevant bullets:

- under `最新更新` add a short item for `模拟面试`
- under `功能特性` add a bullet explaining:
  - strong personalization
  - three roles
  - on-demand generation

Example bullet:

```markdown
- 🎭 模拟面试：点击开始后，自动生成直属上级 / 高级 VP / HRD 三种视角的深度问答辅导
```

**Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected:

- README changes do not affect lint

**Step 4: Commit**

Run:

```bash
git add README.md
git commit -m "docs: document mock interview feature"
```

---

### Task 7: Verify The Feature End-To-End

**Files:**
- Verify: `app/page.tsx`
- Verify: `components/mock-interview-panel.tsx`
- Verify: `lib/markdown-parser.ts`
- Verify: `app/api/mock-interview/route.ts`

**Step 1: Run the static checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected:

- TypeScript passes
- ESLint passes
- Next build succeeds

**Step 2: Start the dev server**

Run:

```bash
pnpm dev
```

Expected:

- The app starts locally on `http://localhost:3000`

**Step 3: Verify the main happy path in the browser**

Use a real JD and a real resume sample:

1. Paste JD
2. Paste resume
3. Click `开始分析`
4. Wait for analysis and HR 破冰 to finish
5. Click `模拟面试`
6. Confirm the default state shows the explanatory copy and `开始模拟`
7. Click `开始模拟`
8. Confirm the loading state appears
9. Confirm success renders nested tabs for:
   - `直属上级`
   - `高级 VP`
   - `HRD`
10. Switch across all three role tabs
11. Confirm each role renders different content
12. Confirm copy works per role

**Step 4: Verify invalidation behavior**

1. After a successful mock interview generation, edit the JD textarea
2. Return to the `模拟面试` tab
3. Confirm the panel is back to the default unstarted state
4. Repeat the same check after editing the resume textarea

**Step 5: Verify failure isolation**

Run a negative API test in another terminal while the dev server is running:

```bash
curl -i \
  -X POST http://localhost:3000/api/mock-interview \
  -H 'Content-Type: application/json' \
  -d '{"jd":"","resume":"resume","analysis":"analysis"}'
```

Expected:

- The route returns `HTTP/1.1 400`
- The JSON payload includes `缺少或无效的 JD 参数`

Then in the browser:

1. Generate the main analysis successfully
2. Trigger a mock interview failure scenario if possible
3. Confirm existing tabs (`概览` / `详细分析` / `优化建议` / `HR 破冰` / `原文`) remain readable

**Step 6: Commit the verified implementation**

Run:

```bash
git status --short
git add app/page.tsx components/mock-interview-panel.tsx lib/markdown-parser.ts app/api/mock-interview/route.ts lib/prompt.ts README.md
git commit -m "feat: add on-demand mock interview coaching"
```

Expected:

- Only the intended feature files are committed
- The working tree is clean after the commit
