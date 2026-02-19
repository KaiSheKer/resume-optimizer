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
