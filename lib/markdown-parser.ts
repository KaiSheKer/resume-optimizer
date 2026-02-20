export type BaseTabId = "overview" | "analysis" | "suggestions";

interface ParsedSection {
  heading: string;
  fullText: string;
}

const TAB_MAPPING: Record<BaseTabId, string> = {
  overview: "概览",
  analysis: "详细分析",
  suggestions: "优化建议",
};

const TAB_KEYWORDS: Record<BaseTabId, RegExp[]> = {
  overview: [
    /概览/,
    /匹配度评分/,
    /评分/,
    /关键发现/,
    /总体匹配/,
    /高匹配亮点/,
  ],
  analysis: [
    /详细分析/,
    /分析/,
    /核心能力/,
    /经验相关/,
    /技能覆盖/,
    /关键缺口/,
    /差异化优势/,
  ],
  suggestions: [
    /优化建议/,
    /分级优化建议/,
    /高优先级建议/,
    /中优先级建议/,
    /低优先级建议/,
    /简历重写示例/,
    /关键词优化清单/,
  ],
};

function normalizeHeading(text: string): string {
  return text
    .trim()
    .replace(/^[\d一二三四五六七八九十]+[\.、:：)\）-]?\s*/, "")
    .replace(/[【】\[\]\(\)（）]/g, "")
    .replace(/\s+/g, "");
}

function splitSectionsAtHeadingLevel(markdown: string, level: number): ParsedSection[] {
  const regex = new RegExp(`^(#{${level}})\\s+(.+)$`, "gm");
  const matches = Array.from(markdown.matchAll(regex));
  if (matches.length === 0) {
    return [];
  }

  const sections: ParsedSection[] = [];

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const start = current.index ?? 0;
    const end = next?.index ?? markdown.length;
    const heading = current[2]?.trim() || "";
    const fullText = markdown.slice(start, end).trim();

    if (heading && fullText) {
      sections.push({ heading, fullText });
    }
  }

  return sections;
}

function getBestLevelSections(markdown: string): ParsedSection[] {
  for (let level = 1; level <= 6; level += 1) {
    const sections = splitSectionsAtHeadingLevel(markdown, level);
    if (sections.length > 0) {
      return sections;
    }
  }

  return [];
}

function findExactSection(sections: ParsedSection[], targetTitle: string): ParsedSection | null {
  const normalizedTarget = normalizeHeading(targetTitle);

  const exact = sections.find((section) => normalizeHeading(section.heading) === normalizedTarget);
  if (exact) {
    return exact;
  }

  const fuzzy = sections.find((section) => normalizeHeading(section.heading).includes(normalizedTarget));
  return fuzzy || null;
}

function findSectionsByKeywords(sections: ParsedSection[], tabId: BaseTabId): ParsedSection[] {
  const rules = TAB_KEYWORDS[tabId];

  return sections.filter((section) => {
    const target = `${normalizeHeading(section.heading)}\n${section.fullText.slice(0, 360)}`;
    return rules.some((rule) => rule.test(target));
  });
}

function joinSections(sections: ParsedSection[]): string {
  return sections.map((section) => section.fullText).join("\n\n").trim();
}

export function parseMarkdownSections(markdown: string): Record<string, string> {
  const text = markdown.trim();
  if (!text) {
    return {};
  }

  const sections = getBestLevelSections(text);
  const result: Record<string, string> = {};

  sections.forEach((section) => {
    result[section.heading] = section.fullText;
  });

  return result;
}

export function getTabMapping(tabId: BaseTabId): string {
  return TAB_MAPPING[tabId];
}

export function getTabContentById(markdown: string, tabId: BaseTabId): string {
  const text = markdown.trim();
  if (!text) {
    return "";
  }

  const sections = getBestLevelSections(text);
  if (sections.length === 0) {
    return text;
  }

  const mappedTitle = getTabMapping(tabId);
  const exactSection = findExactSection(sections, mappedTitle);
  if (exactSection) {
    return exactSection.fullText;
  }

  const keywordSections = findSectionsByKeywords(sections, tabId);
  const matched = joinSections(keywordSections);
  if (matched) {
    return matched;
  }

  return text;
}
