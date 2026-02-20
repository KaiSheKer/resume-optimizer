# Tab 过滤与 HR 破冰文案功能设计文档

**日期:** 2026-02-20
**版本:** v1.0
**状态:** 设计阶段

---

## 📋 需求概述

### 问题1:Tab 切换无效
当前应用中,"概览"、"详细分析"、"优化建议"三个 Tab 虽然可以点击切换,但内容区域始终显示完整的 Markdown 结果,没有按 Tab 过滤显示对应章节。

### 问题2:HR 破冰文案生成
需要在分析完成后自动生成一段 100 字以内的 HR 破冰文案,帮助用户在投递简历时快速吸引 HR 注意。

---

## 🎯 功能需求

### 1. Tab 内容过滤功能
- 解析 AI 返回的 Markdown 内容,按一级标题(`#`)分割章节
- 根据 Tab 选择动态显示对应章节内容
- 保持现有的滑动指示器和切换动画效果

### 2. HR 破冰文案生成
- 在分析完成后自动生成破冰文案
- 内容包含:最匹配的技能、相关经历、个人优势
- 语气友好热情,控制在 100 字以内
- 作为第4个 Tab 显示

### 3. 原文查看功能
- 新增第5个 Tab "原文"
- 显示 AI 返回的完整 Markdown 内容

### 4. 一键复制功能
- 每个 Tab 内容区域右上角添加"复制"按钮
- 点击后复制当前 Tab 内容到剪贴板
- 复制成功后显示 Toast 提示

---

## 🏗️ 技术架构

### 组件结构
```
app/page.tsx (主页面)
├── Tabs 组件 (Tab 切换)
│   ├── Tab 按钮组
│   └── 内容区域
│       ├── 复制按钮
│       └── Markdown 渲染内容
└── Toast 组件 (提示)
```

### API 调用流程
```
用户点击"开始分析"
    ↓
显示加载动画
    ↓
调用 /api/analyze (简历分析)
    ↓
显示分析结果 (前3个 Tab)
    ↓
调用 /api/icebreaker (生成破冰文案)
    ↓
"HR 破冰" Tab 可用
```

### 数据流
```
JD + Resume
    ↓
[分析 API] → Analysis Result (Markdown)
    ↓                    ↓
[显示前3个Tab]    [破冰文案 API] → Icebreaker Text (100字)
                         ↓
                  [显示第4个Tab]
```

---

## 📝 Markdown 章节解析逻辑

### AI 返回格式
```markdown
# 概览
评分卡片和整体评估...

# 详细分析
技能匹配度分析...

# 优化建议
具体的改进建议...
```

### 解析算法
```typescript
function parseMarkdownSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // 按一级标题分割
  const parts = markdown.split(/^#\s+(.+)$/gm);

  // parts[0] 是空内容或前言
  // parts[1] 是第一个标题
  // parts[2] 是第一个内容
  // 以此类推...

  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    const content = parts[i + 1]?.trim() || "";
    sections[title] = content;
  }

  return sections;
}
```

### Tab 映射
```typescript
const tabMapping: Record<string, string> = {
  "overview": "概览",
  "analysis": "详细分析",
  "suggestions": "优化建议",
  "icebreaker": "", // 特殊处理,来自独立 API
  "original": ""    // 特殊处理,显示完整内容
};
```

---

## 🎨 UI/UX 设计

### Tab 布局
```
┌─────────────────────────────────────────────────────┐
│ [概览] [详细分析] [优化建议] [HR 破冰] [原文]        │
│ ─────────────────                                    │
└─────────────────────────────────────────────────────┘
│                                              [复制] │
│ [该 Tab 对应的内容区域]                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 复制按钮
- 位置:内容区域右上角
- 样式:小图标按钮,hover 时显示"复制"提示
- 图标:使用 lucide-react 的 `Copy` 图标
- 状态:点击后短暂变为"✓ 已复制"

### 加载状态
- 前3个 Tab:分析完成后立即可用
- "HR 破冰" Tab:生成期间显示"生成中...",完成后可用
- "原文" Tab:始终可用

---

## 🔌 API 设计

### 新增 API 路由
**路径:** `/api/icebreaker`
**方法:** POST
**请求体:**
```typescript
{
  jd: string;        // JD 内容
  resume: string;    // 简历内容
  analysis: string;  // 分析结果(可选,用于提取关键信息)
}
```

**响应:**
```typescript
{
  content: string;   // 100字以内的破冰文案
}
```

### Prompt 模板
```
你是一位专业的简历顾问。请基于以下 JD 和简历,生成一段 100 字以内的 HR 破冰文案。

要求:
1. 突出最匹配的 2-3 个核心技能
2. 提及最相关的 1-2 段经历
3. 总结个人优势
4. 语气友好热情,专业但不生硬
5. 目的是让 HR 第一眼就觉得这是合适的人选

JD: {jd}

简历: {resume}

分析结果: {analysis}

请直接输出破冰文案,不要有任何额外说明或标题。
```

---

## ⚙️ 实现细节

### 1. 修改 Tabs 组件
**不需要修改。** 当前组件的 `children(activeTab)` 模式已经支持根据 activeTab 动态渲染内容。

### 2. 修改主页面 (app/page.tsx)

#### 状态管理
```typescript
const [analysisResult, setAnalysisResult] = useState("");
const [icebreakerText, setIcebreakerText] = useState("");
const [isIcebreakerLoading, setIsIcebreakerLoading] = useState(false);
const [activeTab, setActiveTab] = useState("overview");
```

#### Tab 配置
```typescript
const tabs = [
  { id: "overview", label: "概览" },
  { id: "analysis", label: "详细分析" },
  { id: "suggestions", label: "优化建议" },
  { id: "icebreaker", label: "HR 破冰", disabled: !icebreakerText },
  { id: "original", label: "原文" }
];
```

#### 内容过滤逻辑
```typescript
const getTabContent = (tabId: string): string => {
  if (tabId === "icebreaker") {
    return icebreakerText;
  }

  if (tabId === "original") {
    return analysisResult;
  }

  // 解析章节
  const sections = parseMarkdownSections(analysisResult);
  const mapping = {
    "overview": "概览",
    "analysis": "详细分析",
    "suggestions": "优化建议"
  };

  return sections[mapping[tabId]] || analysisResult;
};
```

#### API 调用流程
```typescript
const handleAnalyze = async () => {
  setIsLoading(true);

  try {
    // 1. 分析简历
    const analysisResponse = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ jd, resume })
    });
    const analysisData = await analysisResponse.json();
    setAnalysisResult(analysisData.content);

    // 2. 生成破冰文案
    setIsIcebreakerLoading(true);
    const icebreakerResponse = await fetch("/api/icebreaker", {
      method: "POST",
      body: JSON.stringify({
        jd,
        resume,
        analysis: analysisData.content
      })
    });
    const icebreakerData = await icebreakerResponse.json();
    setIcebreakerText(icebreakerData.content);

    setToast({ message: "分析完成!", type: "success" });
  } catch (error) {
    setToast({ message: "分析失败", type: "error" });
  } finally {
    setIsLoading(false);
    setIsIcebreakerLoading(false);
  }
};
```

### 3. 复制功能
```typescript
const handleCopy = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content);
    setToast({ message: "已复制到剪贴板", type: "success" });
  } catch (error) {
    setToast({ message: "复制失败", type: "error" });
  }
};
```

### 4. UI 更新
```tsx
<Tabs tabs={tabs} defaultTab="overview">
  {(activeTab) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-claude-border dark:border-gray-700 relative">
      {/* 复制按钮 */}
      <button
        onClick={() => handleCopy(getTabContent(activeTab))}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="复制内容"
      >
        <Copy className="w-5 h-5" />
      </button>

      {/* 内容区域 */}
      {activeTab === "icebreaker" && isIcebreakerLoading ? (
        <div className="text-center py-8 text-claude-text-secondary">
          正在生成破冰文案...
        </div>
      ) : (
        <div className="prose prose-blue dark:prose-invert max-w-none">
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

---

## 🧪 测试计划

### 功能测试
1. **Tab 切换**
   - 点击不同 Tab,内容是否正确切换
   - 滑动指示器是否跟随移动
   - "HR 破冰" Tab 在生成前是否显示为禁用状态

2. **Markdown 解析**
   - 测试不同格式的 Markdown(有序/无序章节)
   - 测试缺少某个章节的情况
   - 测试空内容处理

3. **HR 破冰生成**
   - 验证破冰文案长度(≤100字)
   - 验证内容包含技能、经历、优势
   - 验证语气友好热情

4. **复制功能**
   - 点击复制按钮,验证剪贴板内容
   - 验证 Toast 提示显示
   - 测试不同浏览器的兼容性

### 边界情况
- AI 返回内容不包含预期章节标题
- 破冰文案 API 调用失败
- 用户在破冰文案生成期间切换 Tab
- 网络超时处理

### 性能测试
- 大量文本的复制性能
- Markdown 解析性能
- API 响应时间

---

## 📊 成功标准

- ✅ Tab 切换正常工作,内容正确过滤显示
- ✅ HR 破冰文案成功生成且符合要求
- ✅ 复制功能在所有浏览器中正常工作
- ✅ 无控制台错误
- ✅ 移动端显示正常
- ✅ 加载状态清晰明确
- ✅ 错误处理完善

---

## 🔄 后续优化方向

1. **缓存破冰文案** - 避免重复生成
2. **自定义破冰文案** - 允许用户编辑生成的文案
3. **多版本生成** - 提供 2-3 个版本的破冰文案供选择
4. **导出功能增强** - 支持导出包含破冰文案的完整文档

---

**文档版本历史:**
- v1.0 (2026-02-20): 初始设计
