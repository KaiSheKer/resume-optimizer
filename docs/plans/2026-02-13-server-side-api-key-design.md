# 服务端 API Key 集成方案设计

**日期：** 2026-02-13
**项目：** 产品经理简历优化器

## 1. 整体架构

### 核心思路
通过 Next.js API 路由作为代理层，将 API Key 安全地存储在服务端，客户端只通过内部 API 路由调用。

### 架构变化
```
之前：客户端 → localStorage 读取 API Key → 直接调用 Kimi API
现在：客户端 → Next.js API Route → 读取服务端环境变量 → 调用 Kimi API
```

### 优势
- ✅ API Key 完全隐藏在服务端，用户无法获取
- ✅ 可以在服务端添加速率限制、日志等安全措施
- ✅ 符合 Next.js 最佳实践
- ✅ 用户体验简化，无需配置步骤

---

## 2. API Route 实现

### 新建文件：`app/api/analyze/route.ts`

### 核心逻辑
1. **方法验证**：只接受 POST 请求
2. **参数验证**：检查请求体中是否包含 `jd` 和 `resume` 字段
3. **环境变量检查**：验证 `KIMI_API_KEY` 是否已配置，未配置则返回 500 错误
4. **调用 Kimi API**：使用 fetch 调用 Kimi API，相同的 prompt 和参数
5. **错误处理**：捕获网络错误、API 错误，返回统一的错误格式
6. **流式响应**：保持原有的流式输出特性，转发 Kimi 的 SSE 流

### 请求格式
```typescript
POST /api/analyze
Content-Type: application/json

{
  "jd": "职位描述内容",
  "resume": "简历内容"
}
```

### 响应格式
- **成功**：返回流式文本（SSE 格式）
- **失败**：返回 JSON 错误信息
```json
{
  "error": "错误描述"
}
```

### 安全考虑
- 添加基本的请求体大小限制（防止超大请求）
- 可选：添加简单的速率限制（按 IP 或请求频率）

---

## 3. 客户端代码修改

### 主要修改文件：`app/page.tsx`

### 核心改动

#### 3.1 移除 API Key 状态管理
- 删除 `apiKey`、`showApiKeyModal`、`tempApiKey` 等 state
- 移除 `useEffect` 中从 localStorage 读取 API Key 的逻辑
- 删除 `saveApiKey`、`openApiKeyModal`、`closeApiKeyModal` 等函数

#### 3.2 修改分析函数 `handleAnalyze`
**之前的调用方式：**
```typescript
const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

**现在的调用方式：**
```typescript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jd, resume })
});
```

#### 3.3 简化 UI 组件
- 移除"配置 API Key"按钮（header 中的设置图标）
- 移除 `<ApiKeyModal>` 组件及其相关代码
- 保持其他 UI 不变（JD 输入框、简历输入框、分析按钮、结果展示）

---

## 4. 环境变量配置与部署

### 4.1 本地开发配置

**创建 `.env.local` 文件**（在项目根目录，已加入 .gitignore）
```bash
KIMI_API_KEY=your_actual_api_key_here
```

**代码中读取环境变量：**
```typescript
const apiKey = process.env.KIMI_API_KEY;
if (!apiKey) {
  return new Response(
    JSON.stringify({ error: '服务器配置错误：API Key 未设置' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 4.2 Vercel 部署配置

**在 Vercel 项目设置中添加环境变量：**
1. 进入 Vercel Dashboard → 你的项目 → Settings → Environment Variables
2. 添加环境变量：
   - **Key**: `KIMI_API_KEY`
   - **Value**: 你的 Kimi API Key
   - **Environments**: 选择 `Production`、`Preview`、`Development`（根据需要）
3. 触发重新部署以应用环境变量

### 4.3 验证部署
- **本地测试**：确保 `.env.local` 中的 Key 有效，运行 `npm run dev` 测试
- **生产环境**：部署后访问生产环境，尝试提交 JD 和简历，确认能正常返回分析结果
- **错误排查**：如果失败，检查 Vercel 函数日志（Functions Logs）查看具体错误

---

## 5. 文件修改清单

### 需要新建的文件
1. `app/api/analyze/route.ts` - API 路由实现
2. `.env.local` - 本地开发环境变量（不提交到 git）

### 需要修改的文件
1. `app/page.tsx` - 移除 API Key 相关逻辑，修改调用方式
2. `.gitignore` - 已包含 `.env.local`，无需修改

### 需要删除的文件
1. `components/ApiKeyModal.tsx` - 整个文件删除

---

## 6. 实施步骤

1. ✅ **完成设计文档**（当前步骤）
2. ⏭️ **创建实施计划**（使用 superpowers:writing-plans）
3. ⏭️ **创建 git worktree**（使用 superpowers:using-git-worktrees）
4. ⏭️ **实施代码变更**
5. ⏭️ **本地测试**
6. ⏭️ **提交代码并推送到 GitHub**
7. ⏭️ **配置 Vercel 环境变量并重新部署**
8. ⏭️ **生产环境验证**

---

## 7. 预期结果

- ✅ 用户访问应用时无需配置 API Key，直接使用
- ✅ API Key 安全存储在服务端，不会暴露给客户端
- ✅ 代码更简洁，移除了不必要的配置逻辑
- ✅ 维护更方便，只需在 Vercel 更新环境变量即可更换 API Key
