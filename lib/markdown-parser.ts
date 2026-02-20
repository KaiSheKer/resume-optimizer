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
