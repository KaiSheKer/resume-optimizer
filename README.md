# 产品经理简历优化器

使用 AI 分析 JD 与简历匹配度的 Next.js 应用。

## ✨ 最新更新 (v0.2.0)

### 🎯 AI 分析质量优化
- ✅ 重构 prompt 模板,提供结构化分析
- ✅ 量化评分体系 (4 个维度)
- ✅ 分级优化建议 (高/中/低优先级)
- ✅ 可操作的重写示例

### 🎨 视觉设计升级
- ✅ 采用 Claude 风格配色系统
- ✅ 简洁优雅的单列布局
- ✅ 响应式设计优化

### ⚡ 交互体验提升
- ✅ 流畅的页面加载动画
- ✅ 评分卡片数字滚动效果
- ✅ 标签页切换动画
- ✅ Toast 提示和反馈
- ✅ 优雅的加载进度动画
- ✅ 分步骤展示分析进度

## 功能特性

- 🎯 双输入框设计：JD + 简历内容
- 🔒 本地存储：API Key 安全存储在 localStorage
- 🤖 Kimi AI 驱动：专业的简历分析建议
- 📝 Markdown 渲染：清晰的分析结果展示
- 📱 响应式设计：支持移动端访问

## 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 配置 API Key

1. 访问 [platform.moonshot.cn](https://platform.moonshot.cn/console/api-keys)
2. 创建 API Key
3. 在应用中点击"配置 API Key"按钮输入

### 运行开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 http://localhost:3000

### 构建生产版本

\`\`\`bash
npm run build
npm start
\`\`\`

## 技术栈

- Next.js 14 (App Router)
- TypeScript 5
- Tailwind CSS 3
- React 18
- Kimi API

## 部署到 Vercel

1. Fork 或 clone 此仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 构建命令：`npm run build`
4. 输出目录：`.next`
5. 完成！

## 注意事项

- API Key 仅存储在浏览器本地，不会上传到服务器
- 请确保遵守 Kimi API 使用条款
