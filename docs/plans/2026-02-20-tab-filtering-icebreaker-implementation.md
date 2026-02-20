# Tab 过滤与 HR 破冰文案功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 修复 Tab 切换功能,实现按章节过滤显示内容,并新增 HR 破冰文案生成功能

**架构:** 解析 Markdown 按一级标题分割章节,根据 activeTab 动态渲染对应内容;新增独立 API 路由生成破冰文案,前端串行调用两个 API

**技术栈:** Next.js 14, TypeScript, React 18, Tailwind CSS, Kimi API

---

## Task 1: 创建 Markdown 章节解析工具函数

**Files:**
- Create: `lib/markdown-parser.ts`

**Step 1: 创建解析工具函数文件**

```bash
touch lib/markdown-parser.ts
```

**Step 2: 编写章节解析函数**

```typescript
// lib/markdown-parser.ts

/**
 * 将 Markdown 内容按一级标题分割成章节对象
 * @param markdown - 完整的 Markdown 文本
 * @returns 章节对象,键为标题,值为内容
 */
export function parseMarkdownSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // 按一级标题分割 (# 标题)
  // 正则说明: ^#\s+(.+)$ 匹配行首的 # 标题
  const parts = markdown.split(/^#\s+(.+)$/gm);

  // parts 数组结构:
  // [0] 可能是空内容或前言
  // [1] 第一个标题
  // [2] 第一个内容
  // [3] 第二个标题
  // [4] 第二个内容
  // 以此类推...

  // 从索引 1 开始,每两个元素为一对(标题+内容)
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim();
    const content = parts[i + 1]?.trim() || "";

    if (title) {
      sections[title] = content;
    }
  }

  return sections;
}

/**
 * 根据 Tab ID 获取对应的章节标题
 */
export function getTabMapping(tabId: string): string {
  const mapping: Record<string, string> = {
    "overview": "概览",
    "analysis": "详细分析",
    "suggestions": "优化建议",
  };
  return mapping[tabId] || "";
}
```

**Step 3: 提交**

```bash
git add lib/markdown-parser.ts
git commit -m "feat: add Markdown section parser utility"
```

---

## Task 2: 创建 HR 破冰文案 Prompt 模板

**Files:**
- Modify: `lib/prompt.ts`

**Step 1: 读取现有 prompt 文件**

```bash
cat lib/prompt.ts
```

**Step 2: 在文件末尾添加破冰文案 prompt 函数**

在 `lib/prompt.ts` 文件末尾添加:

```typescript
/**
 * 生成 HR 破冰文案的 prompt
 */
export function icebreakerPrompt(jd: string, resume: string, analysis: string): string {
  return `你是一位专业的简历顾问。请基于以下 JD 和简历,生成一段 100 字以内的 HR 破冰文案。

要求:
1. 突出最匹配的 2-3 个核心技能
2. 提及最相关的 1-2 段经历
3. 总结个人优势
4. 语气友好热情,专业但不生硬
5. 目的是让 HR 第一眼就觉得这是合适的人选

JD 内容:
${jd}

简历内容:
${resume}

分析结果(参考):
${analysis}

请直接输出破冰文案,不要有任何额外说明、标题或引言。`;
}
```

**Step 3: 提交**

```bash
git add lib/prompt.ts
git commit -m "feat: add HR icebreaker prompt template"
```

---

## Task 3: 创建 HR 破冰文案 API 路由

**Files:**
- Create: `app/api/icebreaker/route.ts`

**Step 1: 创建 API 路由目录和文件**

```bash
mkdir -p app/api/icebreaker
touch app/api/icebreaker/route.ts
```

**Step 2: 编写 API 路由处理逻辑**

```typescript
// app/api/icebreaker/route.ts
import { NextRequest, NextResponse } from "next/server";
import { icebreakerPrompt } from "@/lib/prompt";

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json();
    const { jd, resume, analysis } = body;

    // 2. 参数验证
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

    // 3. 检查环境变量
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      console.error("KIMI_API_KEY 环境变量未设置");
      return NextResponse.json(
        { error: "服务器配置错误:API Key 未设置" },
        { status: 500 }
      );
    }

    // 4. 调用 Kimi API
    const prompt = icebreakerPrompt(jd, resume, analysis);
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-k2.5",
        messages: [
          {
            role: "system",
            content: "你是一位专业的简历顾问,擅长撰写吸引 HR 注意力的破冰文案。",
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

    // 5. 处理 API 错误
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Kimi API 错误:", errorData);
      return NextResponse.json(
        {
          error: errorData.error?.message || `API 请求失败: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    // 6. 返回成功结果
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // 清理可能的 Markdown 格式(移除可能的引号)
    const cleanedContent = content.replace(/^["']|["']$/g, "").trim();

    return NextResponse.json({ content: cleanedContent });
  } catch (error) {
    // 7. 捕获未知错误
    console.error("API 路由错误:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
```

**Step 3: 提交**

```bash
git add app/api/icebreaker/route.ts
git commit -m "feat: add HR icebreaker API endpoint"
```

---

## Task 4: 修改主页面 - 添加状态管理和 Tab 配置

**Files:**
- Modify: `app/page.tsx`

**Step 1: 导入新的依赖**

在文件顶部的 import 区域添加:

```typescript
import { Copy } from "lucide-react";
import { parseMarkdownSections, getTabMapping } from "@/lib/markdown-parser";
```

**Step 2: 添加新的状态变量**

找到 `const [toast, setToast] = useState<...>` 这一行,在其后添加:

```typescript
const [icebreakerText, setIcebreakerText] = useState("");
const [isIcebreakerLoading, setIsIcebreakerLoading] = useState(false);
const [activeTab, setActiveTab] = useState("overview");
```

**Step 3: 更新 Tab 配置**

找到 `const tabs = [...]` 定义,替换为:

```typescript
const tabs = [
  { id: "overview", label: "概览" },
  { id: "analysis", label: "详细分析" },
  { id: "suggestions", label: "优化建议" },
  { id: "icebreaker", label: "HR 破冰" },
  { id: "original", label: "原文" }
];
```

**Step 4: 添加内容获取函数**

在 `handleExport` 函数之后,添加新的辅助函数:

```typescript
const getTabContent = (tabId: string): string => {
  // HR 破冰 Tab
  if (tabId === "icebreaker") {
    return icebreakerText;
  }

  // 原文 Tab
  if (tabId === "original") {
    return result;
  }

  // 其他 Tab:解析对应章节
  const sections = parseMarkdownSections(result);
  const sectionTitle = getTabMapping(tabId);

  // 如果找到对应章节,返回章节内容;否则返回完整内容
  return sections[sectionTitle] || result;
};
```

**Step 5: 添加复制处理函数**

在 `getTabContent` 函数之后添加:

```typescript
const handleCopy = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content);
    setToast({ message: "已复制到剪贴板", type: "success" });
  } catch (error) {
    console.error("复制失败:", error);
    setToast({ message: "复制失败,请重试", type: "error" });
  }
};
```

**Step 6: 提交**

```bash
git add app/page.tsx
git commit -m "feat: add state management and helper functions for tabs"
```

---

## Task 5: 修改主页面 - 更新 API 调用逻辑

**Files:**
- Modify: `app/page.tsx`

**Step 1: 修改 handleAnalyze 函数**

找到 `const handleAnalyze = async () => {` 这一行,在 `setResult(data.content);` 之后添加破冰文案生成逻辑:

原代码:
```typescript
setResult(data.content);
setToast({ message: "分析完成!", type: "success" });
```

替换为:
```typescript
setResult(data.content);

// 生成 HR 破冰文案
setIsIcebreakerLoading(true);
try {
  const icebreakerResponse = await fetch("/api/icebreaker", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jd,
      resume,
      analysis: data.content,
    }),
  });

  if (!icebreakerResponse.ok) {
    throw new Error(`破冰文案生成失败: ${icebreakerResponse.status}`);
  }

  const icebreakerData = await icebreakerResponse.json();
  setIcebreakerText(icebreakerData.content);
} catch (error) {
  console.error("破冰文案生成失败:", error);
  // 破冰文案生成失败不影响主流程,只记录错误
} finally {
  setIsIcebreakerLoading(false);
}

setToast({ message: "分析完成!", type: "success" });
```

**Step 2: 提交**

```bash
git add app/page.tsx
git commit -m "feat: add icebreaker generation API call"
```

---

## Task 6: 修改主页面 - 更新 UI 渲染逻辑

**Files:**
- Modify: `app/page.tsx`

**Step 1: 修改 Tabs 组件调用**

找到 `<Tabs tabs={tabs} defaultTab="overview">` 这一部分,替换为:

```typescript
<Tabs
  tabs={tabs}
  defaultTab="overview"
  onChange={(tabId) => setActiveTab(tabId)}
>
  {(activeTab) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-claude-border dark:border-gray-700 relative">
      {/* 复制按钮 */}
      <button
        onClick={() => handleCopy(getTabContent(activeTab))}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors group"
        title="复制内容"
      >
        <Copy className="w-5 h-5 text-claude-text-secondary group-hover:text-claude-orange transition-colors" />
      </button>

      {/* 内容区域 */}
      {activeTab === "icebreaker" && isIcebreakerLoading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-claude-orange mb-4"></div>
          <p className="text-claude-text-secondary dark:text-gray-400 text-sm">
            正在生成破冰文案...
          </p>
        </div>
      ) : (
        <div className="prose prose-blue dark:prose-invert max-w-none pr-12">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {getTabContent(activeTab)}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )}
</Tabs>
```

注意修改点:
1. 添加 `onChange` prop 来同步 activeTab 状态
2. 添加复制按钮(绝对定位在右上角)
3. 添加破冰文案加载状态判断
4. 在内容区域添加 `pr-12` 右边距,避免内容被复制按钮遮挡

**Step 2: 提交**

```bash
git add app/page.tsx
git commit -m "feat: add copy button and update tab content rendering"
```

---

## Task 7: 更新文档

**Files:**
- Modify: `README.md`

**Step 1: 读取 README 文件**

```bash
cat README.md
```

**Step 2: 在"最新更新"部分添加新功能**

找到 `### ⚡ 交互体验提升` 部分,在列表末尾添加:

```markdown
### ⚡ 交互体验提升
- ✅ 流畅的页面加载动画
- ✅ 评分卡片数字滚动效果
- ✅ 标签页切换动画
- ✅ Toast 提示和反馈
- ✅ 优雅的加载进度动画
- ✅ 分步骤展示分析进度
- ✅ Tab 内容过滤显示
- ✅ HR 破冰文案自动生成
- ✅ 一键复制功能
```

**Step 3: 在"功能特性"部分添加说明**

在 `## 功能特性` 部分添加:

```markdown
## 功能特性

- 🎯 双输入框设计:JD + 简历内容
- 🔒 本地存储:API Key 安全存储在 localStorage
- 🤖 Kimi AI 驱动:专业的简历分析建议
- 📝 Markdown 渲染:清晰的分析结果展示
- 📑 Tab 分栏展示:概览、详细分析、优化建议、HR 破冰、原文
- 📋 一键复制:快速复制 Tab 内容到剪贴板
- 💬 HR 破冰文案:自动生成 100 字以内的专业开场白
- 📱 响应式设计:支持移动端访问
```

**Step 4: 提交**

```bash
git add README.md
git commit -m "docs: update feature descriptions in README"
```

---

## Task 8: 本地测试

**Step 1: 启动开发服务器**

```bash
npm run dev
```

**Step 2: 测试 Tab 切换功能**

访问 http://localhost:3000

1. 输入测试 JD 和简历内容
2. 点击"开始分析"
3. 等待分析完成
4. 依次点击各个 Tab,验证:
   - ✅ "概览" Tab 显示概览章节内容
   - ✅ "详细分析" Tab 显示详细分析章节内容
   - ✅ "优化建议" Tab 显示优化建议章节内容
   - ✅ "HR 破冰" Tab 在生成期间显示加载动画,完成后显示破冰文案
   - ✅ "原文" Tab 显示完整 Markdown 内容

**Step 3: 测试复制功能**

在每个 Tab 下点击右上角的复制按钮:
- ✅ 点击复制按钮
- ✅ 看到 Toast 提示"已复制到剪贴板"
- ✅ 粘贴验证内容正确

**Step 4: 测试 HR 破冰文案**

1. 等待分析完成后,观察"HR 破冰" Tab
2. 验证:
   - ✅ 生成期间显示"正在生成破冰文案..."和加载动画
   - ✅ 生成完成后显示 100 字以内的文案
   - ✅ 文案包含:匹配的技能、相关经历、个人优势
   - ✅ 语气友好热情
   - ✅ 可以复制破冰文案

**Step 5: 测试错误处理**

1. 测试网络错误:关闭网络,点击分析
2. 验证:
   - ✅ 显示错误提示
   - ✅ 破冰文案生成失败不影响主分析结果

**Step 6: 测试响应式**

调整浏览器窗口大小:
- 桌面端(>768px):复制按钮和内容正常显示
- 移动端(<768px):布局适配良好

**Step 7: 检查控制台**

打开浏览器开发者工具(F12):
- Console 标签不应有错误
- Network 标签应看到 `/api/analyze` 和 `/api/icebreaker` 请求成功

---

## Task 9: 构建验证

**Step 1: 构建生产版本**

```bash
npm run build
```

**Step 2: 验证构建成功**

确保看到:
```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
```

**Step 3: 如果构建失败,修复错误**

如果看到 TypeScript 错误或 Lint 错误:
1. 读取错误信息
2. 修复对应文件
3. 重新运行 `npm run build`

**Step 4: 提交所有更改**

```bash
git add -A
git commit -m "feat: complete Tab filtering and HR icebreaker feature"
```

---

## Task 10: 推送到远程仓库

**Step 1: 推送到 GitHub**

```bash
git push origin main
```

**Step 2: 验证推送成功**

确保看到:
```
To https://github.com/KaiSheKer/resume-optimizer.git
   <old-commit>..<new-commit>  main -> main
```

---

## 验收标准

### 功能验收

- ✅ Tab 切换正常工作,内容正确过滤显示
- ✅ HR 破冰文案成功生成且符合要求(≤100字,包含技能/经历/优势)
- ✅ 复制功能在所有浏览器中正常工作
- ✅ "HR 破冰" Tab 在生成前显示加载状态
- ✅ "原文" Tab 显示完整内容
- ✅ 移动端显示正常

### 技术验收

- ✅ 无控制台错误
- ✅ 构建成功通过
- ✅ TypeScript 类型检查通过
- ✅ API 路由正常响应
- ✅ 错误处理完善(网络错误、API 失败)

### 性能验收

- ✅ Markdown 解析不影响性能
- ✅ 复制大量文本无卡顿
- ✅ API 调用时加载状态清晰

---

## 预期时间

- Task 1-3: 工具函数和 API (15 分钟)
- Task 4-6: 主页面修改 (20 分钟)
- Task 7: 文档更新 (5 分钟)
- Task 8-9: 测试和构建 (10 分钟)
- Task 10: 推送 (2 分钟)

**总计: 约 50-60 分钟**

---

## 风险和注意事项

1. **AI 返回格式不一致**
   - 风险: AI 可能不按预期的章节标题返回内容
   - 缓解: 在 `getTabContent` 中添加降级逻辑,找不到对应章节时返回完整内容

2. **破冰文案长度控制**
   - 风险: AI 可能返回超过 100 字的文案
   - 缓解: 在 prompt 中强调限制,前端可截断显示并提示用户

3. **API 调用时序**
   - 风险: 第二个 API 调用可能失败
   - 缓解: 破冰文案生成失败不影响主流程,只记录错误

4. **剪贴板权限**
   - 风险: 某些浏览器可能限制剪贴板访问
   - 缓解: 使用 try-catch 捕获错误并提示用户

---

**实施计划完成。**
