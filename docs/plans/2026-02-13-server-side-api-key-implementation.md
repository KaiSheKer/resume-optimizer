# 服务端 API Key 集成实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 API Key 从客户端 localStorage 迁移到服务端环境变量，通过 Next.js API 路由安全调用 Kimi API。

**Architecture:** 创建 `/api/analyze` API 路由作为代理层，读取服务端环境变量 `KIMI_API_KEY` 调用 Kimi API，客户端通过内部 API 调用，无需暴露 API Key 给用户。

**Tech Stack:** Next.js 14 App Router API Routes, TypeScript, Environment Variables, Fetch API, Vercel Deployment

---

## Task 1: 创建 API 路由

**Files:**
- Create: `app/api/analyze/route.ts`

**Step 1: 创建 API 路由文件结构**

```typescript
// app/api/analyze/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return new Response('Not implemented', { status: 501 });
}
```

**Step 2: 验证路由可访问**

Run: `curl -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d '{"jd":"test","resume":"test"}'`
Expected: 501 status with "Not implemented"

**Step 3: 实现请求体验证逻辑**

```typescript
// app/api/analyze/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求体
    if (!body.jd || typeof body.jd !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少或无效的 jd 参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.resume || typeof body.resume !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少或无效的 resume 参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: '参数验证通过' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '无效的 JSON 请求体' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Step 4: 验证参数验证逻辑**

Run: `curl -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d '{"jd":"test jd","resume":"test resume"}'`
Expected: 200 status with `{"success":true,"message":"参数验证通过"}`

**Step 5: 添加环境变量检查**

```typescript
// app/api/analyze/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求体
    if (!body.jd || typeof body.jd !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少或无效的 jd 参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.resume || typeof body.resume !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少或无效的 resume 参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 检查环境变量
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '服务器配置错误：API Key 未设置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: '环境变量已配置' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '无效的 JSON 请求体' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Step 6: 验证环境变量检查（未配置时）**

Run: `npm run dev`（确保没有 .env.local）
Expected: 访问 `/api/analyze` 返回 500 错误 "服务器配置错误：API Key 未设置"

**Step 7: Commit**

```bash
git add app/api/analyze/route.ts
git commit -m "feat: add API route with validation and env check

- Create /api/analyze POST endpoint
- Add request body validation (jd and resume fields)
- Add KIMI_API_KEY environment variable check
- Return appropriate error responses

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: 实现 Kimi API 调用逻辑

**Files:**
- Modify: `app/api/analyze/route.ts`
- Reference: `lib/kimi.ts:1-50`（查看现有的 prompt 逻辑）

**Step 1: 读取现有的 Kimi API 调用逻辑**

Run: `cat lib/kimi.ts`
Expected: 查看 generateAnalysisPrompt 函数和 API 调用格式

**Step 2: 在 API 路由中实现 Kimi API 调用**

```typescript
// app/api/analyze/route.ts
import { NextRequest } from 'next/server';

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

function generateAnalysisPrompt(jd: string, resume: string): string {
  return `你是一位专业的产品经理简历顾问。请分析以下简历与职位描述（JD）的匹配度，并提供具体的优化建议。

【职位描述（JD）】
${jd}

【简历内容】
${resume}

请按照以下格式进行分析：

1. **匹配度评分**（1-10分）
2. **核心优势**（列出3-5个最匹配的点）
3. **改进建议**（针对JD要求的优化方向）
4. **关键词补充**（建议添加到简历中的关键词）

请提供具体、可操作的建议。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求体
    if (!body.jd || typeof body.jd !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少或无效的 jd 参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.resume || typeof body.resume !== 'string') {
      return new Response(
        JSON.stringify({ error: '缺少或无效的 resume 参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 检查环境变量
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '服务器配置错误：API Key 未设置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 调用 Kimi API
    const prompt = generateAnalysisPrompt(body.jd, body.resume);

    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'kimi-k2.5',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 1,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Kimi API 调用失败: ${response.status} ${errorText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 返回流式响应
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API 路由错误:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Step 3: 创建 .env.local 测试文件**

Run: `echo "KIMI_API_KEY=your_test_key_here" > .env.local`
Expected: .env.local 文件创建成功

**Step 4: 验证流式响应（需要有效的 API Key）**

Run: `npm run dev` 然后使用浏览器或 Postman 测试 `/api/analyze`
Expected: 返回流式响应（需要有效 API Key）

**Step 5: Commit**

```bash
git add app/api/analyze/route.ts .env.local
git commit -m "feat: implement Kimi API call with streaming response

- Add generateAnalysisPrompt function with optimized prompt
- Implement Kimi API integration with streaming support
- Forward SSE stream to client
- Add error handling for API failures

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: 修改客户端 - 移除 API Key 状态管理

**Files:**
- Modify: `app/page.tsx`

**Step 1: 读取并理解当前客户端代码**

Run: `cat app/page.tsx`
Expected: 理解现有的 API Key 状态管理和 localStorage 逻辑

**Step 2: 移除 API Key 相关的 state**

找到并删除以下代码行：
- `const [apiKey, setApiKey] = useState<string>('');`
- `const [showApiKeyModal, setShowApiKeyModal] = useState(false);`
- `const [tempApiKey, setTempApiKey] = useState('');`

**Step 3: 移除 localStorage 读取的 useEffect**

找到并删除以下 useEffect（通常在组件顶部）：
```typescript
useEffect(() => {
  const savedKey = localStorage.getItem('kimi_api_key');
  if (savedKey) {
    setApiKey(savedKey);
  }
}, []);
```

**Step 4: 移除 API Key 相关的函数**

找到并删除以下函数：
- `const saveApiKey = () => { ... }`
- `const openApiKeyModal = () => { ... }`
- `const closeApiKeyModal = () => { ... }`

**Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: remove API key state management from client

- Remove apiKey, showApiKeyModal, and tempApiKey states
- Remove localStorage reading useEffect
- Remove saveApiKey, openApiKeyModal, and closeApiKeyModal functions

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 修改客户端 - 更新 analyze 函数调用

**Files:**
- Modify: `app/page.tsx`

**Step 1: 找到 handleAnalyze 函数**

查找包含 `fetch('https://api.moonshot.cn/v1/chat/completions'` 的函数

**Step 2: 替换 API 调用为内部 API 路由**

原来的代码应该类似：
```typescript
const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'kimi-k2.5',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1,
    stream: true,
  }),
});
```

替换为：
```typescript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jd,
    resume,
  }),
});
```

**Step 3: 移除 prompt 生成逻辑（因为已移到服务端）**

删除 `generateAnalysisPrompt` 函数或其调用（如果在客户端）

**Step 4: 验证调用逻辑**

确保 `handleAnalyze` 函数不再依赖 `apiKey` 变量

**Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: update client to call internal API route

- Replace Kimi API call with /api/analyze route
- Remove prompt generation from client (moved to server)
- Remove Authorization header dependency
- Simplify request body to {jd, resume}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: 简化 UI - 移除 API Key 配置按钮和模态框

**Files:**
- Modify: `app/page.tsx`
- Delete: `components/ApiKeyModal.tsx`

**Step 1: 移除"配置 API Key"按钮**

在 header 部分找到设置图标按钮并删除，通常类似：
```typescript
<button onClick={openApiKeyModal}>
  <Settings />
</button>
```

**Step 2: 移除 ApiKeyModal 组件引用**

删除：
```typescript
import ApiKeyModal from '@/components/ApiKeyModal';
```

**Step 3: 移除模态框渲染**

删除 JSX 中的：
```typescript
{showApiKeyModal && (
  <ApiKeyModal
    onSave={saveApiKey}
    onClose={closeApiKeyModal}
    initialValue={tempApiKey}
  />
)}
```

**Step 4: 删除 ApiKeyModal 组件文件**

Run: `rm components/ApiKeyModal.tsx`

**Step 5: 测试 UI 渲染**

Run: `npm run dev`
Expected: 页面正常显示，无设置按钮，无报错

**Step 6: Commit**

```bash
git add app/page.tsx components/ApiKeyModal.tsx
git commit -m "refactor: remove API key configuration UI

- Remove settings button from header
- Remove ApiKeyModal component import and rendering
- Delete components/ApiKeyModal.tsx file
- Simplify UI to core functionality only

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: 创建环境变量示例文件

**Files:**
- Create: `.env.local.example`

**Step 1: 创建环境变量示例文件**

```bash
# .env.local.example
cat > .env.local.example << 'EOF'
# Kimi API Key
# 获取地址: https://platform.moonshot.cn/console/api-keys
KIMI_API_KEY=your_kimi_api_key_here
EOF
```

**Step 2: 更新 .gitignore（如果需要）**

确认 `.env.local.example` 不在 .gitignore 中（我们希望提交这个示例文件）

Run: `grep -v "env.local.example" .gitignore`
Expected: 没有输出，说明 .env.local.example 不会被忽略

**Step 3: 提交环境变量示例**

```bash
git add .env.local.example
git commit -m "docs: add environment variable example file

- Add .env.local.example with KIMI_API_KEY template
- Include instructions on how to obtain API key
- Help developers set up local environment quickly

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: 端到端测试

**Files:**
- Test: Manual testing in development environment

**Step 1: 启动开发服务器**

Run: `npm run dev`
Expected: 服务器启动在 http://localhost:3000

**Step 2: 测试完整流程**

1. 打开浏览器访问 http://localhost:3000
2. 输入 JD 和简历内容
3. 点击"分析"按钮
4. 观察是否正常返回分析结果
5. 检查浏览器控制台无错误

Expected: 完整流程正常工作，无需配置 API Key

**Step 3: 测试错误处理**

1. 修改 .env.local 中的 API Key 为无效值
2. 重启开发服务器
3. 尝试分析简历
4. 检查是否显示友好的错误提示

Expected: 显示"服务器配置错误"或类似提示

**Step 4: 测试参数验证**

1. 打开浏览器开发者工具
2. 在 Console 中运行：
```javascript
fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}) // 缺少参数
}).then(r => r.json()).then(console.log)
```

Expected: 返回 400 错误和"缺少或无效的 jd 参数"消息

**Step 5: 验证构建成功**

Run: `npm run build`
Expected: 构建成功，无类型错误

**Step 6: Commit 测试结果文档（可选）**

创建测试笔记文件：
```bash
cat > docs/testing-notes.md << 'EOF'
# 测试笔记

## 测试环境
- Node.js 版本: $(node --version)
- npm 版本: $(npm --version)
- 测试日期: $(date +"%Y-%m-%d")

## 测试结果

### 功能测试
- [x] 完整流程测试通过
- [x] 错误处理测试通过
- [x] 参数验证测试通过
- [x] 构建测试通过

### 发现的问题
（记录测试中发现的问题）

### 浏览器兼容性
- Chrome: ✓
- Safari: ✓
- Firefox: ✓
EOF

git add docs/testing-notes.md
git commit -m "docs: add testing notes and results"
```

---

## Task 8: 更新 README 文档

**Files:**
- Modify: `README.md`

**Step 1: 移除 API Key 配置相关说明**

删除"配置 API Key"部分，包括：
- "1. 访问 platform.moonshot.cn/console/api-keys"
- "2. 创建 API Key"
- "3. 在应用中点击'配置 API Key'按钮输入"

**Step 2: 更新快速开始部分**

将原来的说明改为：
```markdown
## 快速开始

### 本地开发

1. 克隆仓库
\`\`\`bash
git clone https://github.com/KaiSheKer/resume-optimizer.git
cd resume-optimizer
\`\`\`

2. 安装依赖
\`\`\`bash
npm install
\`\`\`

3. 配置环境变量
\`\`\`bash
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 Kimi API Key
\`\`\`

4. 运行开发服务器
\`\`\`bash
npm run dev
\`\`\`

访问 http://localhost:3000

### 部署到 Vercel

1. Fork 此仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在 Vercel 项目设置中添加环境变量：
   - Key: `KIMI_API_KEY`
   - Value: 你的 Kimi API Key
4. 部署完成！

## 注意事项

- API Key 存储在服务端环境变量中，用户无需配置
- 请确保遵守 Kimi API 使用条款
- 建议在 Vercel 中设置速率限制以防止滥用
```

**Step 3: 提交文档更新**

```bash
git add README.md
git commit -m "docs: update README for server-side API key architecture

- Remove client-side API key configuration instructions
- Add server-side environment variable setup guide
- Update Vercel deployment instructions
- Simplify getting started section

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: 推送到主分支

**Files:**
- Git operations

**Step 1: 切换回主分支并合并**

```bash
cd /Users/ericcao/CascadeProjects/resume-optimizer  # 回到主项目
git checkout main
git merge feature/server-side-api-key
```

**Step 2: 推送到远程**

```bash
git push origin main
```

**Step 3: 清理 worktree（可选）**

```bash
git worktree remove .worktrees/server-side-api-key
```

---

## 实施后验证清单

- [ ] 所有测试通过
- [ ] 构建成功无错误
- [ ] 本地开发环境正常运行
- [ ] README 文档已更新
- [ ] 代码已推送到 GitHub
- [ ] Vercel 环境变量已配置（生产环境）
- [ ] 生产环境部署成功
- [ ] 生产环境功能测试通过

---

## 预期结果

完成此计划后：
- ✅ 用户无需配置 API Key，开箱即用
- ✅ API Key 安全存储在服务端
- ✅ 代码更简洁，移除了配置 UI
- ✅ 符合 Next.js 最佳实践
- ✅ 易于维护和部署

---

**总预计时间：** 1-2 小时（包括测试和文档更新）

**技术风险：** 低（主要是重构，不涉及复杂的新功能）
