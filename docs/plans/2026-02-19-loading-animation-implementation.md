# 加载动画优化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 将 AI 分析等待过程从骨架屏改为优雅的进度条+步骤文案动画,提升用户体验。

**架构:** 创建新的 `AnalysisLoading` 组件替换现有的 `LoadingSkeleton`,使用 React hooks 管理进度状态和步骤切换,纯 CSS 动画保证性能。

**技术栈:** React 18, TypeScript, Tailwind CSS 3

---

## Task 1: 创建 AnalysisLoading 组件基础结构

**Files:**
- Create: `components/analysis-loading.tsx`

**Step 1: 创建组件文件**

```bash
touch components/analysis-loading.tsx
```

**Step 2: 编写组件骨架**

```typescript
// components/analysis-loading.tsx
"use client";

import { useState, useEffect } from "react";

export function AnalysisLoading() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "解析 JD 中...",
    "匹配技能...",
    "生成建议...",
    "优化简历...",
    "Offer 在路上..."
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* 进度条容器 */}
      <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        {/* 进度条填充 */}
        <div
          className="h-full bg-claude-orange transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 步骤文案 */}
      <p className="mt-4 text-claude-text-secondary dark:text-gray-400 text-sm animate-pulse-soft">
        {steps[currentStep]}
      </p>
    </div>
  );
}
```

**Step 3: 提交**

```bash
git add components/analysis-loading.tsx
git commit -m "feat: create AnalysisLoading component skeleton"
```

---

## Task 2: 实现进度自动推进逻辑

**Files:**
- Modify: `components/analysis-loading.tsx`

**Step 1: 添加进度推进 useEffect**

在组件中添加:

```typescript
  // 自动推进进度
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2; // 每 50ms 增加 2%, 约 2.5秒到达 100%
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);
```

**Step 2: 添加步骤切换逻辑**

在组件中添加:

```typescript
  // 根据进度切换文案
  useEffect(() => {
    const stepIndex = Math.min(Math.floor(progress / 20), 4);
    setCurrentStep(stepIndex);
  }, [progress]);
```

**Step 3: 提交**

```bash
git add components/analysis-loading.tsx
git commit -m "feat: add progress animation logic"
```

---

## Task 3: 在主页面中集成新组件

**Files:**
- Modify: `app/page.tsx`

**Step 1: 导入新组件**

在文件顶部找到:

```typescript
import { LoadingSkeleton } from "@/components/loading-skeleton";
```

替换为:

```typescript
import { AnalysisLoading } from "@/components/analysis-loading";
```

**Step 2: 替换组件使用**

找到:

```typescript
{isLoading && <LoadingSkeleton />}
```

替换为:

```typescript
{isLoading && <AnalysisLoading />}
```

**Step 3: 提交**

```bash
git add app/page.tsx
git commit -m "feat: integrate AnalysisLoading component"
```

---

## Task 4: 清理旧组件(可选)

**Files:**
- Delete: `components/loading-skeleton.tsx`

**Step 1: 删除旧组件文件**

```bash
rm components/loading-skeleton.tsx
```

**Step 2: 提交**

```bash
git add components/loading-skeleton.tsx
git commit -m "chore: remove unused LoadingSkeleton component"
```

---

## Task 5: 本地测试

**Step 1: 启动开发服务器**

```bash
npm run dev
```

**Step 2: 测试加载动画**

访问 http://localhost:3000

1. 在 JD 输入框输入测试内容
2. 在简历输入框输入测试内容
3. 点击"开始分析"按钮
4. 观察:
   - ✅ 进度条是否平滑填充
   - ✅ 文案是否每 2-3 秒切换一次
   - ✅ 是否按照 5 个步骤顺序展示
   - ✅ 分析完成后是否自然淡出

**Step 3: 测试响应式**

调整浏览器窗口大小:
- 桌面端 (>768px): 进度条应该居中,最大宽度 28rem
- 移动端 (<768px): 进度条应该全宽

**Step 4: 检查控制台**

打开浏览器开发者工具 (F12):
- Console 标签不应该有错误
- Network 标签应该看到 `/api/analyze` 请求成功

---

## Task 6: 优化进度速度(可选)

**如果实际 API 响应时间较长,需要调整进度速度:**

**Files:**
- Modify: `components/analysis-loading.tsx`

**Step 1: 调整进度增量**

找到:

```typescript
return prev + 2; // 每 50ms 增加 2%
```

如果 API 平均响应 5 秒,改为:

```typescript
return prev + 1; // 每 50ms 增加 1%, 约 5秒到达 100%
```

如果 API 平均响应 10 秒,改为:

```typescript
return prev + 0.5; // 每 50ms 增加 0.5%, 约 10秒到达 100%
```

**Step 2: 提交**

```bash
git add components/analysis-loading.tsx
git commit -m "perf: adjust progress speed to match API response time"
```

---

## Task 7: 添加文档

**Files:**
- Modify: `README.md`

**Step 1: 更新功能特性**

在 "最新更新" 部分添加:

```markdown
### ⚡ 交互体验提升
- ✅ 优雅的加载进度动画
- ✅ 分步骤展示分析进度
```

**Step 2: 提交**

```bash
git add README.md
git commit -m "docs: update loading animation feature notes"
```

---

## Task 8: 最终测试和推送

**Step 1: 完整功能测试**

1. 刷新浏览器
2. 测试完整的分析流程
3. 验证动画流畅性
4. 检查移动端适配

**Step 2: 提交所有更改**

```bash
git add -A
git commit -m "feat: complete loading animation optimization"
```

**Step 3: 推送到远程仓库**

```bash
git push origin main
```

---

## 验收标准

- ✅ 进度条平滑填充,无卡顿
- ✅ 5 个步骤文案依次切换
- ✅ 动画时长与 API 响应时间匹配
- ✅ 桌面端和移动端显示正常
- ✅ 无控制台错误
- ✅ 不影响现有分析功能

---

## 预期时间

- Task 1-3: 核心实现 (15 分钟)
- Task 4: 清理 (2 分钟)
- Task 5: 测试 (5 分钟)
- Task 6-7: 优化和文档 (5 分钟)
- Task 8: 最终验证 (5 分钟)

**总计: 约 30-40 分钟**
