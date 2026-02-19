# 加载动画优化设计文档

**目标:** 优化 AI 分析等待过程的用户体验,将技术分析过程包装成"Offer 之旅"的视觉旅程。

**原则:** 极简实现,只改视觉展示,不改动任何现有逻辑。

---

## 视觉设计

### 核心组件

**横向进度条:**
- 颜色: `#D97757` (Claude 橙色)
- 高度: `8px`
- 圆角: `4px`
- 分 5 段,每段代表一个分析步骤
- 从左到右依次填充动画

**步骤文案:**
- 位置: 进度条下方居中
- 字体: `text-claude-text-secondary` (#585858)
- 大小: `text-sm`
- 每 2-3 秒切换一次

### 步骤序列

1. **解析 JD 中...** (0-20%)
2. **匹配技能...** (20-40%)
3. **生成建议...** (40-60%)
4. **优化简历...** (60-80%)
5. **Offer 在路上...** (80-100%)

### 动画效果

- 进度条: CSS `transition` 平滑填充
- 文案: `fade-out` → 切换 → `fade-in`
- 整体: 加载时淡入,分析完成时淡出

---

## 技术实现

### 组件结构

替换现有的 `LoadingSkeleton` 组件:

```tsx
// components/analysis-loading.tsx
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

  // 自动推进进度
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2; // 每 50ms 增加 2%
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // 根据进度切换文案
  useEffect(() => {
    const stepIndex = Math.min(Math.floor(progress / 20), 4);
    setCurrentStep(stepIndex);
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* 进度条 */}
      <div className="w-full max-w-md bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-claude-orange transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 步骤文案 */}
      <p className="mt-4 text-claude-text-secondary text-sm animate-pulse-soft">
        {steps[currentStep]}
      </p>
    </div>
  );
}
```

### 集成方式

在 `app/page.tsx` 中替换:

```tsx
// 之前
{isLoading && <LoadingSkeleton />}

// 之后
{isLoading && <AnalysisLoading />}
```

---

## 响应式设计

- **桌面端**: 进度条最大宽度 `max-w-md` (28rem)
- **移动端**: 进度条全宽 `w-full`
- 文案始终居中

---

## 性能考虑

- 使用 CSS `transition` 而非 JS 动画 (GPU 加速)
- 单个 `setInterval` 避免多个定时器
- 组件卸载时清理定时器
- 不增加额外的 API 调用或网络请求

---

## 测试要点

1. **动画流畅度**: 进度条填充是否平滑
2. **文案切换**: 是否在合适的时机切换
3. **加载/卸载**: 淡入淡出是否自然
4. **响应式**: 移动端和桌面端表现是否一致

---

## 实现优先级

**P0 (必须):**
- 横向进度条
- 5 步文案切换
- 平滑动画

**P1 (重要):**
- 淡入淡出效果
- 响应式适配

**P2 (可选):**
- 进度百分比数字显示
- 预估剩余时间

---

## 成功标准

- ✅ 用户能清楚看到分析进度
- ✅ 等待过程不枯燥
- ✅ 动画流畅不卡顿
- ✅ 不影响现有功能
