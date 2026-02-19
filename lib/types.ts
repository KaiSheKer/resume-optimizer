export interface AnalysisResult {
  // 评分数据
  scores: {
    overall: number;        // 总体匹配度 0-100
    coreSkills: number;     // 核心能力匹配 0-100
    experience: number;     // 经验相关性 0-100
    skillCoverage: number;  // 技能覆盖度 0-100
  };

  // 关键发现
  findings: {
    strengths: string[];    // 高匹配亮点
    gaps: string[];         // 关键缺口
    advantages: string[];   // 差异化优势
  };

  // 分级建议
  suggestions: {
    high: Suggestion[];     // 高优先级
    medium: Suggestion[];   // 中优先级
    low: Suggestion[];      // 低优先级
  };

  // 重写示例
  examples: {
    selfEvaluation: string; // 自我评价
    projects: string[];     // 项目经历
    skills: string;         // 技能清单
  };

  // 关键词清单
  keywords: {
    term: string;           // 关键词
    location: string;       // 建议位置
  }[];
}

export interface Suggestion {
  title: string;            // 建议标题
  description: string;      // 详细说明
  action: string;           // 具体行动
}

export default AnalysisResult;
